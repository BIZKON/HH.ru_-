"use client"

import { useState, useCallback } from "react"
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { CandidateCard, type CandidateCardProps } from "./candidate-card"
import { SortableCard } from "./sortable-card"
import { cn } from "@/lib/utils"

export interface PipelineStage {
  id: string
  name: string
  label: string
  color: string
  cards: CandidateCardProps[]
}

export interface KanbanBoardProps {
  stages: PipelineStage[]
  onCardMove: (cardId: string, fromStage: string, toStage: string, toPosition: number) => Promise<void>
  onOpenProfile?: (candidateId: string) => void
  onAddNote?: (cardId: string) => void
  onAssign?: (cardId: string) => void
  onRemove?: (cardId: string) => void
  isLoading?: boolean
}

export function KanbanBoard({
  stages,
  onCardMove,
  onOpenProfile,
  onAddNote,
  onAssign,
  onRemove,
  isLoading,
}: KanbanBoardProps) {
  const [activeCard, setActiveCard] = useState<CandidateCardProps | null>(null)
  const [moving, setMoving] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px движения для активации (предотвращает случайное срабатывание)
      },
    }),
  )

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event

    // Находим карточку которую тащим
    for (const stage of stages) {
      const card = stage.cards.find((c) => c.id === active.id)
      if (card) {
        setActiveCard(card)
        break
      }
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    setActiveCard(null)

    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    // Находим активную карточку
    let activeCard: CandidateCardProps | null = null
    let fromStage: string | null = null

    for (const stage of stages) {
      const card = stage.cards.find((c) => c.id === activeId)
      if (card) {
        activeCard = card
        fromStage = stage.name
        break
      }
    }

    if (!activeCard || !fromStage) return

    // Определяем куда перетащили
    let toStage: string | null = null
    let toPosition = 0

    // Проверяем, перетащили на другую карточку
    for (const stage of stages) {
      const overCardIndex = stage.cards.findIndex((c) => c.id === overId)
      if (overCardIndex !== -1) {
        toStage = stage.name
        toPosition = overCardIndex
        break
      }
    }

    // Если не на карточку, проверяем на колонку
    if (!toStage) {
      const targetStage = stages.find((s) => s.id === overId)
      if (targetStage) {
        toStage = targetStage.name
        toPosition = targetStage.cards.length // В конец колонки
      }
    }

    if (!toStage) return

    // Если ничего не изменилось, не делаем запрос
    if (fromStage === toStage && activeCard.position === toPosition) {
      return
    }

    try {
      setMoving(true)
      await onCardMove(activeId, fromStage, toStage, toPosition)
    } catch (error) {
      console.error("Error moving card:", error)
    } finally {
      setMoving(false)
    }
  }

  const getTotalCount = () => {
    return stages.reduce((sum, stage) => sum + stage.cards.length, 0)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-2">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">Загрузка pipeline...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold">Pipeline</h2>
          <Badge variant="secondary">{getTotalCount()} кандидатов</Badge>
        </div>
      </div>

      {/* Kanban Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {stages.map((stage) => (
            <div key={stage.id} className="flex-shrink-0 w-80">
              <Card className={cn("h-full", moving && "pointer-events-none")}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <div className={cn("w-3 h-3 rounded-full", stage.color)} />
                      {stage.label}
                    </CardTitle>
                    <Badge variant="secondary" className="ml-auto">
                      {stage.cards.length}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <ScrollArea className="h-[calc(100vh-280px)]">
                    {/* Drop zone для пустых колонок */}
                    <SortableContext
                      items={stage.cards.map((c) => c.id)}
                      strategy={verticalListSortingStrategy}
                      id={stage.id}
                    >
                      <div className="space-y-3 min-h-[100px]">
                        {stage.cards.length === 0 ? (
                          <div
                            className="border-2 border-dashed rounded-lg p-8 text-center text-muted-foreground text-sm"
                            id={stage.id}
                          >
                            Перетащите сюда кандидата
                          </div>
                        ) : (
                          stage.cards.map((card, index) => (
                            <SortableCard key={card.id} id={card.id}>
                              <CandidateCard
                                {...card}
                                isDragging={activeCard?.id === card.id}
                                onOpenProfile={onOpenProfile}
                                onAddNote={onAddNote}
                                onAssign={onAssign}
                                onRemove={onRemove}
                              />
                            </SortableCard>
                          ))
                        )}
                      </div>
                    </SortableContext>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeCard ? (
            <div className="rotate-3 scale-105">
              <CandidateCard {...activeCard} isDragging />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
