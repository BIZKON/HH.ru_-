import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { messageTemplates, users } from "@/lib/db/schema"
import { eq, and, like, or, desc } from "drizzle-orm"

// GET /api/crm/templates - Get all message templates
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get("category")
    const search = searchParams.get("search")

    // Build where conditions
    const conditions: any[] = []

    if (category) {
      conditions.push(eq(messageTemplates.category, category))
    }

    if (search) {
      conditions.push(
        or(
          like(messageTemplates.name, `%${search}%`),
          like(messageTemplates.subject, `%${search}%`),
          like(messageTemplates.body, `%${search}%`)
        )
      )
    }

    let query = db
      .select({
        id: messageTemplates.id,
        name: messageTemplates.name,
        category: messageTemplates.category,
        subject: messageTemplates.subject,
        body: messageTemplates.body,
        variables: messageTemplates.variables,
        isActive: messageTemplates.isActive,
        createdBy: messageTemplates.createdBy,
        createdAt: messageTemplates.createdAt,
        updatedAt: messageTemplates.updatedAt,
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
        },
      })
      .from(messageTemplates)
      .leftJoin(users, eq(messageTemplates.createdBy, users.id))

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any
    }

    query = query.orderBy(desc(messageTemplates.createdAt)) as any

    const templates = await query

    return NextResponse.json(templates)
  } catch (error) {
    console.error("Error fetching templates:", error)
    return NextResponse.json(
      { error: "Failed to fetch templates" },
      { status: 500 }
    )
  }
}

// POST /api/crm/templates - Create new template
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, category, subject, body: templateBody, variables, isActive = true } = body

    // Validation
    if (!name || !category || !templateBody) {
      return NextResponse.json(
        { error: "Name, category, and body are required" },
        { status: 400 }
      )
    }

    // Create template
    const [template] = await db
      .insert(messageTemplates)
      .values({
        name,
        category,
        subject,
        body: templateBody,
        variables: variables ? JSON.stringify(variables) : null,
        isActive,
        createdBy: session.user.id,
      })
      .returning()

    return NextResponse.json(template, { status: 201 })
  } catch (error) {
    console.error("Error creating template:", error)
    return NextResponse.json(
      { error: "Failed to create template" },
      { status: 500 }
    )
  }
}

// PATCH /api/crm/templates - Update template
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
        { error: "Template ID is required" },
        { status: 400 }
      )
    }

    // Handle variables serialization
    if (updates.variables) {
      updates.variables = JSON.stringify(updates.variables)
    }

    updates.updatedAt = new Date()

    const [template] = await db
      .update(messageTemplates)
      .set(updates)
      .where(eq(messageTemplates.id, id))
      .returning()

    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 })
    }

    return NextResponse.json(template)
  } catch (error) {
    console.error("Error updating template:", error)
    return NextResponse.json(
      { error: "Failed to update template" },
      { status: 500 }
    )
  }
}

// DELETE /api/crm/templates - Delete template
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
        { error: "Template ID is required" },
        { status: 400 }
      )
    }

    await db.delete(messageTemplates).where(eq(messageTemplates.id, id))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting template:", error)
    return NextResponse.json(
      { error: "Failed to delete template" },
      { status: 500 }
    )
  }
}
