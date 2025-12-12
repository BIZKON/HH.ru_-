import { type NextRequest, NextResponse } from "next/server"
import { searchResumes, transformResumeToCandidate } from "@/lib/hh-api"
import type { HHSearchParams } from "@/lib/types"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, resume_search_period, ...searchParams } = body as {
      token: string
      resume_search_period?: number
    } & HHSearchParams

    if (!token) {
      return NextResponse.json({ error: "API токен обязателен" }, { status: 400 })
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

    const result = await searchResumes(token, params)

    const candidates = result.data.map(transformResumeToCandidate)

    return NextResponse.json({
      candidates,
      items: result.data,
      found: result.found,
      pages: result.pages,
      page: result.page,
    })
  } catch (error) {
    console.error("Search API error:", error)
    const message = error instanceof Error ? error.message : "Произошла ошибка при поиске"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
