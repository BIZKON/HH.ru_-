-- Миграция 012: Создание таблицы messages для переписки

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Связь с откликом
  negotiation_id UUID NOT NULL REFERENCES negotiations(id) ON DELETE CASCADE,
  
  -- Данные из HH.ru
  hh_message_id TEXT UNIQUE, -- ID сообщения в HH.ru API
  
  -- Автор сообщения
  author TEXT NOT NULL, -- 'employer' или 'applicant'
  
  -- Содержимое
  text TEXT NOT NULL,
  
  -- Состояние
  read_by_applicant BOOLEAN DEFAULT false,
  read_by_employer BOOLEAN DEFAULT false,
  
  -- Временные метки
  created_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  
  -- Вложения
  attachments JSONB DEFAULT '[]'::jsonb,
  
  CONSTRAINT messages_author_check CHECK (author IN ('employer', 'applicant'))
);

-- Индексы
CREATE INDEX idx_messages_negotiation ON messages(negotiation_id);
CREATE INDEX idx_messages_created ON messages(created_at DESC);
CREATE INDEX idx_messages_hh_id ON messages(hh_message_id);

COMMENT ON TABLE messages IS 'История сообщений в переписке с кандидатами';
