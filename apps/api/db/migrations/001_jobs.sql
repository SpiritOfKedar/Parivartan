-- Conversion job metadata. File bytes live in B2, not Postgres.
CREATE TABLE jobs (
  id UUID PRIMARY KEY,
  tool TEXT NOT NULL CHECK (tool <> ''),
  status TEXT NOT NULL CHECK (
    status IN ('queued', 'processing', 'done', 'failed', 'client_ready')
  ),
  progress SMALLINT NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  processing TEXT NOT NULL CHECK (processing IN ('client', 'server')),
  file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes BIGINT NOT NULL CHECK (size_bytes > 0),
  storage_key TEXT,
  output_url TEXT,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX jobs_status_created_at_idx ON jobs (status, created_at DESC);
