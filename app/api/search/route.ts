import { type NextRequest, NextResponse } from "next/server"
import { searchResumes, transformResumeToCandidate } from "@/lib/hh-api"
import type { HHSearchParams } from "@/lib/types"
import { getUserFromSession } from "@/lib/auth/session"
import { getDecryptedToken } from "@/lib/db/queries/tokens"
import { searchRateLimiter, getClientIdentifier } from "@/lib/rate-limiter"

export async function POST(request: NextRequest) {
  try {
    // Получаем пользователя
    const user = await getUserFromSession()
    if (!user) {
      console.log("[Search API] User not authenticated")
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 })
    }

    console.log(`[Search API] User authenticated: ${user.id}`)

    // Проверяем rate limit
    const identifier = getClientIdentifier(request, user.id)
    const rateLimitResult = searchRateLimiter.check(identifier)

    if (!rateLimitResult.allowed) {
      console.log(`[Search API] Rate limit exceeded for user ${user.id}`)
      return NextResponse.json(
        {
          error: "Слишком много поисковых запросов. Пожалуйста, подождите.",
          retryAfter: rateLimitResult.retryAfter,
        },
        {
          status: 429,
          headers: {
            "Retry-After": rateLimitResult.retryAfter?.toString() || "60",
            "X-RateLimit-Limit": "20",
            "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
            "X-RateLimit-Reset": new Date(rateLimitResult.resetTime).toISOString(),
          },
        },
      )
    }

    // Получаем токен из БД
    const token = await getDecryptedToken(user.id)
    if (!token) {
      console.log(`[Search API] Token not found for user ${user.id}`)
      return NextResponse.json(
        { error: "API токен HH.ru не найден. Пожалуйста, добавьте токен в настройках." },
        { status: 403 }
      )
    }

    console.log(`[Search API] Token found for user ${user.id}`)

    const body = await request.json()
    const { resume_search_period, ...searchParams } = body as {
      resume_search_period?: number
    } & HHSearchParams

    if (!searchParams.text) {
      return NextResponse.json({ error: "Поисковый запрос обязателен" }, { status: 400 })
    }

    const params: HHSearchParams = {
      ...searchParams,
      per_page: searchParams.per_page || 20,
      page: searchParams.page || 0,
    }

    // Add resume_search_period if provided (days since last resume update)
    if (resume_search_period) {
      ;(params as any).resume_search_period = resume_search_period
    }

    console.log(`[Search API] Searching with params:`, { text: params.text, page: params.page })

    const result = await searchResumes(token, params)

    console.log(`[Search API] Found ${result.found} resumes, returning ${result.data.length} items`)

    const candidates = result.data.map(transformResumeToCandidate)

    return NextResponse.json({
      candidates,
      items: result.data,
      found: result.found,
      pages: result.pages,
      page: result.page,
    })
  } catch (error) {
    console.error("[Search API] Error:", error)
    const message = error instanceof Error ? error.message : "Произошла ошибка при поиске"

    // Проверяем, если это ошибка от HH.ru API
    if (message.includes("403") || message.includes("Forbidden")) {
      return NextResponse.json(
        {
          error: "Доступ к API HH.ru запрещен. Возможные причины:\n1. Токен недействителен или истек\n2. У токена нет доступа к платному API HH.ru\n3. Превышен лимит запросов\n\nПроверьте статус токена на dev.hh.ru",
        },
        { status: 403 }
      )
    }

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
