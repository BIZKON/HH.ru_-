"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Link2, CheckCircle2, AlertCircle } from "lucide-react"
import type { VacancyConfig, SearchFilters } from "@/lib/types"

interface LoadVacancyByIdProps {
  token: string
  onVacancyLoaded: (config: Partial<VacancyConfig>, filters: Partial<SearchFilters>) => void
}

export function LoadVacancyById({ token, onVacancyLoaded }: LoadVacancyByIdProps) {
  const [vacancyId, setVacancyId] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Extract vacancy ID from URL or plain ID
  const extractVacancyId = (input: string): string => {
    const trimmed = input.trim()

    // Check if it's a URL - handle various HH.ru URL formats
    const urlPatterns = [/hh\.ru\/vacancy\/(\d+)/, /headhunter\.ru\/vacancy\/(\d+)/, /^(\d+)$/]

    for (const pattern of urlPatterns) {
      const match = trimmed.match(pattern)
      if (match) {
        return match[1]
      }
    }

    // Try to extract just numbers from the input
    const numbersOnly = trimmed.replace(/\D/g, "")
    if (numbersOnly.length >= 6) {
      return numbersOnly
    }

    return trimmed
  }

  const handleLoadVacancy = async () => {
    const id = extractVacancyId(vacancyId)

    if (!id || !/^\d+$/.test(id)) {
      setError("Пожалуйста, введите корректный ID вакансии (только цифры) или ссылку на вакансию")
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)

    console.log("[v0] Loading vacancy with ID:", id)

    try {
      const response = await fetch(`/api/vacancy/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      console.log("[v0] Response status:", response.status)

      const data = await response.json()
      console.log("[v0] Response data:", data)

      if (!response.ok) {
        throw new Error(data.error || "Вакансия не найдена")
      }

      // Update vacancy config
      const vacancyConfig: Partial<VacancyConfig> = {
        id: data.vacancy.id,
        name: data.vacancy.title,
        city: data.searchParams.area,
        requiredExperience: data.searchParams.experience,
        salaryMin: data.searchParams.salaryFrom || undefined,
        salaryMax: data.searchParams.salaryTo || undefined,
        requiredSkills: data.vacancy.skills.slice(0, 5), // Top 5 skills
        bonusSkills: data.vacancy.skills.slice(5, 10), // Next 5 as bonus
      }

      // Update search filters
      const searchFilters: Partial<SearchFilters> = {
        text: data.vacancy.title,
        area: data.searchParams.area,
        experience: data.searchParams.experience,
        salaryFrom: data.searchParams.salaryFrom?.toString() || "",
        salaryTo: data.searchParams.salaryTo?.toString() || "",
      }

      console.log("[v0] Calling onVacancyLoaded with:", { vacancyConfig, searchFilters })

      onVacancyLoaded(vacancyConfig, searchFilters)

      setSuccess(
        `Вакансия "${data.vacancy.title}" загружена! Регион: ${data.vacancy.region}. Навыки: ${data.vacancy.skills.slice(0, 3).join(", ")}${data.vacancy.skills.length > 3 ? "..." : ""}`,
      )
    } catch (err) {
      console.error("[v0] Error loading vacancy:", err)
      setError(err instanceof Error ? err.message : "Ошибка загрузки вакансии. Проверьте ID и токен.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border-dashed border-2 border-primary/30 bg-gradient-to-r from-primary/5 to-primary/10">
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-primary" />
            <Label className="text-base font-semibold">Быстрая загрузка вакансии по ID</Label>
          </div>

          <p className="text-sm text-muted-foreground">
            Вставьте ID или ссылку на вакансию с HH.ru - название, регион, зарплата и навыки заполнятся автоматически
          </p>

          <div className="flex gap-2">
            <Input
              placeholder="128368179 или https://hh.ru/vacancy/128368179"
              value={vacancyId}
              onChange={(e) => {
                setVacancyId(e.target.value)
                setError(null)
                setSuccess(null)
              }}
              onKeyDown={(e) => e.key === "Enter" && handleLoadVacancy()}
              disabled={loading}
              className="flex-1"
            />
            <Button onClick={handleLoadVacancy} disabled={loading || !vacancyId.trim()} className="gap-2 min-w-[140px]">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Загрузка...
                </>
              ) : (
                <>
                  <Link2 className="h-4 w-4" />
                  Загрузить
                </>
              )}
            </Button>
          </div>

          {error && (
            <Alert variant="destructive" className="py-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="py-2 border-green-500 bg-green-50 dark:bg-green-950">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700 dark:text-green-300">{success}</AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
