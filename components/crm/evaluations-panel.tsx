"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { formatDistanceToNow } from "date-fns"
import { ru } from "date-fns/locale"
import { Plus, Star } from "lucide-react"
import { Progress } from "@/components/ui/progress"

export interface Evaluation {
  id: string
  criteriaName: string
  score: number
  maxScore: number
  feedback?: string | null
  evaluatedBy?: string | null
  createdAt: Date | string
  user?: {
    id: string
    name?: string | null
    email: string
  } | null
}

interface EvaluationsPanelProps {
  evaluations: Evaluation[]
  onAddEvaluation: (evaluation: {
    criteriaName: string
    score: number
    maxScore: number
    feedback?: string
  }) => Promise<void>
}

export function EvaluationsPanel({
  evaluations,
  onAddEvaluation,
}: EvaluationsPanelProps) {
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    criteriaName: "",
    score: 0,
    maxScore: 5,
    feedback: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await onAddEvaluation(formData)
      setFormData({
        criteriaName: "",
        score: 0,
        maxScore: 5,
        feedback: "",
      })
      setShowForm(false)
    } catch (error) {
      console.error("Error adding evaluation:", error)
      alert("Не удалось добавить оценку")
    } finally {
      setLoading(false)
    }
  }

  // Calculate average score
  const averageScore =
    evaluations.length > 0
      ? evaluations.reduce((acc, e) => acc + (e.score / e.maxScore) * 100, 0) /
        evaluations.length
      : 0

  return (
    <div className="space-y-4">
      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Общая оценка</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Progress value={averageScore} className="h-3" />
            </div>
            <div className="text-2xl font-bold">{averageScore.toFixed(0)}%</div>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            На основе {evaluations.length} критериев
          </p>
        </CardContent>
      </Card>

      {/* Add Evaluation Button */}
      <Button onClick={() => setShowForm(true)} className="w-full">
        <Plus className="h-4 w-4 mr-2" />
        Добавить оценку
      </Button>

      {/* Evaluations List */}
      <div className="space-y-3">
        {evaluations.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Star className="h-12 w-12 mx-auto mb-2 opacity-30" />
            <p>Оценок нет</p>
            <p className="text-sm mt-1">Добавьте первую оценку кандидата</p>
          </div>
        ) : (
          evaluations.map((evaluation) => {
            const percentage = (evaluation.score / evaluation.maxScore) * 100

            return (
              <Card key={evaluation.id}>
                <CardContent className="pt-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <h4 className="font-medium">{evaluation.criteriaName}</h4>
                      <span className="text-sm font-medium">
                        {evaluation.score} / {evaluation.maxScore}
                      </span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                    {evaluation.feedback && (
                      <p className="text-sm text-muted-foreground mt-2">
                        {evaluation.feedback}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>
                        {evaluation.user?.name ||
                          evaluation.user?.email ||
                          "Неизвестный пользователь"}
                      </span>
                      <span>•</span>
                      <span>
                        {formatDistanceToNow(new Date(evaluation.createdAt), {
                          addSuffix: true,
                          locale: ru,
                        })}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* Add Evaluation Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Добавить оценку</DialogTitle>
            <DialogDescription>
              Оцените кандидата по определенному критерию
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="criteriaName">Критерий *</Label>
              <Input
                id="criteriaName"
                value={formData.criteriaName}
                onChange={(e) =>
                  setFormData({ ...formData, criteriaName: e.target.value })
                }
                required
                placeholder="Технические навыки, Коммуникация, и т.д."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="score">Оценка *</Label>
                <Input
                  id="score"
                  type="number"
                  min="0"
                  max={formData.maxScore}
                  value={formData.score}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      score: parseInt(e.target.value) || 0,
                    })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxScore">Макс. оценка *</Label>
                <Input
                  id="maxScore"
                  type="number"
                  min="1"
                  value={formData.maxScore}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      maxScore: parseInt(e.target.value) || 5,
                    })
                  }
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="feedback">Комментарий</Label>
              <Textarea
                id="feedback"
                value={formData.feedback}
                onChange={(e) =>
                  setFormData({ ...formData, feedback: e.target.value })
                }
                placeholder="Дополнительные комментарии..."
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowForm(false)}
                disabled={loading}
              >
                Отмена
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Сохранение..." : "Сохранить"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
