# 🔄 HH.ru Sync Engine - Setup Guide

## Обзор

HH.ru Sync Engine автоматически синхронизирует данные с HH.ru API:
- ✅ Отклики на вакансии (negotiations)
- ✅ Сообщения в переговорах (messages)
- ✅ Обновления статусов кандидатов

## Автоматическая синхронизация

### Vercel Cron (Production)

Cron job настроен в `vercel.json` и запускается **каждые 5 минут**:

```json
{
  "crons": [{
    "path": "/api/sync/cron",
    "schedule": "*/5 * * * *"
  }]
}
```

### Environment Variables

Добавьте в `.env.local` и Vercel Environment Variables:

```bash
# Ключ для защиты cron endpoint
CRON_SECRET_KEY=your-random-secret-key-here

# Ключ для шифрования токенов (уже должен быть)
ENCRYPTION_KEY=your-encryption-key
```

### Безопасность Cron Endpoint

Cron endpoint защищен секретным ключом:

```
GET /api/sync/cron?key=YOUR_CRON_SECRET_KEY
```

В production запросы без правильного ключа будут отклонены.

## Ручная синхронизация

### Через API

```bash
# Полная синхронизация
curl -X POST http://localhost:3000/api/sync \
  -H "Content-Type: application/json" \
  -d '{"type": "full"}'

# Только negotiations
curl -X POST http://localhost:3000/api/sync \
  -H "Content-Type: application/json" \
  -d '{"type": "negotiations", "vacancyId": "123"}'

# Только messages
curl -X POST http://localhost:3000/api/sync \
  -H "Content-Type: application/json" \
  -d '{"type": "messages"}'
```

### Через UI

Добавьте кнопку "Синхронизировать" в CRM интерфейс:

```tsx
async function handleSync() {
  const response = await fetch('/api/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'full' })
  })

  const data = await response.json()
  console.log('Sync result:', data)
}

<Button onClick={handleSync}>Синхронизировать</Button>
```

## Проверка статуса синхронизации

```bash
# Статус синхронизации negotiations
GET /api/sync/status?type=negotiations

# Статус синхронизации messages
GET /api/sync/status?type=messages
```

Ответ:

```json
{
  "lastSyncedAt": "2025-12-28T10:30:00Z",
  "status": "success",
  "itemsSynced": 15,
  "errorMessage": null
}
```

## Логирование

Все синхронизации логируются в таблицу `sync_status`:

```sql
SELECT * FROM sync_status
ORDER BY last_synced_at DESC
LIMIT 10;
```

## Monitoring

### Метрики для отслеживания:

1. **Частота синхронизации** - должна быть каждые 5 минут
2. **Количество синхронизированных элементов** - не должно падать до 0 при активных вакансиях
3. **Ошибки синхронизации** - должны быть редкими

### Alerts

Настройте алерты для:
- Отсутствия синхронизации >10 минут
- Повторяющихся ошибок синхронизации
- Rate limiting ошибок от HH.ru API

## Troubleshooting

### Проблема: Синхронизация не работает

**Решение:**
1. Проверьте логи: `vercel logs`
2. Убедитесь что `CRON_SECRET_KEY` настроен
3. Проверьте что у пользователей есть валидные API токены

### Проблема: Rate limiting от HH.ru

**Решение:**
1. Уменьшите частоту cron (например, каждые 10 минут)
2. Добавьте больше задержек между запросами
3. Синхронизируйте только активные negotiations

### Проблема: Дубликаты в БД

**Решение:**
Sync engine использует `hhNegotiationId` и `hhMessageId` для предотвращения дубликатов.
Если дубликаты все равно появляются, проверьте уникальные индексы в БД.

## Локальная разработка

Для локального тестирования cron:

```bash
# Запустить cron вручную
curl http://localhost:3000/api/sync/cron?key=dev-cron-key
```

Или используйте инструменты для локального cron:

```bash
# Установить node-cron
npm install node-cron

# Создать lib/cron/scheduler.ts (опционально)
```

## Performance

### Оптимизация синхронизации:

1. **Batch processing** - обрабатываем по 50 negotiations за раз
2. **Conditional sync** - messages синхронизируются только при `hasUpdates = true`
3. **Rate limiting** - задержки между запросами к HH.ru API
4. **Caching** - проверяем существование перед INSERT

### Примерное время синхронизации:

- 10 negotiations: ~5 секунд
- 50 negotiations: ~20 секунд
- 100 negotiations: ~40 секунд

## Roadmap

### Планируемые улучшения:

- [ ] Websocket real-time sync
- [ ] Selective sync (только измененные с последней синхронизации)
- [ ] Parallel processing для нескольких вакансий
- [ ] Retry механизм с exponential backoff
- [ ] Sync dashboard в UI

---

*Документ обновлен: 2025-12-28*
*Версия: 1.0*
