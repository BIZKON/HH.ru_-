-- Миграция 011: Создание таблицы negotiations для откликов и приглашений
-- Связь с HH.ru API negotiations

CREATE TABLE IF NOT EXISTS negotiations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Связи
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  vacancy_id UUID NOT NULL REFERENCES vacancies(id) ON DELETE CASCADE,
  application_id UUID REFERENCES applications(id) ON DELETE SET NULL,
  
  -- Данные из HH.ru
  hh_negotiation_id TEXT UNIQUE, -- ID отклика в HH.ru API
  external_resume_id TEXT, -- ID резюме в HH.ru
  external_vacancy_id TEXT, -- ID вакансии в HH.ru
  
  -- Статус отклика
  state TEXT NOT NULL DEFAULT 'new', -- new, invitation, response, discard, hired, archived
  
  -- Кто инициировал
  source TEXT NOT NULL DEFAULT 'employer', -- employer (приглашение) или applicant (отклик)
  
  -- Сообщения
  initial_message TEXT, -- Первое сообщение от работодателя/кандидата
  has_updates BOOLEAN DEFAULT false, -- Есть непрочитанные сообщения
  messages_count INTEGER DEFAULT 0,
  
  -- Временные метки
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  viewed_at TIMESTAMPTZ, -- Когда кандидат просмотрел приглашение
  responded_at TIMESTAMPTZ, -- Когда был последний ответ
  
  -- Дополнительная информация
  topics JSONB DEFAULT '[]'::jsonb, -- Темы переписки из HH.ru
  actions JSONB DEFAULT '{}'::jsonb, -- Доступные действия
  
  -- Индексы
  CONSTRAINT negotiations_state_check CHECK (state IN ('new', 'invitation', 'response', 'discard', 'hired', 'archived'))
);

-- Индексы для быстрого поиска
CREATE INDEX idx_negotiations_candidate ON negotiations(candidate_id);
CREATE INDEX idx_negotiations_vacancy ON negotiations(vacancy_id);
CREATE INDEX idx_negotiations_state ON negotiations(state);
CREATE INDEX idx_negotiations_hh_id ON negotiations(hh_negotiation_id);
CREATE INDEX idx_negotiations_created ON negotiations(created_at DESC);
CREATE INDEX idx_negotiations_updated ON negotiations(updated_at DESC);

-- Комментарии
COMMENT ON TABLE negotiations IS 'Отклики и приглашения (синхронизация с HH.ru API)';
COMMENT ON COLUMN negotiations.state IS 'Статус: new, invitation, response, discard, hired, archived';
COMMENT ON COLUMN negotiations.source IS 'Инициатор: employer (приглашение) или applicant (отклик)';
