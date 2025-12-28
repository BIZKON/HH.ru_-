"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreVertical, CheckCircle2, Circle, Clock, AlertCircle } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { ru } from "date-fns/locale"

export interface Task {
  id: string
  title: string
  description?: string | null
  type: string
  priority: string
  status: string
  dueDate?: Date | string | null
  candidateId?: string | null
  vacancyId?: string | null
  assignedTo?: string | null
  completedAt?: Date | string | null
  createdAt: Date | string
  updatedAt: Date | string
  candidate?: {
    id: string
    fullName: string
    email?: string | null
  } | null
  vacancy?: {
    id: string
    title: string
  } | null
  assignedUser?: {
    id: string
    name?: string | null
    email: string
  } | null
}

interface TaskListProps {
  tasks: Task[]
  onEdit?: (task: Task) => void
  onDelete?: (taskId: string) => void
  onStatusChange?: (taskId: string, status: string) => void
  onOpenCandidate?: (candidateId: string) => void
}

const priorityColors = {
  low: "bg-gray-500",
  medium: "bg-blue-500",
  high: "bg-orange-500",
  urgent: "bg-red-500",
}

const priorityLabels = {
  low: "Низкий",
  medium: "Средний",
  high: "Высокий",
  urgent: "Срочный",
}

const statusIcons = {
  pending: Circle,
  in_progress: Clock,
  completed: CheckCircle2,
  cancelled: AlertCircle,
}

const statusColors = {
  pending: "text-gray-500",
  in_progress: "text-blue-500",
  completed: "text-green-500",
  cancelled: "text-red-500",
}

const statusLabels = {
  pending: "Ожидает",
  in_progress: "В процессе",
  completed: "Выполнена",
  cancelled: "Отменена",
}

const typeLabels: Record<string, string> = {
  call: "Звонок",
  email: "Email",
  interview: "Интервью",
  follow_up: "Следующий шаг",
  review: "Просмотр",
  feedback: "Обратная связь",
  offer: "Оффер",
  onboarding: "Онбординг",
  other: "Другое",
}

export function TaskList({
  tasks,
  onEdit,
  onDelete,
  onStatusChange,
  onOpenCandidate,
}: TaskListProps) {
  const [expandedTask, setExpandedTask] = useState<string | null>(null)

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    if (onStatusChange) {
      await onStatusChange(taskId, newStatus)
    }
  }

  const isOverdue = (dueDate?: Date | string | null) => {
    if (!dueDate) return false
    return new Date(dueDate) < new Date()
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Задач нет</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {tasks.map((task) => {
        const StatusIcon = statusIcons[task.status as keyof typeof statusIcons] || Circle
        const overdue = isOverdue(task.dueDate)

        return (
          <Card
            key={task.id}
            className={`hover:shadow-md transition-shadow ${
              task.status === "completed" ? "opacity-60" : ""
            }`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <button
                    onClick={() =>
                      handleStatusChange(
                        task.id,
                        task.status === "completed" ? "pending" : "completed"
                      )
                    }
                    className={`mt-0.5 ${
                      statusColors[task.status as keyof typeof statusColors]
                    }`}
                  >
                    <StatusIcon className="h-5 w-5" />
                  </button>
                  <div className="flex-1">
                    <CardTitle className="text-base font-medium">
                      {task.title}
                    </CardTitle>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <Badge variant="outline" className="text-xs">
                        {typeLabels[task.type] || task.type}
                      </Badge>
                      <Badge
                        className={`text-xs text-white ${
                          priorityColors[
                            task.priority as keyof typeof priorityColors
                          ]
                        }`}
                      >
                        {priorityLabels[
                          task.priority as keyof typeof priorityLabels
                        ]}
                      </Badge>
                      {task.dueDate && (
                        <Badge
                          variant={overdue ? "destructive" : "secondary"}
                          className="text-xs"
                        >
                          {overdue ? "Просрочено" : "Срок"}{": "}
                          {formatDistanceToNow(new Date(task.dueDate), {
                            addSuffix: true,
                            locale: ru,
                          })}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {onEdit && (
                      <DropdownMenuItem onClick={() => onEdit(task)}>
                        Редактировать
                      </DropdownMenuItem>
                    )}
                    {onStatusChange && task.status !== "completed" && (
                      <DropdownMenuItem
                        onClick={() => handleStatusChange(task.id, "completed")}
                      >
                        Отметить выполненной
                      </DropdownMenuItem>
                    )}
                    {onStatusChange && task.status !== "in_progress" && (
                      <DropdownMenuItem
                        onClick={() =>
                          handleStatusChange(task.id, "in_progress")
                        }
                      >
                        В процессе
                      </DropdownMenuItem>
                    )}
                    {onDelete && (
                      <DropdownMenuItem
                        onClick={() => onDelete(task.id)}
                        className="text-red-600"
                      >
                        Удалить
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            {(task.description ||
              task.candidate ||
              task.vacancy ||
              task.assignedUser) && (
              <CardContent className="pt-0">
                {task.description && (
                  <p className="text-sm text-muted-foreground mb-2">
                    {task.description}
                  </p>
                )}
                <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                  {task.candidate && (
                    <div>
                      <span className="font-medium">Кандидат: </span>
                      {onOpenCandidate ? (
                        <button
                          onClick={() => onOpenCandidate(task.candidate!.id)}
                          className="text-blue-600 hover:underline"
                        >
                          {task.candidate.fullName}
                        </button>
                      ) : (
                        <span>{task.candidate.fullName}</span>
                      )}
                    </div>
                  )}
                  {task.vacancy && (
                    <div>
                      <span className="font-medium">Вакансия: </span>
                      <span>{task.vacancy.title}</span>
                    </div>
                  )}
                  {task.assignedUser && (
                    <div>
                      <span className="font-medium">Назначена: </span>
                      <span>
                        {task.assignedUser.name || task.assignedUser.email}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            )}
          </Card>
        )
      })}
    </div>
  )
}
