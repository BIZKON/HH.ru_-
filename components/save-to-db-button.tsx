"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Database, Loader2, CheckCircle, AlertCircle } from "lucide-react"
import type { ScoredCandidate, VacancyConfig } from "@/lib/types"

interface SaveToDBButtonProps {
  candidates: ScoredCandidate[]
  vacancyConfig: VacancyConfig
  disabled?: boolean
}

export function SaveToDBButton({ candidates, vacancyConfig, disabled }: SaveToDBButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [saveVacancy, setSaveVacancy] = useState(true)
  const [linkToVacancy, setLinkToVacancy] = useState(true)
  const [result, setResult] = useState<{
    success: boolean
    message: string
    details?: string
  } | null>(null)

  const handleSave = async () => {
    setIsLoading(true)
    setResult(null)

    try {
      let vacancyId: string | undefined

      // Save vacancy first if enabled
      if (saveVacancy && vacancyConfig.name) {
        const vacancyRes = await fetch("/api/db/vacancies", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(vacancyConfig),
        })

        const vacancyData = await vacancyRes.json()

        if (!vacancyRes.ok) {
          throw new Error(vacancyData.error || "Ошибка сохранения вакансии")
        }

        vacancyId = vacancyData.id
      }

      // Save candidates
      const candidatesRes = await fetch("/api/db/candidates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidates,
          vacancyId: linkToVacancy ? vacancyId : undefined,
        }),
      })

      const candidatesData = await candidatesRes.json()

      if (!candidatesRes.ok) {
        throw new Error(candidatesData.error || "Ошибка сохранения кандидатов")
      }

      setResult({
        success: true,
        message: `Сохранено ${candidatesData.saved} из ${candidatesData.total} кандидатов`,
        details: candidatesData.errors?.join("\n"),
      })
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : "Произошла ошибка",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setIsOpen(false)
    setResult(null)
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        disabled={disabled || candidates.length === 0}
        className="gap-2"
      >
        <Database className="h-4 w-4" />
        Сохранить в БД
      </Button>

      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Сохранить в базу данных</DialogTitle>
            <DialogDescription>Сохраните найденных кандидатов и настройки вакансии в Supabase</DialogDescription>
          </DialogHeader>

          {result ? (
            <div className="space-y-4 py-4">
              <div
                className={`flex items-start gap-3 rounded-lg p-4 ${
                  result.success ? "bg-green-500/10" : "bg-destructive/10"
                }`}
              >
                {result.success ? (
                  <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
                )}
                <div className="space-y-1">
                  <p className={`font-medium ${result.success ? "text-green-500" : "text-destructive"}`}>
                    {result.message}
                  </p>
                  {result.details && (
                    <p className="text-sm text-muted-foreground whitespace-pre-line">{result.details}</p>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleClose}>Закрыть</Button>
              </DialogFooter>
            </div>
          ) : (
            <>
              <div className="space-y-4 py-4">
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-sm font-medium">Будет сохранено:</p>
                  <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                    <li>• {candidates.length} кандидатов</li>
                    {vacancyConfig.name && <li>• Вакансия: {vacancyConfig.name}</li>}
                  </ul>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="save-vacancy"
                      checked={saveVacancy}
                      onCheckedChange={(checked) => setSaveVacancy(checked === true)}
                      disabled={!vacancyConfig.name}
                    />
                    <Label htmlFor="save-vacancy" className="text-sm font-normal">
                      Сохранить настройки вакансии
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="link-vacancy"
                      checked={linkToVacancy}
                      onCheckedChange={(checked) => setLinkToVacancy(checked === true)}
                      disabled={!saveVacancy || !vacancyConfig.name}
                    />
                    <Label htmlFor="link-vacancy" className="text-sm font-normal">
                      Связать кандидатов с вакансией (создать заявки)
                    </Label>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={handleClose}>
                  Отмена
                </Button>
                <Button onClick={handleSave} disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Сохранить
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
