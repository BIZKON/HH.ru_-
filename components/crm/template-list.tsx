"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreVertical, Mail, Eye, Copy } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { ru } from "date-fns/locale"

export interface Template {
  id: string
  name: string
  category: string
  subject?: string | null
  body: string
  variables?: string[] | null
  isActive?: boolean | null
  createdBy?: string | null
  createdAt: Date | string
  updatedAt: Date | string
  user?: {
    id: string
    name?: string | null
    email: string
  } | null
}

interface TemplateListProps {
  templates: Template[]
  onEdit?: (template: Template) => void
  onDelete?: (templateId: string) => void
  onPreview?: (template: Template) => void
  onUse?: (template: Template) => void
}

const categoryColors: Record<string, string> = {
  invitation: "bg-blue-500",
  confirmation: "bg-green-500",
  rejection: "bg-red-500",
  offer: "bg-purple-500",
  reminder: "bg-orange-500",
  follow_up: "bg-cyan-500",
  other: "bg-gray-500",
}

const categoryLabels: Record<string, string> = {
  invitation: "Приглашение",
  confirmation: "Подтверждение",
  rejection: "Отказ",
  offer: "Оффер",
  reminder: "Напоминание",
  follow_up: "Следующий шаг",
  other: "Другое",
}

export function TemplateList({
  templates,
  onEdit,
  onDelete,
  onPreview,
  onUse,
}: TemplateListProps) {
  if (templates.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Mail className="h-12 w-12 mx-auto mb-2 opacity-30" />
        <p>Шаблонов нет</p>
        <p className="text-sm mt-1">Создайте первый шаблон сообщения</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {templates.map((template) => {
        const variables = Array.isArray(template.variables)
          ? template.variables
          : template.variables
          ? JSON.parse(template.variables as string)
          : []

        return (
          <Card
            key={template.id}
            className="hover:shadow-md transition-shadow"
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-base font-medium mb-2">
                    {template.name}
                  </CardTitle>
                  <div className="flex flex-wrap gap-2">
                    <Badge
                      className={`text-xs text-white ${
                        categoryColors[template.category] || "bg-gray-500"
                      }`}
                    >
                      {categoryLabels[template.category] || template.category}
                    </Badge>
                    {template.isActive === false && (
                      <Badge variant="outline" className="text-xs">
                        Неактивен
                      </Badge>
                    )}
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {onUse && (
                      <DropdownMenuItem onClick={() => onUse(template)}>
                        <Copy className="h-4 w-4 mr-2" />
                        Использовать
                      </DropdownMenuItem>
                    )}
                    {onPreview && (
                      <DropdownMenuItem onClick={() => onPreview(template)}>
                        <Eye className="h-4 w-4 mr-2" />
                        Просмотр
                      </DropdownMenuItem>
                    )}
                    {onEdit && (
                      <DropdownMenuItem onClick={() => onEdit(template)}>
                        Редактировать
                      </DropdownMenuItem>
                    )}
                    {onDelete && (
                      <DropdownMenuItem
                        onClick={() => onDelete(template.id)}
                        className="text-red-600"
                      >
                        Удалить
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent>
              {template.subject && (
                <div className="mb-3">
                  <p className="text-xs text-muted-foreground mb-1">Тема:</p>
                  <p className="text-sm font-medium line-clamp-1">
                    {template.subject}
                  </p>
                </div>
              )}
              <div className="mb-3">
                <p className="text-xs text-muted-foreground mb-1">Текст:</p>
                <p className="text-sm text-muted-foreground line-clamp-3 whitespace-pre-wrap">
                  {template.body}
                </p>
              </div>
              {variables.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs text-muted-foreground mb-1">
                    Переменные: {variables.length}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {variables.slice(0, 3).map((variable: string, index: number) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="text-xs font-mono"
                      >
                        {variable}
                      </Badge>
                    ))}
                    {variables.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{variables.length - 3}
                      </Badge>
                    )}
                  </div>
                </div>
              )}
              <div className="text-xs text-muted-foreground">
                {template.user && (
                  <span>{template.user.name || template.user.email}</span>
                )}
                {" • "}
                <span>
                  {formatDistanceToNow(new Date(template.createdAt), {
                    addSuffix: true,
                    locale: ru,
                  })}
                </span>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
