/*
  # Add user_preferences table and trigger

  1. New Tables
    - `user_preferences`
      - `user_id` (uuid, primary key and foreign key to users)
      - `journey` (text)
      - `stage` (text)
      - `updated_at` (timestamp)
  2. Triggers
    - Add trigger to update timestamp on changes
  3. Security
    - Enable RLS
    - Add policies for authenticated users
*/

-- Create function to update timestamp
CREATE OR REPLACE FUNCTION update_user_preferences_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create user_preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id),
  journey text NOT NULL,
  stage text NOT NULL,
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on user_preferences
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Add policies for user_preferences
CREATE POLICY "Users can view their own preferences"
  ON user_preferences
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences"
  ON user_preferences
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
  ON user_preferences
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create trigger for timestamp updates
CREATE TRIGGER update_user_preferences_timestamp
BEFORE UPDATE ON user_preferences
FOR EACH ROW
EXECUTE FUNCTION update_user_preferences_timestamp();