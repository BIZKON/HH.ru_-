"use client"

import { useEffect, useState } from "react"
import { History, X, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import type { SearchHistory, SearchFilters } from "@/lib/types"

interface SearchHistoryProps {
  onSelectHistory: (filters: SearchFilters) => void
}

const HISTORY_KEY = "hh_search_history"
const MAX_HISTORY = 10

export function addToHistory(filters: SearchFilters, resultsCount: number) {
  if (!filters.text.trim()) return

  const stored = localStorage.getItem(HISTORY_KEY)
  const history: SearchHistory[] = stored ? JSON.parse(stored) : []

  const newEntry: SearchHistory = {
    id: Date.now().toString(),
    query: filters.text,
    filters,
    timestamp: Date.now(),
    resultsCount,
  }

  const filtered = history.filter((h) => h.query !== filters.text)
  const updated = [newEntry, ...filtered].slice(0, MAX_HISTORY)

  localStorage.setItem(HISTORY_KEY, JSON.stringify(updated))
}

export function SearchHistoryButton({ onSelectHistory }: SearchHistoryProps) {
  const [history, setHistory] = useState<SearchHistory[]>([])
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(HISTORY_KEY)
    if (stored) {
      setHistory(JSON.parse(stored))
    }
  }, [open])

  const clearHistory = () => {
    localStorage.removeItem(HISTORY_KEY)
    setHistory([])
  }

  const removeItem = (id: string) => {
    const updated = history.filter((h) => h.id !== id)
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated))
    setHistory(updated)
  }

  const selectItem = (item: SearchHistory) => {
    onSelectHistory(item.filters)
    setOpen(false)
  }

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 bg-transparent">
          <History className="h-4 w-4" />
          История
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between border-b p-3">
          <h4 className="text-sm font-medium">История поиска</h4>
          {history.length > 0 && (
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={clearHistory}>
              Очистить
            </Button>
          )}
        </div>
        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Clock className="h-8 w-8 text-muted-foreground/50" />
            <p className="mt-2 text-sm text-muted-foreground">История пуста</p>
          </div>
        ) : (
          <ScrollArea className="h-64">
            <div className="space-y-1 p-2">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="group flex items-center justify-between rounded-md p-2 hover:bg-muted cursor-pointer"
                  onClick={() => selectItem(item)}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{item.query}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.resultsCount.toLocaleString("ru-RU")} результатов • {formatTime(item.timestamp)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation()
                      removeItem(item.id)
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </PopoverContent>
    </Popover>
  )
}
