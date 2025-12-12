-- =====================================================
-- RLS POLICIES FOR NEW TABLES
-- Выполнить после создания всех таблиц
-- =====================================================

-- =====================================================
-- SEARCH_SESSIONS
-- =====================================================
ALTER TABLE search_sessions ENABLE ROW LEVEL SECURITY;

-- Политика: пользователи видят сессии поиска своей компании
CREATE POLICY "Users can view company search sessions"
ON search_sessions FOR SELECT
USING (
  created_by IN (
    SELECT id FROM users 
    WHERE company_id = (SELECT company_id FROM users WHERE id = auth.uid())
  )
  OR created_by IS NULL -- для анонимных сессий
);

-- Политика: пользователи могут создавать сессии
CREATE POLICY "Users can create search sessions"
ON search_sessions FOR INSERT
WITH CHECK (true);

-- Политика: пользователи могут обновлять свои сессии
CREATE POLICY "Users can update own search sessions"
ON search_sessions FOR UPDATE
USING (created_by = auth.uid() OR created_by IS NULL);

-- =====================================================
-- INVITATIONS
-- =====================================================
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- Политика: пользователи видят приглашения своей компании
CREATE POLICY "Users can view company invitations"
ON invitations FOR SELECT
USING (
  sent_by IN (
    SELECT id FROM users 
    WHERE company_id = (SELECT company_id FROM users WHERE id = auth.uid())
  )
  OR sent_by IS NULL
);

-- Политика: пользователи могут создавать приглашения
CREATE POLICY "Users can create invitations"
ON invitations FOR INSERT
WITH CHECK (true);

-- Политика: пользователи могут обновлять приглашения
CREATE POLICY "Users can update invitations"
ON invitations FOR UPDATE
USING (sent_by = auth.uid() OR sent_by IS NULL);

-- =====================================================
-- EXPORTS
-- =====================================================
ALTER TABLE exports ENABLE ROW LEVEL SECURITY;

-- Политика: пользователи видят экспорты своей компании
CREATE POLICY "Users can view company exports"
ON exports FOR SELECT
USING (
  created_by IN (
    SELECT id FROM users 
    WHERE company_id = (SELECT company_id FROM users WHERE id = auth.uid())
  )
  OR created_by IS NULL
);

-- Политика: пользователи могут создавать экспорты
CREATE POLICY "Users can create exports"
ON exports FOR INSERT
WITH CHECK (true);

-- =====================================================
-- AUDIT_LOG (партиции наследуют RLS от родителя)
-- =====================================================
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Политика: только админы могут читать audit_log
CREATE POLICY "Admins can view audit logs"
ON audit_log FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

-- Политика: система может записывать в audit_log
CREATE POLICY "System can insert audit logs"
ON audit_log FOR INSERT
WITH CHECK (true);

-- =====================================================
-- Включить RLS на партициях audit_log
-- =====================================================
ALTER TABLE audit_log_2025_06 ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log_2025_07 ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log_2025_08 ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log_2025_09 ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log_2025_10 ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log_2025_11 ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log_2025_12 ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log_2026_01 ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log_2026_02 ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log_2026_03 ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log_2026_04 ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log_2026_05 ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log_default ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- ИНДЕКСЫ ДЛЯ ПРОИЗВОДИТЕЛЬНОСТИ RLS
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_search_sessions_created_by ON search_sessions(created_by);
CREATE INDEX IF NOT EXISTS idx_invitations_sent_by ON invitations(sent_by);
CREATE INDEX IF NOT EXISTS idx_exports_created_by ON exports(created_by);
CREATE INDEX IF NOT EXISTS idx_users_company_role ON users(company_id, role);

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================
GRANT SELECT, INSERT, UPDATE ON search_sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON invitations TO authenticated;
GRANT SELECT, INSERT ON exports TO authenticated;
GRANT SELECT, INSERT ON audit_log TO authenticated;

-- Для анонимных пользователей (если нужно)
GRANT SELECT, INSERT, UPDATE ON search_sessions TO anon;
GRANT SELECT, INSERT, UPDATE ON invitations TO anon;
GRANT SELECT, INSERT ON exports TO anon;
GRANT SELECT, INSERT, UPDATE ON candidates TO anon;
GRANT SELECT, INSERT, UPDATE ON vacancies TO anon;
GRANT SELECT, INSERT, UPDATE ON applications TO anon;
