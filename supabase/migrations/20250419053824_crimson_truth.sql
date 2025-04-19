/*
  # Create profiles table and related tables

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key)
      - `email` (text, not null)
      - `name` (text, not null)
      - `user_type` (text, nullable)
      - `created_at` (timestamptz, default now())
    - `conversations`
      - `id` (text, primary key)
      - `user_id` (uuid, foreign key to profiles.id)
      - `title` (text, not null)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())
    - `messages`
      - `id` (text, primary key)
      - `conversation_id` (text, foreign key to conversations.id)
      - `role` (text, not null)
      - `content` (text, not null)
      - `created_at` (timestamptz, default now())
    - `quick_prompts`
      - `id` (text, primary key)
      - `text` (text, not null)
      - `user_type` (text, not null)
      - `created_at` (timestamptz, default now())
  
  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to access their own data
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email text NOT NULL,
  name text NOT NULL,
  user_type text,
  created_at timestamptz DEFAULT now()
);

-- Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id text PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id text PRIMARY KEY,
  conversation_id text REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create quick_prompts table
CREATE TABLE IF NOT EXISTS quick_prompts (
  id text PRIMARY KEY,
  text text NOT NULL,
  user_type text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE quick_prompts ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view their own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Create policies for conversations
CREATE POLICY "Users can view their own conversations"
  ON conversations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own conversations"
  ON conversations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversations"
  ON conversations
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own conversations"
  ON conversations
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policies for messages
CREATE POLICY "Users can view messages in their conversations"
  ON messages
  FOR SELECT
  TO authenticated
  USING (
    conversation_id IN (
      SELECT id FROM conversations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert messages in their conversations"
  ON messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    conversation_id IN (
      SELECT id FROM conversations WHERE user_id = auth.uid()
    )
  );

-- Create policies for quick_prompts
CREATE POLICY "Anyone can view quick prompts"
  ON quick_prompts
  FOR SELECT
  TO authenticated
  USING (true);

-- Insert default quick prompts for buyers
INSERT INTO quick_prompts (id, text, user_type)
VALUES
  ('1', 'What are the steps to purchase a home?', 'buyer'),
  ('2', 'What if inspections go poorly?', 'buyer'),
  ('3', 'What if I need to get out of this deal?', 'buyer'),
  ('4', 'How much home can I afford?', 'buyer'),
  ('5', 'What are closing costs?', 'buyer');

-- Insert default quick prompts for owners
INSERT INTO quick_prompts (id, text, user_type)
VALUES
  ('6', 'Calculate my home affordability', 'owner'),
  ('7', 'Find a real estate agent', 'owner'),
  ('8', 'Show me a timeline of the typical home-buying process', 'owner'),
  ('9', 'What are the tax benefits of home ownership?', 'owner'),
  ('10', 'How do I refinance my mortgage?', 'owner');