# 🚀 План имплементации CRM системы

## Sprint Planning (Agile подход)

### Этап 1: MVP - Базовая функциональность (4 недели)

---

## 🏃 SPRINT 1: Foundation & Sync (неделя 1)

### Цели спринта
- Настроить синхронизацию с HH.ru API
- Расширить схему базы данных
- Создать базовые API endpoints

### Задачи

#### День 1-2: Database Schema Extensions
**Ответственный:** Backend Developer
**Приоритет:** 🔴 Критичная

- [ ] Создать migration для новых таблиц:
  - `pipeline_stages`
  - `tasks`
  - `candidate_notes`
  - `candidate_evaluations`
  - `communications`
  - `sync_status`

- [ ] Добавить индексы для производительности
- [ ] Создать Drizzle схемы для новых таблиц
- [ ] Написать seed данные для тестирования

**Файлы:**
```
lib/db/schema.ts - расширить схему
lib/db/migrations/0002_crm_tables.sql - новая миграция
```

#### День 3-5: HH.ru Sync Engine
**Ответственный:** Backend Developer
**Приоритет:** 🔴 Критичная

- [ ] Создать `lib/sync/hh-sync-engine.ts`
  - `syncNegotiations()` - синхронизация откликов
  - `syncMessages()` - синхронизация сообщений
  - `syncVacancyResponses()` - отклики на вакансии

- [ ] Создать API route `app/api/sync/route.ts`
  - `POST /api/sync/negotiations`
  - `POST /api/sync/messages`
  - `GET /api/sync/status`

- [ ] Настроить cron job для автоматической синхронизации
  - Каждые 5 минут - negotiations
  - Каждую минуту - messages

- [ ] Добавить error handling и retry логику
- [ ] Логирование в `sync_status` таблицу

**Технические детали:**
```typescript
// lib/sync/hh-sync-engine.ts
import { db } from '@/lib/db'
import { negotiations, messages, candidates, sync_status } from '@/lib/db/schema'
import { getNegotiations, getNegotiationMessages } from '@/lib/hh-api'

export class HHSyncEngine {
  async syncNegotiations(options?: { vacancyId?: string }) {
    // 1. Получить negotiations из HH.ru API
    // 2. Сравнить с БД (по hh_negotiation_id)
    // 3. Создать новые / обновить существующие
    // 4. Логировать в sync_status
  }

  async syncMessages(negotiationId?: string) {
    // 1. Получить active negotiations из БД
    // 2. Для каждой - получить messages из HH.ru API
    // 3. Сохранить новые сообщения
    // 4. Обновить has_updates флаг
  }
}
```

#### День 5: API Routes для Sync
**Ответственный:** Backend Developer

- [ ] `POST /api/sync/negotiations` - ручная синхронизация
- [ ] `POST /api/sync/messages` - синхронизация сообщений
- [ ] `GET /api/sync/status` - статус последней синхронизации
- [ ] Add rate limiting для sync endpoints

**Критерии завершения:**
- ✅ Синхронизация работает вручную через API
- ✅ Новые отклики появляются в БД
- ✅ Сообщения синхронизируются корректно
- ✅ Логируется статус синхронизации

---

## 🏃 SPRINT 2: Kanban Board & UI (неделя 2)

### Цели спринта
- Создать Kanban board компонент
- Реализовать drag & drop
- API для управления pipeline

### Задачи

#### День 1-2: Pipeline API
**Ответственный:** Backend Developer
**Приоритет:** 🔴 Критичная

- [ ] Создать `app/api/crm/pipeline/route.ts`
  - `GET /api/crm/pipeline?vacancy_id=X` - получить все карточки
  - `POST /api/crm/pipeline/move` - переместить карточку
  - `PATCH /api/crm/pipeline/:id` - обновить карточку

- [ ] Бизнес-логика перемещения карточек
  - Обновление position в колонке
  - Логирование в activities
  - Автоматические действия при смене стадии

**Структура данных:**
```typescript
interface PipelineStage {
  id: string
  vacancy_id: string
  candidate_id: string
  stage: 'sourcing' | 'screening' | 'contacted' | 'interview' | 'offer' | 'hired' | 'rejected'
  position: number
  assigned_to?: string
  notes?: string
}
```

