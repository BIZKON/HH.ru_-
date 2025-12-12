"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Send, ExternalLink, Phone, Mail, MapPin, Briefcase } from "lucide-react"
import type { Negotiation, Message } from "@/lib/types"

export default function NegotiationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [negotiation, setNegotiation] = useState<Negotiation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    loadData()
    // Poll for new messages every 10 seconds
    const interval = setInterval(loadMessages, 10000)
    return () => clearInterval(interval)
  }, [id])

  async function loadData() {
    try {
      setLoading(true)
      await Promise.all([loadNegotiation(), loadMessages()])
    } finally {
      setLoading(false)
    }
  }

  async function loadNegotiation() {
    const response = await fetch(`/api/crm/negotiations/${id}`)
    if (!response.ok) throw new Error("Failed to load negotiation")
    const data = await response.json()
    setNegotiation(data)
  }

  async function loadMessages() {
    const response = await fetch(`/api/crm/messages?negotiation_id=${id}`)
    if (!response.ok) throw new Error("Failed to load messages")
    const data = await response.json()
    setMessages(data)
  }

  async function sendMessage() {
    if (!newMessage.trim() || sending) return

    try {
      setSending(true)

      const response = await fetch("/api/crm/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          negotiation_id: id,
          author: "employer",
          text: newMessage,
          read_by_employer: true,
          read_by_applicant: false,
        }),
      })

      if (!response.ok) throw new Error("Failed to send message")

      setNewMessage("")
      await loadMessages()
    } catch (error) {
      console.error("Failed to send message:", error)
      alert("Не удалось отправить сообщение")
    } finally {
      setSending(false)
    }
  }

  async function updateState(newState: string) {
    try {
      const response = await fetch(`/api/crm/negotiations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state: newState }),
      })

      if (!response.ok) throw new Error("Failed to update state")

      await loadNegotiation()
    } catch (error) {
      console.error("Failed to update state:", error)
      alert("Не удалось обновить статус")
    }
  }

  function getStateColor(state: string) {
    const colors: Record<string, string> = {
      new: "bg-blue-500",
      invitation: "bg-purple-500",
      response: "bg-green-500",
      discard: "bg-gray-500",
      hired: "bg-emerald-500",
      archived: "bg-slate-500",
    }
    return colors[state] || "bg-gray-500"
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Загрузка...</div>
      </div>
    )
  }

  if (!negotiation) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Отклик не найден</div>
      </div>
    )
  }

  const candidate = negotiation.candidate
  const vacancy = negotiation.vacancy

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{candidate?.full_name || "Кандидат"}</h1>
          <p className="text-sm text-muted-foreground">{vacancy?.title || "Вакансия"}</p>
        </div>
        <Select value={negotiation.state} onValueChange={updateState}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="new">Новый</SelectItem>
            <SelectItem value="invitation">Приглашение</SelectItem>
            <SelectItem value="response">Отклик</SelectItem>
            <SelectItem value="discard">Отклонен</SelectItem>
            <SelectItem value="hired">Нанят</SelectItem>
            <SelectItem value="archived">Архив</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Candidate Info */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Информация о кандидате</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={candidate?.photo_url || undefined} />
                <AvatarFallback>
                  {candidate?.first_name?.[0]}
                  {candidate?.last_name?.[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="font-semibold">{candidate?.full_name}</h3>
                <p className="text-sm text-muted-foreground">{candidate?.current_position}</p>
              </div>
            </div>

            {candidate?.email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a href={`mailto:${candidate.email}`} className="text-primary hover:underline">
                  {candidate.email}
                </a>
              </div>
            )}

            {candidate?.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <a href={`tel:${candidate.phone}`} className="text-primary hover:underline">
                  {candidate.phone}
                </a>
              </div>
            )}

            {candidate?.location && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{candidate.location}</span>
              </div>
            )}

            {candidate?.experience_years !== undefined && (
              <div className="flex items-center gap-2 text-sm">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                <span>Опыт: {candidate.experience_years} лет</span>
              </div>
            )}

            {candidate?.external_id && (
              <Button variant="outline" size="sm" className="w-full gap-2 bg-transparent" asChild>
                <a href={`https://hh.ru/resume/${candidate.external_id}`} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                  Открыть резюме на HH.ru
                </a>
              </Button>
            )}

            <div className="pt-4 border-t">
              <h4 className="text-sm font-semibold mb-2">Навыки</h4>
              <div className="flex flex-wrap gap-1">
                {candidate?.skills?.map((skill, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Chat */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Переписка</CardTitle>
            <CardDescription>История сообщений с кандидатом</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Messages */}
            <div className="space-y-4 min-h-[400px] max-h-[500px] overflow-y-auto rounded-lg border p-4">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">Сообщений пока нет</div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.author === "employer" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-2 ${
                        message.author === "employer"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-foreground"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                      <p
                        className={`text-xs mt-1 ${
                          message.author === "employer" ? "text-primary-foreground/70" : "text-muted-foreground"
                        }`}
                      >
                        {new Date(message.created_at).toLocaleString("ru-RU")}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Send Message */}
            <div className="flex gap-2">
              <Textarea
                placeholder="Введите сообщение..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    sendMessage()
                  }
                }}
                className="min-h-[80px]"
              />
              <Button onClick={sendMessage} disabled={!newMessage.trim() || sending} className="gap-2">
                <Send className="h-4 w-4" />
                Отправить
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              Нажмите Enter для отправки сообщения. Shift+Enter для новой строки.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
