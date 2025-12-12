-- Миграция 014: Расширение таблицы candidates для CRM

-- Добавляем новые поля
ALTER TABLE candidates
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS middle_name TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'new',
ADD COLUMN IF NOT EXISTS paid_access BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS access_paid_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS rating INTEGER CHECK (rating >= 1 AND rating <= 5);

-- Индексы для поиска
CREATE INDEX IF NOT EXISTS idx_candidates_status ON candidates(status);
CREATE INDEX IF NOT EXISTS idx_candidates_email ON candidates(email);
CREATE INDEX IF NOT EXISTS idx_candidates_phone ON candidates(phone);
CREATE INDEX IF NOT EXISTS idx_candidates_paid_access ON candidates(paid_access);
CREATE INDEX IF NOT EXISTS idx_candidates_tags ON candidates USING GIN(tags);

-- Комментарии
COMMENT ON COLUMN candidates.status IS 'Статус в воронке: new, contacted, interview, offer, hired, rejected';
COMMENT ON COLUMN candidates.paid_access IS 'Оплачен ли доступ к контактам на HH.ru';
COMMENT ON COLUMN candidates.rating IS 'Оценка кандидата от 1 до 5 звезд';
