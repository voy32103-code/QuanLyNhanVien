ALTER TABLE employees DROP CONSTRAINT IF EXISTS employees_status_check;
ALTER TABLE employees
ADD CONSTRAINT employees_status_check
CHECK (status IN ('active', 'probation', 'leave', 'terminated'));

ALTER TABLE service_requests DROP CONSTRAINT IF EXISTS service_requests_status_check;
ALTER TABLE service_requests
ADD CONSTRAINT service_requests_status_check
CHECK (status IN ('open', 'triage', 'inProgress', 'waiting', 'resolved', 'closed'));

ALTER TABLE service_requests
ADD COLUMN IF NOT EXISTS assigned_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS closed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS sla_paused_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS sla_paused_seconds INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'web',
ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ NOT NULL DEFAULT now();

ALTER TABLE service_requests DROP CONSTRAINT IF EXISTS service_requests_sla_paused_seconds_check;
ALTER TABLE service_requests
ADD CONSTRAINT service_requests_sla_paused_seconds_check
CHECK (sla_paused_seconds >= 0);

UPDATE service_requests
SET resolved_at = COALESCE(resolved_at, updated_at, created_at)
WHERE status = 'resolved'
  AND resolved_at IS NULL;

CREATE TABLE IF NOT EXISTS service_request_events (
  id BIGSERIAL PRIMARY KEY,
  request_id TEXT NOT NULL REFERENCES service_requests(id) ON DELETE CASCADE,
  actor_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  before_data JSONB,
  after_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS service_request_comments (
  id BIGSERIAL PRIMARY KEY,
  request_id TEXT NOT NULL REFERENCES service_requests(id) ON DELETE CASCADE,
  actor_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  body TEXT NOT NULL,
  is_internal BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  deleted_by INTEGER REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_service_requests_assigned_user_id ON service_requests(assigned_user_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_last_activity ON service_requests(last_activity_at DESC);
CREATE INDEX IF NOT EXISTS idx_service_request_events_request_id ON service_request_events(request_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_service_request_events_actor ON service_request_events(actor_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_service_request_comments_request_id ON service_request_comments(request_id, created_at DESC)
WHERE deleted_at IS NULL;
