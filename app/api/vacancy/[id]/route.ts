import { type NextRequest, NextResponse } from "next/server"
import { getVacancyById } from "@/lib/hh-api"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const token = request.headers.get("Authorization")?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "Unauthorized: Token required" }, { status: 401 })
    }

    if (!id) {
      return NextResponse.json({ error: "Vacancy ID is required" }, { status: 400 })
    }

    const result = await getVacancyById(token, id)

    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch vacancy"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
