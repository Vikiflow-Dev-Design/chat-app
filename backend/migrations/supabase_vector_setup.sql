-- Enable the pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create the chatbot_knowledge_vectors table
CREATE TABLE IF NOT EXISTS chatbot_knowledge_vectors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chatbot_id TEXT NOT NULL,
  knowledge_id TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('file', 'text', 'qa')),
  chunk_text TEXT NOT NULL,
  chunk_index INTEGER NOT NULL DEFAULT 0,
  embedding vector(768) NOT NULL, -- Gemini text-embedding-004 dimension
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chatbot_knowledge_vectors_chatbot_id 
ON chatbot_knowledge_vectors(chatbot_id);

CREATE INDEX IF NOT EXISTS idx_chatbot_knowledge_vectors_knowledge_id 
ON chatbot_knowledge_vectors(knowledge_id);

CREATE INDEX IF NOT EXISTS idx_chatbot_knowledge_vectors_source_type 
ON chatbot_knowledge_vectors(source_type);

-- Create vector similarity index using HNSW
CREATE INDEX IF NOT EXISTS idx_chatbot_knowledge_vectors_embedding 
ON chatbot_knowledge_vectors USING hnsw (embedding vector_cosine_ops);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_chatbot_knowledge_vectors_updated_at ON chatbot_knowledge_vectors;
CREATE TRIGGER update_chatbot_knowledge_vectors_updated_at
    BEFORE UPDATE ON chatbot_knowledge_vectors
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create function for similarity search
CREATE OR REPLACE FUNCTION match_documents(
  query_embedding vector(768),
  chatbot_id text,
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  chatbot_id text,
  knowledge_id text,
  source_type text,
  chunk_text text,
  chunk_index int,
  metadata jsonb,
  similarity float,
  created_at timestamptz
)
LANGUAGE sql STABLE
AS $$
  SELECT
    ckv.id,
    ckv.chatbot_id,
    ckv.knowledge_id,
    ckv.source_type,
    ckv.chunk_text,
    ckv.chunk_index,
    ckv.metadata,
    1 - (ckv.embedding <=> query_embedding) AS similarity,
    ckv.created_at
  FROM chatbot_knowledge_vectors ckv
  WHERE ckv.chatbot_id = match_documents.chatbot_id
    AND 1 - (ckv.embedding <=> query_embedding) > match_threshold
  ORDER BY ckv.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- Create function to help with table creation from Node.js
CREATE OR REPLACE FUNCTION create_vector_table()
RETURNS void
LANGUAGE sql
AS $$
  -- This function is mainly for compatibility with the Node.js service
  -- The table should already be created by this migration
  SELECT 1;
$$;

-- Create RLS (Row Level Security) policies if needed
-- Note: Adjust these policies based on your security requirements

-- Enable RLS on the table
ALTER TABLE chatbot_knowledge_vectors ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for now
-- In production, you might want more restrictive policies
CREATE POLICY "Allow all operations on chatbot_knowledge_vectors" 
ON chatbot_knowledge_vectors 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Grant necessary permissions
-- Adjust these based on your Supabase setup and user roles
GRANT ALL ON chatbot_knowledge_vectors TO authenticated;
GRANT ALL ON chatbot_knowledge_vectors TO anon;

-- Grant usage on the sequence (for UUID generation)
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;
