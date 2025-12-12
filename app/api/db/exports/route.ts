import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createDBExport } from "@/lib/supabase/db"

export async function POST(request: NextRequest) {
  try {
    const {
      candidatesCount,
      fileName,
      format = "csv",
      searchSessionId,
      vacancyId,
      appliedFilters,
      scoreRange,
    } = await request.json()

    if (!candidatesCount || !fileName) {
      return NextResponse.json({ error: "candidatesCount и fileName обязательны" }, { status: 400 })
    }

    const supabase = await createClient()
    const dbExport = createDBExport(
      candidatesCount,
      fileName,
      format,
      searchSessionId,
      vacancyId,
      appliedFilters,
      scoreRange,
    )

    const { data, error } = await supabase.from("exports").insert(dbExport).select().single()

    if (error) {
      console.error("Error creating export record:", error)
      return NextResponse.json({ error: "Ошибка записи экспорта", details: error.message }, { status: 500 })
    }

    return NextResponse.json({ export: data })
  } catch (error) {
    console.error("Export API error:", error)
    return NextResponse.json({ error: "Внутренняя ошибка сервера" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Number(searchParams.get("limit")) || 20

    const supabase = await createClient()

    const { data, error } = await supabase
      .from("exports")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) {
      return NextResponse.json({ error: "Ошибка получения экспортов", details: error.message }, { status: 500 })
    }

    return NextResponse.json({ exports: data })
  } catch (error) {
    return NextResponse.json({ error: "Внутренняя ошибка сервера" }, { status: 500 })
  }
}