#### День 3-5: Kanban Board Component
**Ответственный:** Frontend Developer
**Приоритет:** 🔴 Критичная

- [ ] Установить `@dnd-kit/core` для drag & drop
- [ ] Создать `components/crm/kanban-board.tsx`
  - Columns для каждой стадии
  - Карточки кандидатов
  - Drag & drop между колонками
  - Фильтры (вакансия, рекрутер)

- [ ] Создать `components/crm/candidate-card.tsx`
  - Фото, имя, позиция
  - Рейтинг, теги
  - Быстрые действия (звонок, email)

- [ ] Создать страницу `/crm/pipeline`
- [ ] Real-time updates при изменениях

**UI/UX:**
```
┌─────────────────────────────────────────────────────────┐
│  Pipeline: Senior React Developer                       │
│  Filters: [All Recruiters ▼] [Last 30 days ▼]          │
├─────────┬──────────┬──────────┬──────────┬─────────────┤
│Sourcing │Screening │Contacted │Interview │   Offer     │
│  (12)   │   (8)    │   (5)    │   (3)    │    (2)      │
├─────────┼──────────┼──────────┼──────────┼─────────────┤
│┌───────┐│┌───────┐ │┌───────┐ │┌───────┐ │┌───────┐   │
││ Card  ││ Card    │││ Card   │││ Card   │││ Card   │   │
││ ⭐⭐⭐ │││  ⭐⭐⭐  │││  ⭐⭐   │││  ⭐⭐   │││  ⭐⭐⭐  │   │
│└───────┘│└───────┘ │└───────┘ │└───────┘ │└───────┘   │
│         │          │          │          │             │
└─────────┴──────────┴──────────┴──────────┴─────────────┘
```

#### День 5: Testing & Polish
**Ответственный:** QA / Developer

- [ ] Unit тесты для pipeline API
- [ ] E2E тест drag & drop
- [ ] Performance тестирование с 100+ карточками
- [ ] Mobile responsive проверка

**Критерии завершения:**
- ✅ Kanban board отображается корректно
- ✅ Drag & drop работает плавно
- ✅ Изменения сохраняются в БД
- ✅ Фильтры работают
- ✅ Mobile responsive

---

## 🏃 SPRINT 3: Task Manager & Candidate Profile (неделя 3)

### Цели спринта
- Система задач для рекрутеров
- Расширенная карточка кандидата

### Задачи

#### День 1-2: Tasks API
**Ответственный:** Backend Developer
**Приоритет:** 🔴 Критичная

- [ ] Создать `app/api/tasks/route.ts`
  - `GET /api/tasks` - список задач с фильтрами
  - `POST /api/tasks` - создать задачу
  - `PATCH /api/tasks/:id` - обновить задачу
  - `DELETE /api/tasks/:id` - удалить задачу
  - `POST /api/tasks/:id/complete` - завершить задачу

- [ ] Notifications при создании/назначении задачи
- [ ] Автоматическое создание задач из автоматизации

#### День 2-3: Task UI Components
**Ответственный:** Frontend Developer

- [ ] Создать `components/crm/task-list.tsx`
  - Список задач с фильтрами
  - Группировка (сегодня, на неделе, просроченные)
  - Чекбокс для завершения

- [ ] Создать `components/crm/task-dialog.tsx`
  - Форма создания/редактирования задачи
  - Выбор кандидата, вакансии
  - Date picker для deadline
  - Priority selector

- [ ] Интегрировать в `/crm` страницу
- [ ] Badge с количеством задач в header

#### День 3-5: Enhanced Candidate Profile
**Ответственный:** Full-stack Developer
**Приоритет:** 🔴 Критичная

- [ ] Расширить `app/api/candidates/:id/route.ts`
  - `GET /api/candidates/:id/timeline` - timeline активностей
  - `POST /api/candidates/:id/notes` - добавить заметку
  - `POST /api/candidates/:id/evaluate` - добавить оценку

