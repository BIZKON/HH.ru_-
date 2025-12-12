"use client"

import { ExternalLink, MapPin, Briefcase, Calendar, Mail, Phone, User, UserPlus, Star, Copy, Check } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useState } from "react"
import type { ScoredCandidate, VacancyConfig } from "@/lib/types"

interface CandidateCardProps {
  candidate: ScoredCandidate
  vacancyConfig: VacancyConfig | null
  onInvite: (candidate: ScoredCandidate) => void
}

export function CandidateCard({ candidate, vacancyConfig, onInvite }: CandidateCardProps) {
  const [copiedPhone, setCopiedPhone] = useState(false)
  const [copiedEmail, setCopiedEmail] = useState(false)

  const initials = candidate.fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  const scoreColor =
    candidate.score >= 85
      ? "text-green-600 dark:text-green-400"
      : candidate.score >= 75
        ? "text-emerald-600 dark:text-emerald-400"
        : candidate.score >= 65
          ? "text-yellow-600 dark:text-yellow-400"
          : candidate.score >= 50
            ? "text-orange-600 dark:text-orange-400"
            : "text-red-600 dark:text-red-400"

  const copyPhone = async () => {
    if (candidate.contacts.phone) {
      await navigator.clipboard.writeText(candidate.contacts.phone)
      setCopiedPhone(true)
      setTimeout(() => setCopiedPhone(false), 2000)
    }
  }

  const copyEmail = async () => {
    if (candidate.contacts.email) {
      await navigator.clipboard.writeText(candidate.contacts.email)
      setCopiedEmail(true)
      setTimeout(() => setCopiedEmail(false), 2000)
    }
  }

  return (
    <Card className="group transition-all hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex gap-4">
          <div className="flex flex-col items-center gap-2">
            <Avatar className="h-14 w-14 shrink-0">
              <AvatarImage src={candidate.photoUrl || undefined} alt={candidate.fullName} />
              <AvatarFallback className="bg-muted text-muted-foreground">
                {initials || <User className="h-6 w-6" />}
              </AvatarFallback>
            </Avatar>
            {/* Score badge */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="text-center">
                    <div className={`text-lg font-bold ${scoreColor}`}>{candidate.score}</div>
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3 w-3 ${
                            i < candidate.stars ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right" className="w-56">
                  <div className="space-y-2">
                    <p className="font-medium">{candidate.rating}</p>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span>Опыт:</span>
                        <span>{candidate.breakdown.experience}/30</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Навыки:</span>
                        <span>{candidate.breakdown.skills}/25</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Зарплата:</span>
                        <span>{candidate.breakdown.salary}/15</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Образование:</span>
                        <span>{candidate.breakdown.education}/10</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Статус:</span>
                        <span>{candidate.breakdown.jobSearchStatus}/10</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Бонусы:</span>
                        <span>{candidate.breakdown.bonus}/10</span>
                      </div>
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="truncate text-base font-semibold leading-tight text-foreground">{candidate.fullName}</h3>
                <p className="truncate text-sm text-muted-foreground">{candidate.title}</p>
              </div>
              <Button variant="ghost" size="icon" className="shrink-0" asChild>
                <a href={candidate.resumeUrl} target="_blank" rel="noopener noreferrer" aria-label="Открыть резюме">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </div>

            {/* Score progress bar */}
            <div className="space-y-1">
              <Progress value={candidate.score} className="h-1.5" />
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              {candidate.age && (
                <span className="flex items-center gap-1">
                  <User className="h-3.5 w-3.5" />
                  {candidate.age} лет
                </span>
              )}
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {candidate.city}
              </span>
              <span className="flex items-center gap-1">
                <Briefcase className="h-3.5 w-3.5" />
                {candidate.experience}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {candidate.lastUpdate}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 rounded-lg bg-muted/50 p-2">
              {candidate.contacts.phone ? (
                <div className="flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5 text-green-600" />
                  <span className="text-sm font-medium">{candidate.contacts.phone}</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={copyPhone}>
                    {copiedPhone ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
                  </Button>
                </div>
              ) : (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Phone className="h-3.5 w-3.5" />
                  Телефон не указан
                </span>
              )}

              {candidate.contacts.email ? (
                <div className="flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5 text-blue-600" />
                  <span className="text-sm font-medium">{candidate.contacts.email}</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={copyEmail}>
                    {copiedEmail ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
                  </Button>
                </div>
              ) : (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Mail className="h-3.5 w-3.5" />
                  Email не указан
                </span>
              )}
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="font-medium text-foreground">{candidate.salary}</span>
              <div className="flex gap-2">
                {candidate.contacts.email && (
                  <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs bg-transparent" asChild>
                    <a href={`mailto:${candidate.contacts.email}`}>
                      <Mail className="h-3 w-3" />
                      Написать
                    </a>
                  </Button>
                )}
                {candidate.contacts.phone && (
                  <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs bg-transparent" asChild>
                    <a href={`tel:${candidate.contacts.phone}`}>
                      <Phone className="h-3 w-3" />
                      Позвонить
                    </a>
                  </Button>
                )}
                <Button
                  variant="default"
                  size="sm"
                  className="h-7 gap-1.5 text-xs"
                  onClick={() => onInvite(candidate)}
                  disabled={!vacancyConfig?.id}
                  title={vacancyConfig?.id ? `Пригласить на "${vacancyConfig.name}"` : "Укажите ID вакансии"}
                >
                  <UserPlus className="h-3 w-3" />
                  Пригласить
                </Button>
              </div>
            </div>

            {candidate.skills.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {candidate.skills.slice(0, 5).map((skill) => (
                  <Badge key={skill} variant="secondary" className="text-xs">
                    {skill}
                  </Badge>
                ))}
                {candidate.skills.length > 5 && (
                  <Badge variant="outline" className="text-xs">
                    +{candidate.skills.length - 5}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
