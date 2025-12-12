-- =====================================================
-- ОЧИСТКА ТЕСТОВЫХ ДАННЫХ
-- Выполнить после успешного тестирования
-- =====================================================

DELETE FROM applications WHERE id = '00000000-0000-0000-0000-000000000004';
DELETE FROM search_sessions WHERE id = '00000000-0000-0000-0000-000000000003';
DELETE FROM candidates WHERE id = '00000000-0000-0000-0000-000000000002';
DELETE FROM vacancies WHERE id = '00000000-0000-0000-0000-000000000001';

-- Проверка очистки
SELECT 'После очистки:' as status;
SELECT 'vacancies' as table_name, count(*) as count FROM vacancies WHERE source = 'test'
UNION ALL
SELECT 'candidates', count(*) FROM candidates WHERE source = 'test';
