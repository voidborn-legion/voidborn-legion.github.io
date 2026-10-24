-- Additive migration; existing access tokens remain valid until their normal expiry.
CREATE TABLE IF NOT EXISTS mcp_refresh_sessions (id TEXT PRIMARY KEY, client_id TEXT NOT NULL, resource TEXT NOT NULL, scope TEXT NOT NULL, actor TEXT NOT NULL, current_digest TEXT NOT NULL, revoked INTEGER NOT NULL DEFAULT 0, expires INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS mcp_refresh_history (id TEXT PRIMARY KEY, session_id TEXT NOT NULL, expires INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS mcp_token_sessions (id TEXT PRIMARY KEY, session_id TEXT NOT NULL, expires INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS mcp_refresh_history_session ON mcp_refresh_history(session_id);
