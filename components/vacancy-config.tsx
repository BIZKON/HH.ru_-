"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X, Plus, Briefcase, Settings2 } from "lucide-react"
import { LoadVacancyById } from "@/components/load-vacancy-by-id"
import type { VacancyConfig, SearchFilters } from "@/lib/types"
import { EXPERIENCE_OPTIONS, AREA_OPTIONS } from "@/lib/types"

interface VacancyConfigFormProps {
  config: VacancyConfig
  onChange: (config: VacancyConfig) => void
  token?: string
  onFiltersChange?: (filters: Partial<SearchFilters>) => void
}

export function VacancyConfigForm({ config, onChange, token, onFiltersChange }: VacancyConfigFormProps) {
  const [newRequiredSkill, setNewRequiredSkill] = useState("")
  const [newBonusSkill, setNewBonusSkill] = useState("")

  const updateConfig = (updates: Partial<VacancyConfig>) => {
    onChange({ ...config, ...updates })
  }

  const handleVacancyLoaded = (vacancyConfig: Partial<VacancyConfig>, filters: Partial<SearchFilters>) => {
    console.log("[v0] VacancyConfigForm received:", { vacancyConfig, filters })
    onChange({ ...config, ...vacancyConfig })
    if (onFiltersChange) {
      onFiltersChange(filters)
    }
  }

  const addRequiredSkill = () => {
    if (newRequiredSkill.trim() && !config.requiredSkills.includes(newRequiredSkill.trim())) {
      updateConfig({ requiredSkills: [...config.requiredSkills, newRequiredSkill.trim()] })
      setNewRequiredSkill("")
    }
  }

  const removeRequiredSkill = (skill: string) => {
    updateConfig({ requiredSkills: config.requiredSkills.filter((s) => s !== skill) })
  }

  const addBonusSkill = () => {
    if (newBonusSkill.trim() && !config.bonusSkills.includes(newBonusSkill.trim())) {
      updateConfig({ bonusSkills: [...config.bonusSkills, newBonusSkill.trim()] })
      setNewBonusSkill("")
    }
  }

  const removeBonusSkill = (skill: string) => {
    updateConfig({ bonusSkills: config.bonusSkills.filter((s) => s !== skill) })
  }

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <Briefcase className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Настройки вакансии</CardTitle>
        </div>
        <CardDescription>Укажите параметры вакансии для поиска и оценки кандидатов</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {token && <LoadVacancyById token={token} onVacancyLoaded={handleVacancyLoaded} />}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="vacancy-name">Название вакансии</Label>
            <Input
              id="vacancy-name"
              placeholder="Загрузится автоматически или введите вручную"
              value={config.name}
              onChange={(e) => updateConfig({ name: e.target.value })}
            />
            {config.id && <p className="text-xs text-green-600 dark:text-green-400">ID вакансии: {config.id}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="vacancy-city">Город</Label>
            <Select value={config.city} onValueChange={(value) => updateConfig({ city: value })}>
              <SelectTrigger id="vacancy-city">
                <SelectValue placeholder="Выберите город" />
              </SelectTrigger>
              <SelectContent>
                {AREA_OPTIONS.map((area) => (
                  <SelectItem key={area.value || "all"} value={area.value || "all"}>
                    {area.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="required-experience">Требуемый опыт</Label>
          <Select
            value={config.requiredExperience}
            onValueChange={(value) => updateConfig({ requiredExperience: value })}
          >
            <SelectTrigger id="required-experience">
              <SelectValue placeholder="Выберите опыт" />
            </SelectTrigger>
            <SelectContent>
              {EXPERIENCE_OPTIONS.map((exp) => (
                <SelectItem key={exp.value || "any"} value={exp.value || "any"}>
                  {exp.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Settings2 className="h-4 w-4" />
            Диапазон зарплаты (для оценки кандидатов)
          </Label>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Input
                type="number"
                placeholder="от 90000"
                value={config.salaryMin || ""}
                onChange={(e) => updateConfig({ salaryMin: Number(e.target.value) || 0 })}
              />
              <p className="text-xs text-muted-foreground">Минимальная зарплата (Р)</p>
            </div>
            <div className="space-y-1">
              <Input
                type="number"
                placeholder="до 150000"
                value={config.salaryMax || ""}
                onChange={(e) => updateConfig({ salaryMax: Number(e.target.value) || 0 })}
              />
              <p className="text-xs text-muted-foreground">Максимальная зарплата (Р)</p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Обязательные навыки (для оценки)</Label>
          <div className="flex gap-2">
            <Input
              placeholder="Например: CRM, B2B, продажи"
              value={newRequiredSkill}
              onChange={(e) => setNewRequiredSkill(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addRequiredSkill())}
            />
            <Button type="button" variant="outline" size="icon" onClick={addRequiredSkill}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {config.requiredSkills.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1">
              {config.requiredSkills.map((skill) => (
                <Badge key={skill} variant="default" className="gap-1">
                  {skill}
                  <button
                    type="button"
                    onClick={() => removeRequiredSkill(skill)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label>Желательные навыки (бонус к оценке)</Label>
          <div className="flex gap-2">
            <Input
              placeholder="Например: партнерство, холодные звонки"
              value={newBonusSkill}
              onChange={(e) => setNewBonusSkill(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addBonusSkill())}
            />
            <Button type="button" variant="outline" size="icon" onClick={addBonusSkill}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {config.bonusSkills.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1">
              {config.bonusSkills.map((skill) => (
                <Badge key={skill} variant="secondary" className="gap-1">
                  {skill}
                  <button type="button" onClick={() => removeBonusSkill(skill)} className="ml-1 hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="invite-message">Текст приглашения</Label>
          <Textarea
            id="invite-message"
            placeholder="Добрый день! Приглашаем вас на собеседование на позицию..."
            rows={4}
            value={config.inviteMessage}
            onChange={(e) => updateConfig({ inviteMessage: e.target.value })}
          />
          <p className="text-xs text-muted-foreground">
            Этот текст будет использоваться при отправке приглашений кандидатам
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

export const DEFAULT_VACANCY_CONFIG: VacancyConfig = {
  id: "",
  name: "",
  city: "",
  salary: null,
  inviteMessage: "",
  requiredExperience: "between1And3",
  requiredSkills: [],
  bonusSkills: [],
  salaryMin: 0,
  salaryMax: 0,
}
