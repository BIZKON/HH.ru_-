"use client"

import { useEffect, useState } from "react"
import { Building2, Loader2, RefreshCw, PenLine, CheckCircle2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Vacancy } from "@/lib/types"

interface VacancySelectorProps {
  token: string
  selectedVacancy: Vacancy | null
  onVacancyChange: (vacancy: Vacancy | null) => void
}

export function VacancySelector({ token, selectedVacancy, onVacancyChange }: VacancySelectorProps) {
  const [vacancies, setVacancies] = useState<Vacancy[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<"manual" | "hh">("manual")

  const [manualVacancy, setManualVacancy] = useState({
    id: "",
    name: "",
    inviteMessage: "Здравствуйте! Ваш профиль заинтересовал нашу компанию. Приглашаем вас рассмотреть нашу вакансию.",
  })

  console.log("[v0] VacancySelector rendered, token:", token ? "present" : "missing", "mode:", mode)

  const loadVacancies = async () => {
    if (!token) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/vacancies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Ошибка загрузки вакансий")
      }

      setVacancies(data.vacancies)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка загрузки")
      setVacancies([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (mode === "manual" && manualVacancy.id) {
      onVacancyChange({
        id: manualVacancy.id,
        name: manualVacancy.name || `Вакансия ${manualVacancy.id}`,
        city: "",
        salary: null,
        inviteMessage: manualVacancy.inviteMessage,
      })
    }
  }, [manualVacancy, mode, onVacancyChange])

  const handleManualChange = (field: keyof typeof manualVacancy, value: string) => {
    setManualVacancy((prev) => ({ ...prev, [field]: value }))
  }

  const handleVacancySelect = (vacancyId: string) => {
    const vacancy = vacancies.find((v) => v.id === vacancyId)
    onVacancyChange(vacancy || null)
  }

  const handleModeChange = (newMode: "manual" | "hh") => {
    setMode(newMode)
    onVacancyChange(null)
    if (newMode === "hh" && vacancies.length === 0) {
      loadVacancies()
    }
  }

  if (!token) return null

  return (
    <Card className="border-2 border-primary/20 bg-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Building2 className="h-5 w-5 text-primary" />
          Настройки вакансии для приглашений
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Mode switcher */}
        <div className="flex gap-2">
          <Button
            type="button"
            variant={mode === "manual" ? "default" : "outline"}
            size="sm"
            onClick={() => handleModeChange("manual")}
            className="flex-1"
          >
            <PenLine className="mr-1.5 h-4 w-4" />
            Указать вручную
          </Button>
          <Button
            type="button"
            variant={mode === "hh" ? "default" : "outline"}
            size="sm"
            onClick={() => handleModeChange("hh")}
            className="flex-1"
          >
            <Building2 className="mr-1.5 h-4 w-4" />
            Загрузить из HH.ru
          </Button>
        </div>

        {/* Manual input mode */}
        {mode === "manual" && (
          <div className="space-y-4 rounded-lg border bg-background p-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="vacancy-id" className="text-sm font-medium">
                  ID вакансии <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="vacancy-id"
                  placeholder="12345678"
                  value={manualVacancy.id}
                  onChange={(e) => handleManualChange("id", e.target.value)}
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  URL: hh.ru/vacancy/<strong className="text-foreground">ID</strong>
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="vacancy-name" className="text-sm font-medium">
                  Название вакансии
                </Label>
                <Input
                  id="vacancy-name"
                  placeholder="Frontend Developer"
                  value={manualVacancy.name}
                  onChange={(e) => handleManualChange("name", e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Для отображения в интерфейсе</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="invite-message" className="text-sm font-medium">
                Текст приглашения
              </Label>
              <Textarea
                id="invite-message"
                placeholder="Введите текст приглашения..."
                value={manualVacancy.inviteMessage}
                onChange={(e) => handleManualChange("inviteMessage", e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>

            {manualVacancy.id && (
              <div className="flex items-center gap-2 rounded-md bg-green-500/10 p-3 text-sm text-green-700 dark:text-green-400">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>
                  <strong>Вакансия настроена:</strong> {manualVacancy.name || "Без названия"} (ID: {manualVacancy.id})
                </span>
              </div>
            )}
          </div>
        )}

        {/* HH.ru selection mode */}
        {mode === "hh" && (
          <div className="space-y-3 rounded-lg border bg-background p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Активные вакансии из вашего аккаунта</p>
              <Button type="button" variant="outline" size="sm" onClick={loadVacancies} disabled={isLoading}>
                <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
                Обновить
              </Button>
            </div>

            {error ? (
              <p className="text-sm text-destructive">{error}</p>
            ) : isLoading ? (
              <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Загрузка вакансий...
              </div>
            ) : vacancies.length === 0 ? (
              <div className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
                Нет активных вакансий. Нажмите "Обновить" для загрузки.
              </div>
            ) : (
              <Select value={selectedVacancy?.id || ""} onValueChange={handleVacancySelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите вакансию" />
                </SelectTrigger>
                <SelectContent>
                  {vacancies.map((vacancy) => (
                    <SelectItem key={vacancy.id} value={vacancy.id}>
                      {vacancy.name} {vacancy.city && `(${vacancy.city})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
