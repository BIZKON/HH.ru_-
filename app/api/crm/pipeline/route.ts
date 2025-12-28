import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { pipelineStages, candidates, vacancies, activities, tasks } from "@/lib/db/schema"
import { eq, and, desc, sql } from "drizzle-orm"
import { getUserFromSession } from "@/lib/auth/session"
import { apiRateLimiter, getClientIdentifier } from "@/lib/rate-limiter"

/**
 * GET /api/crm/pipeline?vacancy_id=X&stage=Y
 * Получить все карточки для Kanban board
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromSession()
    if (!user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const vacancyId = searchParams.get("vacancy_id")
    const stage = searchParams.get("stage")
    const assignedTo = searchParams.get("assigned_to")

    // Build query
    let query = db
      .select({
        id: pipelineStages.id,
        vacancyId: pipelineStages.vacancyId,
        candidateId: pipelineStages.candidateId,
        stage: pipelineStages.stage,
        position: pipelineStages.position,
        assignedTo: pipelineStages.assignedTo,
        notes: pipelineStages.notes,
        movedAt: pipelineStages.movedAt,
        movedBy: pipelineStages.movedBy,
        createdAt: pipelineStages.createdAt,
        // Join candidate data
        candidate: {
          id: candidates.id,
          externalId: candidates.externalId,
          fullName: candidates.fullName,
          firstName: candidates.firstName,
          lastName: candidates.lastName,
          email: candidates.email,
          phone: candidates.phone,
          currentPosition: candidates.currentPosition,
          location: candidates.location,
          skills: candidates.skills,
          resumeUrl: candidates.resumeUrl,
          status: candidates.status,
          paidAccess: candidates.paidAccess,
        },
        // Join vacancy data
        vacancy: {
          id: vacancies.id,
          title: vacancies.title,
          location: vacancies.location,
        },
      })
      .from(pipelineStages)
      .leftJoin(candidates, eq(pipelineStages.candidateId, candidates.id))
      .leftJoin(vacancies, eq(pipelineStages.vacancyId, vacancies.id))

    // Apply filters
    const conditions = []
    if (vacancyId) conditions.push(eq(pipelineStages.vacancyId, vacancyId))
    if (stage) conditions.push(eq(pipelineStages.stage, stage))
    if (assignedTo) conditions.push(eq(pipelineStages.assignedTo, assignedTo))

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any
    }

    // Order by position within stage
    query = query.orderBy(pipelineStages.stage, pipelineStages.position) as any

    const stages = await query

    // Get task counts for all candidates
    const candidateIds = [...new Set(stages.map((s) => s.candidateId))]
    const taskCounts = await db
      .select({
        candidateId: tasks.candidateId,
        total: sql<number>`count(*)`.as("total"),
        pending: sql<number>`sum(case when ${tasks.status} in ('pending', 'in_progress') then 1 else 0 end)`.as(
          "pending",
        ),
      })
      .from(tasks)
      .where(sql`${tasks.candidateId} in (${sql.raw(candidateIds.map(() => "?").join(","))})`)
      .groupBy(tasks.candidateId)

    // Create a map for quick lookup
    const taskCountMap = new Map(
      taskCounts.map((tc) => [tc.candidateId, { total: Number(tc.total), pending: Number(tc.pending) }]),
    )

    // Enrich stages with task counts
    const enrichedStages = stages.map((stage) => ({
      ...stage,
      tasksCount: taskCountMap.get(stage.candidateId)?.total || 0,
      pendingTasksCount: taskCountMap.get(stage.candidateId)?.pending || 0,
    }))

    // Group by stage for easier frontend consumption
    const stageGroups = enrichedStages.reduce(
      (acc, item) => {
        const stageName = item.stage || "sourcing"
        if (!acc[stageName]) {
          acc[stageName] = []
        }
        acc[stageName].push(item)
        return acc
      },
      {} as Record<string, typeof enrichedStages>,
    )

    return NextResponse.json({
      stages: stageGroups,
      total: enrichedStages.length,
    })
  } catch (error) {
    console.error("[Pipeline API] Error:", error)
    const message = error instanceof Error ? error.message : "Ошибка получения pipeline"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/**
 * POST /api/crm/pipeline
 * Добавить кандидата в pipeline (создать карточку)
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromSession()
    if (!user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 })
    }

    // Rate limiting
    const identifier = getClientIdentifier(request, user.id)
    const rateLimitResult = apiRateLimiter.check(identifier)

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: "Слишком много запросов" },
        {
          status: 429,
          headers: {
            "Retry-After": rateLimitResult.retryAfter?.toString() || "60",
          },
        },
      )
    }

    const body = await request.json()
    const { candidateId, vacancyId, stage = "sourcing", assignedTo, notes } = body

    if (!candidateId) {
      return NextResponse.json({ error: "candidateId обязателен" }, { status: 400 })
    }

    // Check if candidate already in pipeline for this vacancy
    const existing = await db
      .select()
      .from(pipelineStages)
      .where(
        vacancyId
          ? and(eq(pipelineStages.candidateId, candidateId), eq(pipelineStages.vacancyId, vacancyId))
          : eq(pipelineStages.candidateId, candidateId),
      )
      .limit(1)

    if (existing.length > 0) {
      return NextResponse.json({ error: "Кандидат уже в pipeline" }, { status: 400 })
    }

    // Get max position for this stage
    const [maxPos] = await db
      .select({ max: sql<number>`COALESCE(MAX(${pipelineStages.position}), -1)` })
      .from(pipelineStages)
      .where(eq(pipelineStages.stage, stage))

    const position = (maxPos?.max ?? -1) + 1

    // Create pipeline stage
    const [newStage] = await db
      .insert(pipelineStages)
      .values({
        candidateId,
        vacancyId: vacancyId || null,
        stage,
        position,
        assignedTo: assignedTo || null,
        notes: notes || null,
        movedBy: user.id,
      })
      .returning()

    // Log activity
    await db.insert(activities).values({
      candidateId,
      vacancyId: vacancyId || null,
      actionType: "pipeline_added",
      title: `Добавлен в pipeline: ${stage}`,
      metadata: JSON.stringify({
        stage,
        position,
      }),
    })

    console.log(`[Pipeline API] Added candidate ${candidateId} to stage ${stage}`)

    return NextResponse.json(newStage, { status: 201 })
  } catch (error) {
    console.error("[Pipeline API] Error creating stage:", error)
    const message = error instanceof Error ? error.message : "Ошибка создания карточки"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/**
 * PATCH /api/crm/pipeline/:id
 * Обновить карточку (notes, assignedTo)
 */
