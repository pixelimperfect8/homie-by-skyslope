/*
  # Create profiles table

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key) - matches the user id from Supabase auth
      - `email` (text, not null)
      - `name` (text, not null)
      - `user_type` (text, nullable) - can be 'buyer' or 'owner'
      - `created_at` (timestamp with time zone, default: now())
  
  2. Security
    - Enable RLS on `profiles` table
    - Add policies for authenticated users to manage their own profile
*/

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  email text NOT NULL,
  name text NOT NULL,
  user_type text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own profile
CREATE POLICY "Users can view their own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update their own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Policy: Users can insert their own profile
CREATE POLICY "Users can insert their own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Add index on user id for faster lookups
CREATE INDEX IF NOT EXISTS profiles_id_idx ON profiles(id);