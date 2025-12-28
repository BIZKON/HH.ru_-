# 🎯 Архитектура полноценной CRM системы для HH.ru Recruiter

## Содержание
1. [Обзор системы](#обзор-системы)
2. [Архитектура компонентов](#архитектура-компонентов)
3. [Основные модули](#основные-модули)
4. [Технический стек](#технический-стек)
5. [Схема данных](#схема-данных)
6. [API Endpoints](#api-endpoints)
7. [UI/UX Компоненты](#uiux-компоненты)

---

## Обзор системы

### Цель
Создать полноценную CRM систему для автоматизации процесса рекрутинга:
- Автоматическое отслеживание кандидатов
- Визуализация воронки найма (Kanban board)
- Автоматизация рутинных задач
- Аналитика и отчетность
- Коллаборация команды рекрутеров

### Ключевые принципы
1. **Автоматизация first** - минимизировать ручную работу
2. **Real-time синхронизация** - постоянная связь с HH.ru API
3. **Прозрачность** - каждое действие логируется
4. **Масштабируемость** - поддержка множества вакансий и рекрутеров
5. **Mobile-friendly** - адаптивный интерфейс

---

## Архитектура компонентов

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend Layer                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐│
│  │ Kanban   │  │Analytics │  │ Candidate│  │ Tasks   ││
│  │ Board    │  │Dashboard │  │ Profile  │  │ Manager ││
│  └──────────┘  └──────────┘  └──────────┘  └─────────┘│
└─────────────────────────────────────────────────────────┘
                          ↕
┌─────────────────────────────────────────────────────────┐
│                     API Layer                           │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐│
│  │ CRM API  │  │ Sync API │  │ Analytics│  │Workflow ││
│  │ Routes   │  │ Scheduler│  │   API    │  │  API    ││
│  └──────────┘  └──────────┘  └──────────┘  └─────────┘│
└─────────────────────────────────────────────────────────┘
                          ↕
┌─────────────────────────────────────────────────────────┐
│                   Business Logic Layer                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐│
│  │Pipeline  │  │Auto-     │  │Scoring   │  │Notif.   ││
│  │Manager   │  │mation    │  │ Engine   │  │Service  ││
│  └──────────┘  └──────────┘  └──────────┘  └─────────┘│
└─────────────────────────────────────────────────────────┘
                          ↕
┌─────────────────────────────────────────────────────────┐
│                   Data Layer                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐│
│  │SQLite DB │  │Redis     │  │File      │  │Event    ││
│  │(Primary) │  │(Cache)   │  │Storage   │  │Queue    ││
│  └──────────┘  └──────────┘  └──────────┘  └─────────┘│
└─────────────────────────────────────────────────────────┘
                          ↕
┌─────────────────────────────────────────────────────────┐
│                External Integrations                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐│
│  │ HH.ru    │  │ Email    │  │ SMS      │  │Calendar ││
│  │  API     │  │ Service  │  │ Service  │  │(Google) ││
│  └──────────┘  └──────────┘  └──────────┘  └─────────┘│
└─────────────────────────────────────────────────────────┘
```

---

## Основные модули

### 1. 📋 Pipeline Manager (Воронка найма)

**Описание:** Kanban доска с карточками кандидатов

**Стадии (колонки):**
1. **Sourcing** (Поиск) - новые резюме из поиска
2. **Screening** (Скрининг) - первичная оценка
3. **Contacted** (Связались) - отправлено приглашение
4. **Interview Scheduled** (Интервью назначено)
5. **Interview Passed** (Интервью пройдено)
6. **Offer** (Предложение)
7. **Hired** (Нанят)
8. **Rejected** (Отклонен)

**Функциональность:**
- Drag & drop между стадиями
- Фильтры по вакансии, рекрутеру, дате
- Быстрые действия на карточке (звонок, email, заметка)
- Массовые операции (выбрать несколько → переместить)
- История перемещений

**База данных:**
```sql
-- Новая таблица
CREATE TABLE pipeline_stages (
  id TEXT PRIMARY KEY,
  vacancy_id TEXT REFERENCES vacancies(id),
  candidate_id TEXT REFERENCES candidates(id),
  stage TEXT NOT NULL, -- sourcing, screening, contacted, etc.
  position INTEGER NOT NULL, -- порядок внутри колонки
  assigned_to TEXT REFERENCES users(id),
  moved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  moved_by TEXT REFERENCES users(id),
  notes TEXT
);
```

### 2. 🔄 Auto-Sync Engine (Синхронизация с HH.ru)

**Описание:** Фоновый процесс синхронизации данных

**Что синхронизируется:**
- Новые отклики на вакансии (каждые 5 мин)
- Новые сообщения в переговорах (каждую минуту)
- Обновления статусов кандидатов
- Изменения в вакансиях

**Реализация:**
```typescript
// lib/sync/hh-sync-engine.ts
class HHSyncEngine {
  // Sync negotiations from HH.ru API
  async syncNegotiations(vacancyId?: string): Promise<void>

  // Sync messages for active negotiations
  async syncMessages(): Promise<void>

  // Update candidate statuses
  async syncCandidateStatuses(): Promise<void>

  // Schedule sync jobs (using cron or Next.js middleware)
  async scheduleSyncJobs(): Promise<void>
}
```

**API Route:**
```
POST /api/sync/negotiations - ручной запуск синхронизации
GET /api/sync/status - статус последней синхронизации
```

### 3. 🤖 Automation Engine (Автоматизация)

**Описание:** Автоматические действия на основе триггеров

**Примеры автоматизаций:**

**Триггер → Действие:**
- Новый кандидат с рейтингом >80 → Отправить приглашение
- Кандидат в стадии "Contacted" >3 дня → Напомнить рекрутеру
- Получен отклик → Переместить в "Screening"
- Интервью через 1 день → Email напоминание кандидату
- Кандидат не ответил 7 дней → Переместить в "Rejected"

**Конфигурация:**
```typescript
interface AutomationRule {
  id: string
  name: string
  trigger: {
    type: 'stage_entered' | 'time_elapsed' | 'score_threshold' | 'status_changed'
    conditions: Record<string, any>
  }
  actions: Array<{
    type: 'send_email' | 'send_sms' | 'move_stage' | 'create_task' | 'notify_user'
    params: Record<string, any>
  }>
  enabled: boolean
}
```

**База данных:**
```sql
CREATE TABLE automation_rules (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  trigger_type TEXT NOT NULL,
  trigger_conditions TEXT, -- JSON
  actions TEXT NOT NULL, -- JSON array
  enabled BOOLEAN DEFAULT true,
  created_by TEXT REFERENCES users(id)
);

CREATE TABLE automation_log (
  id TEXT PRIMARY KEY,
  rule_id TEXT REFERENCES automation_rules(id),
  candidate_id TEXT REFERENCES candidates(id),
  executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  success BOOLEAN,
  error TEXT
);
```

### 4. 📊 Analytics & Reporting

**Описание:** Детальная аналитика процесса найма

**Метрики:**

**Основные KPI:**
- Time to Hire (среднее время найма)
- Conversion Rate по каждой стадии
- Cost per Hire
- Source Effectiveness (какие источники дают лучших кандидатов)
- Recruiter Performance

**Дашборды:**
1. **Funnel Analytics** - воронка с конверсией на каждом этапе
2. **Velocity Metrics** - скорость движения по стадиям
3. **Quality Metrics** - качество кандидатов (рейтинги, приживаемость)
4. **Recruiter Dashboard** - индивидуальная производительность

**Графики:**
- Line chart: Кандидаты по времени
- Bar chart: Кандидаты по стадиям
- Pie chart: Источники кандидатов
- Heatmap: Активность по дням недели

**API:**
```
GET /api/analytics/funnel?vacancy_id=X&date_from=Y&date_to=Z
GET /api/analytics/recruiter/:id/performance
GET /api/analytics/source-effectiveness
```

### 5. ✅ Task Manager (Система задач)

**Описание:** Управление задачами для рекрутеров

**Типы задач:**
- Связаться с кандидатом
- Провести интервью
- Отправить тестовое задание
- Дать обратную связь
- Подготовить offer

**Функции:**
- Создание задачи с дедлайном
- Назначение ответственного
- Привязка к кандидату/вакансии
- Напоминания (email, push)
- Чек-листы внутри задачи

**База данных:**
```sql
CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT, -- call, interview, send_test, etc.
  priority TEXT, -- low, medium, high, urgent
  status TEXT DEFAULT 'pending', -- pending, in_progress, completed, cancelled
  due_date TIMESTAMP,
  assigned_to TEXT REFERENCES users(id),
  created_by TEXT REFERENCES users(id),
  candidate_id TEXT REFERENCES candidates(id),
  vacancy_id TEXT REFERENCES vacancies(id),
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE task_comments (
  id TEXT PRIMARY KEY,
  task_id TEXT REFERENCES tasks(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id),
  text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 6. 💬 Communication Hub

**Описание:** Централизованная коммуникация

**Каналы:**
1. **HH.ru Messages** - сообщения через HH.ru API (уже есть)
2. **Email** - прямые email через SMTP
3. **SMS** - SMS уведомления (Twilio/SMS.ru)
4. **WhatsApp/Telegram** - мессенджеры (будущее)

**Шаблоны сообщений:**
```sql
CREATE TABLE message_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT, -- invitation, rejection, interview_confirm, etc.
  subject TEXT,
  body TEXT NOT NULL,
  variables TEXT, -- JSON array ['candidate_name', 'vacancy_title', etc.]
  channel TEXT, -- hh, email, sms
  created_by TEXT REFERENCES users(id)
);
```

**Функции:**
- Выбор шаблона и подстановка переменных
- История всех коммуникаций в одном месте
- Отслеживание прочитанных/непрочитанных
- Запланированная отправка

### 7. 👤 Candidate Profile (360° view)

**Описание:** Полная карточка кандидата

**Разделы:**
1. **Basic Info** - ФИО, контакты, резюме
2. **Timeline** - хронология всех взаимодействий
3. **Documents** - резюме, тестовые задания, портфолио
4. **Notes** - заметки рекрутеров
5. **Evaluations** - оценки после интервью
6. **Tasks** - связанные задачи
7. **Related Vacancies** - на какие вакансии рассматривался

**Скоринг и теги:**
- Динамический рейтинг
- Кастомные теги (remote, senior, startup_experience)
- Флаги (blacklist, favorite, passive_candidate)

### 8. 🔐 Access Control (Права доступа)

**Описание:** Разграничение прав

**Роли:**
1. **Admin** - полный доступ
2. **HR Manager** - управление рекрутерами, аналитика
3. **Recruiter** - работа с кандидатами
4. **Viewer** - только просмотр

**Права:**
- Просмотр всех кандидатов vs только своих
- Редактирование vs read-only
- Доступ к аналитике
- Управление вакансиями

```sql
CREATE TABLE user_roles (
  user_id TEXT REFERENCES users(id),
  role TEXT NOT NULL,
  scope TEXT, -- 'all' or specific vacancy_ids as JSON
  granted_by TEXT REFERENCES users(id),
  granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## Технический стек

### Frontend
- **Framework:** Next.js 14 (App Router) ✅ уже используется
- **UI Library:** Shadcn/ui + Tailwind CSS ✅ уже используется
- **Drag & Drop:** @dnd-kit/core (для Kanban)
- **Charts:** Recharts или Chart.js
- **Forms:** React Hook Form + Zod validation
- **State:** Zustand или React Context
- **Real-time:** WebSockets или Server-Sent Events

### Backend
- **Runtime:** Node.js ✅ уже используется
- **Database:** SQLite (Drizzle ORM) ✅ уже используется
- **Cache:** Redis (для session, queue)
- **Queue:** BullMQ (для background jobs)
- **Cron:** node-cron (для scheduled tasks)

### External Services
- **HH.ru API** ✅ уже интегрировано
- **Email:** Nodemailer + Gmail SMTP or SendGrid
- **SMS:** Twilio или SMS.ru API
- **File Storage:** Local FS или S3-compatible (MinIO)
- **Analytics:** собственная + опционально Google Analytics

---

## Схема данных (расширение)

### Новые таблицы

```sql
-- Pipeline stages
CREATE TABLE pipeline_stages (
  id TEXT PRIMARY KEY,
  vacancy_id TEXT REFERENCES vacancies(id),
  candidate_id TEXT REFERENCES candidates(id),
  stage TEXT NOT NULL,
  position INTEGER NOT NULL,
  assigned_to TEXT REFERENCES users(id),
  moved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  moved_by TEXT REFERENCES users(id),
  notes TEXT,
  INDEX idx_pipeline_vacancy (vacancy_id),
  INDEX idx_pipeline_stage (stage),
  INDEX idx_pipeline_assigned (assigned_to)
);

-- Automation rules
CREATE TABLE automation_rules (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  trigger_type TEXT NOT NULL,
  trigger_conditions TEXT,
  actions TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  created_by TEXT REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Automation execution log
CREATE TABLE automation_executions (
  id TEXT PRIMARY KEY,
  rule_id TEXT REFERENCES automation_rules(id),
  candidate_id TEXT REFERENCES candidates(id),
  executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  success BOOLEAN,
  result TEXT,
  error TEXT
);

-- Tasks
CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT,
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'pending',
  due_date TIMESTAMP,
  assigned_to TEXT REFERENCES users(id),
  created_by TEXT REFERENCES users(id),
  candidate_id TEXT REFERENCES candidates(id),
  vacancy_id TEXT REFERENCES vacancies(id),
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_tasks_assigned (assigned_to),
  INDEX idx_tasks_due (due_date),
  INDEX idx_tasks_candidate (candidate_id)
);

-- Message templates
CREATE TABLE message_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT,
  subject TEXT,
  body TEXT NOT NULL,
  variables TEXT,
  channel TEXT DEFAULT 'email',
  created_by TEXT REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Communication log
CREATE TABLE communications (
  id TEXT PRIMARY KEY,
  candidate_id TEXT REFERENCES candidates(id),
  channel TEXT NOT NULL, -- hh, email, sms, call
  direction TEXT, -- inbound, outbound
  subject TEXT,
  body TEXT,
  status TEXT, -- sent, delivered, read, failed
  sent_by TEXT REFERENCES users(id),
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  read_at TIMESTAMP
);

-- Candidate notes
CREATE TABLE candidate_notes (
  id TEXT PRIMARY KEY,
  candidate_id TEXT REFERENCES candidates(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id),
  note TEXT NOT NULL,
  is_important BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Candidate evaluations (после интервью)
CREATE TABLE candidate_evaluations (
  id TEXT PRIMARY KEY,
  candidate_id TEXT REFERENCES candidates(id) ON DELETE CASCADE,
  vacancy_id TEXT REFERENCES vacancies(id),
  evaluator_id TEXT REFERENCES users(id),
  interview_type TEXT, -- screening, technical, hr, final
  technical_skills INTEGER, -- 1-5
  soft_skills INTEGER,
  cultural_fit INTEGER,
  overall_rating INTEGER,
  notes TEXT,
  recommendation TEXT, -- hire, maybe, reject
  evaluated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User roles and permissions
CREATE TABLE user_roles (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  role TEXT NOT NULL, -- admin, hr_manager, recruiter, viewer
  scope TEXT, -- JSON: vacancy_ids or 'all'
  granted_by TEXT REFERENCES users(id),
  granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sync status tracking
CREATE TABLE sync_status (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL, -- negotiations, messages, vacancies
  last_synced_at TIMESTAMP,
  status TEXT, -- success, error
  items_synced INTEGER,
  error_message TEXT
);
```

---

## API Endpoints (новые)

### Pipeline API
```
GET    /api/crm/pipeline?vacancy_id=X          - получить все карточки
POST   /api/crm/pipeline/move                  - переместить карточку
PATCH  /api/crm/pipeline/:id                   - обновить карточку
DELETE /api/crm/pipeline/:id                   - удалить карточку
```

### Sync API
```
POST   /api/sync/negotiations                  - синхронизировать отклики
POST   /api/sync/messages                      - синхронизировать сообщения
GET    /api/sync/status                        - статус синхронизации
POST   /api/sync/full                          - полная синхронизация
```

### Automation API
```
GET    /api/automation/rules                   - список правил
POST   /api/automation/rules                   - создать правило
PATCH  /api/automation/rules/:id               - обновить правило
DELETE /api/automation/rules/:id               - удалить правило
GET    /api/automation/executions              - история выполнений
POST   /api/automation/test                    - тест правила
```

### Tasks API
```
GET    /api/tasks?assigned_to=X&status=Y       - список задач
POST   /api/tasks                              - создать задачу
PATCH  /api/tasks/:id                          - обновить задачу
DELETE /api/tasks/:id                          - удалить задачу
POST   /api/tasks/:id/complete                 - завершить задачу
```

### Analytics API
```
GET    /api/analytics/funnel?vacancy_id=X      - воронка конверсии
GET    /api/analytics/time-to-hire             - время найма
GET    /api/analytics/source-effectiveness     - эффективность источников
GET    /api/analytics/recruiter/:id/stats      - статистика рекрутера
POST   /api/analytics/export                   - экспорт отчета
```

### Communication API
```
POST   /api/communications/send                - отправить сообщение
GET    /api/communications/history/:candidateId - история коммуникаций
GET    /api/communications/templates           - шаблоны
POST   /api/communications/templates           - создать шаблон
```

### Candidate API (расширение)
```
GET    /api/candidates/:id/timeline            - timeline активностей
POST   /api/candidates/:id/notes               - добавить заметку
POST   /api/candidates/:id/evaluate            - добавить оценку
GET    /api/candidates/:id/evaluations         - список оценок
PATCH  /api/candidates/:id/tags                - обновить теги
```

---

## UI/UX Компоненты

### 1. Kanban Board Component
```tsx
<KanbanBoard
  vacancyId={string}
  onCardMove={(candidateId, fromStage, toStage) => void}
  onCardClick={(candidateId) => void}
  filters={{ recruiter, dateRange }}
/>
```

### 2. Analytics Dashboard
```tsx
<AnalyticsDashboard
  dateRange={{ from, to }}
  vacancyId={string}
  metrics={['funnel', 'velocity', 'quality']}
/>
```

### 3. Task List
```tsx
<TaskList
  assignedTo={userId}
  status={['pending', 'in_progress']}
  onTaskComplete={(taskId) => void}
  onTaskCreate={(task) => void}
/>
```

### 4. Candidate Timeline
```tsx
<CandidateTimeline
  candidateId={string}
  events={activities}
  onAddNote={(note) => void}
/>
```

### 5. Communication Panel
```tsx
<CommunicationPanel
  candidateId={string}
  channels={['hh', 'email', 'sms']}
  templates={messageTemplates}
  onSend={(message) => void}
/>
```

### 6. Automation Builder
```tsx
<AutomationBuilder
  onSave={(rule) => void}
  existingRule={rule}
  availableTriggers={triggers}
  availableActions={actions}
/>
```

---

## Приоритеты разработки

### 🔴 MUST HAVE (MVP - 4 недели)
1. Синхронизация с HH.ru negotiations API
2. Kanban board с основными стадиями
3. Детальная карточка кандидата с timeline
4. Система задач (базовая)
5. Шаблоны сообщений

### 🟡 SHOULD HAVE (версия 2.0 - 4 недели)
1. Автоматизация (базовые правила)
2. Аналитика (funnel, time-to-hire)
3. Email интеграция
4. Расширенные фильтры и поиск
5. Права доступа

### 🟢 NICE TO HAVE (версия 3.0 - 6 недель)
1. SMS интеграция
2. Расширенная автоматизация (AI suggestions)
3. Расширенная аналитика (predictive)
4. Mobile app
5. Интеграция с календарем
6. Video interview integration

---

## Оценка трудоемкости

| Модуль | Сложность | Время разработки | Приоритет |
|--------|-----------|------------------|-----------|
| HH.ru Sync Engine | Средняя | 1 неделя | 🔴 Критичная |
| Kanban Board | Средняя | 1.5 недели | 🔴 Критичная |
| Candidate Profile 360° | Низкая | 0.5 недели | 🔴 Критичная |
| Task Manager | Низкая | 1 неделя | 🔴 Критичная |
| Message Templates | Низкая | 0.5 недели | 🔴 Критичная |
| Automation Engine | Высокая | 2 недели | 🟡 Важная |
| Analytics Dashboard | Средняя | 1.5 недели | 🟡 Важная |
| Email Integration | Низкая | 0.5 недели | 🟡 Важная |
| Access Control | Средняя | 1 неделя | 🟡 Важная |
| Communication Hub | Средняя | 1 неделя | 🟡 Важная |
| SMS Integration | Низкая | 0.5 недели | 🟢 Желательная |
| Advanced Analytics | Высокая | 2 недели | 🟢 Желательная |

**Итого MVP (MUST HAVE):** ~4 недели разработки
**Итого v2.0 (+ SHOULD HAVE):** ~8 недель
**Итого v3.0 (+ NICE TO HAVE):** ~14 недель

---

## Метрики успеха

После запуска CRM должна обеспечить:
- ⏱️ **Сокращение времени найма** на 30-40%
- 📈 **Увеличение конверсии** на 20-25%
- ⚡ **Сокращение рутинных задач** на 50%
- 👥 **Увеличение количества обработанных кандидатов** на 2x
- 💰 **ROI:** окупаемость за 3-6 месяцев

---

## Риски и митигация

| Риск | Вероятность | Влияние | Митигация |
|------|-------------|---------|-----------|
| HH.ru API rate limits | Высокая | Высокое | Умный throttling, кэширование |
| Сложность автоматизации | Средняя | Среднее | Начать с простых правил |
| Performance с большим объемом данных | Средняя | Высокое | Индексы БД, пагинация, виртуализация UI |
| User adoption | Средняя | Критичное | Обучение, постепенный rollout |
| Data migration | Низкая | Среднее | Тестирование на dev данных |

---

*Документ подготовлен: 2025-12-28*
*Версия: 1.0*
*Автор: Claude AI Assistant*
