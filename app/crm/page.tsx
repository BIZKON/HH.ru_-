"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, MessageSquare, TrendingUp, UserCheck, Calendar, ArrowLeft } from "lucide-react"
import type { Negotiation, CRMStats } from "@/lib/types"
import Link from "next/link"

export default function CRMPage() {
  const [negotiations, setNegotiations] = useState<Negotiation[]>([])
  const [stats, setStats] = useState<CRMStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>("all")
  const router = useRouter()

  useEffect(() => {
    loadData()
  }, [filter])

  async function loadData() {
    try {
      setLoading(true)

      const params = new URLSearchParams()
      if (filter !== "all") params.append("state", filter)

      const response = await fetch(`/api/crm/negotiations?${params}`)
      if (!response.ok) throw new Error("Failed to load negotiations")

      const data = await response.json()
      setNegotiations(data)

      calculateStats(data)
    } catch (error) {
      console.error("Failed to load CRM data:", error)
    } finally {
      setLoading(false)
    }
  }

  function calculateStats(data: Negotiation[]) {
    const total = data.length
    const active = data.filter((n) => ["new", "invitation", "response"].includes(n.state)).length
    const hired = data.filter((n) => n.state === "hired").length

    setStats({
      total_candidates: total,
      total_negotiations: total,
      active_negotiations: active,
      hired_count: hired,
      conversion_funnel: {
        new: data.filter((n) => n.state === "new").length,
        contacted: data.filter((n) => n.state === "invitation").length,
        interview: data.filter((n) => n.state === "response").length,
        offer: 0,
        hired: hired,
        rejected: data.filter((n) => n.state === "discard").length,
      },
      recent_activities: [],
    })
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

  function getStateLabel(state: string) {
    const labels: Record<string, string> = {
      new: "Новый",
      invitation: "Приглашение",
      response: "Отклик",
      discard: "Отклонен",
      hired: "Нанят",
      archived: "Архив",
    }
    return labels[state] || state
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Загрузка CRM данных...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Назад к поиску
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                База кандидатов
              </Button>
            </Link>
          </div>
          <h1 className="text-3xl font-bold">CRM Система</h1>
          <p className="text-muted-foreground mt-1">Управление кандидатами и откликами</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadData} variant="outline">
            Обновить
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Всего кандидатов</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_candidates}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Активные переговоры</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.active_negotiations}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Нанято</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.hired_count}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Конверсия</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.total_negotiations > 0 ? Math.round((stats.hired_count / stats.total_negotiations) * 100) : 0}%
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Negotiations List */}
      <Card>
        <CardHeader>
          <CardTitle>Отклики и приглашения</CardTitle>
          <CardDescription>Управление откликами кандидатов и отправленными приглашениями</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={filter} onValueChange={setFilter}>
            <TabsList>
              <TabsTrigger value="all">Все ({negotiations.length})</TabsTrigger>
              <TabsTrigger value="new">Новые ({negotiations.filter((n) => n.state === "new").length})</TabsTrigger>
              <TabsTrigger value="invitation">
                Приглашения ({negotiations.filter((n) => n.state === "invitation").length})
              </TabsTrigger>
              <TabsTrigger value="response">
                Отклики ({negotiations.filter((n) => n.state === "response").length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={filter} className="space-y-4 mt-6">
              {negotiations.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">Нет откликов</div>
              ) : (
                negotiations.map((negotiation) => (
                  <Card key={negotiation.id} className="hover:border-primary transition-colors">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold">{negotiation.candidate?.full_name || "Кандидат"}</h3>
                            <Badge className={getStateColor(negotiation.state)}>
                              {getStateLabel(negotiation.state)}
                            </Badge>
                            {negotiation.has_updates && (
                              <Badge variant="outline" className="bg-orange-50">
                                Есть обновления
                              </Badge>
                            )}
                          </div>

                          <p className="text-sm text-muted-foreground mb-3">
                            {negotiation.vacancy?.title || "Вакансия"}
                          </p>

                          {negotiation.initial_message && (
                            <p className="text-sm mb-3 line-clamp-2">{negotiation.initial_message}</p>
                          )}

                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(negotiation.created_at).toLocaleDateString("ru-RU")}
                            </span>
                            {negotiation.messages_count > 0 && (
                              <span className="flex items-center gap-1">
                                <MessageSquare className="h-3 w-3" />
                                {negotiation.messages_count} сообщений
                              </span>
                            )}
                            {negotiation.source === "employer" ? (
                              <Badge variant="outline">Приглашение</Badge>
                            ) : (
                              <Badge variant="outline">Отклик</Badge>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/crm/negotiations/${negotiation.id}`)}
                          >
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Открыть
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
