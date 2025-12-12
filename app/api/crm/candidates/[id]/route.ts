import { type NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const supabase = await createServiceClient()

    const { data, error } = await supabase.from("candidates").update(body).eq("id", id).select().single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Log activity
    if (body.status) {
      await supabase.from("activities").insert({
        candidate_id: id,
        action_type: "status_changed",
        title: `Статус изменен на: ${body.status}`,
        metadata: { new_status: body.status },
      })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
