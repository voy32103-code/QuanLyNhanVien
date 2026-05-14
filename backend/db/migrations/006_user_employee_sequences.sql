ALTER TABLE users
ADD COLUMN IF NOT EXISTS employee_id TEXT REFERENCES employees(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_employee_id_unique
ON users(employee_id)
WHERE employee_id IS NOT NULL;

UPDATE users u
SET employee_id = e.id
FROM employees e
WHERE u.employee_id IS NULL
  AND e.deleted_at IS NULL
  AND LOWER(u.email) = LOWER(e.email);

CREATE SEQUENCE IF NOT EXISTS employee_text_id_seq;
CREATE SEQUENCE IF NOT EXISTS service_request_text_id_seq;

DO $$
DECLARE
  max_employee_id INTEGER;
  max_request_id INTEGER;
BEGIN
  SELECT COALESCE(MAX(NULLIF(regexp_replace(id, '[^0-9]', '', 'g'), '')::INTEGER), 0)
  INTO max_employee_id
  FROM employees;

  IF max_employee_id > 0 THEN
    PERFORM setval('employee_text_id_seq', max_employee_id, true);
  END IF;

  SELECT COALESCE(MAX(NULLIF(regexp_replace(id, '[^0-9]', '', 'g'), '')::INTEGER), 0)
  INTO max_request_id
  FROM service_requests;

  IF max_request_id > 0 THEN
    PERFORM setval('service_request_text_id_seq', max_request_id, true);
  END IF;
END $$;
