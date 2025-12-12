"use client"

import { Users, Clock, Search } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface StatisticsCardProps {
  totalFound: number
  searchTime: number
  searchQuery: string
}

export function StatisticsCard({ totalFound, searchTime, searchQuery }: StatisticsCardProps) {
  if (!searchQuery) return null

  return (
    <Card className="bg-muted/50">
      <CardContent className="flex flex-wrap items-center gap-6 p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
            <Search className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Запрос</p>
            <p className="text-sm font-medium truncate max-w-48">{searchQuery}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
            <Users className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Найдено</p>
            <p className="text-sm font-medium">{totalFound.toLocaleString("ru-RU")}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
            <Clock className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Время</p>
            <p className="text-sm font-medium">{searchTime.toFixed(2)} сек</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
