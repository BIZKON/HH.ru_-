import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createDBInvitation } from "@/lib/supabase/db"

export async function POST(request: NextRequest) {
  try {
    const { applicationId, candidateId, vacancyId, message, hhInvitationId } = await request.json()

    if (!applicationId || !candidateId || !vacancyId) {
      return NextResponse.json({ error: "applicationId, candidateId и vacancyId обязательны" }, { status: 400 })
    }

    const supabase = await createClient()
    const dbInvitation = createDBInvitation(applicationId, candidateId, vacancyId, message || "", hhInvitationId)

    // Создаем запись о приглашении
    const { data: invitation, error: invError } = await supabase
      .from("invitations")
      .insert(dbInvitation)
      .select()
      .single()

    if (invError) {
      console.error("Error creating invitation:", invError)
      return NextResponse.json({ error: "Ошибка создания приглашения", details: invError.message }, { status: 500 })
    }

    // Обновляем статус application
    const { error: appError } = await supabase
      .from("applications")
      .update({ status: "invited", updated_at: new Date().toISOString() })
      .eq("id", applicationId)

    if (appError) {
      console.error("Error updating application status:", appError)
    }

    return NextResponse.json({ invitation })
  } catch (error) {
    console.error("Invitation API error:", error)
    return NextResponse.json({ error: "Внутренняя ошибка сервера" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const candidateId = searchParams.get("candidate_id")
    const vacancyId = searchParams.get("vacancy_id")

    const supabase = await createClient()

    let query = supabase.from("invitations").select("*").order("sent_at", { ascending: false })

    if (candidateId) {
      query = query.eq("candidate_id", candidateId)
    }
    if (vacancyId) {
      query = query.eq("vacancy_id", vacancyId)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: "Ошибка получения приглашений", details: error.message }, { status: 500 })
    }

    return NextResponse.json({ invitations: data })
  } catch (error) {
    return NextResponse.json({ error: "Внутренняя ошибка сервера" }, { status: 500 })
  }
}
