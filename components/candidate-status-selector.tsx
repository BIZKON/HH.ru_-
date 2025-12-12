"use client"

import { useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Check, Edit } from "lucide-react"

interface CandidateStatusSelectorProps {
  candidateId: string
  currentStatus: string
  currentNotes?: string
  onStatusChange?: () => void
}

const STATUS_OPTIONS = [
  { value: "new", label: "Новый", color: "bg-blue-500" },
  { value: "contacted", label: "Связались", color: "bg-purple-500" },
  { value: "interview", label: "Интервью", color: "bg-yellow-500" },
  { value: "offer", label: "Оффер", color: "bg-orange-500" },
  { value: "hired", label: "Нанят", color: "bg-green-500" },
  { value: "rejected", label: "Отклонен", color: "bg-red-500" },
]

export function CandidateStatusSelector({
  candidateId,
  currentStatus,
  currentNotes,
  onStatusChange,
}: CandidateStatusSelectorProps) {
  const [status, setStatus] = useState(currentStatus)
  const [notes, setNotes] = useState(currentNotes || "")
  const [saving, setSaving] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  async function handleSave() {
    try {
      setSaving(true)

      const response = await fetch(`/api/crm/candidates/${candidateId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, notes }),
      })

      if (!response.ok) throw new Error("Failed to update")

      setIsOpen(false)
      onStatusChange?.()
    } catch (error) {
      console.error("Failed to update candidate:", error)
      alert("Не удалось обновить статус")
    } finally {
      setSaving(false)
    }
  }

  const currentOption = STATUS_OPTIONS.find((opt) => opt.value === status)

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 bg-transparent">
          <Edit className="h-3 w-3" />
          Изменить статус
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Изменить статус кандидата</DialogTitle>
          <DialogDescription>Обновите статус и добавьте заметки о кандидате</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Статус</label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${option.color}`} />
                      {option.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Заметки</label>
            <Textarea
              placeholder="Добавьте заметки о кандидате..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)} disabled={saving}>
              Отмена
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              <Check className="h-4 w-4 mr-2" />
              Сохранить
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
