-- Улучшения схемы БД

-- 1. Добавить FK constraint на created_by в search_sessions (если users существует)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
    ALTER TABLE search_sessions 
      ADD CONSTRAINT fk_search_sessions_created_by 
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 2. Добавить constraints на total_found/total_scored
ALTER TABLE search_sessions
  ADD CONSTRAINT check_total_found_positive CHECK (total_found >= 0),
  ADD CONSTRAINT check_total_scored_positive CHECK (total_scored >= 0),
  ADD CONSTRAINT check_scored_lte_found CHECK (total_scored <= total_found);

-- 3. Добавить constraints на score диапазоны
ALTER TABLE search_sessions
  ADD CONSTRAINT check_avg_score_range CHECK (avg_score IS NULL OR (avg_score >= 0 AND avg_score <= 100)),
  ADD CONSTRAINT check_min_score_range CHECK (min_score IS NULL OR (min_score >= 0 AND min_score <= 100)),
  ADD CONSTRAINT check_max_score_range CHECK (max_score IS NULL OR (max_score >= 0 AND max_score <= 100)),
  ADD CONSTRAINT check_min_lte_max CHECK (min_score IS NULL OR max_score IS NULL OR min_score <= max_score);

-- 4. Индекс на vacancy_id в invitations (уже есть поле, добавляем индекс)
CREATE INDEX IF NOT EXISTS idx_invitations_vacancy ON invitations(vacancy_id);

-- 5. Партиционирование audit_log по месяцам
-- Сначала создаем партиционированную версию таблицы

-- Переименовываем старую таблицу если существует
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_log') THEN
    -- Сохраняем старые данные
    ALTER TABLE audit_log RENAME TO audit_log_old;
  END IF;
END $$;

-- Создаем партиционированную таблицу
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT NOT NULL,
  old_value JSONB,
  new_value JSONB,
  changed_fields TEXT[],
  changed_by UUID,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT,
  
  CONSTRAINT valid_action CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  PRIMARY KEY (id, changed_at)
) PARTITION BY RANGE (changed_at);

-- Создаем партиции на ближайшие 12 месяцев
CREATE TABLE IF NOT EXISTS audit_log_2025_06 PARTITION OF audit_log
  FOR VALUES FROM ('2025-06-01') TO ('2025-07-01');

CREATE TABLE IF NOT EXISTS audit_log_2025_07 PARTITION OF audit_log
  FOR VALUES FROM ('2025-07-01') TO ('2025-08-01');

CREATE TABLE IF NOT EXISTS audit_log_2025_08 PARTITION OF audit_log
  FOR VALUES FROM ('2025-08-01') TO ('2025-09-01');

CREATE TABLE IF NOT EXISTS audit_log_2025_09 PARTITION OF audit_log
  FOR VALUES FROM ('2025-09-01') TO ('2025-10-01');

CREATE TABLE IF NOT EXISTS audit_log_2025_10 PARTITION OF audit_log
  FOR VALUES FROM ('2025-10-01') TO ('2025-11-01');

CREATE TABLE IF NOT EXISTS audit_log_2025_11 PARTITION OF audit_log
  FOR VALUES FROM ('2025-11-01') TO ('2025-12-01');

CREATE TABLE IF NOT EXISTS audit_log_2025_12 PARTITION OF audit_log
  FOR VALUES FROM ('2025-12-01') TO ('2026-01-01');

CREATE TABLE IF NOT EXISTS audit_log_2026_01 PARTITION OF audit_log
  FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');

CREATE TABLE IF NOT EXISTS audit_log_2026_02 PARTITION OF audit_log
  FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');

CREATE TABLE IF NOT EXISTS audit_log_2026_03 PARTITION OF audit_log
  FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');

CREATE TABLE IF NOT EXISTS audit_log_2026_04 PARTITION OF audit_log
  FOR VALUES FROM ('2026-04-01') TO ('2026-05-01');

CREATE TABLE IF NOT EXISTS audit_log_2026_05 PARTITION OF audit_log
  FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');

-- Default партиция для данных вне диапазона
CREATE TABLE IF NOT EXISTS audit_log_default PARTITION OF audit_log DEFAULT;

-- Индексы для партиционированной таблицы
CREATE INDEX IF NOT EXISTS idx_audit_log_table ON audit_log(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_log_record ON audit_log(record_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_changed_at ON audit_log(changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_changed_by ON audit_log(changed_by);

-- Миграция данных из старой таблицы
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_log_old') THEN
    INSERT INTO audit_log SELECT * FROM audit_log_old;
    DROP TABLE audit_log_old;
  END IF;
END $$;

-- 6. Функция для автоматического создания новых партиций
CREATE OR REPLACE FUNCTION create_audit_log_partition()
RETURNS void AS $$
DECLARE
  partition_date DATE;
  partition_name TEXT;
  start_date DATE;
  end_date DATE;
BEGIN
  -- Создаем партицию на следующий месяц если её нет
  partition_date := DATE_TRUNC('month', NOW() + INTERVAL '1 month');
  partition_name := 'audit_log_' || TO_CHAR(partition_date, 'YYYY_MM');
  start_date := partition_date;
  end_date := partition_date + INTERVAL '1 month';
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_class WHERE relname = partition_name
  ) THEN
    EXECUTE FORMAT(
      'CREATE TABLE IF NOT EXISTS %I PARTITION OF audit_log FOR VALUES FROM (%L) TO (%L)',
      partition_name, start_date, end_date
    );
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Комментарии к таблицам
COMMENT ON TABLE search_sessions IS 'История поисковых сессий с полными параметрами и статистикой';
COMMENT ON TABLE invitations IS 'История отправленных приглашений кандидатам';
COMMENT ON TABLE audit_log IS 'Партиционированный лог всех изменений в системе';
COMMENT ON COLUMN search_sessions.search_params IS 'Полный JSON параметров поиска для резервного копирования';
COMMENT ON COLUMN audit_log.changed_fields IS 'Список измененных полей для быстрого анализа';
