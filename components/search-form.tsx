"use client"

import type React from "react"

import { Search, Filter, ChevronDown, ChevronUp, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { useState } from "react"
import type { SearchFilters } from "@/lib/types"
import {
  EXPERIENCE_OPTIONS,
  EMPLOYMENT_OPTIONS,
  SCHEDULE_OPTIONS,
  ORDER_BY_OPTIONS,
  AREA_OPTIONS,
  RESUME_SEARCH_PERIOD_OPTIONS,
} from "@/lib/types"

interface SearchFormProps {
  filters: SearchFilters
  onFiltersChange: (filters: SearchFilters) => void
  onSearch: () => void
  isLoading: boolean
  hasToken: boolean
}

export function SearchForm({ filters, onFiltersChange, onSearch, isLoading, hasToken }: SearchFormProps) {
  const [showFilters, setShowFilters] = useState(false)

  const updateFilter = (key: keyof SearchFilters, value: string) => {
    onFiltersChange({ ...filters, [key]: value })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={filters.text}
            onChange={(e) => updateFilter("text", e.target.value)}
            placeholder="Должность, навыки или ключевые слова..."
            className="pl-10"
          />
        </div>
        <Button type="submit" disabled={isLoading || !hasToken || !filters.text.trim()}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Поиск...
            </>
          ) : (
            "Найти"
          )}
        </Button>
      </div>

      <Collapsible open={showFilters} onOpenChange={setShowFilters}>
        <CollapsibleTrigger asChild>
          <Button type="button" variant="ghost" size="sm" className="gap-2 text-muted-foreground">
            <Filter className="h-4 w-4" />
            Расширенные фильтры
            {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label className="text-sm">Регион</Label>
              <Select value={filters.area} onValueChange={(v) => updateFilter("area", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите регион" />
                </SelectTrigger>
                <SelectContent>
                  {AREA_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value || "all"} value={opt.value || "all"}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Опыт работы</Label>
              <Select value={filters.experience} onValueChange={(v) => updateFilter("experience", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Любой опыт" />
                </SelectTrigger>
                <SelectContent>
                  {EXPERIENCE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value || "any"} value={opt.value || "any"}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Дата обновления резюме</Label>
              <Select value={filters.resumeSearchPeriod} onValueChange={(v) => updateFilter("resumeSearchPeriod", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="За все время" />
                </SelectTrigger>
                <SelectContent>
                  {RESUME_SEARCH_PERIOD_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value || "all"} value={opt.value || "all"}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Тип занятости</Label>
              <Select value={filters.employment} onValueChange={(v) => updateFilter("employment", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Любая занятость" />
                </SelectTrigger>
                <SelectContent>
                  {EMPLOYMENT_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value || "any"} value={opt.value || "any"}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">График работы</Label>
              <Select value={filters.schedule} onValueChange={(v) => updateFilter("schedule", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Любой график" />
                </SelectTrigger>
                <SelectContent>
                  {SCHEDULE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value || "any"} value={opt.value || "any"}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Зарплата от</Label>
              <Input
                type="number"
                value={filters.salaryFrom}
                onChange={(e) => updateFilter("salaryFrom", e.target.value)}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Зарплата до</Label>
              <Input
                type="number"
                value={filters.salaryTo}
                onChange={(e) => updateFilter("salaryTo", e.target.value)}
                placeholder="999999"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Сортировка</Label>
              <Select value={filters.orderBy} onValueChange={(v) => updateFilter("orderBy", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="По релевантности" />
                </SelectTrigger>
                <SelectContent>
                  {ORDER_BY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </form>
  )
}
