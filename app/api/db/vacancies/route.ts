import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { vacancyConfigToDBVacancy } from "@/lib/supabase/db"
import type { VacancyConfig } from "@/lib/types"

export async function POST(request: Request) {
  try {
    const config = (await request.json()) as VacancyConfig

    if (!config.name) {
      return NextResponse.json({ error: "Название вакансии обязательно" }, { status: 400 })
    }

    const supabase = await createClient()
    const dbVacancy = vacancyConfigToDBVacancy(config)

    // Check if vacancy already exists by external_id
    if (config.id) {
      const { data: existing } = await supabase.from("vacancies").select("id").eq("external_id", config.id).single()

      if (existing) {
        // Update existing vacancy
        const { data, error } = await supabase
          .from("vacancies")
          .update({
            ...dbVacancy,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id)
          .select("id")
          .single()

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true, id: data.id, updated: true })
      }
    }

    // Insert new vacancy
    const { data, error } = await supabase.from("vacancies").insert(dbVacancy).select("id").single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, id: data.id, created: true })
  } catch (error) {
    console.error("Error saving vacancy:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Ошибка сохранения" }, { status: 500 })
  }
}

export async function GET() {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("vacancies")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ vacancies: data })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Ошибка загрузки" }, { status: 500 })
  }
}
