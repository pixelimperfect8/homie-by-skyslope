/*
  # Fix profiles table RLS policy

  1. Security
    - Add policy for authenticated users to insert their own profile data
*/

-- Create the insert policy for profiles
CREATE POLICY "Users can insert their own profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);