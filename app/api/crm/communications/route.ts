import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { communications, activityLog } from "@/lib/db/schema"
import { eq, and, desc } from "drizzle-orm"

// POST /api/crm/communications - Send message to candidate
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      candidateId,
      vacancyId,
      type,
      direction = "outgoing",
      subject,
      body: messageBody,
      status = "sent",
    } = body

    // Validation
    if (!candidateId || !type || !messageBody) {
      return NextResponse.json(
        { error: "Candidate ID, type, and message body are required" },
        { status: 400 }
      )
    }

    // Create communication record
    const [communication] = await db
      .insert(communications)
      .values({
        candidateId,
        vacancyId: vacancyId || null,
        type,
        direction,
        subject,
        body: messageBody,
        status,
        sentAt: new Date(),
        createdBy: session.user.id,
      })
      .returning()

    // Log activity
    await db.insert(activityLog).values({
      userId: session.user.id,
      candidateId,
      vacancyId: vacancyId || null,
      action: "communication_sent",
      entityType: "communication",
      entityId: communication.id,
      details: `Отправлено ${type}: ${subject || "без темы"}`,
    })

    console.log(
      `[Communications API] Sent ${type} to candidate ${candidateId}`
    )

    return NextResponse.json(communication, { status: 201 })
  } catch (error) {
    console.error("Error sending communication:", error)
    return NextResponse.json(
      { error: "Failed to send communication" },
      { status: 500 }
    )
  }
}

// GET /api/crm/communications?candidateId=xxx - Get communications for candidate
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const candidateId = searchParams.get("candidateId")
    const vacancyId = searchParams.get("vacancyId")
    const type = searchParams.get("type")

    const conditions: any[] = []

    if (candidateId) {
      conditions.push(eq(communications.candidateId, candidateId))
    }

    if (vacancyId) {
      conditions.push(eq(communications.vacancyId, vacancyId))
    }

    if (type) {
      conditions.push(eq(communications.type, type))
    }

    let query = db.select().from(communications)

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any
    }

    query = query.orderBy(desc(communications.sentAt)) as any

    const result = await query

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error fetching communications:", error)
    return NextResponse.json(
      { error: "Failed to fetch communications" },
      { status: 500 }
    )
  }
}

// PATCH /api/crm/communications - Update communication status
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { id, status } = body

    if (!id || !status) {
      return NextResponse.json(
        { error: "Communication ID and status are required" },
        { status: 400 }
      )
    }

    const [communication] = await db
      .update(communications)
      .set({ status })
      .where(eq(communications.id, id))
      .returning()

    if (!communication) {
      return NextResponse.json(
        { error: "Communication not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(communication)
  } catch (error) {
    console.error("Error updating communication:", error)
    return NextResponse.json(
      { error: "Failed to update communication" },
      { status: 500 }
    )
  }
}
