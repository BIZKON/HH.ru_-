"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Mail, Send, FileText, MessageSquare, Phone } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { ru } from "date-fns/locale"
import { renderTemplate, buildTemplateVariables } from "@/lib/template-engine"

export interface Communication {
  id: string
  candidateId: string
  type: string
  direction: string
  subject?: string | null
  body: string
  sentAt: Date | string
  createdBy?: string | null
  status?: string | null
}

interface CommunicationPanelProps {
  candidateId: string
  candidate: {
    fullName?: string | null
    firstName?: string | null
    lastName?: string | null
    email?: string | null
    phone?: string | null
    currentPosition?: string | null
  }
  vacancy?: {
    title?: string | null
    location?: string | null
  } | null
  communications: Communication[]
  onSendMessage: (message: {
    type: string
    subject?: string
    body: string
  }) => Promise<void>
}

interface Template {
  id: string
  name: string
  category: string
  subject?: string | null
  body: string
}

const communicationTypes = [
  { value: "email", label: "Email", icon: Mail },
  { value: "sms", label: "SMS", icon: MessageSquare },
  { value: "call", label: "Звонок", icon: Phone },
  { value: "other", label: "Другое", icon: FileText },
]

const directionLabels = {
  outgoing: "Исходящее",
  incoming: "Входящее",
}

export function CommunicationPanel({
  candidateId,
  candidate,
  vacancy,
  communications,
  onSendMessage,
}: CommunicationPanelProps) {
  const [showComposeDialog, setShowComposeDialog] = useState(false)
  const [templates, setTemplates] = useState<Template[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<string>("")
  const [messageType, setMessageType] = useState("email")
  const [subject, setSubject] = useState("")
  const [body, setBody] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      const response = await fetch("/api/crm/templates")
      if (response.ok) {
        const data = await response.json()
        setTemplates(data)
      }
    } catch (error) {
      console.error("Error fetching templates:", error)
    }
  }

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId)

    if (!templateId) {
      setSubject("")
      setBody("")
      return
    }

    const template = templates.find((t) => t.id === templateId)
    if (template) {
      // Build variables
      const variables = buildTemplateVariables({
        candidate,
        vacancy: vacancy || undefined,
        recruiter: {
          name: "Рекрутер", // TODO: Get from session
          email: "recruiter@company.com", // TODO: Get from session
        },
      })

      // Render template
      const renderedSubject = template.subject
        ? renderTemplate(template.subject, variables)
        : ""
      const renderedBody = renderTemplate(template.body, variables)

      setSubject(renderedSubject)
      setBody(renderedBody)
    }
  }

  const handleSend = async () => {
    if (!body.trim()) {
      alert("Введите текст сообщения")
      return
    }

    setLoading(true)
    try {
      await onSendMessage({
        type: messageType,
        subject: messageType === "email" ? subject : undefined,
        body,
      })

      // Reset form
      setShowComposeDialog(false)
      setSelectedTemplate("")
      setSubject("")
      setBody("")
      setMessageType("email")
    } catch (error) {
      console.error("Error sending message:", error)
      alert("Не удалось отправить сообщение")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Send Message Button */}
      <Button onClick={() => setShowComposeDialog(true)} className="w-full">
        <Send className="h-4 w-4 mr-2" />
        Отправить сообщение
      </Button>

      {/* Communications History */}
      <div className="space-y-3">
        {communications.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-30" />
            <p>Коммуникаций нет</p>
            <p className="text-sm mt-1">
              Отправьте первое сообщение кандидату
            </p>
          </div>
        ) : (
          communications.map((communication) => {
            const TypeIcon =
              communicationTypes.find((t) => t.value === communication.type)
                ?.icon || FileText

            return (
              <Card key={communication.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <TypeIcon className="h-4 w-4 text-muted-foreground" />
                      <CardTitle className="text-sm font-medium">
                        {communicationTypes.find(
                          (t) => t.value === communication.type
                        )?.label || communication.type}
                      </CardTitle>
                      <Badge variant="outline" className="text-xs">
                        {directionLabels[
                          communication.direction as keyof typeof directionLabels
                        ] || communication.direction}
                      </Badge>
                      {communication.status && (
                        <Badge variant="secondary" className="text-xs">
                          {communication.status}
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(communication.sentAt), {
                        addSuffix: true,
                        locale: ru,
                      })}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  {communication.subject && (
                    <p className="text-sm font-medium mb-2">
                      {communication.subject}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {communication.body}
                  </p>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* Compose Dialog */}
      <Dialog open={showComposeDialog} onOpenChange={setShowComposeDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Отправить сообщение</DialogTitle>
            <DialogDescription>
              Кандидат: {candidate.fullName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="message-type">Тип сообщения</Label>
              <Select value={messageType} onValueChange={setMessageType}>
                <SelectTrigger id="message-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {communicationTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <type.icon className="h-4 w-4" />
                        {type.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="template">Шаблон (опционально)</Label>
              <Select
                value={selectedTemplate}
                onValueChange={handleTemplateSelect}
              >
                <SelectTrigger id="template">
                  <SelectValue placeholder="Выберите шаблон..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Без шаблона</SelectItem>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name} ({template.category})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {messageType === "email" && (
              <div className="space-y-2">
                <Label htmlFor="subject">Тема</Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Тема письма..."
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="message-body">Сообщение *</Label>
              <Textarea
                id="message-body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                required
                placeholder="Текст сообщения..."
                rows={10}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowComposeDialog(false)}
              disabled={loading}
            >
              Отмена
            </Button>
            <Button onClick={handleSend} disabled={loading || !body.trim()}>
              {loading ? (
                "Отправка..."
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Отправить
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
