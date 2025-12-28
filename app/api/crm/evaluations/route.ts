import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { candidateEvaluations } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

// POST /api/crm/evaluations - Create new evaluation
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { candidateId, criteriaName, score, maxScore, feedback } = body

    if (!candidateId || !criteriaName || score === undefined || !maxScore) {
      return NextResponse.json(
        { error: "Required fields: candidateId, criteriaName, score, maxScore" },
        { status: 400 }
      )
    }

    const [evaluation] = await db
      .insert(candidateEvaluations)
      .values({
        candidateId,
        criteriaName,
        score,
        maxScore,
        feedback,
        evaluatedBy: session.user.id,
      })
      .returning()

    return NextResponse.json(evaluation, { status: 201 })
  } catch (error) {
    console.error("Error creating evaluation:", error)
    return NextResponse.json(
      { error: "Failed to create evaluation" },
      { status: 500 }
    )
  }
}

// PATCH /api/crm/evaluations - Update evaluation
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { id, score, feedback } = body

    if (!id) {
      return NextResponse.json(
        { error: "Evaluation ID is required" },
        { status: 400 }
      )
    }

    const [evaluation] = await db
      .update(candidateEvaluations)
      .set({ score, feedback })
      .where(eq(candidateEvaluations.id, id))
      .returning()

    if (!evaluation) {
      return NextResponse.json(
        { error: "Evaluation not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(evaluation)
  } catch (error) {
    console.error("Error updating evaluation:", error)
    return NextResponse.json(
      { error: "Failed to update evaluation" },
      { status: 500 }
    )
  }
}

// DELETE /api/crm/evaluations?id=xxx - Delete evaluation
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
        { error: "Evaluation ID is required" },
        { status: 400 }
      )
    }

    await db.delete(candidateEvaluations).where(eq(candidateEvaluations.id, id))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting evaluation:", error)
    return NextResponse.json(
      { error: "Failed to delete evaluation" },
      { status: 500 }
    )
  }
}
