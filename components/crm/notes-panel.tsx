"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDistanceToNow } from "date-fns"
import { ru } from "date-fns/locale"
import { Trash2, Plus } from "lucide-react"

export interface Note {
  id: string
  note: string
  createdAt: Date | string
  createdBy?: string | null
  user?: {
    id: string
    name?: string | null
    email: string
  } | null
}

interface NotesPanelProps {
  notes: Note[]
  onAddNote: (note: string) => Promise<void>
  onDeleteNote: (noteId: string) => Promise<void>
  currentUserId?: string
}

export function NotesPanel({
  notes,
  onAddNote,
  onDeleteNote,
  currentUserId,
}: NotesPanelProps) {
  const [newNote, setNewNote] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newNote.trim()) return

    setLoading(true)
    try {
      await onAddNote(newNote)
      setNewNote("")
    } catch (error) {
      console.error("Error adding note:", error)
      alert("Не удалось добавить заметку")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (noteId: string) => {
    if (!confirm("Вы уверены, что хотите удалить эту заметку?")) return

    try {
      await onDeleteNote(noteId)
    } catch (error) {
      console.error("Error deleting note:", error)
      alert("Не удалось удалить заметку")
    }
  }

  return (
    <div className="space-y-4">
      {/* Add Note Form */}
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-3">
            <Textarea
              placeholder="Добавить заметку о кандидате..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              rows={3}
              disabled={loading}
            />
            <div className="flex justify-end">
              <Button type="submit" disabled={loading || !newNote.trim()}>
                <Plus className="h-4 w-4 mr-2" />
                Добавить заметку
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Notes List */}
      <div className="space-y-3">
        {notes.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>Заметок нет</p>
            <p className="text-sm mt-1">Добавьте первую заметку о кандидате</p>
          </div>
        ) : (
          notes.map((note) => (
            <Card key={note.id}>
              <CardContent className="pt-4">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <p className="text-sm whitespace-pre-wrap">{note.note}</p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <span>
                        {note.user?.name || note.user?.email || "Неизвестный пользователь"}
                      </span>
                      <span>•</span>
                      <span>
                        {formatDistanceToNow(new Date(note.createdAt), {
                          addSuffix: true,
                          locale: ru,
                        })}
                      </span>
                    </div>
                  </div>
                  {currentUserId && note.createdBy === currentUserId && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(note.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
