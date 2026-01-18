-- Add timezone to board members
ALTER TABLE board_members ADD COLUMN timezone text;

-- Reminder jobs queue (DB-backed)
CREATE TABLE reminder_jobs (
  id text PRIMARY KEY,
  card_id text NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  board_id text NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  user_id text NOT NULL,
  reminder_type text NOT NULL,
  due_at_snapshot integer NOT NULL,
  reminder_minutes integer,
  run_at integer NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  attempts integer NOT NULL DEFAULT 0,
  max_attempts integer NOT NULL DEFAULT 5,
  last_error text,
  created_at integer NOT NULL,
  updated_at integer NOT NULL,
  UNIQUE(card_id, user_id, reminder_type, due_at_snapshot)
);

-- Idempotency table for email reminders
CREATE TABLE email_reminders_sent (
  id text PRIMARY KEY,
  card_id text NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  user_id text NOT NULL,
  reminder_type text NOT NULL,
  due_at_snapshot integer NOT NULL,
  sent_at integer NOT NULL,
  UNIQUE(card_id, user_id, reminder_type, due_at_snapshot)
);
