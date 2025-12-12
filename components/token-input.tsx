"use client"

import { useState, useEffect } from "react"
import { Eye, EyeOff, Key, ExternalLink } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

interface TokenInputProps {
  value: string
  onChange: (value: string) => void
}

export function TokenInput({ value, onChange }: TokenInputProps) {
  const [showToken, setShowToken] = useState(false)

  useEffect(() => {
    const stored = sessionStorage.getItem("hh_token")
    if (stored) {
      onChange(stored)
    }
  }, [onChange])

  const handleChange = (newValue: string) => {
    onChange(newValue)
    if (newValue) {
      sessionStorage.setItem("hh_token", newValue)
    } else {
      sessionStorage.removeItem("hh_token")
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor="token" className="flex items-center gap-2 text-sm font-medium">
          <Key className="h-4 w-4" />
          API Токен HH.ru
        </Label>
        <a
          href="https://dev.hh.ru/admin"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Получить токен
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
      <div className="relative">
        <Input
          id="token"
          type={showToken ? "text" : "password"}
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Введите ваш API токен"
          className="pr-10 font-mono text-sm"
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
          onClick={() => setShowToken(!showToken)}
          aria-label={showToken ? "Скрыть токен" : "Показать токен"}
        >
          {showToken ? (
            <EyeOff className="h-4 w-4 text-muted-foreground" />
          ) : (
            <Eye className="h-4 w-4 text-muted-foreground" />
          )}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">Токен хранится только в текущей сессии браузера</p>
    </div>
  )
}
