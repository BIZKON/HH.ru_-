-- Add external_id column for linking to HH.ru vacancy IDs
ALTER TABLE vacancies 
ADD COLUMN IF NOT EXISTS external_id TEXT;

-- Create unique index for external_id (allow nulls but unique non-null values)
CREATE UNIQUE INDEX IF NOT EXISTS idx_vacancies_external_id 
ON vacancies(external_id) 
WHERE external_id IS NOT NULL;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_vacancies_external_id_search 
ON vacancies(external_id);

-- Comment for documentation
COMMENT ON COLUMN vacancies.external_id IS 'External vacancy ID from HH.ru (e.g., 128368179)';
