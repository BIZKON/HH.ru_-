-- Таблица сессий поиска (сохраняет параметры поиска!)
CREATE TABLE IF NOT EXISTS search_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vacancy_id UUID REFERENCES vacancies(id) ON DELETE CASCADE,
  
  -- Параметры поиска (ВСЕ сохраняются!)
  search_text TEXT NOT NULL,
  search_area TEXT,
  search_experience TEXT,
  search_employment TEXT,
  search_schedule TEXT,
  search_salary_from INTEGER,
  search_order_by TEXT,
  
  -- Полный JSON параметров для резервного копирования
  search_params JSONB,
  
  -- Результаты
  total_found INTEGER DEFAULT 0,
  total_scored INTEGER DEFAULT 0,
  avg_score DECIMAL(5, 2),
  min_score INTEGER,
  max_score INTEGER,
  
  -- Метаданные
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_search_sessions_vacancy ON search_sessions(vacancy_id);
CREATE INDEX IF NOT EXISTS idx_search_sessions_created ON search_sessions(created_at DESC);
