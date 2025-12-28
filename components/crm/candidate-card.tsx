"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Phone,
  Mail,
  MapPin,
  Briefcase,
  ExternalLink,
  Star,
  MessageSquare,
  Calendar,
  MoreVertical,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

export interface CandidateCardProps {
  id: string
  candidateId: string
  candidate: {
    fullName: string
    firstName?: string | null
    lastName?: string | null
    email?: string | null
    phone?: string | null
    currentPosition?: string | null
    location?: string | null
    skills?: string[] | null
    resumeUrl?: string | null
    status?: string | null
    paidAccess?: boolean | null
  }
  stage: string
  position: number
  notes?: string | null
  assignedTo?: string | null
  movedAt?: Date
  isDragging?: boolean
  onOpenProfile?: (candidateId: string) => void
  onAddNote?: (cardId: string) => void
  onAssign?: (cardId: string) => void
  onRemove?: (cardId: string) => void
}

export function CandidateCard({
  id,
  candidateId,
  candidate,
  stage,
  notes,
  assignedTo,
  movedAt,
  isDragging,
  onOpenProfile,
  onAddNote,
  onAssign,
  onRemove,
}: CandidateCardProps) {
  const getInitials = (name: string) => {
    const parts = name.split(" ")
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  const getStageColor = (stage: string) => {
    const colors: Record<string, string> = {
      sourcing: "bg-blue-100 text-blue-800 border-blue-200",
      screening: "bg-purple-100 text-purple-800 border-purple-200",
      contacted: "bg-cyan-100 text-cyan-800 border-cyan-200",
      interview_scheduled: "bg-orange-100 text-orange-800 border-orange-200",
      interview_passed: "bg-green-100 text-green-800 border-green-200",
      offer: "bg-amber-100 text-amber-800 border-amber-200",
      hired: "bg-emerald-100 text-emerald-800 border-emerald-200",
      rejected: "bg-gray-100 text-gray-800 border-gray-200",
    }
    return colors[stage] || "bg-gray-100 text-gray-800 border-gray-200"
  }

  const getStageLabel = (stage: string) => {
    const labels: Record<string, string> = {
      sourcing: "Поиск",
      screening: "Скрининг",
      contacted: "Связались",
      interview_scheduled: "Интервью",
      interview_passed: "Прошел интервью",
      offer: "Оффер",
      hired: "Нанят",
      rejected: "Отклонен",
    }
    return labels[stage] || stage
  }

  return (
    <Card
      className={cn(
        "group hover:shadow-md transition-all cursor-grab active:cursor-grabbing",
        isDragging && "opacity-50 rotate-2 shadow-xl",
        "border-l-4",
        stage === "hired" && "border-l-emerald-500",
        stage === "rejected" && "border-l-gray-400",
        !["hired", "rejected"].includes(stage) && "border-l-primary",
      )}
    >
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Avatar className="h-10 w-10 flex-shrink-0">
              <AvatarFallback className="bg-primary/10 text-primary">
                {getInitials(candidate.fullName)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <h4
                className="font-semibold text-sm truncate cursor-pointer hover:text-primary"
                onClick={() => onOpenProfile?.(candidateId)}
              >
                {candidate.fullName}
              </h4>
              {candidate.currentPosition && (
                <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                  <Briefcase className="h-3 w-3" />
                  {candidate.currentPosition}
                </p>
              )}
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onOpenProfile?.(candidateId)}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Открыть профиль
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAddNote?.(id)}>
                <MessageSquare className="h-4 w-4 mr-2" />
                Добавить заметку
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAssign?.(id)}>
                <Star className="h-4 w-4 mr-2" />
                Назначить
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onRemove?.(id)} className="text-destructive">
                Удалить из pipeline
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Contact Info */}
        <div className="space-y-1">
          {candidate.location && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span className="truncate">{candidate.location}</span>
            </div>
          )}

          {candidate.email && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Mail className="h-3 w-3" />
              <span className="truncate">{candidate.email}</span>
            </div>
          )}

          {candidate.phone && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Phone className="h-3 w-3" />
              <span>{candidate.phone}</span>
            </div>
          )}
        </div>

        {/* Skills */}
        {candidate.skills && candidate.skills.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {candidate.skills.slice(0, 3).map((skill, index) => (
              <Badge key={index} variant="secondary" className="text-xs px-2 py-0">
                {skill}
              </Badge>
            ))}
            {candidate.skills.length > 3 && (
              <Badge variant="outline" className="text-xs px-2 py-0">
                +{candidate.skills.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Notes Preview */}
        {notes && (
          <div className="bg-amber-50 border border-amber-200 rounded p-2">
            <p className="text-xs text-amber-900 line-clamp-2">{notes}</p>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-2">
            {candidate.paidAccess && (
              <Badge variant="outline" className="text-xs px-2 py-0">
                <Star className="h-3 w-3 mr-1 fill-amber-400 text-amber-400" />
                Paid
              </Badge>
            )}
            {movedAt && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {new Date(movedAt).toLocaleDateString("ru-RU")}
              </span>
            )}
          </div>

          {candidate.resumeUrl && (
            <Button variant="ghost" size="sm" className="h-7 text-xs" asChild>
              <a href={candidate.resumeUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3 w-3 mr-1" />
                HH.ru
              </a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