export async function PATCH(request: NextRequest) {
  try {
    const user = await getUserFromSession()
    if (!user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 })
    }

    const body = await request.json()
    const { id, notes, assignedTo } = body

    if (!id) {
      return NextResponse.json({ error: "id обязателен" }, { status: 400 })
    }

    const updates: any = {}
    if (notes !== undefined) updates.notes = notes
    if (assignedTo !== undefined) updates.assignedTo = assignedTo

    const [updated] = await db.update(pipelineStages).set(updates).where(eq(pipelineStages.id, id)).returning()

    if (!updated) {
      return NextResponse.json({ error: "Карточка не найдена" }, { status: 404 })
    }

    return NextResponse.json(updated)
  } catch (error) {
    console.error("[Pipeline API] Error updating stage:", error)
    const message = error instanceof Error ? error.message : "Ошибка обновления карточки"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/**
 * DELETE /api/crm/pipeline/:id
 * Удалить карточку из pipeline
 */
export async function DELETE(request: NextRequest) {
  try {
    const user = await getUserFromSession()
    if (!user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "id обязателен" }, { status: 400 })
    }

    await db.delete(pipelineStages).where(eq(pipelineStages.id, id))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[Pipeline API] Error deleting stage:", error)
    const message = error instanceof Error ? error.message : "Ошибка удаления карточки"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
