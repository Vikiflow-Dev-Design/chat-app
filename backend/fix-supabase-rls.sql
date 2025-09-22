-- Fix Supabase Row Level Security (RLS) for Chunk Storage
-- This script disables RLS temporarily for development or creates permissive policies

-- Option 1: Disable RLS for development (RECOMMENDED FOR DEVELOPMENT)
-- Uncomment these lines to disable RLS completely:

ALTER TABLE chatbot_knowledge_chunks DISABLE ROW LEVEL SECURITY;
ALTER TABLE chunk_metadata DISABLE ROW LEVEL SECURITY;
ALTER TABLE chunk_relationships DISABLE ROW LEVEL SECURITY;

-- Option 2: Create permissive policies (RECOMMENDED FOR PRODUCTION)
-- Uncomment these lines to create policies that allow all operations:

/*
-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow all operations on chatbot_knowledge_chunks" ON chatbot_knowledge_chunks;
DROP POLICY IF EXISTS "Allow all operations on chunk_metadata" ON chunk_metadata;
DROP POLICY IF EXISTS "Allow all operations on chunk_relationships" ON chunk_relationships;

-- Create permissive policies for all operations
CREATE POLICY "Allow all operations on chatbot_knowledge_chunks" 
ON chatbot_knowledge_chunks FOR ALL 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Allow all operations on chunk_metadata" 
ON chunk_metadata FOR ALL 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Allow all operations on chunk_relationships" 
ON chunk_relationships FOR ALL 
USING (true) 
WITH CHECK (true);
*/

-- Option 3: Create chatbot-specific policies (MOST SECURE)
-- Uncomment these lines for production with proper user authentication:

/*
-- Policies that allow operations only for specific chatbot owners
CREATE POLICY "Users can manage their chatbot chunks" 
ON chatbot_knowledge_chunks FOR ALL 
USING (
  chatbot_id IN (
    SELECT id::text FROM chatbots 
    WHERE user_id = auth.uid()
  )
) 
WITH CHECK (
  chatbot_id IN (
    SELECT id::text FROM chatbots 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can manage their chunk metadata" 
ON chunk_metadata FOR ALL 
USING (
  chunk_id IN (
    SELECT id FROM chatbot_knowledge_chunks 
    WHERE chatbot_id IN (
      SELECT id::text FROM chatbots 
      WHERE user_id = auth.uid()
    )
  )
) 
WITH CHECK (
  chunk_id IN (
    SELECT id FROM chatbot_knowledge_chunks 
    WHERE chatbot_id IN (
      SELECT id::text FROM chatbots 
      WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can manage their chunk relationships" 
ON chunk_relationships FOR ALL 
USING (
  chunk_id IN (
    SELECT id FROM chatbot_knowledge_chunks 
    WHERE chatbot_id IN (
      SELECT id::text FROM chatbots 
      WHERE user_id = auth.uid()
    )
  )
) 
WITH CHECK (
  chunk_id IN (
    SELECT id FROM chatbot_knowledge_chunks 
    WHERE chatbot_id IN (
      SELECT id::text FROM chatbots 
      WHERE user_id = auth.uid()
    )
  )
);
*/

-- Verify the changes
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('chatbot_knowledge_chunks', 'chunk_metadata', 'chunk_relationships');

-- Show current policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename IN ('chatbot_knowledge_chunks', 'chunk_metadata', 'chunk_relationships');
