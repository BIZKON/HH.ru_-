import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { candidateNotes, users } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"

// POST /api/crm/notes - Create new note
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { candidateId, note } = body

    if (!candidateId || !note) {
      return NextResponse.json(
        { error: "Candidate ID and note are required" },
        { status: 400 }
      )
    }

    const [newNote] = await db
      .insert(candidateNotes)
      .values({
        candidateId,
        note,
        createdBy: session.user.id,
      })
      .returning()

    return NextResponse.json(newNote, { status: 201 })
  } catch (error) {
    console.error("Error creating note:", error)
    return NextResponse.json(
      { error: "Failed to create note" },
      { status: 500 }
    )
  }
}

// DELETE /api/crm/notes?id=xxx - Delete note
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
        { error: "Note ID is required" },
        { status: 400 }
      )
    }

    // Check if user owns the note
    const [note] = await db
      .select()
      .from(candidateNotes)
      .where(eq(candidateNotes.id, id))

    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 })
    }

    if (note.createdBy !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await db.delete(candidateNotes).where(eq(candidateNotes.id, id))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting note:", error)
    return NextResponse.json(
      { error: "Failed to delete note" },
      { status: 500 }
    )
  }
}
