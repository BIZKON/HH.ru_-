"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, Key, ExternalLink, CheckCircle2, XCircle, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

export default function SettingsPage() {
  const [token, setToken] = useState("")
  const [showToken, setShowToken] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [hasToken, setHasToken] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [tokenCreatedAt, setTokenCreatedAt] = useState<Date | null>(null)
  const { toast } = useToast()

  // Проверяем наличие токена при загрузке
  useEffect(() => {
    const checkToken = async () => {
      try {
        const response = await fetch("/api/token")
        if (response.ok) {
          const data = await response.json()
          setHasToken(data.hasToken)
          if (data.createdAt) {
            setTokenCreatedAt(new Date(data.createdAt))
          }
        }
      } catch (error) {
        console.error("Error checking token:", error)
      } finally {
        setIsLoading(false)
      }
    }
    checkToken()
  }, [])

  const handleSaveToken = async () => {
    if (!token || token.length < 10) {
      toast({
        title: "Ошибка",
        description: "Введите корректный токен",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch("/api/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      })

      if (response.ok) {
        setHasToken(true)
        setTokenCreatedAt(new Date())
        setToken("")
        toast({
          title: "Успешно",
          description: "API токен сохранен",
        })
      } else {
        const error = await response.json()
        toast({
          title: "Ошибка",
          description: error.error || "Не удалось сохранить токен",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Произошла ошибка при сохранении токена",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteToken = async () => {
    if (!confirm("Вы уверены, что хотите удалить токен?")) {
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch("/api/token", {
        method: "DELETE",
      })

      if (response.ok) {
        setHasToken(false)
        setTokenCreatedAt(null)
        toast({
          title: "Успешно",
          description: "API токен удален",
        })
      } else {
        toast({
          title: "Ошибка",
          description: "Не удалось удалить токен",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Произошла ошибка при удалении токена",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2">
              <svg className="h-6 w-6 text-primary" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
              </svg>
              <h1 className="text-lg font-semibold">HH.ru Candidate Search</h1>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 p-4">
        <div>
          <h1 className="text-3xl font-bold">Настройки</h1>
          <p className="text-muted-foreground">Управление API токеном HH.ru</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              API токен HH.ru
            </CardTitle>
            <CardDescription>
              Токен используется для выполнения поисковых запросов к API HH.ru
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                {hasToken && (
                  <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium text-green-900 dark:text-green-100">
                          API токен настроен
                        </p>
                        <p className="text-sm text-green-700 dark:text-green-300">
                          {tokenCreatedAt
                            ? `Добавлен: ${tokenCreatedAt.toLocaleString("ru-RU")}`
                            : "Токен активен"}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDeleteToken}
                        disabled={isSaving}
                      >
                        Удалить
                      </Button>
                    </div>
                  </div>
                )}

                {!hasToken && (
                  <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900 dark:bg-yellow-950">
                    <div className="flex items-start gap-3">
                      <XCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                      <div>
                        <p className="font-medium text-yellow-900 dark:text-yellow-100">
                          API токен не настроен
                        </p>
                        <p className="text-sm text-yellow-700 dark:text-yellow-300">
                          Добавьте токен для использования поиска
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="token">
                      {hasToken ? "Обновить токен" : "Добавить токен"}
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
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      placeholder="Введите API токен HH.ru"
                      className="pr-10 font-mono text-sm"
                      disabled={isSaving}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowToken(!showToken)}
                    >
                      {showToken ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Токен шифруется и хранится безопасно на сервере
                  </p>
                </div>

                <Button
                  onClick={handleSaveToken}
                  disabled={isSaving || !token}
                  className="w-full"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Сохранение...
                    </>
                  ) : (
                    <>
                      <Key className="h-4 w-4 mr-2" />
                      {hasToken ? "Обновить токен" : "Сохранить токен"}
                    </>
                  )}
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Инструкция по получению токена</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>
                Перейдите на{" "}
                <a
                  href="https://dev.hh.ru/admin"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  dev.hh.ru/admin
                </a>
              </li>
              <li>Авторизуйтесь или зарегистрируйтесь</li>
              <li>Создайте новое приложение или используйте существующее</li>
              <li>Скопируйте API токен</li>
              <li>Вставьте токен в поле выше и сохраните</li>
            </ol>

            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                ⚠️ Важно
              </p>
              <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                <li>• Для доступа к полным данным резюме требуется платный доступ к API HH.ru</li>
                <li>• Бесплатный токен может иметь ограничения на количество запросов</li>
                <li>• При ошибке "Forbidden" проверьте статус вашей подписки на dev.hh.ru</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-center">
          <Link href="/">
            <Button variant="outline">Вернуться на главную</Button>
          </Link>
        </div>
      </main>
    </div>
  )
}
