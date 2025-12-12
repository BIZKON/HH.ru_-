-- Таблица аудита (история всех изменений)
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Что было изменено
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT NOT NULL, -- INSERT, UPDATE, DELETE
  
  -- Как было и как стало
  old_value JSONB,
  new_value JSONB,
  changed_fields TEXT[],
  
  -- Кто и когда
  changed_by UUID,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Контекст
  ip_address TEXT,
  user_agent TEXT,
  
  CONSTRAINT valid_action CHECK (action IN ('INSERT', 'UPDATE', 'DELETE'))
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_audit_table ON audit_log(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_record ON audit_log(record_id);
CREATE INDEX IF NOT EXISTS idx_audit_changed_at ON audit_log(changed_at DESC);
