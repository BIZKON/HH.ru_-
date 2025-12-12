import { type NextRequest, NextResponse } from "next/server"
import { getMyVacancies } from "@/lib/hh-api"

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "API токен обязателен" }, { status: 400 })
    }

    const vacancies = await getMyVacancies(token)

    // Filter only active (non-archived) vacancies
    const activeVacancies = vacancies.filter((v) => !v.archived)

    return NextResponse.json({ vacancies: activeVacancies })
  } catch (error) {
    console.error("Vacancies API error:", error)
    const message = error instanceof Error ? error.message : "Произошла ошибка при получении вакансий"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
