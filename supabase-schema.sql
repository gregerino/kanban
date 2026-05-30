-- Supabase Schema for Scrum Board
-- Run this in the Supabase SQL Editor (https://supabase.com/dashboard → SQL Editor)

-- 1. Boards table — stores each board as a JSONB document
CREATE TABLE IF NOT EXISTS boards (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  board_id text NOT NULL,
  data jsonb NOT NULL DEFAULT '{}',
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, board_id)
);

-- 2. User settings table — stores active board preference + gamification state
CREATE TABLE IF NOT EXISTS user_settings (
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  active_board_id text DEFAULT '',
  gamification_data jsonb DEFAULT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- 3. Row Level Security (RLS) — users can only see/edit their own data
ALTER TABLE boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Boards policies
CREATE POLICY "Users can view own boards"
  ON boards FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own boards"
  ON boards FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own boards"
  ON boards FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own boards"
  ON boards FOR DELETE
  USING (auth.uid() = user_id);

-- User settings policies
CREATE POLICY "Users can view own settings"
  ON user_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings"
  ON user_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
  ON user_settings FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 4. Enable realtime for the boards table
ALTER PUBLICATION supabase_realtime ADD TABLE boards;

-- 5. Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_boards_user_id ON boards(user_id);
