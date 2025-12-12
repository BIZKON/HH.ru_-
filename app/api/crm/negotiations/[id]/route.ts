import { type NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createServiceClient()

    const { data, error } = await supabase
      .from("negotiations")
      .select(`
        *,
        candidate:candidates(*),
        vacancy:vacancies(*),
        application:applications(*)
      `)
      .eq("id", id)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const supabase = await createServiceClient()

    const { data, error } = await supabase
      .from("negotiations")
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Log activity
    if (body.state) {
      await supabase.from("activities").insert({
        negotiation_id: id,
        candidate_id: data.candidate_id,
        vacancy_id: data.vacancy_id,
        action_type: "status_changed",
        title: `Статус изменен на: ${body.state}`,
        metadata: { old_state: data.state, new_state: body.state },
      })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
