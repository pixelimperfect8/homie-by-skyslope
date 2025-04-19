/*
  # Add insert policy for profiles table

  1. Security
    - Add policy for authenticated users to insert their own profiles
    - This fixes the "new row violates row-level security policy" error
*/

-- Create the insert policy for profiles
CREATE POLICY "Users can insert their own profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (uid() = id);