import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ThemeToggle } from "@/components/theme-toggle"
import Link from "next/link"
import {
  Clock,
  DollarSign,
  Target,
  Search,
  Database,
  FileText,
  Star,
  Filter,
  Download,
  Send,
  CheckCircle,
  ArrowLeft,
  Zap,
  Users,
  TrendingUp,
  Award,
  BookOpen,
  Briefcase,
  GraduationCap,
  Activity,
  Sparkles,
} from "lucide-react"

export default function InstructionPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Назад к поиску
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-8 p-4 py-8">
        {/* Header */}
        <div className="space-y-4 text-center">
          <Badge variant="secondary" className="px-4 py-1 text-sm">
            <BookOpen className="mr-2 h-4 w-4" />
            Руководство для HR
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight">HH.ru Resume Finder + Scoring</h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Полное руководство по использованию сервиса автоматического поиска и оценки кандидатов
          </p>
        </div>

        {/* Для кого */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Для кого этот сервис?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {["HR-менеджеры", "Рекрутеры", "Владельцы бизнеса", "Кадровые агентства"].map((item) => (
                <div key={item} className="flex items-center gap-2 rounded-lg border bg-muted/30 p-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="font-medium">{item}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Основная идея */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Основная идея
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
                <p className="mb-2 font-semibold text-red-700 dark:text-red-300">ВМЕСТО:</p>
                <p className="text-red-600 dark:text-red-400">5-7 часов в неделю на ручной поиск в HH.ru</p>
              </div>
              <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950">
                <p className="mb-2 font-semibold text-green-700 dark:text-green-300">ПОЛУЧАЕТЕ:</p>
                <p className="text-green-600 dark:text-green-400">Автоматический поиск + оценка за 20-30 секунд</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Экономия ресурсов */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="h-5 w-5 text-blue-500" />
                Экономия времени
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Обычно:</span>
                <span>5-7 часов/неделя</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">С сервисом:</span>
                <span>1-2 часа/неделя</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold text-green-600">
                <span>Экономия:</span>
                <span>200+ часов/год</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <DollarSign className="h-5 w-5 text-green-500" />
                Экономия денег
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Ставка HR:</span>
                <span>~240 ₽/час</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Экономия/неделю:</span>
                <span>~1,200 ₽</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold text-green-600">
                <span>В год:</span>
                <span>~60,000 ₽</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="h-5 w-5 text-purple-500" />
                Улучшение качества
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>0% ошибок (автоматизация)</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>100% релевантных кандидатов</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Объективная оценка по 100 баллов</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Separator />

        {/* Основные функции */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Основные функции сервиса</h2>

          {/* Функция 1: Поиск вакансии */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                1. Поиск вакансии (2 способа)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Способ A */}
              <div className="rounded-lg border bg-muted/30 p-4">
                <h4 className="mb-3 flex items-center gap-2 font-semibold">
                  <Badge>A</Badge>
                  Быстрая загрузка по ID
                  <Badge variant="outline" className="ml-2">
                    <Zap className="mr-1 h-3 w-3" />
                    30 секунд
                  </Badge>
                </h4>
                <div className="space-y-3 text-sm">
                  <p className="text-muted-foreground">Как использовать:</p>
                  <ol className="ml-4 list-decimal space-y-1">
                    <li>На HH.ru найдите нужную вакансию</li>
                    <li>
                      Скопируйте ID из URL:{" "}
                      <code className="rounded bg-muted px-1">https://hh.ru/vacancy/128368179</code>
                    </li>
                    <li>Вставьте ID в поле &quot;Загрузить вакансию по ID&quot;</li>
                    <li>Нажмите кнопку &quot;Загрузить вакансию&quot;</li>
                    <li>Все параметры заполнятся автоматически!</li>
                  </ol>
                  <div className="mt-3 rounded border border-green-200 bg-green-50 p-3 dark:border-green-900 dark:bg-green-950">
                    <p className="font-medium text-green-700 dark:text-green-300">Автоматически заполняется:</p>
                    <ul className="mt-1 grid gap-1 text-green-600 sm:grid-cols-2 dark:text-green-400">
                      <li>• Название вакансии</li>
                      <li>• Регион/город</li>
                      <li>• Зарплата (от-до)</li>
                      <li>• Требуемый опыт</li>
                      <li>• Ключевые навыки</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Способ B */}
              <div className="rounded-lg border bg-muted/30 p-4">
                <h4 className="mb-3 flex items-center gap-2 font-semibold">
                  <Badge>B</Badge>
                  Ручное заполнение
                  <Badge variant="outline" className="ml-2">
                    <Clock className="mr-1 h-3 w-3" />
                    3-5 минут
                  </Badge>
                </h4>
                <div className="space-y-3 text-sm">
                  <p className="text-muted-foreground">Заполните в разделе &quot;Настройка вакансии&quot;:</p>
                  <ul className="ml-4 list-disc space-y-1">
                    <li>Название вакансии: &quot;Менеджер по продажам B2B&quot;</li>
                    <li>Регион: выберите из списка</li>
                    <li>Требуемый опыт: выберите диапазон</li>
                    <li>Зарплата: укажите от и до</li>
                    <li>Обязательные навыки: &quot;CRM, B2B, продажи&quot;</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Функция 2: Поиск кандидатов */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5 text-primary" />
                2. Поиск кандидатов
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border p-4">
                  <h4 className="mb-2 font-semibold">Быстрый поиск</h4>
                  <p className="text-sm text-muted-foreground">Первые 20 результатов без скоринга</p>
                </div>
                <div className="rounded-lg border border-primary/50 bg-primary/5 p-4">
                  <h4 className="mb-2 font-semibold text-primary">Полный поиск с оценкой</h4>
                  <p className="text-sm text-muted-foreground">
                    До 100 кандидатов с автоматической оценкой и сохранением в БД
                  </p>
                </div>
              </div>
              <div className="rounded-lg border bg-muted/30 p-4">
                <p className="mb-2 font-medium">Что происходит во время поиска:</p>
                <ol className="ml-4 list-decimal space-y-1 text-sm text-muted-foreground">
                  <li>API запрос к HH.ru</li>
                  <li>Получение списка кандидатов</li>
                  <li>Скачивание резюме каждого</li>
                  <li>Оценка каждого по 100-балльной системе</li>
                  <li>Сортировка по баллам</li>
                  <li>Сохранение в базу данных</li>
                </ol>
              </div>
            </CardContent>
          </Card>

          {/* Функция 3: Система оценки */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                3. Автоматическая оценка кандидатов (0-100 баллов)
              </CardTitle>
              <CardDescription>Каждый кандидат получает объективную оценку по 6 критериям</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Критерии оценки */}
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-lg border p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-blue-500" />
                      <span className="font-medium">Опыт работы</span>
                    </div>
                    <Badge>30 баллов</Badge>
                  </div>
                  <ul className="space-y-1 text-xs text-muted-foreground">
                    <li>• 3+ лет в сфере → 30 баллов</li>
                    <li>• 2-3 года → 25 баллов</li>
                    <li>• 1-2 года → 20 баллов</li>
                    <li>• Менее 1 года → 10 баллов</li>
                  </ul>
                </div>

                <div className="rounded-lg border p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-green-500" />
                      <span className="font-medium">Навыки</span>
                    </div>
                    <Badge>25 баллов</Badge>
                  </div>
                  <ul className="space-y-1 text-xs text-muted-foreground">
                    <li>• Обязательные навыки → до 15</li>
                    <li>• Бонусные навыки → до 10</li>
                  </ul>
                </div>

                <div className="rounded-lg border p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-yellow-500" />
                      <span className="font-medium">Зарплата</span>
                    </div>
                    <Badge>15 баллов</Badge>
                  </div>
                  <ul className="space-y-1 text-xs text-muted-foreground">
                    <li>• В диапазоне → 15 баллов</li>
                    <li>• Ниже/выше → 8-10 баллов</li>
                    <li>• Не указана → 5 баллов</li>
                  </ul>
                </div>

                <div className="rounded-lg border p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="h-4 w-4 text-purple-500" />
                      <span className="font-medium">Образование</span>
                    </div>
                    <Badge>10 баллов</Badge>
                  </div>
                  <ul className="space-y-1 text-xs text-muted-foreground">
                    <li>• Высшее профильное → 10</li>
                    <li>• Высшее другое → 7</li>
                    <li>• Нет высшего → 5</li>
                  </ul>
                </div>

                <div className="rounded-lg border p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-orange-500" />
                      <span className="font-medium">Статус поиска</span>
                    </div>
                    <Badge>10 баллов</Badge>
                  </div>
                  <ul className="space-y-1 text-xs text-muted-foreground">
                    <li>• Активно ищет → 10</li>
                    <li>• Рассматривает → 7</li>
                    <li>• Не ищет → 3</li>
                  </ul>
                </div>

                <div className="rounded-lg border p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-pink-500" />
                      <span className="font-medium">Бонусы</span>
                    </div>
                    <Badge>10 баллов</Badge>
                  </div>
                  <ul className="space-y-1 text-xs text-muted-foreground">
                    <li>• Известная компания → +5</li>
                    <li>• Достижения с цифрами → +5</li>
                  </ul>
                </div>
              </div>

              {/* Рейтинг по звездам */}
              <div className="rounded-lg border bg-muted/30 p-4">
                <h4 className="mb-3 font-semibold">Рейтинг по баллам:</h4>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
                  <div className="flex items-center gap-2 rounded bg-green-100 p-2 dark:bg-green-900/30">
                    <div className="flex text-yellow-500">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-current" />
                      ))}
                    </div>
                    <span className="text-xs">85-100</span>
                  </div>
                  <div className="flex items-center gap-2 rounded bg-lime-100 p-2 dark:bg-lime-900/30">
                    <div className="flex text-yellow-500">
                      {[...Array(4)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-current" />
                      ))}
                      <Star className="h-4 w-4" />
                    </div>
                    <span className="text-xs">75-84</span>
                  </div>
                  <div className="flex items-center gap-2 rounded bg-yellow-100 p-2 dark:bg-yellow-900/30">
                    <div className="flex text-yellow-500">
                      {[...Array(3)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-current" />
                      ))}
                      {[...Array(2)].map((_, i) => (
                        <Star key={i} className="h-4 w-4" />
                      ))}
                    </div>
                    <span className="text-xs">65-74</span>
                  </div>
                  <div className="flex items-center gap-2 rounded bg-orange-100 p-2 dark:bg-orange-900/30">
                    <div className="flex text-yellow-500">
                      {[...Array(2)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-current" />
                      ))}
                      {[...Array(3)].map((_, i) => (
                        <Star key={i} className="h-4 w-4" />
                      ))}
                    </div>
                    <span className="text-xs">50-64</span>
                  </div>
                  <div className="flex items-center gap-2 rounded bg-red-100 p-2 dark:bg-red-900/30">
                    <div className="flex text-yellow-500">
                      <Star className="h-4 w-4 fill-current" />
                      {[...Array(4)].map((_, i) => (
                        <Star key={i} className="h-4 w-4" />
                      ))}
                    </div>
                    <span className="text-xs">0-49</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Функция 4: Таблица результатов */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                4. Таблица результатов
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-muted-foreground">
                Все найденные кандидаты отображаются в удобной таблице с полной информацией:
              </p>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  "ФИО кандидата",
                  "Возраст",
                  "Город",
                  "Текущая должность",
                  "Компания",
                  "Опыт работы (лет)",
                  "Ключевые навыки",
                  "Зарплатные ожидания",
                  "Оценка (0-100)",
                  "Статус заявки",
                  "Ссылка на резюме",
                  "Кнопки действий",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    {item}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Функция 5: Фильтрация */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-primary" />
                5. Фильтрация и сортировка
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <h4 className="mb-2 font-medium">Доступные фильтры:</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• По баллам (80-100, 70-80 и т.д.)</li>
                    <li>• По статусу (new, reviewed, invited)</li>
                    <li>• По городу</li>
                    <li>• По опыту работы</li>
                  </ul>
                </div>
                <div>
                  <h4 className="mb-2 font-medium">Сортировка:</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• По оценке (высокие сначала)</li>
                    <li>• По релевантности</li>
                    <li>• По дате обновления резюме</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Функция 6: Экспорт */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5 text-primary" />
                6. Экспорт в CSV
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-muted-foreground">
                Выгрузите результаты поиска в формате CSV для дальнейшей работы в Excel или Google Sheets:
              </p>
              <div className="rounded-lg border bg-muted/30 p-4">
                <p className="mb-2 font-medium">Что включено в экспорт:</p>
                <ul className="grid gap-1 text-sm text-muted-foreground sm:grid-cols-2">
                  <li>• ФИО кандидата</li>
                  <li>• Контактные данные</li>
                  <li>• Оценка и детализация</li>
                  <li>• Навыки и опыт</li>
                  <li>• Зарплатные ожидания</li>
                  <li>• Ссылка на резюме</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Функция 7: Приглашения */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5 text-primary" />
                7. Отправка приглашений
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-muted-foreground">Отправляйте приглашения кандидатам прямо из сервиса:</p>
              <ol className="ml-4 list-decimal space-y-2 text-sm">
                <li>Нажмите кнопку &quot;Пригласить&quot; на карточке кандидата</li>
                <li>Отредактируйте текст приглашения при необходимости</li>
                <li>Нажмите &quot;Отправить&quot;</li>
                <li>Приглашение будет отправлено через HH.ru API</li>
                <li>История приглашений сохраняется в базе данных</li>
              </ol>
            </CardContent>
          </Card>

          {/* База данных */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
                8. Автосохранение в базу данных
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-muted-foreground">Все данные автоматически сохраняются в Supabase:</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border p-3">
                  <h4 className="mb-1 font-medium">Что сохраняется:</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Все найденные кандидаты</li>
                    <li>• Оценки и детализация скоринга</li>
                    <li>• История поиска</li>
                    <li>• Отправленные приглашения</li>
                    <li>• Экспорты данных</li>
                  </ul>
                </div>
                <div className="rounded-lg border p-3">
                  <h4 className="mb-1 font-medium">Зачем это нужно:</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Не потеряете кандидатов</li>
                    <li>• Командная работа</li>
                    <li>• Аналитика и отчеты</li>
                    <li>• История взаимодействий</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Быстрый старт */}
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Быстрый старт (5 шагов)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-5">
              {[
                { step: 1, title: "Токен", desc: "Введите API токен HH.ru" },
                { step: 2, title: "Вакансия", desc: "Загрузите по ID или заполните вручную" },
                { step: 3, title: "Поиск", desc: "Нажмите 'Полный поиск с оценкой'" },
                { step: 4, title: "Анализ", desc: "Изучите результаты с оценками" },
                { step: 5, title: "Действие", desc: "Пригласите или экспортируйте" },
              ].map(({ step, title, desc }) => (
                <div key={step} className="text-center">
                  <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
                    {step}
                  </div>
                  <h4 className="font-medium">{title}</h4>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Search className="h-5 w-5" />
            Начать поиск кандидатов
          </Link>
        </div>
      </main>

      <footer className="mt-auto border-t py-4">
        <div className="mx-auto max-w-5xl px-4 text-center text-xs text-muted-foreground">
          HH.ru Resume Finder + Scoring System | Руководство для HR-сотрудника
        </div>
      </footer>
    </div>
  )
}