- [ ] Создать `components/crm/candidate-profile.tsx`
  - Tabs: Overview, Timeline, Documents, Notes, Evaluations
  - Timeline всех взаимодействий
  - Форма добавления заметок
  - Форма оценки после интервью

- [ ] Создать страницу `/crm/candidates/:id`

**Timeline компонент:**
```tsx
<Timeline events={[
  { type: 'sourced', date: '2025-01-15', user: 'Anna' },
  { type: 'invited', date: '2025-01-16', message: '...' },
  { type: 'responded', date: '2025-01-17' },
  { type: 'interview_scheduled', date: '2025-01-20' },
  { type: 'evaluated', date: '2025-01-20', rating: 4 },
  { type: 'offer_sent', date: '2025-01-22' }
]} />
```

**Критерии завершения:**
- ✅ Задачи создаются и назначаются
- ✅ Уведомления работают
- ✅ Карточка кандидата показывает полную историю
- ✅ Можно добавлять заметки и оценки

---

## 🏃 SPRINT 4: Templates & Polish (неделя 4)

### Цели спринта
- Шаблоны сообщений
- Полировка MVP
- Подготовка к production

### Задачи

#### День 1-2: Message Templates
**Ответственный:** Full-stack Developer
**Приоритет:** 🔴 Критичная

- [ ] Создать `app/api/templates/route.ts`
  - `GET /api/templates?category=X` - список шаблонов
  - `POST /api/templates` - создать шаблон
  - `PATCH /api/templates/:id` - обновить
  - `DELETE /api/templates/:id` - удалить

- [ ] Создать `components/crm/template-editor.tsx`
  - Rich text editor для body
  - Variables placeholder ({{candidate_name}}, {{vacancy_title}})
  - Preview шаблона

- [ ] Интегрировать в message sending flow
- [ ] Предустановленные шаблоны (invitation, rejection, interview_confirm)

**Пример шаблона:**
```
Тема: Приглашение на вакансию {{vacancy_title}}

Здравствуйте, {{candidate_name}}!

Мы рассмотрели ваше резюме на позицию {{vacancy_title}}
и хотели бы пригласить вас на собеседование.

Предлагаем встретиться {{interview_date}} в {{interview_time}}.

С уважением,
{{recruiter_name}}
```

#### День 2-3: Communication Panel
**Ответственный:** Frontend Developer

- [ ] Создать `components/crm/communication-panel.tsx`
  - Выбор канала (HH.ru, Email)
  - Выбор шаблона
  - Подстановка переменных
  - Preview перед отправкой

- [ ] История коммуникаций
- [ ] Фильтры по каналу и дате

#### День 3-4: MVP Polishing
**Ответственный:** Team

- [ ] Code review всех компонентов
- [ ] Performance optimization
  - Виртуализация списков
  - Lazy loading компонентов
  - Кэширование данных

- [ ] Error handling улучшение
  - User-friendly error messages
  - Retry mechanisms
  - Loading states

- [ ] UI/UX improvements
  - Consistent styling
  - Accessibility (ARIA labels)
  - Keyboard shortcuts

- [ ] Documentation
  - API documentation
  - User guide
  - Developer guide

#### День 4-5: Testing & Deployment
**Ответственный:** DevOps / QA

- [ ] End-to-end тестирование
  - Полный flow найма кандидата
  - Синхронизация работает
  - Задачи создаются и завершаются

- [ ] Load testing
  - 100+ кандидатов в pipeline
  - Множественные пользователи

- [ ] Security audit
  - SQL injection prevention
  - XSS prevention
  - CSRF protection

- [ ] Production deployment
  - Environment variables
  - Database migration
  - Monitoring setup

**Критерии завершения MVP:**
- ✅ Все MUST HAVE функции работают
- ✅ Синхронизация с HH.ru стабильна
- ✅ UI responsive и быстрый
- ✅ Нет критических багов
- ✅ Documentation готова
- ✅ Deployed to production

---

## 📊 Этап 2: Version 2.0 - Advanced Features (недели 5-8)

## 🏃 SPRINT 5: Automation Engine (неделя 5)

### Задачи

#### Automation Rules Builder

- [ ] Создать `app/api/automation/route.ts`
  - CRUD для automation rules
  - Test rule execution
  - Execution logs

