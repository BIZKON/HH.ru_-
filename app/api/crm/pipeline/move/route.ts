import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { pipelineStages, activities, tasks } from "@/lib/db/schema"
import { eq, and, gte, lte, sql } from "drizzle-orm"
import { getUserFromSession } from "@/lib/auth/session"

// Auto-task templates for each stage
const stageTaskTemplates: Record<
  string,
  Array<{ title: string; type: string; priority: string; description: string }>
> = {
  screening: [
    {
      title: "Просмотреть резюме",
      type: "review",
      priority: "high",
      description: "Проверить соответствие кандидата требованиям вакансии",
    },
  ],
  contacted: [
    {
      title: "Связаться с кандидатом",
      type: "call",
      priority: "high",
      description: "Провести первичный звонок и обсудить условия",
    },
  ],
  interview_scheduled: [
    {
      title: "Провести интервью",
      type: "interview",
      priority: "urgent",
      description: "Назначить и провести собеседование с кандидатом",
    },
  ],
  interview_passed: [
    {
      title: "Собрать обратную связь",
      type: "feedback",
      priority: "high",
      description: "Получить feedback от интервьюеров",
    },
  ],
  offer: [
    {
      title: "Подготовить оффер",
      type: "offer",
      priority: "urgent",
      description: "Составить и отправить предложение о работе",
    },
  ],
  hired: [
    {
      title: "Организовать онбординг",
      type: "onboarding",
      priority: "medium",
      description: "Подготовить план адаптации нового сотрудника",
    },
  ],
}

/**
 * POST /api/crm/pipeline/move
 * Переместить карточку между стадиями или внутри стадии
 *
 * Body:
 * {
 *   "cardId": "uuid",
 *   "fromStage": "screening",
 *   "toStage": "contacted",
 *   "toPosition": 2,
 *   "vacancyId": "uuid" (optional)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromSession()
    if (!user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 })
    }

    const body = await request.json()
    const { cardId, fromStage, toStage, toPosition, vacancyId } = body

    if (!cardId || !fromStage || !toStage || toPosition === undefined) {
      return NextResponse.json({ error: "Недостаточно параметров" }, { status: 400 })
    }

    console.log(`[Pipeline Move] Moving card ${cardId} from ${fromStage} to ${toStage} at position ${toPosition}`)

    // Get the card being moved
    const [card] = await db.select().from(pipelineStages).where(eq(pipelineStages.id, cardId)).limit(1)

    if (!card) {
      return NextResponse.json({ error: "Карточка не найдена" }, { status: 404 })
    }

    const oldPosition = card.position
    const oldStage = card.stage

    // Transaction для атомарности
    await db.transaction(async (tx) => {
      // Case 1: Moving within the same stage
      if (fromStage === toStage) {
        if (oldPosition < toPosition) {
          // Moving down: decrement positions between old and new
          await tx
            .update(pipelineStages)
            .set({
              position: sql`${pipelineStages.position} - 1`,
            })
            .where(
              and(
                eq(pipelineStages.stage, fromStage),
                gte(pipelineStages.position, oldPosition + 1),
                lte(pipelineStages.position, toPosition),
                vacancyId ? eq(pipelineStages.vacancyId, vacancyId) : sql`1=1`,
              ),
            )
        } else if (oldPosition > toPosition) {
          // Moving up: increment positions between new and old
          await tx
            .update(pipelineStages)
            .set({
              position: sql`${pipelineStages.position} + 1`,
            })
            .where(
              and(
                eq(pipelineStages.stage, fromStage),
                gte(pipelineStages.position, toPosition),
                lte(pipelineStages.position, oldPosition - 1),
                vacancyId ? eq(pipelineStages.vacancyId, vacancyId) : sql`1=1`,
              ),
            )
        }

        // Update the moved card
        await tx
          .update(pipelineStages)
          .set({
            position: toPosition,
            movedAt: new Date(),
            movedBy: user.id,
          })
          .where(eq(pipelineStages.id, cardId))
      }
      // Case 2: Moving to a different stage
      else {
        // Decrement positions in old stage (fill the gap)
        await tx
          .update(pipelineStages)
          .set({
            position: sql`${pipelineStages.position} - 1`,
          })
          .where(
            and(
              eq(pipelineStages.stage, fromStage),
              gte(pipelineStages.position, oldPosition + 1),
              vacancyId ? eq(pipelineStages.vacancyId, vacancyId) : sql`1=1`,
            ),
          )

        // Increment positions in new stage (make space)
        await tx
          .update(pipelineStages)
          .set({
            position: sql`${pipelineStages.position} + 1`,
          })
          .where(
            and(
              eq(pipelineStages.stage, toStage),
              gte(pipelineStages.position, toPosition),
              vacancyId ? eq(pipelineStages.vacancyId, vacancyId) : sql`1=1`,
            ),
          )

        // Update the moved card
        await tx
          .update(pipelineStages)
          .set({
            stage: toStage,
            position: toPosition,
            movedAt: new Date(),
            movedBy: user.id,
          })
          .where(eq(pipelineStages.id, cardId))

        // Log activity for stage change
        await tx.insert(activities).values({
          candidateId: card.candidateId,
          vacancyId: card.vacancyId,
          actionType: "pipeline_stage_changed",
          title: `Перемещен: ${fromStage} → ${toStage}`,
          metadata: JSON.stringify({
            from_stage: fromStage,
            to_stage: toStage,
            position: toPosition,
          }),
        })

        // Auto-create tasks for new stage
        const taskTemplates = stageTaskTemplates[toStage]
        if (taskTemplates && taskTemplates.length > 0) {
          const now = new Date()
          const dueDate = new Date(now.getTime() + 24 * 60 * 60 * 1000) // +1 day

          for (const template of taskTemplates) {
            await tx.insert(tasks).values({
              candidateId: card.candidateId,
              vacancyId: card.vacancyId,
              title: template.title,
              description: template.description,
              type: template.type,
              priority: template.priority,
              status: "pending",
              dueDate,
              assignedTo: card.assignedTo,
              createdBy: user.id,
            })
          }

          console.log(
            `[Pipeline Move] Auto-created ${taskTemplates.length} task(s) for stage ${toStage}`,
          )
        }
      }
    })

    console.log(`[Pipeline Move] Successfully moved card ${cardId}`)

    return NextResponse.json({
      success: true,
      cardId,
      fromStage,
      toStage,
      position: toPosition,
    })
  } catch (error) {
    console.error("[Pipeline Move] Error:", error)
    const message = error instanceof Error ? error.message : "Ошибка перемещения карточки"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
