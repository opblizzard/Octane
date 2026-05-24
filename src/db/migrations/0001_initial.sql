-- OCTANE v5 — Database Schema
-- STELLAR Edition | May 23, 2026
-- Ionirix LLC — Sovereign-Eyes Only

-- Operator identities
CREATE TABLE IF NOT EXISTS operators (
  id                  TEXT PRIMARY KEY,
  handle              TEXT NOT NULL UNIQUE,
  tier                TEXT NOT NULL DEFAULT 'SOVEREIGN',
  sovereignty_level   TEXT NOT NULL DEFAULT 'SOVEREIGN',
  ascension_progress  REAL NOT NULL DEFAULT 0,
  ignition_count      INTEGER NOT NULL DEFAULT 0,
  last_active         INTEGER NOT NULL,
  oath_signed         INTEGER NOT NULL DEFAULT 0,
  inner_circle        TEXT NOT NULL DEFAULT '[]',
  created_at          INTEGER NOT NULL
);

-- Operator sessions
CREATE TABLE IF NOT EXISTS sessions (
  session_id          TEXT PRIMARY KEY,
  operator_id         TEXT NOT NULL REFERENCES operators(id),
  tier                TEXT NOT NULL,
  state               TEXT NOT NULL DEFAULT 'DORMANT',
  started_at          INTEGER NOT NULL,
  last_heartbeat      INTEGER NOT NULL,
  ascension_stage     INTEGER NOT NULL DEFAULT 1,
  active_flows        TEXT NOT NULL DEFAULT '[]',
  sovereign_acts      INTEGER NOT NULL DEFAULT 0
);

-- Signals log
CREATE TABLE IF NOT EXISTS signals (
  id            TEXT PRIMARY KEY,
  timestamp     INTEGER NOT NULL,
  origin        TEXT NOT NULL,
  destination   TEXT NOT NULL,
  layer         TEXT NOT NULL,
  flow          TEXT NOT NULL,
  priority      INTEGER NOT NULL,
  payload       TEXT NOT NULL DEFAULT '{}',
  operator_id   TEXT,
  trace_id      TEXT NOT NULL,
  epoch         INTEGER NOT NULL
);

-- Civilization bridges
CREATE TABLE IF NOT EXISTS bridges (
  id            TEXT PRIMARY KEY,
  from_civ      TEXT NOT NULL,
  to_civ        TEXT NOT NULL,
  from_epoch    INTEGER NOT NULL,
  to_epoch      INTEGER NOT NULL,
  coherence     REAL NOT NULL,
  state         TEXT NOT NULL DEFAULT 'FORMING',
  opened_at     INTEGER NOT NULL,
  sealed_at     INTEGER,
  signal_count  INTEGER NOT NULL DEFAULT 0,
  operator      TEXT
);

-- Existence lattice snapshots
CREATE TABLE IF NOT EXISTS lattice_snapshots (
  snapshot_id   TEXT PRIMARY KEY,
  timestamp     INTEGER NOT NULL,
  node_count    INTEGER NOT NULL,
  total_weight  REAL NOT NULL,
  coherence     REAL NOT NULL,
  layers        TEXT NOT NULL DEFAULT '{}'
);

-- Flow executions
CREATE TABLE IF NOT EXISTS flow_executions (
  execution_id  TEXT PRIMARY KEY,
  flow          TEXT NOT NULL,
  initiated_by  TEXT NOT NULL,
  state         TEXT NOT NULL DEFAULT 'QUEUED',
  started_at    INTEGER NOT NULL,
  completed_at  INTEGER,
  steps         TEXT NOT NULL DEFAULT '[]',
  result        TEXT,
  error         TEXT
);

-- Sovereign decrees
CREATE TABLE IF NOT EXISTS decrees (
  decre_id      TEXT PRIMARY KEY,
  issued_by     TEXT NOT NULL,
  issued_at     INTEGER NOT NULL,
  title         TEXT NOT NULL,
  body          TEXT NOT NULL,
  protocol      TEXT NOT NULL DEFAULT 'SOVEREIGN',
  expires_at    INTEGER,
  enforced      INTEGER NOT NULL DEFAULT 1
);

-- Ethics log
CREATE TABLE IF NOT EXISTS ethics_log (
  check_id      TEXT PRIMARY KEY,
  action        TEXT NOT NULL,
  operator_id   TEXT NOT NULL,
  verdict       TEXT NOT NULL,
  rationale     TEXT NOT NULL,
  timestamp     INTEGER NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_signals_timestamp   ON signals(timestamp);
CREATE INDEX IF NOT EXISTS idx_signals_layer       ON signals(layer);
CREATE INDEX IF NOT EXISTS idx_signals_flow        ON signals(flow);
CREATE INDEX IF NOT EXISTS idx_bridges_state       ON bridges(state);
CREATE INDEX IF NOT EXISTS idx_flows_state         ON flow_executions(state);
CREATE INDEX IF NOT EXISTS idx_sessions_operator   ON sessions(operator_id);
CREATE INDEX IF NOT EXISTS idx_decrees_enforced    ON decrees(enforced);
