-- Valentine Wall Table Migration
-- Run this in your Supabase SQL editor

CREATE TABLE IF NOT EXISTS valentines (
  sender_username TEXT PRIMARY KEY,
  sender_avatar_url TEXT NOT NULL,
  sender_display_name TEXT NOT NULL,
  sender_discord_username TEXT,
  recipient_type TEXT NOT NULL CHECK (recipient_type IN ('community', 'user')),
  recipient_username TEXT,
  recipient_display_name TEXT,
  recipient_avatar_url TEXT,
  message_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_valentines_created_at ON valentines(created_at DESC);

-- RLS Policies (adjust based on your auth setup)
ALTER TABLE valentines ENABLE ROW LEVEL SECURITY;

-- Allow public read
CREATE POLICY "Allow public read access"
  ON valentines
  FOR SELECT
  USING (true);

-- Allow authenticated users to insert/update
CREATE POLICY "Allow authenticated insert/update"
  ON valentines
  FOR ALL
  USING (true)
  WITH CHECK (true);
