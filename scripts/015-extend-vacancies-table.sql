-- Миграция 015: Расширение таблицы vacancies для CRM

-- Добавляем счетчики и статусы
ALTER TABLE vacancies
ADD COLUMN IF NOT EXISTS responses_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS invitations_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT true;

-- Индексы
CREATE INDEX IF NOT EXISTS idx_vacancies_published ON vacancies(is_published);
CREATE INDEX IF NOT EXISTS idx_vacancies_published_at ON vacancies(published_at DESC);

-- Комментарии
COMMENT ON COLUMN vacancies.responses_count IS 'Количество откликов от кандидатов';
COMMENT ON COLUMN vacancies.invitations_count IS 'Количество отправленных приглашений';
COMMENT ON COLUMN vacancies.is_published IS 'Опубликована ли вакансия';
