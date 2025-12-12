-- Таблица приглашений (история отправок)
CREATE TABLE IF NOT EXISTS invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
  candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
  vacancy_id UUID REFERENCES vacancies(id) ON DELETE CASCADE,
  
  -- Что было отправлено
  message TEXT,
  hh_invitation_id TEXT, -- ID из API HH.ru
  
  -- Статус
  status TEXT DEFAULT 'sent',
  
  -- Кто отправил
  sent_by UUID,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ответ кандидата
  responded_at TIMESTAMP WITH TIME ZONE,
  response_text TEXT,
  
  CONSTRAINT valid_invitation_status CHECK (
    status IN ('sent', 'delivered', 'viewed', 'responded', 'rejected', 'error')
  )
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_invitations_application ON invitations(application_id);
CREATE INDEX IF NOT EXISTS idx_invitations_candidate ON invitations(candidate_id);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON invitations(status);
