import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createDBSearchSession } from "@/lib/supabase/db"
import type { ScoredCandidate } from "@/lib/types"

export async function POST(request: NextRequest) {
  try {
    const { searchParams, candidates, vacancyId } = (await request.json()) as {
      searchParams: Record<string, any>
      candidates: ScoredCandidate[]
      vacancyId?: string
    }

    if (!searchParams || !candidates) {
      return NextResponse.json({ error: "searchParams и candidates обязательны" }, { status: 400 })
    }

    const supabase = await createClient()
    const dbSearchSession = createDBSearchSession(searchParams, candidates, vacancyId)

    const { data, error } = await supabase.from("search_sessions").insert(dbSearchSession).select().single()

    if (error) {
      console.error("Error creating search session:", error)
      return NextResponse.json({ error: "Ошибка создания сессии поиска", details: error.message }, { status: 500 })
    }

    return NextResponse.json({ searchSession: data })
  } catch (error) {
    console.error("Search session API error:", error)
    return NextResponse.json({ error: "Внутренняя ошибка сервера" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const vacancyId = searchParams.get("vacancy_id")
    const limit = Number(searchParams.get("limit")) || 10

    const supabase = await createClient()

    let query = supabase.from("search_sessions").select("*").order("created_at", { ascending: false }).limit(limit)

    if (vacancyId) {
      query = query.eq("vacancy_id", vacancyId)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: "Ошибка получения сессий", details: error.message }, { status: 500 })
    }

    return NextResponse.json({ sessions: data })
  } catch (error) {
    return NextResponse.json({ error: "Внутренняя ошибка сервера" }, { status: 500 })
  }
}
