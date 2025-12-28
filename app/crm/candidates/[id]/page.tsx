"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  ExternalLink,
  Calendar,
  User,
} from "lucide-react"
import { Timeline, TimelineEvent } from "@/components/crm/timeline"
import { NotesPanel, Note } from "@/components/crm/notes-panel"
import { EvaluationsPanel, Evaluation } from "@/components/crm/evaluations-panel"
import { TaskList, Task } from "@/components/crm/task-list"
import { TaskForm, TaskFormData } from "@/components/crm/task-form"
import { CommunicationPanel, Communication } from "@/components/crm/communication-panel"
import { formatDistanceToNow } from "date-fns"
import { ru } from "date-fns/locale"

interface CandidateData {
  candidate: any
  notes: Note[]
  evaluations: Evaluation[]
  tasks: Task[]
  pipelineHistory: any[]
  activities: any[]
  communications: any[]
}

export default function CandidateProfilePage() {
  const params = useParams()
  const router = useRouter()
  const candidateId = params.id as string

  const [data, setData] = useState<CandidateData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)

  const fetchData = async () => {
    try {
      const response = await fetch(`/api/crm/candidates/${candidateId}`)
      if (response.ok) {
        const result = await response.json()
        setData(result)
      } else {
        console.error("Failed to fetch candidate data")
      }
    } catch (error) {
      console.error("Error fetching candidate data:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [candidateId])

  const handleAddNote = async (note: string) => {
    const response = await fetch("/api/crm/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ candidateId, note }),
    })

    if (response.ok) {
      await fetchData()
    }
  }

  const handleDeleteNote = async (noteId: string) => {
    const response = await fetch(`/api/crm/notes?id=${noteId}`, {
      method: "DELETE",
    })

    if (response.ok) {
      await fetchData()
    }
  }

  const handleAddEvaluation = async (evaluation: any) => {
    const response = await fetch("/api/crm/evaluations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ candidateId, ...evaluation }),
    })

    if (response.ok) {
      await fetchData()
    }
  }

  const handleCreateTask = async (taskData: TaskFormData) => {
    const response = await fetch("/api/crm/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...taskData, candidateId }),
    })

    if (response.ok) {
      await fetchData()
      setShowTaskForm(false)
    }
  }

  const handleUpdateTask = async (taskData: TaskFormData) => {
    const response = await fetch("/api/crm/tasks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(taskData),
    })

    if (response.ok) {
      await fetchData()
      setShowTaskForm(false)
      setEditingTask(null)
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Вы уверены, что хотите удалить эту задачу?")) return

    const response = await fetch(`/api/crm/tasks?id=${taskId}`, {
      method: "DELETE",
    })

    if (response.ok) {
      await fetchData()
    }
  }

  const handleStatusChange = async (taskId: string, status: string) => {
    const response = await fetch("/api/crm/tasks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: taskId, status }),
    })

    if (response.ok) {
      await fetchData()
    }
  }

  const handleEditTask = (task: Task) => {
    setEditingTask(task)
    setShowTaskForm(true)
  }

  const handleSendMessage = async (message: {
    type: string
    subject?: string
    body: string
  }) => {
    const response = await fetch("/api/crm/communications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        candidateId,
        ...message,
      }),
    })

    if (response.ok) {
      await fetchData()
    } else {
      throw new Error("Failed to send message")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Загрузка профиля...</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Кандидат не найден</p>
          <Button onClick={() => router.back()} className="mt-4">
            Вернуться назад
          </Button>
        </div>
      </div>
    )
  }

  const { candidate, notes, evaluations, tasks, pipelineHistory, activities } = data

  // Build timeline events
  const timelineEvents: TimelineEvent[] = [
    ...notes.map((note) => ({
      id: note.id,
      type: "note" as const,
      title: "Добавлена заметка",
      description: note.note,
      timestamp: note.createdAt,
      user: note.user,
    })),
    ...evaluations.map((eval) => ({
      id: eval.id,
      type: "evaluation" as const,
      title: `Оценка: ${eval.criteriaName}`,
      description: eval.feedback || undefined,
      timestamp: eval.createdAt,
      user: eval.user,
      metadata: { score: `${eval.score}/${eval.maxScore}` },
    })),
    ...tasks.map((task) => ({
      id: task.id,
      type: "task" as const,
      title: task.title,
      description: task.description || undefined,
      timestamp: task.createdAt,
      user: task.assignedUser,
      metadata: { status: task.status, priority: task.priority },
    })),
    ...pipelineHistory.map((stage) => ({
      id: stage.id,
      type: "stage_change" as const,
      title: `Перемещен в: ${stage.stage}`,
      description: stage.notes || undefined,
      timestamp: stage.movedAt,
      user: stage.user,
      metadata: stage.vacancy ? { vacancy: stage.vacancy.title } : undefined,
    })),
    ...activities.map((activity) => ({
      id: activity.id,
      type: "activity" as const,
      title: activity.action,
      description: activity.details || undefined,
      timestamp: activity.createdAt,
      user: activity.user,
    })),
  ].sort(
    (a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Профиль кандидата</h1>
        </div>
      </div>

      {/* Candidate Info Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-6">
            <Avatar className="h-20 w-20">
              <AvatarFallback className="text-2xl">
                {candidate.fullName
                  .split(" ")
                  .map((n: string) => n[0])
                  .join("")
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-2xl font-bold">{candidate.fullName}</h2>
              {candidate.currentPosition && (
                <p className="text-muted-foreground flex items-center gap-2 mt-1">
                  <Briefcase className="h-4 w-4" />
                  {candidate.currentPosition}
                </p>
              )}
              <div className="flex flex-wrap gap-4 mt-3">
                {candidate.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a
                      href={`mailto:${candidate.email}`}
                      className="text-blue-600 hover:underline"
                    >
                      {candidate.email}
                    </a>
                  </div>
                )}
                {candidate.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a
                      href={`tel:${candidate.phone}`}
                      className="text-blue-600 hover:underline"
                    >
                      {candidate.phone}
                    </a>
                  </div>
                )}
                {candidate.location && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{candidate.location}</span>
                  </div>
                )}
              </div>
              {candidate.skills && candidate.skills.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {candidate.skills.map((skill: string, index: number) => (
                    <Badge key={index} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                </div>
              )}
              {candidate.resumeUrl && (
                <Button variant="outline" size="sm" className="mt-4" asChild>
                  <a
                    href={candidate.resumeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Открыть резюме
                  </a>
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Обзор</TabsTrigger>
          <TabsTrigger value="timeline">
            История ({timelineEvents.length})
          </TabsTrigger>
          <TabsTrigger value="notes">Заметки ({notes.length})</TabsTrigger>
          <TabsTrigger value="evaluations">
            Оценки ({evaluations.length})
          </TabsTrigger>
          <TabsTrigger value="tasks">Задачи ({tasks.length})</TabsTrigger>
          <TabsTrigger value="communications">
            Коммуникации ({data?.communications.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Статистика</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Заметок:</span>
                  <span className="font-medium">{notes.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Оценок:</span>
                  <span className="font-medium">{evaluations.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Задач:</span>
                  <span className="font-medium">{tasks.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Этапов пройдено:</span>
                  <span className="font-medium">{pipelineHistory.length}</span>
                </div>
              </CardContent>
            </Card>

            {/* Current Stage */}
            {pipelineHistory.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Текущий этап</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge className="text-base px-3 py-1">
                    {pipelineHistory[0].stage}
                  </Badge>
                  {pipelineHistory[0].vacancy && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Вакансия: {pipelineHistory[0].vacancy.title}
                    </p>
                  )}
                  {pipelineHistory[0].movedAt && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(pipelineHistory[0].movedAt), {
                        addSuffix: true,
                        locale: ru,
                      })}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Recent Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Недавние события</CardTitle>
            </CardHeader>
            <CardContent>
              <Timeline events={timelineEvents.slice(0, 5)} />
              {timelineEvents.length > 5 && (
                <p className="text-center text-sm text-muted-foreground mt-4">
                  Всего {timelineEvents.length} событий. Посмотрите вкладку
                  "История" для полного списка.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline">
          <Card>
            <CardHeader>
              <CardTitle>Полная история</CardTitle>
            </CardHeader>
            <CardContent>
              <Timeline events={timelineEvents} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes">
          <NotesPanel
            notes={notes}
            onAddNote={handleAddNote}
            onDeleteNote={handleDeleteNote}
          />
        </TabsContent>

        <TabsContent value="evaluations">
          <EvaluationsPanel
            evaluations={evaluations}
            onAddEvaluation={handleAddEvaluation}
          />
        </TabsContent>

        <TabsContent value="tasks" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setShowTaskForm(true)}>
              Создать задачу
            </Button>
          </div>
          <TaskList
            tasks={tasks}
            onEdit={handleEditTask}
            onDelete={handleDeleteTask}
            onStatusChange={handleStatusChange}
          />
        </TabsContent>

        <TabsContent value="communications">
          <CommunicationPanel
            candidateId={candidateId}
            candidate={candidate}
            vacancy={pipelineHistory.length > 0 ? pipelineHistory[0].vacancy : null}
            communications={data?.communications || []}
            onSendMessage={handleSendMessage}
          />
        </TabsContent>
      </Tabs>

      {/* Task Form Dialog */}
      <TaskForm
        open={showTaskForm}
        onClose={() => {
          setShowTaskForm(false)
          setEditingTask(null)
        }}
        onSave={editingTask ? handleUpdateTask : handleCreateTask}
        initialData={editingTask || undefined}
        candidateId={candidateId}
      />
    </div>
  )
}
