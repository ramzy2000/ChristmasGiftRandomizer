-- Exchanges table
CREATE TABLE IF NOT EXISTS exchanges (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  organizer_token TEXT NOT NULL UNIQUE,
  participant_code TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  matched_at TEXT
);

-- Participants table
CREATE TABLE IF NOT EXISTS participants (
  id TEXT PRIMARY KEY,
  exchange_id TEXT NOT NULL,
  name TEXT NOT NULL,
  excluded_names TEXT, -- JSON array of excluded names
  matched_with_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (exchange_id) REFERENCES exchanges(id) ON DELETE CASCADE,
  FOREIGN KEY (matched_with_id) REFERENCES participants(id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_participants_exchange_id ON participants(exchange_id);
CREATE INDEX IF NOT EXISTS idx_exchanges_participant_code ON exchanges(participant_code);
CREATE INDEX IF NOT EXISTS idx_exchanges_organizer_token ON exchanges(organizer_token);

