/*
  # Add chat_history and chat_messages tables

  1. New Tables
    - `chat_history`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `title` (text)
      - `last_message` (text, nullable)
      - `created_at` (timestamp)
    - `chat_messages`
      - `id` (uuid, primary key)
      - `chat_id` (uuid, foreign key to chat_history)
      - `content` (text)
      - `role` (text)
      - `created_at` (timestamp)
  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users
  3. Indexes
    - Add indexes for performance
*/

-- Create chat_history table
CREATE TABLE IF NOT EXISTS chat_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  title text NOT NULL,
  last_message text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on chat_history
ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;

-- Add policies for chat_history
CREATE POLICY "Users can view their own chat history"
  ON chat_history
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own chat history"
  ON chat_history
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own chat history"
  ON chat_history
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own chat history"
  ON chat_history
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS chat_history_user_id_idx ON chat_history(user_id);

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id uuid NOT NULL REFERENCES chat_history(id) ON DELETE CASCADE,
  content text NOT NULL,
  role text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on chat_messages
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Add policies for chat_messages
CREATE POLICY "Users can view messages from their chats"
  ON chat_messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chat_history
      WHERE chat_history.id = chat_messages.chat_id
      AND chat_history.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create messages in their chats"
  ON chat_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM chat_history
      WHERE chat_history.id = chat_messages.chat_id
      AND chat_history.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update messages in their chats"
  ON chat_messages
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chat_history
      WHERE chat_history.id = chat_messages.chat_id
      AND chat_history.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM chat_history
      WHERE chat_history.id = chat_messages.chat_id
      AND chat_history.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete messages from their chats"
  ON chat_messages
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chat_history
      WHERE chat_history.id = chat_messages.chat_id
      AND chat_history.user_id = auth.uid()
    )
  );

-- Create index on chat_id for faster lookups
CREATE INDEX IF NOT EXISTS chat_messages_chat_id_idx ON chat_messages(chat_id);