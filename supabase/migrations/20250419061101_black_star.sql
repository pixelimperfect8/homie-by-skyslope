/*
  # Fix chat table structure and relationships

  1. Changes
     - Clean up duplicate chat tables to ensure consistent schema
     - Ensure all foreign key references are correct
     - Fix any broken RLS policies

  This migration ensures we have a single source of truth for chat data
*/

-- Check if we have multiple versions of chat tables and keep only the ones in active use
BEGIN;

-- First, ensure we're using conversations/messages and not chat_history/chat_messages
DO $$
DECLARE
  conv_count INTEGER;
  chat_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO conv_count FROM conversations;
  SELECT COUNT(*) INTO chat_count FROM chat_history;
  
  -- If we have more data in conversations than in chat_history, or chat_history doesn't exist
  -- we'll standardize on conversations/messages
  IF (conv_count > chat_count) OR (NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'chat_history')) THEN
    -- Drop the less used tables if they exist
    DROP TABLE IF EXISTS chat_messages;
    DROP TABLE IF EXISTS chat_history;
  END IF;
END $$;

-- Ensure conversations table has correct structure
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'conversations') THEN
    -- Make sure conversations references profiles correctly
    IF NOT EXISTS (
      SELECT 1 
      FROM information_schema.table_constraints tc 
      JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
      WHERE tc.table_name = 'conversations' 
      AND tc.constraint_type = 'FOREIGN KEY' 
      AND ccu.table_name = 'profiles'
    ) THEN
      -- Fix the foreign key if needed
      ALTER TABLE conversations 
      DROP CONSTRAINT IF EXISTS conversations_user_id_fkey,
      ADD CONSTRAINT conversations_user_id_fkey 
      FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

-- Ensure messages table has correct structure
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'messages') THEN
    -- Make sure messages references conversations correctly
    IF NOT EXISTS (
      SELECT 1 
      FROM information_schema.table_constraints tc 
      JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
      WHERE tc.table_name = 'messages' 
      AND tc.constraint_type = 'FOREIGN KEY' 
      AND ccu.table_name = 'conversations'
    ) THEN
      -- Fix the foreign key if needed
      ALTER TABLE messages 
      DROP CONSTRAINT IF EXISTS messages_conversation_id_fkey,
      ADD CONSTRAINT messages_conversation_id_fkey 
      FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

-- Ensure correct RLS policies exist on conversations
DO $$
BEGIN
  -- Check if the policies exist and create them if they don't
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'conversations' AND policyname = 'Users can view their own conversations') THEN
    CREATE POLICY "Users can view their own conversations"
      ON conversations
      FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'conversations' AND policyname = 'Users can insert their own conversations') THEN
    CREATE POLICY "Users can insert their own conversations"
      ON conversations
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'conversations' AND policyname = 'Users can update their own conversations') THEN
    CREATE POLICY "Users can update their own conversations"
      ON conversations
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'conversations' AND policyname = 'Users can delete their own conversations') THEN
    CREATE POLICY "Users can delete their own conversations"
      ON conversations
      FOR DELETE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Ensure correct RLS policies exist on messages
DO $$
BEGIN
  -- Check if the policies exist and create them if they don't
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'messages' AND policyname = 'Users can view messages in their conversations') THEN
    CREATE POLICY "Users can view messages in their conversations"
      ON messages
      FOR SELECT
      TO authenticated
      USING (
        conversation_id IN (
          SELECT id FROM conversations WHERE user_id = auth.uid()
        )
      );
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'messages' AND policyname = 'Users can insert messages in their conversations') THEN
    CREATE POLICY "Users can insert messages in their conversations"
      ON messages
      FOR INSERT
      TO authenticated
      WITH CHECK (
        conversation_id IN (
          SELECT id FROM conversations WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;

COMMIT;