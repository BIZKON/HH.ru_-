"use client"

import { formatDistanceToNow } from "date-fns"
import { ru } from "date-fns/locale"
import {
  User,
  FileText,
  MessageSquare,
  Phone,
  Mail,
  Calendar,
  CheckCircle,
  AlertCircle,
  TrendingRight,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

export interface TimelineEvent {
  id: string
  type: "note" | "evaluation" | "task" | "stage_change" | "communication" | "activity"
  title: string
  description?: string
  timestamp: Date | string
  user?: {
    id: string
    name?: string | null
    email: string
  } | null
  metadata?: Record<string, any>
}

interface TimelineProps {
  events: TimelineEvent[]
}

const eventIcons = {
  note: FileText,
  evaluation: CheckCircle,
  task: Calendar,
  stage_change: TrendingRight,
  communication: MessageSquare,
  activity: User,
}

const eventColors = {
  note: "text-blue-500",
  evaluation: "text-green-500",
  task: "text-purple-500",
  stage_change: "text-orange-500",
  communication: "text-cyan-500",
  activity: "text-gray-500",
}

const eventLabels = {
  note: "Заметка",
  evaluation: "Оценка",
  task: "Задача",
  stage_change: "Изменение стадии",
  communication: "Коммуникация",
  activity: "Активность",
}

export function Timeline({ events }: TimelineProps) {
  if (events.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Нет событий</p>
      </div>
    )
  }

  return (
    <div className="relative space-y-4">
      {/* Timeline line */}
      <div className="absolute left-6 top-0 bottom-0 w-px bg-border" />

      {events.map((event, index) => {
        const Icon = eventIcons[event.type] || User
        const color = eventColors[event.type] || "text-gray-500"
        const label = eventLabels[event.type] || "Событие"

        return (
          <div key={event.id} className="relative flex gap-4">
            {/* Icon */}
            <div
              className={`relative z-10 flex h-12 w-12 items-center justify-center rounded-full border-4 border-background bg-white ${color}`}
            >
              <Icon className="h-5 w-5" />
            </div>

            {/* Content */}
            <Card className="flex-1">
              <CardContent className="pt-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">
                        {label}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(event.timestamp), {
                          addSuffix: true,
                          locale: ru,
                        })}
                      </span>
                    </div>
                    <h4 className="font-medium text-sm">{event.title}</h4>
                    {event.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {event.description}
                      </p>
                    )}
                    {event.user && (
                      <p className="text-xs text-muted-foreground mt-2">
                        {event.user.name || event.user.email}
                      </p>
                    )}
                    {event.metadata && Object.keys(event.metadata).length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {Object.entries(event.metadata).map(([key, value]) => (
                          <Badge key={key} variant="secondary" className="text-xs">
                            {key}: {String(value)}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )
      })}
    </div>
  )
}
