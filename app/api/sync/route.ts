import { type NextRequest, NextResponse } from "next/server"
import { syncEngine } from "@/lib/sync/hh-sync-engine"
import { getUserFromSession } from "@/lib/auth/session"
import { getDecryptedToken } from "@/lib/db/queries/tokens"
import { apiRateLimiter, getClientIdentifier } from "@/lib/rate-limiter"

/**
 * POST /api/sync
 * Запустить полную синхронизацию с HH.ru
 */
export async function POST(request: NextRequest) {
  try {
    // Аутентификация
    const user = await getUserFromSession()
    if (!user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 })
    }

    // Rate limiting
    const identifier = getClientIdentifier(request, user.id)
    const rateLimitResult = apiRateLimiter.check(identifier)

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: "Слишком много запросов. Пожалуйста, подождите.",
          retryAfter: rateLimitResult.retryAfter,
        },
        {
          status: 429,
          headers: {
            "Retry-After": rateLimitResult.retryAfter?.toString() || "60",
          },
        },
      )
    }

    // Получаем токен
    const token = await getDecryptedToken(user.id)
    if (!token) {
      return NextResponse.json({ error: "API токен не найден" }, { status: 400 })
    }

    const body = await request.json().catch(() => ({}))
    const { vacancyId, type = "full" } = body as {
      vacancyId?: string
      type?: "full" | "negotiations" | "messages"
    }

    console.log(`[Sync API] Starting ${type} sync for user ${user.id}, vacancy: ${vacancyId || "all"}`)

    let result: any

    switch (type) {
      case "negotiations":
        result = await syncEngine.syncNegotiations({ token, vacancyId })
        break

      case "messages":
        result = await syncEngine.syncMessages({ token, vacancyId })
        break

      case "full":
      default:
        result = await syncEngine.fullSync({ token, vacancyId })
        break
    }

    console.log(`[Sync API] Sync completed:`, result)

    return NextResponse.json({
      success: true,
      result,
      message: "Синхронизация завершена",
    })
  } catch (error) {
    console.error("[Sync API] Error:", error)
    const message = error instanceof Error ? error.message : "Ошибка при синхронизации"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/**
 * GET /api/sync/status
 * Получить статус последней синхронизации
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromSession()
    if (!user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const entityType = searchParams.get("type") || "negotiations"

    const status = await syncEngine.getSyncStatus(entityType)

    if (!status) {
      return NextResponse.json({
        status: "never_synced",
        lastSyncedAt: null,
        itemsSynced: 0,
      })
    }

    return NextResponse.json(status)
  } catch (error) {
    console.error("[Sync Status API] Error:", error)
    const message = error instanceof Error ? error.message : "Ошибка получения статуса"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
