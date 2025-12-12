"use client"

import { useState, useEffect } from "react"
import { Send, Loader2, Star } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import type { ScoredCandidate, VacancyConfig } from "@/lib/types"

interface InviteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  candidate: ScoredCandidate | null
  vacancyConfig: VacancyConfig | null
  token: string
  applicationId?: string
  dbVacancyId?: string
}

export function InviteDialog({
  open,
  onOpenChange,
  candidate,
  vacancyConfig,
  token,
  applicationId,
  dbVacancyId,
}: InviteDialogProps) {
  const [message, setMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  useEffect(() => {
    if (open && vacancyConfig?.inviteMessage) {
      setMessage(vacancyConfig.inviteMessage)
    }
  }, [open, vacancyConfig])

  const handleSendInvite = async () => {
    if (!candidate || !vacancyConfig?.id || !token) return

    setIsLoading(true)
    setResult(null)

    try {
      const response = await fetch("/api/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          vacancy_id: vacancyConfig.id,
          resume_id: candidate.id,
          message: message.trim() || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Ошибка отправки приглашения")
      }

      if (applicationId && dbVacancyId) {
        try {
          await fetch("/api/db/invitations", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              applicationId,
              candidateId: candidate.id,
              vacancyId: dbVacancyId,
              message: message.trim(),
              hhInvitationId: data.invitation_id,
            }),
          })
        } catch (dbError) {
          console.error("Failed to log invitation to DB:", dbError)
        }
      }

      setResult({ success: true, message: "Приглашение успешно отправлено!" })
    } catch (err) {
      setResult({
        success: false,
        message: err instanceof Error ? err.message : "Произошла ошибка",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setResult(null)
    setMessage("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Пригласить кандидата</DialogTitle>
          <DialogDescription>
            Отправить приглашение на вакансию "{vacancyConfig?.name || "Не указана"}"
          </DialogDescription>
        </DialogHeader>

        {result ? (
          <div
            className={`rounded-lg p-4 text-sm ${
              result.success
                ? "bg-green-500/10 text-green-600 dark:text-green-400"
                : "bg-destructive/10 text-destructive"
            }`}
          >
            {result.message}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg border bg-muted/30 p-3 text-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{candidate?.fullName}</div>
                  <div className="text-muted-foreground">{candidate?.title}</div>
                </div>
                {candidate?.score !== undefined && (
                  <div className="text-center">
                    <div className="text-lg font-bold text-primary">{candidate.score}</div>
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-2.5 w-2.5 ${
                            i < (candidate.stars || 0) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="mt-2 text-xs text-muted-foreground">Вакансия: {vacancyConfig?.name || "Не указана"}</div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Сопроводительное сообщение</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Здравствуйте! Мы заинтересованы в вашей кандидатуре..."
                rows={4}
              />
              {vacancyConfig?.inviteMessage && (
                <p className="text-xs text-muted-foreground">
                  Текст заполнен из настроек вакансии. Вы можете отредактировать его.
                </p>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          {result?.success ? (
            <Button onClick={handleClose}>Закрыть</Button>
          ) : (
            <>
              <Button variant="outline" onClick={handleClose} disabled={isLoading}>
                Отмена
              </Button>
              <Button onClick={handleSendInvite} disabled={isLoading || !candidate || !vacancyConfig?.id}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Отправка...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Пригласить
                  </>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
