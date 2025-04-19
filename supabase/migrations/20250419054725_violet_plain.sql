/*
  # Fix for profiles insert policy
  
  1. Security
    - Ensure admin users can insert profiles
    - Fix policy for authenticated users
*/

-- Create a policy for service role to manage profiles
CREATE POLICY "Service role can manage profiles"
  ON public.profiles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Update existing policy for users inserting their own profiles
DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
  
  CREATE POLICY "Users can insert their own profile"
    ON public.profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);
END
$$;