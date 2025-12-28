"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TemplateList, Template } from "@/components/crm/template-list"
import { TemplateForm, TemplateFormData } from "@/components/crm/template-form"
import { Plus, Search, Download } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { DEFAULT_TEMPLATES } from "@/lib/template-engine"

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [showTemplateForm, setShowTemplateForm] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null)

  const fetchTemplates = async () => {
    try {
      const params = new URLSearchParams()
      if (categoryFilter !== "all") params.set("category", categoryFilter)
      if (searchQuery) params.set("search", searchQuery)

      const response = await fetch(`/api/crm/templates?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setTemplates(data)
      }
    } catch (error) {
      console.error("Error fetching templates:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTemplates()
  }, [categoryFilter])

  const handleSearch = () => {
    fetchTemplates()
  }

  const handleCreateTemplate = async (templateData: TemplateFormData) => {
    const response = await fetch("/api/crm/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(templateData),
    })

    if (response.ok) {
      await fetchTemplates()
      setShowTemplateForm(false)
    }
  }

  const handleUpdateTemplate = async (templateData: TemplateFormData) => {
    const response = await fetch("/api/crm/templates", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(templateData),
    })

    if (response.ok) {
      await fetchTemplates()
      setShowTemplateForm(false)
      setEditingTemplate(null)
    }
  }

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm("Вы уверены, что хотите удалить этот шаблон?")) return

    const response = await fetch(`/api/crm/templates?id=${templateId}`, {
      method: "DELETE",
    })

    if (response.ok) {
      await fetchTemplates()
    }
  }

  const handleEdit = (template: Template) => {
    setEditingTemplate(template)
    setShowTemplateForm(true)
  }

  const handleCloseForm = () => {
    setShowTemplateForm(false)
    setEditingTemplate(null)
  }

  const handleImportDefaults = async () => {
    if (!confirm(`Импортировать ${DEFAULT_TEMPLATES.length} стандартных шаблонов?`))
      return

    setLoading(true)
    try {
      for (const template of DEFAULT_TEMPLATES) {
        await fetch("/api/crm/templates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(template),
        })
      }
      await fetchTemplates()
      alert("Шаблоны успешно импортированы!")
    } catch (error) {
      console.error("Error importing templates:", error)
      alert("Ошибка импорта шаблонов")
    } finally {
      setLoading(false)
    }
  }

  // Group templates by category
  const templatesByCategory = templates.reduce((acc, template) => {
    const category = template.category || "other"
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(template)
    return acc
  }, {} as Record<string, Template[]>)

  const invitationTemplates = templatesByCategory.invitation || []
  const confirmationTemplates = templatesByCategory.confirmation || []
  const rejectionTemplates = templatesByCategory.rejection || []
  const offerTemplates = templatesByCategory.offer || []
  const reminderTemplates = templatesByCategory.reminder || []

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Загрузка шаблонов...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Шаблоны сообщений</h1>
          <p className="text-muted-foreground mt-1">
            Управление шаблонами для коммуникации с кандидатами
          </p>
        </div>
        <div className="flex gap-2">
          {templates.length === 0 && (
            <Button onClick={handleImportDefaults} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Импортировать стандартные
            </Button>
          )}
          <Button onClick={() => setShowTemplateForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Создать шаблон
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 flex gap-2">
              <Input
                placeholder="Поиск шаблонов..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
              <Button onClick={handleSearch} variant="secondary">
                <Search className="h-4 w-4" />
              </Button>
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Категория" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все категории</SelectItem>
                <SelectItem value="invitation">Приглашение</SelectItem>
                <SelectItem value="confirmation">Подтверждение</SelectItem>
                <SelectItem value="rejection">Отказ</SelectItem>
                <SelectItem value="offer">Оффер</SelectItem>
                <SelectItem value="reminder">Напоминание</SelectItem>
                <SelectItem value="follow_up">Следующий шаг</SelectItem>
                <SelectItem value="other">Другое</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Templates Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">Все ({templates.length})</TabsTrigger>
          <TabsTrigger value="invitation">
            Приглашение ({invitationTemplates.length})
          </TabsTrigger>
          <TabsTrigger value="confirmation">
            Подтверждение ({confirmationTemplates.length})
          </TabsTrigger>
          <TabsTrigger value="rejection">
            Отказ ({rejectionTemplates.length})
          </TabsTrigger>
          <TabsTrigger value="offer">
            Оффер ({offerTemplates.length})
          </TabsTrigger>
          <TabsTrigger value="reminder">
            Напоминание ({reminderTemplates.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <TemplateList
            templates={templates}
            onEdit={handleEdit}
            onDelete={handleDeleteTemplate}
            onPreview={setPreviewTemplate}
          />
        </TabsContent>

        <TabsContent value="invitation">
          <TemplateList
            templates={invitationTemplates}
            onEdit={handleEdit}
            onDelete={handleDeleteTemplate}
            onPreview={setPreviewTemplate}
          />
        </TabsContent>

        <TabsContent value="confirmation">
          <TemplateList
            templates={confirmationTemplates}
            onEdit={handleEdit}
            onDelete={handleDeleteTemplate}
            onPreview={setPreviewTemplate}
          />
        </TabsContent>

        <TabsContent value="rejection">
          <TemplateList
            templates={rejectionTemplates}
            onEdit={handleEdit}
            onDelete={handleDeleteTemplate}
            onPreview={setPreviewTemplate}
          />
        </TabsContent>

        <TabsContent value="offer">
          <TemplateList
            templates={offerTemplates}
            onEdit={handleEdit}
            onDelete={handleDeleteTemplate}
            onPreview={setPreviewTemplate}
          />
        </TabsContent>

        <TabsContent value="reminder">
          <TemplateList
            templates={reminderTemplates}
            onEdit={handleEdit}
            onDelete={handleDeleteTemplate}
            onPreview={setPreviewTemplate}
          />
        </TabsContent>
      </Tabs>

      {/* Template Form Dialog */}
      <TemplateForm
        open={showTemplateForm}
        onClose={handleCloseForm}
        onSave={editingTemplate ? handleUpdateTemplate : handleCreateTemplate}
        initialData={editingTemplate || undefined}
      />

      {/* Preview Dialog */}
      <Dialog
        open={previewTemplate !== null}
        onOpenChange={() => setPreviewTemplate(null)}
      >
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{previewTemplate?.name}</DialogTitle>
            <DialogDescription>Предпросмотр шаблона</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {previewTemplate?.subject && (
              <div>
                <p className="text-sm font-medium mb-1">Тема:</p>
                <p className="text-sm bg-gray-50 p-3 rounded border">
                  {previewTemplate.subject}
                </p>
              </div>
            )}
            <div>
              <p className="text-sm font-medium mb-1">Текст:</p>
              <div className="text-sm bg-gray-50 p-3 rounded border whitespace-pre-wrap">
                {previewTemplate?.body}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
