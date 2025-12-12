import { type NextRequest, NextResponse } from "next/server"
import { sendInvitation } from "@/lib/hh-api"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, vacancyId, resumeId, message } = body

    if (!token) {
      return NextResponse.json({ error: "API токен обязателен" }, { status: 400 })
    }

    if (!vacancyId || !resumeId) {
      return NextResponse.json({ error: "ID вакансии и резюме обязательны" }, { status: 400 })
    }

    await sendInvitation(token, vacancyId, resumeId, message || "")

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Invite API error:", error)
    const message = error instanceof Error ? error.message : "Произошла ошибка при отправке приглашения"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
