"use client"

import { CandidateCard } from "./candidate-card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Users, SearchX } from "lucide-react"
import type { ScoredCandidate, VacancyConfig } from "@/lib/types"

interface CandidatesListProps {
  candidates: ScoredCandidate[]
  totalFound: number
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  isLoading: boolean
  vacancyConfig: VacancyConfig | null
  onInvite: (candidate: ScoredCandidate) => void
}

export function CandidatesList({
  candidates,
  totalFound,
  currentPage,
  totalPages,
  onPageChange,
  isLoading,
  vacancyConfig,
  onInvite,
}: CandidatesListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-40 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    )
  }

  if (candidates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <SearchX className="h-12 w-12 text-muted-foreground/50" />
        <h3 className="mt-4 text-lg font-semibold">Кандидаты не найдены</h3>
        <p className="mt-1 text-sm text-muted-foreground">Попробуйте изменить параметры поиска</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          Найдено: <span className="font-medium text-foreground">{totalFound.toLocaleString("ru-RU")}</span> кандидатов
        </div>
        {totalPages > 1 && (
          <div className="text-sm text-muted-foreground">
            Страница {currentPage + 1} из {totalPages}
          </div>
        )}
      </div>

      <div className="space-y-3">
        {candidates.map((candidate) => (
          <CandidateCard key={candidate.id} candidate={candidate} vacancyConfig={vacancyConfig} onInvite={onInvite} />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 0}
          >
            <ChevronLeft className="h-4 w-4" />
            Назад
          </Button>
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
              let pageNum: number
              if (totalPages <= 5) {
                pageNum = i
              } else if (currentPage < 3) {
                pageNum = i
              } else if (currentPage > totalPages - 4) {
                pageNum = totalPages - 5 + i
              } else {
                pageNum = currentPage - 2 + i
              }

              return (
                <Button
                  key={pageNum}
                  variant={pageNum === currentPage ? "default" : "outline"}
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => onPageChange(pageNum)}
                >
                  {pageNum + 1}
                </Button>
              )
            })}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages - 1}
          >
            Вперёд
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
