import { type NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const negotiation_id = searchParams.get("negotiation_id")

    if (!negotiation_id) {
      return NextResponse.json({ error: "negotiation_id required" }, { status: 400 })
    }

    const supabase = await createServiceClient()

    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("negotiation_id", negotiation_id)
      .order("created_at", { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const supabase = await createServiceClient()

    const { data, error } = await supabase.from("messages").insert(body).select().single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Update negotiation
    await supabase
      .from("negotiations")
      .update({
        messages_count: supabase.raw("messages_count + 1"),
        updated_at: new Date().toISOString(),
      })
      .eq("id", body.negotiation_id)

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
