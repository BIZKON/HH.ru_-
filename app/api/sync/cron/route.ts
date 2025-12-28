import { type NextRequest, NextResponse } from "next/server"
import { syncEngine } from "@/lib/sync/hh-sync-engine"
import { db } from "@/lib/db"
import { users, userApiTokens } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import crypto from "crypto"

/**
 * GET /api/sync/cron
 *
 * Cron endpoint для автоматической синхронизации
 * Должен вызываться периодически (каждые 5 минут)
 *
 * Vercel Cron config: добавить в vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/sync/cron",
 *     "schedule": "*/5 * * * *"
 *   }]
 * }
 *
 * Для локальной разработки вызывать вручную: GET http://localhost:3000/api/sync/cron?key=YOUR_CRON_KEY
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const providedKey = searchParams.get("key")

    // Простая защита cron endpoint
    const cronKey = process.env.CRON_SECRET_KEY || "dev-cron-key"

    // В production проверяем ключ
    if (process.env.NODE_ENV === "production" && providedKey !== cronKey) {
      console.warn("[Cron] Unauthorized cron attempt")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[Cron] Starting scheduled sync")

    // Получаем всех активных пользователей с токенами
    const activeUsers = await db
      .select({
        userId: users.id,
        email: users.email,
      })
      .from(users)
      .innerJoin(userApiTokens, eq(users.id, userApiTokens.userId))
      .limit(50) // ограничиваем для безопасности

    console.log(`[Cron] Found ${activeUsers.length} active users`)

    const results: any[] = []

    for (const user of activeUsers) {
      try {
        // Расшифровываем токен
        const [tokenData] = await db
          .select()
          .from(userApiTokens)
          .where(eq(userApiTokens.userId, user.userId))
          .limit(1)

        if (!tokenData || !tokenData.encryptedToken) {
          console.warn(`[Cron] No token for user ${user.userId}`)
          continue
        }

        // Простая расшифровка (в реальности используйте getDecryptedToken)
        const key = process.env.ENCRYPTION_KEY || "default-key-change-me"
        const decipher = crypto.createDecipher("aes-256-cbc", key)
        let token = decipher.update(tokenData.encryptedToken, "hex", "utf8")
        token += decipher.final("utf8")

        // Синхронизируем negotiations (более частая синхронизация)
        const negotiationsResult = await syncEngine.syncNegotiations({
          token,
          force: false,
        })

        // Синхронизируем messages только если есть обновления
        let messagesResult = null
        if (negotiationsResult.itemsSynced > 0) {
          messagesResult = await syncEngine.syncMessages({ token })
        }

        results.push({
          userId: user.userId,
          email: user.email,
          negotiations: negotiationsResult,
          messages: messagesResult,
        })

        console.log(`[Cron] Synced for user ${user.email}: ${negotiationsResult.itemsSynced} items`)

        // Задержка между пользователями для rate limiting
        await new Promise((resolve) => setTimeout(resolve, 1000))
      } catch (error) {
        console.error(`[Cron] Error syncing for user ${user.userId}:`, error)
        results.push({
          userId: user.userId,
          error: error instanceof Error ? error.message : String(error),
        })
      }
    }

    console.log(`[Cron] Sync completed for ${results.length} users`)

    return NextResponse.json({
      success: true,
      syncedUsers: results.length,
      results,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[Cron] Fatal error:", error)
    const message = error instanceof Error ? error.message : "Cron sync failed"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// Разрешаем только GET запросы
export const dynamic = "force-dynamic"
export const runtime = "nodejs"
