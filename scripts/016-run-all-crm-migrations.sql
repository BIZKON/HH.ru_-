-- Миграция 016: Запуск всех CRM миграций одной командой
-- Это удобно для быстрого развертывания всей CRM системы

-- 1. Создание таблицы negotiations
CREATE TABLE IF NOT EXISTS negotiations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  vacancy_id UUID NOT NULL REFERENCES vacancies(id) ON DELETE CASCADE,
  application_id UUID REFERENCES applications(id) ON DELETE SET NULL,
  hh_negotiation_id TEXT UNIQUE,
  external_resume_id TEXT,
  external_vacancy_id TEXT,
  state TEXT NOT NULL DEFAULT 'new',
  source TEXT NOT NULL DEFAULT 'employer',
  initial_message TEXT,
  has_updates BOOLEAN DEFAULT false,
  messages_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  viewed_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,
  topics JSONB DEFAULT '[]'::jsonb,
  actions JSONB DEFAULT '{}'::jsonb,
  CONSTRAINT negotiations_state_check CHECK (state IN ('new', 'invitation', 'response', 'discard', 'hired', 'archived'))
);

CREATE INDEX IF NOT EXISTS idx_negotiations_candidate ON negotiations(candidate_id);
CREATE INDEX IF NOT EXISTS idx_negotiations_vacancy ON negotiations(vacancy_id);
CREATE INDEX IF NOT EXISTS idx_negotiations_state ON negotiations(state);
CREATE INDEX IF NOT EXISTS idx_negotiations_hh_id ON negotiations(hh_negotiation_id);
CREATE INDEX IF NOT EXISTS idx_negotiations_created ON negotiations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_negotiations_updated ON negotiations(updated_at DESC);

-- 2. Создание таблицы messages
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  negotiation_id UUID NOT NULL REFERENCES negotiations(id) ON DELETE CASCADE,
  hh_message_id TEXT UNIQUE,
  author TEXT NOT NULL,
  text TEXT NOT NULL,
  read_by_applicant BOOLEAN DEFAULT false,
  read_by_employer BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  attachments JSONB DEFAULT '[]'::jsonb,
  CONSTRAINT messages_author_check CHECK (author IN ('employer', 'applicant'))
);

CREATE INDEX IF NOT EXISTS idx_messages_negotiation ON messages(negotiation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_hh_id ON messages(hh_message_id);

-- 3. Создание таблицы activities
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
  vacancy_id UUID REFERENCES vacancies(id) ON DELETE CASCADE,
  negotiation_id UUID REFERENCES negotiations(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activities_candidate ON activities(candidate_id);
CREATE INDEX IF NOT EXISTS idx_activities_vacancy ON activities(vacancy_id);
CREATE INDEX IF NOT EXISTS idx_activities_negotiation ON activities(negotiation_id);
CREATE INDEX IF NOT EXISTS idx_activities_type ON activities(action_type);
CREATE INDEX IF NOT EXISTS idx_activities_created ON activities(created_at DESC);

-- 4. Расширение таблицы candidates
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

CREATE INDEX IF NOT EXISTS idx_candidates_status ON candidates(status);
CREATE INDEX IF NOT EXISTS idx_candidates_email ON candidates(email);
CREATE INDEX IF NOT EXISTS idx_candidates_phone ON candidates(phone);
CREATE INDEX IF NOT EXISTS idx_candidates_paid_access ON candidates(paid_access);
CREATE INDEX IF NOT EXISTS idx_candidates_tags ON candidates USING GIN(tags);

-- 5. Расширение таблицы vacancies
ALTER TABLE vacancies
ADD COLUMN IF NOT EXISTS responses_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS invitations_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_vacancies_published ON vacancies(is_published);
CREATE INDEX IF NOT EXISTS idx_vacancies_published_at ON vacancies(published_at DESC);

-- Вывод успешного завершения
DO $$ 
BEGIN 
  RAISE NOTICE 'CRM tables successfully created and configured!';
  RAISE NOTICE 'Tables: negotiations, messages, activities';
  RAISE NOTICE 'Extended: candidates, vacancies';
END $$;
