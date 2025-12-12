import { type NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const vacancy_id = searchParams.get("vacancy_id")
    const state = searchParams.get("state")

    const supabase = await createServiceClient()

    let query = supabase
      .from("negotiations")
      .select(`
        *,
        candidate:candidates(*),
        vacancy:vacancies(*),
        application:applications(*)
      `)
      .order("updated_at", { ascending: false })

    if (vacancy_id) {
      query = query.eq("vacancy_id", vacancy_id)
    }

    if (state) {
      query = query.eq("state", state)
    }

    const { data, error } = await query

    if (error) {
      console.error("[v0] Negotiations fetch error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error: any) {
    console.error("[v0] Negotiations API error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const supabase = await createServiceClient()

    const { data, error } = await supabase.from("negotiations").insert(body).select().single()

    if (error) {
      console.error("[v0] Negotiation create error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Log activity
    await supabase.from("activities").insert({
      candidate_id: body.candidate_id,
      vacancy_id: body.vacancy_id,
      negotiation_id: data.id,
      action_type: body.source === "employer" ? "invitation_sent" : "response_received",
      title: body.source === "employer" ? "Отправлено приглашение" : "Получен отклик",
      metadata: { negotiation_id: data.id },
    })

    return NextResponse.json(data)
  } catch (error: any) {
    console.error("[v0] Negotiation create API error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
