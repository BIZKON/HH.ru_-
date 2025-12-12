-- Добавить search_session_id в applications
ALTER TABLE applications 
ADD COLUMN IF NOT EXISTS search_session_id UUID REFERENCES search_sessions(id) ON DELETE SET NULL;

-- Добавить rating поле
ALTER TABLE applications
ADD COLUMN IF NOT EXISTS rating TEXT;

-- Добавить constraints
ALTER TABLE applications
DROP CONSTRAINT IF EXISTS score_range;

ALTER TABLE applications
ADD CONSTRAINT score_range CHECK (score >= 0 AND score <= 100);

ALTER TABLE applications
DROP CONSTRAINT IF EXISTS valid_status;

ALTER TABLE applications
ADD CONSTRAINT valid_status CHECK (
  status IN ('new', 'reviewed', 'invited', 'rejected', 'hired')
);

-- Уникальность: один кандидат на одну сессию поиска
ALTER TABLE applications
DROP CONSTRAINT IF EXISTS unique_session_candidate;

ALTER TABLE applications
ADD CONSTRAINT unique_session_candidate UNIQUE (search_session_id, candidate_id);

-- Индекс для быстрого поиска по сессии
CREATE INDEX IF NOT EXISTS idx_applications_search_session ON applications(search_session_id);
CREATE INDEX IF NOT EXISTS idx_applications_score_desc ON applications(score DESC);
