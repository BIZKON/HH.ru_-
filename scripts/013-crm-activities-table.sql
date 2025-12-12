-- Миграция 013: Создание таблицы activities для лога действий

CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Связи
  candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
  vacancy_id UUID REFERENCES vacancies(id) ON DELETE CASCADE,
  negotiation_id UUID REFERENCES negotiations(id) ON DELETE CASCADE,
  
  -- Тип действия
  action_type TEXT NOT NULL, -- status_change, message_sent, note_added, resume_viewed, etc.
  
  -- Описание
  title TEXT NOT NULL,
  description TEXT,
  
  -- Метаданные
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Временная метка
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Индексы
CREATE INDEX idx_activities_candidate ON activities(candidate_id);
CREATE INDEX idx_activities_vacancy ON activities(vacancy_id);
CREATE INDEX idx_activities_negotiation ON activities(negotiation_id);
CREATE INDEX idx_activities_type ON activities(action_type);
CREATE INDEX idx_activities_created ON activities(created_at DESC);

COMMENT ON TABLE activities IS 'Лог всех действий в CRM системе';