- [ ] Создать `components/crm/automation-builder.tsx`
  - Visual rule builder
  - Trigger selection (stage entered, time elapsed, score threshold)
  - Action selection (move stage, send email, create task, notify)
  - Conditions builder

- [ ] Background job processor
  - Установить BullMQ
  - Queue для automation jobs
  - Retry failed jobs

**Пример правила:**
```json
{
  "name": "Auto-reject low score candidates after 7 days",
  "trigger": {
    "type": "time_elapsed",
    "stage": "screening",
    "days": 7
  },
  "conditions": [
    { "field": "score", "operator": "<", "value": 60 }
  ],
  "actions": [
    { "type": "move_stage", "target": "rejected" },
    { "type": "send_email", "template": "rejection_auto" }
  ]
}
```

#### Встроенные автоматизации

- [ ] Новый кандидат с score > 80 → Create task "Review profile"
- [ ] Отклик получен → Move to "Screening"
- [ ] В стадии > 7 дней → Notify assigned recruiter
- [ ] Интервью через 1 день → Send reminder email

---

## 🏃 SPRINT 6: Analytics Dashboard (неделя 6)

### Задачи

#### Analytics API

- [ ] Создать `app/api/analytics/route.ts`
  - Funnel conversion rates
  - Time to hire by stage
  - Source effectiveness
  - Recruiter performance

- [ ] Data aggregation queries
  - Optimize with indexes
  - Cache results (Redis)
  - Pre-calculate metrics

#### Dashboard UI

- [ ] Установить Recharts или Chart.js
- [ ] Создать `app/crm/analytics/page.tsx`
  - Funnel chart с конверсией
  - Time series: candidates over time
  - Bar chart: candidates by stage
  - Pie chart: source distribution

- [ ] Date range selector
- [ ] Export reports (PDF, CSV)

**Метрики для отображения:**
- Total candidates processed
- Conversion rate (sourced → hired)
- Average time to hire
- Stage velocity (time in each stage)
- Bottleneck identification
- Recruiter leaderboard

---

## 🏃 SPRINT 7: Email Integration & Access Control (неделя 7)

### Задачи

#### Email Service

- [ ] Настроить Nodemailer + SMTP
- [ ] Создать `lib/services/email-service.ts`
  - `sendEmail(to, subject, body, template)`
  - Email queue для async sending
  - Tracking (sent, delivered, opened)

- [ ] Email templates (HTML)
  - Invitation email
  - Rejection email
  - Interview confirmation
  - Offer letter

- [ ] Интеграция с Communication Hub

#### Access Control

- [ ] Расширить auth систему
  - User roles (admin, hr_manager, recruiter, viewer)
  - Role-based permissions
  - Scope (all vacancies vs specific)

- [ ] Создать `app/admin/users/page.tsx`
  - User management
  - Assign roles
  - Set scopes

- [ ] Middleware для проверки прав
  - Protect API routes
  - Filter data based on scope

---

## 🏃 SPRINT 8: Polish & Advanced Features (неделя 8)

### Задачи

#### Advanced Search & Filters

- [ ] Global search по всем кандидатам
- [ ] Saved searches
- [ ] Advanced filters (multiple conditions)
- [ ] Bulk actions

#### Notifications System

- [ ] In-app notifications
- [ ] Email notifications (optional)
- [ ] Push notifications (PWA)
- [ ] Notification preferences

#### Performance Optimization

- [ ] Database query optimization
- [ ] API response caching
- [ ] UI virtualization для больших списков
- [ ] Code splitting и lazy loading

#### Mobile Optimization

- [ ] Mobile-first UI adjustments
- [ ] Touch-friendly interactions
- [ ] Offline support (PWA)

---

## 📈 Этап 3: Version 3.0 - Enterprise Features (недели 9-14)

### SPRINT 9-10: SMS Integration & Advanced Automation

- [ ] SMS service integration (Twilio/SMS.ru)
- [ ] SMS templates
- [ ] AI-powered automation suggestions
- [ ] Predictive analytics (likelihood to hire)

### SPRINT 11-12: Integrations

