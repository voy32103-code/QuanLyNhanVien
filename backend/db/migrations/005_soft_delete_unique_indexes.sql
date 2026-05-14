ALTER TABLE departments DROP CONSTRAINT IF EXISTS departments_name_key;
ALTER TABLE employees DROP CONSTRAINT IF EXISTS employees_email_key;
ALTER TABLE employees DROP CONSTRAINT IF EXISTS employees_phone_key;
ALTER TABLE service_categories DROP CONSTRAINT IF EXISTS service_categories_name_key;

CREATE UNIQUE INDEX IF NOT EXISTS idx_departments_name_active_unique
ON departments (name)
WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_employees_email_active_unique
ON employees (email)
WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_employees_phone_active_unique
ON employees (phone)
WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_service_categories_name_active_unique
ON service_categories (name)
WHERE deleted_at IS NULL;
