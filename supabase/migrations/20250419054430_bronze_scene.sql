/*
  # Check for existing profiles insert policy
  
  1. Security
    - Conditionally create policy for authenticated users to insert their own profile data
    - Only creates the policy if it doesn't already exist
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policy
    WHERE polname = 'Users can insert their own profile'
      AND polrelid = 'public.profiles'::regclass
  ) THEN
    CREATE POLICY "Users can insert their own profile"
      ON public.profiles
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = id);
  END IF;
END
$$;