- [ ] Google Calendar integration (interview scheduling)
- [ ] WhatsApp/Telegram messaging
- [ ] Video interview integration (Zoom API)
- [ ] Import/Export (from other ATS systems)

### SPRINT 13-14: Mobile App & AI Features

- [ ] Mobile app (React Native)
- [ ] AI candidate matching
- [ ] Chatbot for candidates
- [ ] Voice notes transcription

---

## 🎯 Definition of Done (DoD)

Для каждой задачи:
- [ ] Code написан и соответствует style guide
- [ ] Unit tests написаны (coverage > 80%)
- [ ] Integration tests пройдены
- [ ] Code review выполнен
- [ ] Documentation обновлена
- [ ] QA тестирование пройдено
- [ ] Deployed to staging
- [ ] User acceptance test пройден
- [ ] Deployed to production

---

## 📦 Deliverables по спринтам

### Sprint 1
- ✅ HH.ru sync работает автоматически
- ✅ База данных расширена
- ✅ Sync API endpoints

### Sprint 2
- ✅ Kanban board функционален
- ✅ Drag & drop работает
- ✅ Pipeline API

### Sprint 3
- ✅ Task manager работает
- ✅ Расширенная карточка кандидата
- ✅ Timeline активностей

### Sprint 4
- ✅ Шаблоны сообщений
- ✅ MVP готов к production
- ✅ Documentation

---

## 🛠️ Инструменты и процессы

### Project Management
- **Jira/Linear** - управление задачами
- **Daily standups** (15 мин)
- **Sprint planning** (начало спринта)
- **Sprint retrospective** (конец спринта)
- **Demo** (для stakeholders каждые 2 недели)

### Code Quality
- **ESLint + Prettier** - code formatting
- **Husky** - pre-commit hooks
- **Jest** - unit testing
- **Playwright** - E2E testing
- **SonarQube** - code quality metrics

### CI/CD
- **GitHub Actions** - automated testing
- **Vercel** - preview deployments
- **Production** - automated deployment after QA approval

### Monitoring
- **Sentry** - error tracking
- **PostHog** - analytics
- **Uptime Robot** - availability monitoring

---

## 👥 Team Structure

### Рекомендуемый состав команды:

1. **Tech Lead** (1 человек)
   - Архитектурные решения
   - Code review
   - Mentoring

2. **Backend Developer** (1-2 человека)
   - API development
   - Database
   - Sync engine

3. **Frontend Developer** (1-2 человека)
   - UI components
   - State management
   - UX implementation

4. **Full-stack Developer** (1 человек)
   - Bridge между frontend/backend
   - Integration work

5. **QA Engineer** (1 человек)
   - Test planning
   - Manual testing
   - Automated tests

6. **DevOps** (0.5 FTE)
   - CI/CD setup
   - Deployment
   - Monitoring

**Total: 4-6 разработчиков** для MVP за 4 недели

---

## 💰 Бюджет (ориентировочный)

### MVP (4 недели)
- **Development:** 4-6 разработчиков × 4 недели = 16-24 недель работы
- **Infrastructure:** ~$100-200/месяц (Vercel, Redis, storage)
- **External services:** ~$50-100/месяц (SendGrid, Twilio для тестов)

### v2.0 (доп. 4 недели)
- **Development:** +16-24 недель работы
- **Infrastructure:** +$50-100/месяц

### v3.0 (доп. 6 недель)
- **Development:** +24-36 недель работы
- **Infrastructure:** +$100-200/месяц

---

## ✅ Чеклист перед стартом

- [ ] Подтвердить приоритеты функций со stakeholders
- [ ] Собрать команду разработчиков
- [ ] Настроить dev/staging/production environments
- [ ] Создать Jira/Linear проект с эпиками и задачами
- [ ] Подготовить дизайн-макеты (Figma)
- [ ] Настроить CI/CD pipeline
- [ ] Провести kickoff meeting
- [ ] Определить success metrics
- [ ] Составить риск-план
- [ ] Начать Sprint 1! 🚀

---

*Документ обновлен: 2025-12-28*
*Версия: 1.0*
*Статус: Ready for Review*
