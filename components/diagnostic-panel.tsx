"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, XCircle, AlertCircle, Loader2 } from "lucide-react"

interface DiagnosticResult {
  label: string
  status: "success" | "error" | "warning" | "loading"
  message: string
}

export function DiagnosticPanel() {
  const [isRunning, setIsRunning] = useState(false)
  const [results, setResults] = useState<DiagnosticResult[]>([])

  const runDiagnostics = async () => {
    setIsRunning(true)
    setResults([])

    const newResults: DiagnosticResult[] = []

    // 1. Проверка авторизации
    newResults.push({ label: "Проверка авторизации", status: "loading", message: "Проверяем..." })
    setResults([...newResults])

    try {
      const authResponse = await fetch("/api/auth/me")
      if (authResponse.ok) {
        const authData = await authResponse.json()
        if (authData.user) {
          newResults[0] = {
            label: "Авторизация",
            status: "success",
            message: `Вы авторизованы как ${authData.user.email}`,
          }
        } else {
          newResults[0] = {
            label: "Авторизация",
            status: "error",
            message: "Пользователь не найден. Требуется вход в систему.",
          }
        }
      } else {
        newResults[0] = {
          label: "Авторизация",
          status: "error",
          message: "Не авторизован. Войдите в систему.",
        }
      }
    } catch (error) {
      newResults[0] = {
        label: "Авторизация",
        status: "error",
        message: `Ошибка проверки: ${error instanceof Error ? error.message : "Неизвестная ошибка"}`,
      }
    }
    setResults([...newResults])

    // 2. Проверка наличия токена
    newResults.push({ label: "Проверка API токена", status: "loading", message: "Проверяем..." })
    setResults([...newResults])

    try {
      const tokenResponse = await fetch("/api/token")
      if (tokenResponse.ok) {
        const tokenData = await tokenResponse.json()
        if (tokenData.hasToken) {
          newResults[1] = {
            label: "API токен HH.ru",
            status: "success",
            message: `Токен найден. Добавлен: ${
              tokenData.createdAt ? new Date(tokenData.createdAt).toLocaleString("ru-RU") : "неизвестно"
            }`,
          }
        } else {
          newResults[1] = {
            label: "API токен HH.ru",
            status: "error",
            message: "Токен не найден. Добавьте токен в настройках.",
          }
        }
      } else if (tokenResponse.status === 401) {
        newResults[1] = {
          label: "API токен HH.ru",
          status: "error",
          message: "Требуется авторизация для проверки токена.",
        }
      } else {
        newResults[1] = {
          label: "API токен HH.ru",
          status: "error",
          message: `Ошибка проверки токена: ${tokenResponse.status}`,
        }
      }
    } catch (error) {
      newResults[1] = {
        label: "API токен HH.ru",
        status: "error",
        message: `Ошибка: ${error instanceof Error ? error.message : "Неизвестная ошибка"}`,
      }
    }
    setResults([...newResults])

    // 3. Тестовый запрос к API поиска
    newResults.push({ label: "Тест API поиска", status: "loading", message: "Отправляем тестовый запрос..." })
    setResults([...newResults])

    try {
      const searchResponse = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: "test",
          page: 0,
          per_page: 1,
        }),
      })

      if (searchResponse.ok) {
        const searchData = await searchResponse.json()
        newResults[2] = {
          label: "API поиска",
          status: "success",
          message: `API работает. Найдено результатов: ${searchData.found || 0}`,
        }
      } else {
        const errorData = await searchResponse.json()
        newResults[2] = {
          label: "API поиска",
          status: "error",
          message: `Ошибка ${searchResponse.status}: ${errorData.error || "Неизвестная ошибка"}`,
        }
      }
    } catch (error) {
      newResults[2] = {
        label: "API поиска",
        status: "error",
        message: `Ошибка запроса: ${error instanceof Error ? error.message : "Неизвестная ошибка"}`,
      }
    }
    setResults([...newResults])

    setIsRunning(false)
  }

  const getStatusIcon = (status: DiagnosticResult["status"]) => {
    switch (status) {
      case "success":
        return <CheckCircle2 className="h-5 w-5 text-green-600" />
      case "error":
        return <XCircle className="h-5 w-5 text-red-600" />
      case "warning":
        return <AlertCircle className="h-5 w-5 text-yellow-600" />
      case "loading":
        return <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Диагностика системы</CardTitle>
        <CardDescription>
          Проверьте статус авторизации, токена и доступность API
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={runDiagnostics} disabled={isRunning} className="w-full">
          {isRunning ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Выполняется диагностика...
            </>
          ) : (
            "Запустить диагностику"
          )}
        </Button>

        {results.length > 0 && (
          <div className="space-y-2">
            {results.map((result, index) => (
              <div
                key={index}
                className="flex items-start gap-3 rounded-lg border p-3"
              >
                {getStatusIcon(result.status)}
                <div className="flex-1">
                  <p className="font-medium text-sm">{result.label}</p>
                  <p className="text-xs text-muted-foreground">{result.message}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
