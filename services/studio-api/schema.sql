CREATE TABLE IF NOT EXISTS oauth_states (id TEXT PRIMARY KEY, verifier TEXT NOT NULL, ui_challenge TEXT NOT NULL, expires INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS login_tickets (id TEXT PRIMARY KEY, token_cipher TEXT NOT NULL, actor TEXT NOT NULL, ui_challenge TEXT NOT NULL, expires INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS sessions (id TEXT PRIMARY KEY, token_cipher TEXT NOT NULL, actor TEXT NOT NULL, expires INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS sessions_expiry ON sessions(expires);
CREATE TABLE IF NOT EXISTS rate_limits (id TEXT PRIMARY KEY, count INTEGER NOT NULL, expires INTEGER NOT NULL);
-- Periodic cleanup of expired authentication rows must be configured before launch.
-- Guide data, comments and tasks remain in GitHub, not in these authentication tables.
