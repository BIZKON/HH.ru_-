"use client"

import { Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { ScoredCandidate } from "@/lib/types"

interface ExportButtonProps {
  candidates: ScoredCandidate[]
  disabled?: boolean
  searchSessionId?: string
  vacancyId?: string
  appliedFilters?: Record<string, any>
}

export function exportScoredToCsv(candidates: ScoredCandidate[]): string {
  const headers = [
    "ID",
    "ФИО",
    "Должность",
    "Оценка",
    "Рейтинг",
    "Возраст",
    "Город",
    "Зарплата",
    "Опыт",
    "Навыки",
    "Обновлено",
    "Email",
    "Телефон",
    "Ссылка",
    "Опыт_балл",
    "Навыки_балл",
    "Зарплата_балл",
    "Образование_балл",
    "Активность_балл",
    "Бонус_балл",
  ]

  const rows = candidates.map((c) => [
    c.id,
    c.fullName,
    c.title,
    c.score ?? "",
    c.rating ?? "",
    c.age || "",
    c.city,
    c.salary,
    c.experience,
    c.skills.join("; "),
    c.lastUpdate,
    c.contacts.email || "",
    c.contacts.phone || "",
    c.resumeUrl,
    // Детальные баллы
    c.breakdown?.experience ?? "",
    c.breakdown?.skills ?? "",
    c.breakdown?.salary ?? "",
    c.breakdown?.education ?? "",
    c.breakdown?.jobSearchStatus ?? "",
    c.breakdown?.bonus ?? "",
  ])

  const csvContent = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n")

  return csvContent
}

function downloadCsv(content: string, filename: string): void {
  const blob = new Blob(["\ufeff" + content], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

async function logExportToDb(
  candidatesCount: number,
  fileName: string,
  searchSessionId?: string,
  vacancyId?: string,
  appliedFilters?: Record<string, any>,
  scoreRange?: { min?: number; max?: number },
) {
  try {
    await fetch("/api/db/exports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        candidatesCount,
        fileName,
        format: "csv",
        searchSessionId,
        vacancyId,
        appliedFilters,
        scoreRange,
      }),
    })
  } catch (error) {
    console.error("Failed to log export:", error)
  }
}

export function ExportButton({ candidates, disabled, searchSessionId, vacancyId, appliedFilters }: ExportButtonProps) {
  const handleExport = async () => {
    const csv = exportScoredToCsv(candidates)
    const filename = `candidates_${new Date().toISOString().slice(0, 10)}.csv`
    downloadCsv(csv, filename)

    const scores = candidates.map((c) => c.score).filter((s) => s !== undefined)
    await logExportToDb(candidates.length, filename, searchSessionId, vacancyId, appliedFilters, {
      min: scores.length > 0 ? Math.min(...scores) : undefined,
      max: scores.length > 0 ? Math.max(...scores) : undefined,
    })
  }

  return (
    <Button variant="outline" size="sm" onClick={handleExport} disabled={disabled || candidates.length === 0}>
      <Download className="mr-2 h-4 w-4" />
      Экспорт CSV
    </Button>
  )
}
