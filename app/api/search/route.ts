import { type NextRequest, NextResponse } from "next/server"
import { searchResumes, transformResumeToCandidate } from "@/lib/hh-api"
import type { HHSearchParams } from "@/lib/types"
import { getUserFromSession } from "@/lib/auth/session"
import { getDecryptedToken } from "@/lib/db/queries/tokens"

export async function POST(request: NextRequest) {
  try {
    console.log("[API] Search request received")

    // Получаем пользователя (для авторизованных пользователей)
    const user = await getUserFromSession()
    console.log("[API] User from session:", user ? user.email : "No user")

    const body = await request.json()
    console.log("[API] Request body:", JSON.stringify(body))

    const { token: providedToken, resume_search_period, ...searchParams } = body as {
      token?: string
      resume_search_period?: number
    } & HHSearchParams

    console.log("[API] Provided token:", providedToken ? `${providedToken.substring(0, 10)}...` : "No token in request")

    // Определяем токен: из запроса или из БД (для авторизованных пользователей)
    let token: string | null = providedToken || null

    if (!token && user) {
      // Для авторизованного пользователя берем токен из БД
      token = await getDecryptedToken(user.id)
    }

    if (!token) {
      return NextResponse.json({ error: "API токен не найден. Пожалуйста, введите токен." }, { status: 400 })
    }

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

    console.log("[API] Calling searchResumes with token:", token ? `${token.substring(0, 10)}...` : "NO TOKEN")
    console.log("[API] Search params:", JSON.stringify(params))

    const result = await searchResumes(token, params)

    console.log("[API] Search successful. Found:", result.found, "resumes")

    const candidates = result.data.map(transformResumeToCandidate)

    return NextResponse.json({
      candidates,
      items: result.data,
      found: result.found,
      pages: result.pages,
      page: result.page,
    })
  } catch (error) {
    console.error("[API] Search API error:", error)
    console.error("[API] Error details:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    })
    const message = error instanceof Error ? error.message : "Произошла ошибка при поиске"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
