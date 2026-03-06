-- Admin credentials only - no DROP, safe for setup-admin
CREATE TABLE IF NOT EXISTS admin_credentials (
  id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  username VARCHAR(64) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
