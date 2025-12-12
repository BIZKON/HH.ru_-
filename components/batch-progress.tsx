"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Loader2, CheckCircle, XCircle, Star, Database } from "lucide-react"
import type { BatchProgress } from "@/lib/batch-loader"

interface BatchProgressCardProps {
  progress: BatchProgress | null
}

export function BatchProgressCard({ progress }: BatchProgressCardProps) {
  if (!progress) return null

  const percentage = progress.total > 0 ? Math.round((progress.loaded / progress.total) * 100) : 0

  const StatusIcon = {
    loading: <Loader2 className="h-5 w-5 animate-spin text-primary" />,
    scoring: <Star className="h-5 w-5 animate-pulse text-yellow-500" />,
    saving: <Database className="h-5 w-5 animate-pulse text-blue-500" />,
    done: <CheckCircle className="h-5 w-5 text-green-500" />,
    error: <XCircle className="h-5 w-5 text-destructive" />,
  }[progress.status]

  return (
    <Card className="border-primary/20">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          {StatusIcon}
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{progress.message}</span>
              <span className="text-muted-foreground">
                {progress.status === "saving" && progress.saved !== undefined
                  ? `${progress.saved} / ${progress.total}`
                  : `${progress.loaded} / ${progress.total}`}
              </span>
            </div>
            <Progress value={percentage} className="h-2" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
