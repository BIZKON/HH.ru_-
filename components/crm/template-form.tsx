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
import { Badge } from "@/components/ui/badge"
import { Info } from "lucide-react"
import { extractVariables, validateTemplate } from "@/lib/template-engine"

export interface TemplateFormData {
  id?: string
  name: string
  category: string
  subject?: string
  body: string
  isActive?: boolean
}

interface TemplateFormProps {
  open: boolean
  onClose: () => void
  onSave: (template: TemplateFormData) => Promise<void>
  initialData?: Partial<TemplateFormData>
}

const categories = [
  { value: "invitation", label: "Приглашение" },
  { value: "confirmation", label: "Подтверждение" },
  { value: "rejection", label: "Отказ" },
  { value: "offer", label: "Оффер" },
  { value: "reminder", label: "Напоминание" },
  { value: "follow_up", label: "Следующий шаг" },
  { value: "other", label: "Другое" },
]

const availableVariables = [
  { name: "candidate_name", description: "Полное имя кандидата" },
  { name: "candidate_first_name", description: "Имя кандидата" },
  { name: "candidate_last_name", description: "Фамилия кандидата" },
  { name: "candidate_email", description: "Email кандидата" },
  { name: "candidate_phone", description: "Телефон кандидата" },
  { name: "candidate_position", description: "Текущая должность" },
  { name: "vacancy_title", description: "Название вакансии" },
  { name: "vacancy_location", description: "Локация вакансии" },
  { name: "recruiter_name", description: "Имя рекрутера" },
  { name: "recruiter_email", description: "Email рекрутера" },
  { name: "current_date", description: "Текущая дата" },
  { name: "interview_date", description: "Дата собеседования" },
  { name: "interview_time", description: "Время собеседования" },
  { name: "interview_location", description: "Место собеседования" },
  { name: "salary_range", description: "Зарплатная вилка" },
]

export function TemplateForm({
  open,
  onClose,
  onSave,
  initialData,
}: TemplateFormProps) {
  const [formData, setFormData] = useState<TemplateFormData>({
    name: "",
    category: "invitation",
    subject: "",
    body: "",
    isActive: true,
  })
  const [loading, setLoading] = useState(false)
  const [detectedVariables, setDetectedVariables] = useState<string[]>([])
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...formData,
        ...initialData,
      })
    } else {
      setFormData({
        name: "",
        category: "invitation",
        subject: "",
        body: "",
        isActive: true,
      })
    }
  }, [initialData, open])

  useEffect(() => {
    // Detect variables in body
    if (formData.body) {
      const vars = extractVariables(formData.body)
      setDetectedVariables(vars)

      // Validate template
      const validation = validateTemplate(formData.body)
      setValidationErrors(validation.errors)
    } else {
      setDetectedVariables([])
      setValidationErrors([])
    }
  }, [formData.body])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await onSave(formData)
      onClose()
    } catch (error) {
      console.error("Error saving template:", error)
      alert("Не удалось сохранить шаблон")
    } finally {
      setLoading(false)
    }
  }

  const insertVariable = (variableName: string) => {
    const textarea = document.querySelector<HTMLTextAreaElement>("#template-body")
    if (textarea) {
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const text = formData.body
      const before = text.substring(0, start)
      const after = text.substring(end)
      const newText = before + `{{${variableName}}}` + after

      setFormData({ ...formData, body: newText })

      // Restore cursor position
      setTimeout(() => {
        textarea.focus()
        const newPosition = start + variableName.length + 4
        textarea.setSelectionRange(newPosition, newPosition)
      }, 0)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initialData?.id ? "Редактировать шаблон" : "Создать шаблон"}
          </DialogTitle>
          <DialogDescription>
            Создайте шаблон сообщения с переменными для автоматической подстановки данных
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Название шаблона *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
                placeholder="Приглашение на интервью"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Категория *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) =>
                  setFormData({ ...formData, category: value })
                }
              >
                <SelectTrigger id="category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Тема письма</Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) =>
                setFormData({ ...formData, subject: e.target.value })
              }
              placeholder="Приглашение на собеседование - {{vacancy_title}}"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="template-body">Текст шаблона *</Label>
            <Textarea
              id="template-body"
              value={formData.body}
              onChange={(e) =>
                setFormData({ ...formData, body: e.target.value })
              }
              required
              placeholder="Здравствуйте, {{candidate_name}}!..."
              rows={10}
              className="font-mono text-sm"
            />
          </div>

          {validationErrors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded p-3">
              <p className="text-sm font-medium text-red-800">Ошибки в шаблоне:</p>
              <ul className="list-disc list-inside text-sm text-red-700 mt-1">
                {validationErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {detectedVariables.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded p-3">
              <p className="text-sm font-medium text-blue-800 mb-2">
                Обнаруженные переменные:
              </p>
              <div className="flex flex-wrap gap-1">
                {detectedVariables.map((variable) => (
                  <Badge key={variable} variant="secondary" className="text-xs">
                    {variable}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="border rounded p-3 bg-gray-50">
            <div className="flex items-center gap-2 mb-2">
              <Info className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-medium">Доступные переменные:</p>
            </div>
            <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
              {availableVariables.map((variable) => (
                <button
                  key={variable.name}
                  type="button"
                  onClick={() => insertVariable(variable.name)}
                  className="text-left text-xs p-2 hover:bg-white rounded border border-transparent hover:border-gray-300 transition-colors"
                >
                  <span className="font-mono text-blue-600">
                    {`{{${variable.name}}}`}
                  </span>
                  <br />
                  <span className="text-muted-foreground">
                    {variable.description}
                  </span>
                </button>
              ))}
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
            <Button
              type="submit"
              disabled={loading || validationErrors.length > 0}
            >
              {loading ? "Сохранение..." : "Сохранить"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
