-- =====================================================
-- ТЕСТОВЫЕ ДАННЫЕ ДЛЯ ПРОВЕРКИ
-- Выполнить для проверки работоспособности
-- =====================================================

-- Тестовая вакансия
INSERT INTO vacancies (
  id,
  external_id,
  title,
  description,
  requirements,
  location,
  employment_type,
  experience_level,
  salary_min,
  salary_max,
  skills,
  status,
  source
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'test-vacancy-001',
  'Тестовая вакансия: Менеджер по продажам',
  'Описание тестовой вакансии',
  'Обязательные навыки: CRM, B2B, продажи',
  'Москва',
  'full',
  'between1And3',
  100000,
  200000,
  ARRAY['CRM', 'B2B', 'продажи', 'переговоры'],
  'active',
  'test'
) ON CONFLICT (id) DO NOTHING;

-- Тестовый кандидат
INSERT INTO candidates (
  id,
  external_id,
  full_name,
  email,
  phone,
  current_position,
  current_company,
  location,
  experience_years,
  skills,
  resume_url,
  summary,
  source
) VALUES (
  '00000000-0000-0000-0000-000000000002',
  'test-candidate-001',
  'Тестовый Кандидат Тестович',
  'test@example.com',
  '+7 999 123-45-67',
  'Менеджер по продажам',
  'ООО Тест',
  'Москва',
  3,
  ARRAY['CRM', 'B2B', 'холодные звонки'],
  'https://hh.ru/resume/test',
  'Тестовый кандидат для проверки системы',
  'test'
) ON CONFLICT (id) DO NOTHING;

-- Тестовая сессия поиска
INSERT INTO search_sessions (
  id,
  vacancy_id,
  search_text,
  search_area,
  search_experience,
  search_params,
  total_found,
  total_scored,
  avg_score,
  min_score,
  max_score
) VALUES (
  '00000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000001',
  'менеджер по продажам',
  '1',
  'between1And3',
  '{"text": "менеджер по продажам", "area": "1"}'::jsonb,
  1,
  1,
  75.5,
  75,
  76
) ON CONFLICT (id) DO NOTHING;

-- Тестовая заявка (связь кандидат-вакансия)
INSERT INTO applications (
  id,
  search_session_id,
  candidate_id,
  vacancy_id,
  status,
  score,
  score_breakdown,
  rating
) VALUES (
  '00000000-0000-0000-0000-000000000004',
  '00000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000001',
  'new',
  75,
  '{"experience": 25, "skills": 18, "salary": 12, "education": 8, "jobSearchStatus": 10, "bonus": 2}'::jsonb,
  '4 звезды'
) ON CONFLICT (id) DO NOTHING;

-- Проверка данных
SELECT 'vacancies' as table_name, count(*) as count FROM vacancies WHERE source = 'test'
UNION ALL
SELECT 'candidates', count(*) FROM candidates WHERE source = 'test'
UNION ALL
SELECT 'search_sessions', count(*) FROM search_sessions WHERE id = '00000000-0000-0000-0000-000000000003'
UNION ALL
SELECT 'applications', count(*) FROM applications WHERE id = '00000000-0000-0000-0000-000000000004';
