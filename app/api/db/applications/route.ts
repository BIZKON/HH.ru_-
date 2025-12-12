import { createServiceClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const vacancyId = searchParams.get("vacancy_id")
    const minScore = searchParams.get("min_score")
    const maxScore = searchParams.get("max_score")
    const status = searchParams.get("status")

    const supabase = await createServiceClient()

    let query = supabase
      .from("applications")
      .select(
        `
        *,
        candidate:candidates(*),
        vacancy:vacancies(*),
        search_session:search_sessions(*)
      `,
      )
      .order("created_at", { ascending: false })

    if (vacancyId) {
      query = query.eq("vacancy_id", vacancyId)
    }

    if (minScore) {
      query = query.gte("score", Number.parseFloat(minScore))
    }

    if (maxScore) {
      query = query.lte("score", Number.parseFloat(maxScore))
    }

    if (status) {
      query = query.eq("status", status)
    }

    const { data, error } = await query

    if (error) {
      console.error("[v0] Error fetching applications:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error) {
    console.error("[v0] Error in applications route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
