"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { KanbanBoard, type PipelineStage } from "@/components/crm/kanban-board"
import { ArrowLeft, RefreshCw, Search, Filter } from "lucide-react"
import Link from "next/link"
import type { CandidateCardProps } from "@/components/crm/candidate-card"

export default function PipelinePage() {
  const router = useRouter()
  const [stages, setStages] = useState<PipelineStage[]>([])
  const [loading, setLoading] = useState(true)
  const [vacancyFilter, setVacancyFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")

  // Define pipeline stages
  const STAGES = [
    { id: "sourcing", name: "sourcing", label: "Поиск", color: "bg-blue-500" },
    { id: "screening", name: "screening", label: "Скрининг", color: "bg-purple-500" },
    { id: "contacted", name: "contacted", label: "Связались", color: "bg-cyan-500" },
    { id: "interview_scheduled", name: "interview_scheduled", label: "Интервью", color: "bg-orange-500" },
    { id: "interview_passed", name: "interview_passed", label: "Прошел", color: "bg-green-500" },
    { id: "offer", name: "offer", label: "Оффер", color: "bg-amber-500" },
    { id: "hired", name: "hired", label: "Нанят", color: "bg-emerald-500" },
  ]

  const loadPipeline = useCallback(async () => {
    try {
      setLoading(true)

      const params = new URLSearchParams()
      if (vacancyFilter && vacancyFilter !== "all") {
        params.append("vacancy_id", vacancyFilter)
      }

      const response = await fetch(`/api/crm/pipeline?${params}`)
      if (!response.ok) throw new Error("Failed to load pipeline")

      const data = await response.json()

      // Transform API data to PipelineStage format
      const stagesData: PipelineStage[] = STAGES.map((stageDef) => {
        const stageCards = (data.stages[stageDef.name] || []).map((item: any) => ({
          id: item.id,
          candidateId: item.candidateId,
          candidate: item.candidate || {},
          stage: item.stage,
          position: item.position,
          notes: item.notes,
          assignedTo: item.assignedTo,
          movedAt: item.movedAt,
        }))

        return {
          ...stageDef,
          cards: stageCards,
        }
      })

      setStages(stagesData)
    } catch (error) {
      console.error("Failed to load pipeline:", error)
    } finally {
      setLoading(false)
    }
  }, [vacancyFilter])

  useEffect(() => {
    loadPipeline()
  }, [loadPipeline])

  const handleCardMove = async (cardId: string, fromStage: string, toStage: string, toPosition: number) => {
    try {
      const response = await fetch("/api/crm/pipeline/move", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cardId,
          fromStage,
          toStage,
          toPosition,
          vacancyId: vacancyFilter !== "all" ? vacancyFilter : undefined,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to move card")
      }

      // Оптимистичное обновление UI
      setStages((prevStages) => {
        const newStages = [...prevStages]

        // Найти и удалить карточку из старой стадии
        const fromStageIndex = newStages.findIndex((s) => s.name === fromStage)
        const fromStageCards = [...newStages[fromStageIndex].cards]
        const cardIndex = fromStageCards.findIndex((c) => c.id === cardId)
        const [movedCard] = fromStageCards.splice(cardIndex, 1)

        // Обновить позиции в старой стадии
        fromStageCards.forEach((card, idx) => {
          card.position = idx
        })
        newStages[fromStageIndex].cards = fromStageCards

        // Добавить в новую стадию
        const toStageIndex = newStages.findIndex((s) => s.name === toStage)
        const toStageCards = [...newStages[toStageIndex].cards]

        movedCard.stage = toStage
        movedCard.position = toPosition
        movedCard.movedAt = new Date()

        toStageCards.splice(toPosition, 0, movedCard)

        // Обновить позиции в новой стадии
        toStageCards.forEach((card, idx) => {
          card.position = idx
        })
        newStages[toStageIndex].cards = toStageCards

        return newStages
      })

      console.log(`Moved card ${cardId} from ${fromStage} to ${toStage}`)
    } catch (error) {
      console.error("Error moving card:", error)
      // Reload to sync with server state
      loadPipeline()
    }
  }

  const handleOpenProfile = (candidateId: string) => {
    router.push(`/crm/candidates/${candidateId}`)
  }

  const handleAddNote = async (cardId: string) => {
    const note = prompt("Введите заметку:")
    if (!note) return

    try {
      await fetch("/api/crm/pipeline", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: cardId, notes: note }),
      })

      loadPipeline()
    } catch (error) {
      console.error("Error adding note:", error)
    }
  }

  const handleAssign = async (cardId: string) => {
    // TODO: Implement assign dialog
    console.log("Assign card:", cardId)
  }

  const handleRemove = async (cardId: string) => {
    if (!confirm("Удалить кандидата из pipeline?")) return

    try {
      await fetch(`/api/crm/pipeline?id=${cardId}`, {
        method: "DELETE",
      })

      loadPipeline()
    } catch (error) {
      console.error("Error removing card:", error)
    }
  }

  const filteredStages = stages.map((stage) => ({
    ...stage,
    cards: stage.cards.filter((card) => {
      if (!searchQuery) return true
      const query = searchQuery.toLowerCase()
      return (
        card.candidate.fullName?.toLowerCase().includes(query) ||
        card.candidate.email?.toLowerCase().includes(query) ||
        card.candidate.currentPosition?.toLowerCase().includes(query)
      )
    }),
  }))

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/crm">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Назад к CRM
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Воронка найма</h1>
            <p className="text-muted-foreground mt-1">Управление кандидатами по стадиям</p>
          </div>
        </div>

        <Button onClick={loadPipeline} variant="outline" disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Обновить
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Поиск по имени, email, должности..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Select value={vacancyFilter} onValueChange={setVacancyFilter}>
          <SelectTrigger className="w-64">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Все вакансии" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все вакансии</SelectItem>
            {/* TODO: Load actual vacancies */}
          </SelectContent>
        </Select>
      </div>

      {/* Kanban Board */}
      <KanbanBoard
        stages={filteredStages}
        onCardMove={handleCardMove}
        onOpenProfile={handleOpenProfile}
        onAddNote={handleAddNote}
        onAssign={handleAssign}
        onRemove={handleRemove}
        isLoading={loading}
      />
    </div>
  )
}
