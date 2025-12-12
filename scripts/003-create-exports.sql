-- Таблица экспортов (история скачиваний)
CREATE TABLE IF NOT EXISTS exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  search_session_id UUID REFERENCES search_sessions(id) ON DELETE SET NULL,
  vacancy_id UUID REFERENCES vacancies(id) ON DELETE SET NULL,
  
  -- Что экспортировалось
  candidates_count INTEGER NOT NULL,
  format TEXT DEFAULT 'csv',
  file_name TEXT,
  
  -- Фильтры которые были применены
  applied_filters JSONB,
  score_range_min INTEGER,
  score_range_max INTEGER,
  
  -- Метаданные
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT valid_format CHECK (format IN ('csv', 'xlsx', 'json'))
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_exports_session ON exports(search_session_id);
CREATE INDEX IF NOT EXISTS idx_exports_created ON exports(created_at DESC);
