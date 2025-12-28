import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { tasks, candidates, vacancies, users } from "@/lib/db/schema"
import { eq, and, or, desc, asc, like, gte, lte } from "drizzle-orm"

// GET /api/crm/tasks - Get all tasks with filters
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const candidateId = searchParams.get("candidateId")
    const vacancyId = searchParams.get("vacancyId")
    const assignedTo = searchParams.get("assignedTo")
    const status = searchParams.get("status")
    const priority = searchParams.get("priority")
    const type = searchParams.get("type")
    const dueBefore = searchParams.get("dueBefore")
    const dueAfter = searchParams.get("dueAfter")
    const search = searchParams.get("search")
    const sortBy = searchParams.get("sortBy") || "dueDate"
    const sortOrder = searchParams.get("sortOrder") || "asc"

    // Build where conditions
    const conditions: any[] = []

    if (candidateId) {
      conditions.push(eq(tasks.candidateId, candidateId))
    }

    if (vacancyId) {
      conditions.push(eq(tasks.vacancyId, vacancyId))
    }

    if (assignedTo) {
      conditions.push(eq(tasks.assignedTo, assignedTo))
    }

    if (status) {
      conditions.push(eq(tasks.status, status))
    }

    if (priority) {
      conditions.push(eq(tasks.priority, priority))
    }

    if (type) {
      conditions.push(eq(tasks.type, type))
    }

    if (dueBefore) {
      conditions.push(lte(tasks.dueDate, new Date(dueBefore)))
    }

    if (dueAfter) {
      conditions.push(gte(tasks.dueDate, new Date(dueAfter)))
    }

    if (search) {
      conditions.push(
        or(
          like(tasks.title, `%${search}%`),
          like(tasks.description, `%${search}%`)
        )
      )
    }

    // Fetch tasks with joins
    let query = db
      .select({
        id: tasks.id,
        title: tasks.title,
        description: tasks.description,
        type: tasks.type,
        priority: tasks.priority,
        status: tasks.status,
        dueDate: tasks.dueDate,
        candidateId: tasks.candidateId,
        vacancyId: tasks.vacancyId,
        assignedTo: tasks.assignedTo,
        createdBy: tasks.createdBy,
        completedAt: tasks.completedAt,
        createdAt: tasks.createdAt,
        updatedAt: tasks.updatedAt,
        candidate: {
          id: candidates.id,
          fullName: candidates.fullName,
          email: candidates.email,
        },
        vacancy: {
          id: vacancies.id,
          title: vacancies.title,
        },
        assignedUser: {
          id: users.id,
          name: users.name,
          email: users.email,
        },
      })
      .from(tasks)
      .leftJoin(candidates, eq(tasks.candidateId, candidates.id))
      .leftJoin(vacancies, eq(tasks.vacancyId, vacancies.id))
      .leftJoin(users, eq(tasks.assignedTo, users.id))

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any
    }

    // Apply sorting
    const orderColumn = sortBy === "priority" ? tasks.priority :
                       sortBy === "status" ? tasks.status :
                       sortBy === "createdAt" ? tasks.createdAt :
                       tasks.dueDate

    query = (sortOrder === "desc" ? query.orderBy(desc(orderColumn)) : query.orderBy(asc(orderColumn))) as any

    const result = await query

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error fetching tasks:", error)
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 }
    )
  }
}

// POST /api/crm/tasks - Create new task
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      title,
      description,
      type,
      priority = "medium",
      status = "pending",
      dueDate,
      candidateId,
      vacancyId,
      assignedTo,
    } = body

    // Validation
    if (!title || !type) {
      return NextResponse.json(
        { error: "Title and type are required" },
        { status: 400 }
      )
    }

    // Create task
    const [task] = await db
      .insert(tasks)
      .values({
        title,
        description,
        type,
        priority,
        status,
        dueDate: dueDate ? new Date(dueDate) : null,
        candidateId,
        vacancyId,
        assignedTo,
        createdBy: session.user.id,
      })
      .returning()

    return NextResponse.json(task, { status: 201 })
  } catch (error) {
    console.error("Error creating task:", error)
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 }
    )
  }
}

// PATCH /api/crm/tasks - Update task
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json(
        { error: "Task ID is required" },
        { status: 400 }
      )
    }

    // Handle completion
    if (updates.status === "completed" && !updates.completedAt) {
      updates.completedAt = new Date()
    }

    // Handle dueDate conversion
    if (updates.dueDate) {
      updates.dueDate = new Date(updates.dueDate)
    }

    updates.updatedAt = new Date()

    const [task] = await db
      .update(tasks)
      .set(updates)
      .where(eq(tasks.id, id))
      .returning()

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    return NextResponse.json(task)
  } catch (error) {
    console.error("Error updating task:", error)
    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 }
    )
  }
}

// DELETE /api/crm/tasks - Delete task
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        { error: "Task ID is required" },
        { status: 400 }
      )
    }

    await db.delete(tasks).where(eq(tasks.id, id))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting task:", error)
    return NextResponse.json(
      { error: "Failed to delete task" },
      { status: 500 }
    )
  }
}
