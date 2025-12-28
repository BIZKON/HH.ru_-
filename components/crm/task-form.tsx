"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export interface TaskFormData {
  id?: string
  title: string
  description?: string
  type: string
  priority: string
  status: string
  dueDate?: string
  candidateId?: string
  vacancyId?: string
  assignedTo?: string
}

interface TaskFormProps {
  open: boolean
  onClose: () => void
  onSave: (task: TaskFormData) => Promise<void>
  initialData?: Partial<TaskFormData>
  candidateId?: string
  vacancyId?: string
}

const taskTypes = [
  { value: "call", label: "Звонок" },
  { value: "email", label: "Email" },
  { value: "interview", label: "Интервью" },
  { value: "follow_up", label: "Следующий шаг" },
  { value: "review", label: "Просмотр резюме" },
  { value: "feedback", label: "Обратная связь" },
  { value: "offer", label: "Оффер" },
  { value: "onboarding", label: "Онбординг" },
  { value: "other", label: "Другое" },
]

const priorities = [
  { value: "low", label: "Низкий" },
  { value: "medium", label: "Средний" },
  { value: "high", label: "Высокий" },
  { value: "urgent", label: "Срочный" },
]

const statuses = [
  { value: "pending", label: "Ожидает" },
  { value: "in_progress", label: "В процессе" },
  { value: "completed", label: "Выполнена" },
  { value: "cancelled", label: "Отменена" },
]

export function TaskForm({
  open,
  onClose,
  onSave,
  initialData,
  candidateId,
  vacancyId,
}: TaskFormProps) {
  const [formData, setFormData] = useState<TaskFormData>({
    title: "",
    description: "",
    type: "call",
    priority: "medium",
    status: "pending",
    dueDate: "",
    candidateId: candidateId || "",
    vacancyId: vacancyId || "",
    assignedTo: "",
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...formData,
        ...initialData,
        dueDate: initialData.dueDate
          ? new Date(initialData.dueDate).toISOString().slice(0, 16)
          : "",
      })
    } else {
      // Reset form when opening for new task
      setFormData({
        title: "",
        description: "",
        type: "call",
        priority: "medium",
        status: "pending",
        dueDate: "",
        candidateId: candidateId || "",
        vacancyId: vacancyId || "",
        assignedTo: "",
      })
    }
  }, [initialData, candidateId, vacancyId, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await onSave(formData)
      onClose()
    } catch (error) {
      console.error("Error saving task:", error)
      alert("Не удалось сохранить задачу")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>
            {initialData?.id ? "Редактировать задачу" : "Создать задачу"}
          </DialogTitle>
          <DialogDescription>
            {initialData?.id
              ? "Обновите детали задачи"
              : "Создайте новую задачу для отслеживания"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Название *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              required
              placeholder="Позвонить кандидату..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Описание</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Дополнительная информация..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Тип *</Label>
              <Select
                value={formData.type}
                onValueChange={(value) =>
                  setFormData({ ...formData, type: value })
                }
              >
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {taskTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Приоритет</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) =>
                  setFormData({ ...formData, priority: value })
                }
              >
                <SelectTrigger id="priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {priorities.map((priority) => (
                    <SelectItem key={priority.value} value={priority.value}>
                      {priority.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Статус</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">Срок</Label>
              <Input
                id="dueDate"
                type="datetime-local"
                value={formData.dueDate}
                onChange={(e) =>
                  setFormData({ ...formData, dueDate: e.target.value })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Отмена
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Сохранение..." : "Сохранить"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
