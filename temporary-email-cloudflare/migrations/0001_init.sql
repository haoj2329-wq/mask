PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS mailboxes (
  local_part TEXT PRIMARY KEY,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  extension_count INTEGER NOT NULL DEFAULT 0,
  message_count INTEGER NOT NULL DEFAULT 0,
  total_bytes INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  mailbox_local_part TEXT NOT NULL,
  sender TEXT NOT NULL,
  subject TEXT NOT NULL DEFAULT '',
  text_body TEXT NOT NULL DEFAULT '',
  verification_code TEXT,
  received_at INTEGER NOT NULL,
  size_bytes INTEGER NOT NULL DEFAULT 0,
  expires_at INTEGER NOT NULL,
  FOREIGN KEY (mailbox_local_part) REFERENCES mailboxes(local_part) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_messages_mailbox_received
  ON messages(mailbox_local_part, received_at DESC);

CREATE INDEX IF NOT EXISTS idx_mailboxes_expiry
  ON mailboxes(expires_at);

CREATE INDEX IF NOT EXISTS idx_messages_expiry
  ON messages(expires_at);
