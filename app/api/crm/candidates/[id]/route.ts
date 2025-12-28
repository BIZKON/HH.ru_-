import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import {
  candidates,
  activities,
  candidateNotes,
  candidateEvaluations,
  tasks,
  pipelineStages,
  activityLog,
  communications,
  users,
  vacancies,
} from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"
import { jsonStringify } from "@/lib/db/queries/helpers"

// GET /api/crm/candidates/[id] - Get candidate with all related data
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: candidateId } = await params

    // Get candidate
    const [candidate] = await db
      .select()
      .from(candidates)
      .where(eq(candidates.id, candidateId))

    if (!candidate) {
      return NextResponse.json({ error: "Candidate not found" }, { status: 404 })
    }

    // Get notes
    const notes = await db
      .select({
        id: candidateNotes.id,
        note: candidateNotes.note,
        createdAt: candidateNotes.createdAt,
        createdBy: candidateNotes.createdBy,
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
        },
      })
      .from(candidateNotes)
      .leftJoin(users, eq(candidateNotes.createdBy, users.id))
      .where(eq(candidateNotes.candidateId, candidateId))
      .orderBy(desc(candidateNotes.createdAt))

    // Get evaluations
    const evaluations = await db
      .select({
        id: candidateEvaluations.id,
        criteriaName: candidateEvaluations.criteriaName,
        score: candidateEvaluations.score,
        maxScore: candidateEvaluations.maxScore,
        feedback: candidateEvaluations.feedback,
        evaluatedBy: candidateEvaluations.evaluatedBy,
        createdAt: candidateEvaluations.createdAt,
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
        },
      })
      .from(candidateEvaluations)
      .leftJoin(users, eq(candidateEvaluations.evaluatedBy, users.id))
      .where(eq(candidateEvaluations.candidateId, candidateId))
      .orderBy(desc(candidateEvaluations.createdAt))

    // Get tasks
    const candidateTasks = await db
      .select({
        id: tasks.id,
        title: tasks.title,
        description: tasks.description,
        type: tasks.type,
        priority: tasks.priority,
        status: tasks.status,
        dueDate: tasks.dueDate,
        completedAt: tasks.completedAt,
        createdAt: tasks.createdAt,
        assignedUser: {
          id: users.id,
          name: users.name,
          email: users.email,
        },
      })
      .from(tasks)
      .leftJoin(users, eq(tasks.assignedTo, users.id))
      .where(eq(tasks.candidateId, candidateId))
      .orderBy(desc(tasks.createdAt))

    // Get pipeline history
    const pipelineHistory = await db
      .select({
        id: pipelineStages.id,
        stage: pipelineStages.stage,
        notes: pipelineStages.notes,
        movedAt: pipelineStages.movedAt,
        movedBy: pipelineStages.movedBy,
        vacancy: {
          id: vacancies.id,
          title: vacancies.title,
        },
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
        },
      })
      .from(pipelineStages)
      .leftJoin(vacancies, eq(pipelineStages.vacancyId, vacancies.id))
      .leftJoin(users, eq(pipelineStages.movedBy, users.id))
      .where(eq(pipelineStages.candidateId, candidateId))
      .orderBy(desc(pipelineStages.movedAt))

    // Get activity log
    const activityLogs = await db
      .select({
        id: activityLog.id,
        action: activityLog.action,
        entityType: activityLog.entityType,
        entityId: activityLog.entityId,
        details: activityLog.details,
        createdAt: activityLog.createdAt,
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
        },
      })
      .from(activityLog)
      .leftJoin(users, eq(activityLog.userId, users.id))
      .where(eq(activityLog.candidateId, candidateId))
      .orderBy(desc(activityLog.createdAt))
      .limit(50)

    // Get communications
    const candidateCommunications = await db
      .select()
      .from(communications)
      .where(eq(communications.candidateId, candidateId))
      .orderBy(desc(communications.sentAt))

    return NextResponse.json({
      candidate,
      notes,
      evaluations,
      tasks: candidateTasks,
      pipelineHistory,
      activities: activityLogs,
      communications: candidateCommunications,
    })
  } catch (error) {
    console.error("Error fetching candidate details:", error)
    return NextResponse.json(
      { error: "Failed to fetch candidate details" },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()

    const [existing] = await db
      .select()
      .from(candidates)
      .where(eq(candidates.id, id))
      .limit(1)

    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    const [data] = await db
      .update(candidates)
      .set({
        ...body,
        skills: body.skills ? jsonStringify(body.skills) : existing.skills,
        tags: body.tags ? jsonStringify(body.tags) : existing.tags,
        updatedAt: new Date(),
      })
      .where(eq(candidates.id, id))
      .returning()

    // Log activity
    if (body.status) {
      await db.insert(activities).values({
        candidateId: id,
        actionType: "status_changed",
        title: `Статус изменен на: ${body.status}`,
        metadata: jsonStringify({ new_status: body.status }),
      })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
