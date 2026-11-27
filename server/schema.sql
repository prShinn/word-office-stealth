CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  nickname      TEXT NOT NULL,
  nickname_key  TEXT NOT NULL UNIQUE,
  recovery_hash TEXT NOT NULL,
  created_at    INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

CREATE TABLE IF NOT EXISTS attempts (
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day         TEXT NOT NULL,
  lang        TEXT NOT NULL CHECK (lang IN ('vi', 'en')),
  topic       TEXT NOT NULL,
  tiles       TEXT NOT NULL,
  answers     TEXT NOT NULL,
  solved      TEXT NOT NULL DEFAULT '[]',
  mistakes    INTEGER NOT NULL DEFAULT 0,
  started_at  INTEGER NOT NULL,
  finished_at INTEGER,
  score_ms    INTEGER,
  version     INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, day, lang)
);
CREATE INDEX IF NOT EXISTS idx_attempts_board
  ON attempts(day, lang, score_ms, finished_at) WHERE score_ms IS NOT NULL;

CREATE TABLE IF NOT EXISTS rate_limits (
  bucket       TEXT NOT NULL,
  window_start INTEGER NOT NULL,
  hits         INTEGER NOT NULL,
  PRIMARY KEY (bucket, window_start)
);

CREATE TABLE IF NOT EXISTS user_profiles (
  user_id     TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  state_json  TEXT NOT NULL DEFAULT '{}',
  engage_json TEXT NOT NULL DEFAULT '{}',
  version     INTEGER NOT NULL DEFAULT 1,
  updated_at  INTEGER NOT NULL
);
