-- Supabase Schema for Relationship-Based Chunks
-- This schema supports storing chunks with rich metadata and relationships

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- Main chunks table with multi-embedding support
CREATE TABLE IF NOT EXISTS chatbot_knowledge_chunks (
    id TEXT PRIMARY KEY,
    chatbot_id TEXT NOT NULL,
    document_id TEXT,
    content TEXT NOT NULL, -- Original markdown format preserved
    chunk_type TEXT DEFAULT 'text',
    chunk_index INTEGER,
    content_length INTEGER,
    word_count INTEGER,
    heading_context JSONB,
    document_section TEXT,

    -- Multi-embedding vectors for different metadata types (Gemini uses 768 dimensions)
    content_embedding vector(768), -- Main content embedding
    topics_embedding vector(768), -- Topics metadata embedding
    keywords_embedding vector(768), -- Keywords metadata embedding
    heading_context_embedding vector(768), -- Heading context embedding
    document_section_embedding vector(768), -- Document section embedding
    audience_embedding vector(768), -- Audience metadata embedding
    question_type_embedding vector(768), -- Question types embedding

    -- LLM processing metadata
    llm_processed BOOLEAN DEFAULT FALSE,
    llm_processing_version TEXT DEFAULT 'v1.0',
    processing_method TEXT DEFAULT 'llm_based', -- 'llm_based' or 'rule_based'

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chunk metadata table for rich filtering
CREATE TABLE IF NOT EXISTS chunk_metadata (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chunk_id TEXT NOT NULL REFERENCES chatbot_knowledge_chunks(id) ON DELETE CASCADE,
    topics JSONB DEFAULT '[]',
    keywords JSONB DEFAULT '[]',
    entities JSONB DEFAULT '[]',
    complexity_level TEXT CHECK (complexity_level IN ('beginner', 'intermediate', 'advanced')),
    question_types JSONB DEFAULT '[]',
    audience JSONB DEFAULT '[]',
    prerequisites JSONB DEFAULT '[]',
    related_concepts JSONB DEFAULT '[]',
    source_document JSONB,
    processing_version TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chunk relationships table
CREATE TABLE IF NOT EXISTS chunk_relationships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chunk_id TEXT NOT NULL REFERENCES chatbot_knowledge_chunks(id) ON DELETE CASCADE,
    related_chunk_id TEXT NOT NULL REFERENCES chatbot_knowledge_chunks(id) ON DELETE CASCADE,
    relationship_type TEXT NOT NULL CHECK (relationship_type IN ('sequential', 'hierarchical', 'topical', 'reference')),
    relationship_direction TEXT CHECK (relationship_direction IN ('previous', 'next', 'parent', 'child', 'sibling', 'bidirectional')),
    strength DECIMAL(3,2) DEFAULT 0.5 CHECK (strength >= 0 AND strength <= 1),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Embedding cache table for performance optimization
CREATE TABLE IF NOT EXISTS embedding_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_hash TEXT NOT NULL, -- SHA-256 hash of the text content
    content_type TEXT NOT NULL, -- 'content', 'topics', 'keywords', 'heading_context', 'document_section', 'audience', 'question_type'
    original_text TEXT NOT NULL, -- The actual text that was embedded (truncated for storage)
    embedding vector(768) NOT NULL, -- The generated embedding (Gemini dimensions)
    model_version TEXT DEFAULT 'text-embedding-004', -- Gemini model used
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    access_count INTEGER DEFAULT 1,
    content_length INTEGER,
    CONSTRAINT unique_hash_type UNIQUE(content_hash, content_type)
);

-- LLM processing logs for monitoring and debugging
CREATE TABLE IF NOT EXISTS llm_processing_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chunk_id TEXT REFERENCES chatbot_knowledge_chunks(id) ON DELETE CASCADE,
    document_id TEXT,
    processing_stage TEXT NOT NULL, -- 'chunking', 'metadata_extraction', 'embedding_generation'
    llm_model TEXT DEFAULT 'gemini-1.5-pro',
    prompt_tokens INTEGER,
    completion_tokens INTEGER,
    total_tokens INTEGER,
    processing_time_ms INTEGER,
    success BOOLEAN DEFAULT TRUE,
    error_message TEXT,
    llm_response JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_chunks_chatbot_id ON chatbot_knowledge_chunks(chatbot_id);
CREATE INDEX IF NOT EXISTS idx_chunks_document_id ON chatbot_knowledge_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_chunks_chunk_type ON chatbot_knowledge_chunks(chunk_type);
CREATE INDEX IF NOT EXISTS idx_chunks_document_section ON chatbot_knowledge_chunks(document_section);
CREATE INDEX IF NOT EXISTS idx_chunks_llm_processed ON chatbot_knowledge_chunks(llm_processed);
CREATE INDEX IF NOT EXISTS idx_chunks_processing_method ON chatbot_knowledge_chunks(processing_method);

-- Multi-embedding vector indexes for similarity search
CREATE INDEX IF NOT EXISTS idx_chunks_content_embedding ON chatbot_knowledge_chunks USING ivfflat (content_embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_chunks_topics_embedding ON chatbot_knowledge_chunks USING ivfflat (topics_embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_chunks_keywords_embedding ON chatbot_knowledge_chunks USING ivfflat (keywords_embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_chunks_heading_context_embedding ON chatbot_knowledge_chunks USING ivfflat (heading_context_embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_chunks_document_section_embedding ON chatbot_knowledge_chunks USING ivfflat (document_section_embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_chunks_audience_embedding ON chatbot_knowledge_chunks USING ivfflat (audience_embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_chunks_question_type_embedding ON chatbot_knowledge_chunks USING ivfflat (question_type_embedding vector_cosine_ops);

-- Embedding cache indexes
CREATE INDEX IF NOT EXISTS idx_embedding_cache_hash ON embedding_cache(content_hash);
CREATE INDEX IF NOT EXISTS idx_embedding_cache_type ON embedding_cache(content_type);
CREATE INDEX IF NOT EXISTS idx_embedding_cache_accessed ON embedding_cache(last_accessed);
CREATE INDEX IF NOT EXISTS idx_embedding_cache_hash_type ON embedding_cache(content_hash, content_type);

-- LLM processing logs indexes
CREATE INDEX IF NOT EXISTS idx_llm_logs_chunk_id ON llm_processing_logs(chunk_id);
CREATE INDEX IF NOT EXISTS idx_llm_logs_document_id ON llm_processing_logs(document_id);
CREATE INDEX IF NOT EXISTS idx_llm_logs_stage ON llm_processing_logs(processing_stage);
CREATE INDEX IF NOT EXISTS idx_llm_logs_success ON llm_processing_logs(success);
CREATE INDEX IF NOT EXISTS idx_llm_logs_created_at ON llm_processing_logs(created_at);

-- Metadata indexes for fast filtering
CREATE INDEX IF NOT EXISTS idx_metadata_chunk_id ON chunk_metadata(chunk_id);
CREATE INDEX IF NOT EXISTS idx_metadata_topics ON chunk_metadata USING GIN (topics);
CREATE INDEX IF NOT EXISTS idx_metadata_keywords ON chunk_metadata USING GIN (keywords);
CREATE INDEX IF NOT EXISTS idx_metadata_question_types ON chunk_metadata USING GIN (question_types);
CREATE INDEX IF NOT EXISTS idx_metadata_audience ON chunk_metadata USING GIN (audience);
CREATE INDEX IF NOT EXISTS idx_metadata_complexity ON chunk_metadata(complexity_level);

-- Relationship indexes
CREATE INDEX IF NOT EXISTS idx_relationships_chunk_id ON chunk_relationships(chunk_id);
CREATE INDEX IF NOT EXISTS idx_relationships_related_chunk_id ON chunk_relationships(related_chunk_id);
CREATE INDEX IF NOT EXISTS idx_relationships_type ON chunk_relationships(relationship_type);
CREATE INDEX IF NOT EXISTS idx_relationships_strength ON chunk_relationships(strength);

-- Function for multi-embedding vector similarity search
CREATE OR REPLACE FUNCTION match_chunks_multi_embedding(
    content_embedding vector(768) DEFAULT NULL,
    topics_embedding vector(768) DEFAULT NULL,
    keywords_embedding vector(768) DEFAULT NULL,
    heading_context_embedding vector(768) DEFAULT NULL,
    document_section_embedding vector(768) DEFAULT NULL,
    audience_embedding vector(768) DEFAULT NULL,
    question_type_embedding vector(768) DEFAULT NULL,
    match_threshold float DEFAULT 0.7,
    match_count int DEFAULT 10,
    chatbot_id_filter text DEFAULT NULL,
    embedding_weights jsonb DEFAULT '{"content": 0.4, "topics": 0.2, "keywords": 0.15, "heading_context": 0.1, "document_section": 0.05, "audience": 0.05, "question_type": 0.05}'
)
RETURNS TABLE (
    id text,
    content text,
    chunk_type text,
    document_section text,
    combined_similarity float,
    content_similarity float,
    topics_similarity float,
    keywords_similarity float,
    metadata jsonb
)
LANGUAGE plpgsql
AS $$
DECLARE
    content_weight float := COALESCE((embedding_weights->>'content')::float, 0.4);
    topics_weight float := COALESCE((embedding_weights->>'topics')::float, 0.2);
    keywords_weight float := COALESCE((embedding_weights->>'keywords')::float, 0.15);
    heading_weight float := COALESCE((embedding_weights->>'heading_context')::float, 0.1);
    section_weight float := COALESCE((embedding_weights->>'document_section')::float, 0.05);
    audience_weight float := COALESCE((embedding_weights->>'audience')::float, 0.05);
    question_weight float := COALESCE((embedding_weights->>'question_type')::float, 0.05);
BEGIN
    RETURN QUERY
    SELECT
        c.id,
        c.content,
        c.chunk_type,
        c.document_section,
        -- Calculate weighted combined similarity
        (
            COALESCE(CASE WHEN content_embedding IS NOT NULL AND c.content_embedding IS NOT NULL
                     THEN content_weight * (1 - (c.content_embedding <=> content_embedding))
                     ELSE 0 END, 0) +
            COALESCE(CASE WHEN topics_embedding IS NOT NULL AND c.topics_embedding IS NOT NULL
                     THEN topics_weight * (1 - (c.topics_embedding <=> topics_embedding))
                     ELSE 0 END, 0) +
            COALESCE(CASE WHEN keywords_embedding IS NOT NULL AND c.keywords_embedding IS NOT NULL
                     THEN keywords_weight * (1 - (c.keywords_embedding <=> keywords_embedding))
                     ELSE 0 END, 0) +
            COALESCE(CASE WHEN heading_context_embedding IS NOT NULL AND c.heading_context_embedding IS NOT NULL
                     THEN heading_weight * (1 - (c.heading_context_embedding <=> heading_context_embedding))
                     ELSE 0 END, 0) +
            COALESCE(CASE WHEN document_section_embedding IS NOT NULL AND c.document_section_embedding IS NOT NULL
                     THEN section_weight * (1 - (c.document_section_embedding <=> document_section_embedding))
                     ELSE 0 END, 0) +
            COALESCE(CASE WHEN audience_embedding IS NOT NULL AND c.audience_embedding IS NOT NULL
                     THEN audience_weight * (1 - (c.audience_embedding <=> audience_embedding))
                     ELSE 0 END, 0) +
            COALESCE(CASE WHEN question_type_embedding IS NOT NULL AND c.question_type_embedding IS NOT NULL
                     THEN question_weight * (1 - (c.question_type_embedding <=> question_type_embedding))
                     ELSE 0 END, 0)
        ) as combined_similarity,
        -- Individual similarities for debugging
        COALESCE(CASE WHEN content_embedding IS NOT NULL AND c.content_embedding IS NOT NULL
                 THEN (1 - (c.content_embedding <=> content_embedding))
                 ELSE NULL END) as content_similarity,
        COALESCE(CASE WHEN topics_embedding IS NOT NULL AND c.topics_embedding IS NOT NULL
                 THEN (1 - (c.topics_embedding <=> topics_embedding))
                 ELSE NULL END) as topics_similarity,
        COALESCE(CASE WHEN keywords_embedding IS NOT NULL AND c.keywords_embedding IS NOT NULL
                 THEN (1 - (c.keywords_embedding <=> keywords_embedding))
                 ELSE NULL END) as keywords_similarity,
        jsonb_build_object(
            'topics', m.topics,
            'keywords', m.keywords,
            'complexity_level', m.complexity_level,
            'question_types', m.question_types,
            'audience', m.audience,
            'llm_processed', c.llm_processed,
            'processing_method', c.processing_method
        ) as metadata
    FROM chatbot_knowledge_chunks c
    LEFT JOIN chunk_metadata m ON c.id = m.chunk_id
    WHERE
        (chatbot_id_filter IS NULL OR c.chatbot_id = chatbot_id_filter)
        AND (
            -- At least one embedding must match the threshold
            (content_embedding IS NOT NULL AND c.content_embedding IS NOT NULL AND (1 - (c.content_embedding <=> content_embedding)) > match_threshold) OR
            (topics_embedding IS NOT NULL AND c.topics_embedding IS NOT NULL AND (1 - (c.topics_embedding <=> topics_embedding)) > match_threshold) OR
            (keywords_embedding IS NOT NULL AND c.keywords_embedding IS NOT NULL AND (1 - (c.keywords_embedding <=> keywords_embedding)) > match_threshold) OR
            (heading_context_embedding IS NOT NULL AND c.heading_context_embedding IS NOT NULL AND (1 - (c.heading_context_embedding <=> heading_context_embedding)) > match_threshold) OR
            (document_section_embedding IS NOT NULL AND c.document_section_embedding IS NOT NULL AND (1 - (c.document_section_embedding <=> document_section_embedding)) > match_threshold) OR
            (audience_embedding IS NOT NULL AND c.audience_embedding IS NOT NULL AND (1 - (c.audience_embedding <=> audience_embedding)) > match_threshold) OR
            (question_type_embedding IS NOT NULL AND c.question_type_embedding IS NOT NULL AND (1 - (c.question_type_embedding <=> question_type_embedding)) > match_threshold)
        )
    ORDER BY combined_similarity DESC
    LIMIT match_count;
END;
$$;

-- Function for metadata-based chunk filtering
CREATE OR REPLACE FUNCTION filter_chunks_by_metadata(
    chatbot_id_param text,
    topics_filter text[] DEFAULT NULL,
    question_types_filter text[] DEFAULT NULL,
    audience_filter text[] DEFAULT NULL,
    complexity_filter text DEFAULT NULL,
    keywords_filter text[] DEFAULT NULL,
    limit_count int DEFAULT 20
)
RETURNS TABLE (
    id text,
    content text,
    chunk_type text,
    document_section text,
    topics jsonb,
    keywords jsonb,
    complexity_level text,
    question_types jsonb,
    audience jsonb
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.content,
        c.chunk_type,
        c.document_section,
        m.topics,
        m.keywords,
        m.complexity_level,
        m.question_types,
        m.audience
    FROM chatbot_knowledge_chunks c
    LEFT JOIN chunk_metadata m ON c.id = m.chunk_id
    WHERE 
        c.chatbot_id = chatbot_id_param
        AND (
            topics_filter IS NULL 
            OR m.topics ?| topics_filter
        )
        AND (
            question_types_filter IS NULL 
            OR m.question_types ?| question_types_filter
        )
        AND (
            audience_filter IS NULL 
            OR m.audience ?| audience_filter
        )
        AND (
            complexity_filter IS NULL 
            OR m.complexity_level = complexity_filter
        )
        AND (
            keywords_filter IS NULL 
            OR m.keywords ?| keywords_filter
        )
    ORDER BY c.chunk_index
    LIMIT limit_count;
END;
$$;

-- Function to get related chunks with relationship info
CREATE OR REPLACE FUNCTION get_related_chunks(
    source_chunk_id text,
    relationship_types text[] DEFAULT ARRAY['sequential', 'hierarchical', 'topical'],
    min_strength float DEFAULT 0.3,
    limit_count int DEFAULT 10
)
RETURNS TABLE (
    chunk_id text,
    content text,
    document_section text,
    relationship_type text,
    relationship_direction text,
    strength decimal,
    topics jsonb,
    question_types jsonb
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id as chunk_id,
        c.content,
        c.document_section,
        r.relationship_type,
        r.relationship_direction,
        r.strength,
        m.topics,
        m.question_types
    FROM chunk_relationships r
    JOIN chatbot_knowledge_chunks c ON r.related_chunk_id = c.id
    LEFT JOIN chunk_metadata m ON c.id = m.chunk_id
    WHERE 
        r.chunk_id = source_chunk_id
        AND r.relationship_type = ANY(relationship_types)
        AND r.strength >= min_strength
    ORDER BY r.strength DESC, r.relationship_type
    LIMIT limit_count;
END;
$$;

-- Function for hybrid search (metadata + vector)
CREATE OR REPLACE FUNCTION hybrid_search(
    query_embedding vector(1536),
    chatbot_id_param text,
    topics_filter text[] DEFAULT NULL,
    question_types_filter text[] DEFAULT NULL,
    audience_filter text[] DEFAULT NULL,
    similarity_threshold float DEFAULT 0.7,
    limit_count int DEFAULT 10
)
RETURNS TABLE (
    id text,
    content text,
    document_section text,
    similarity float,
    topics jsonb,
    keywords jsonb,
    question_types jsonb,
    audience jsonb,
    complexity_level text
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.content,
        c.document_section,
        (1 - (c.embedding <=> query_embedding)) as similarity,
        m.topics,
        m.keywords,
        m.question_types,
        m.audience,
        m.complexity_level
    FROM chatbot_knowledge_chunks c
    LEFT JOIN chunk_metadata m ON c.id = m.chunk_id
    WHERE 
        c.chatbot_id = chatbot_id_param
        AND c.embedding IS NOT NULL
        AND (1 - (c.embedding <=> query_embedding)) > similarity_threshold
        AND (
            topics_filter IS NULL 
            OR m.topics ?| topics_filter
        )
        AND (
            question_types_filter IS NULL 
            OR m.question_types ?| question_types_filter
        )
        AND (
            audience_filter IS NULL 
            OR m.audience ?| audience_filter
        )
    ORDER BY c.embedding <=> query_embedding
    LIMIT limit_count;
END;
$$;

-- Row Level Security (RLS) policies
ALTER TABLE chatbot_knowledge_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE chunk_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE chunk_relationships ENABLE ROW LEVEL SECURITY;

-- Example RLS policies (adjust based on your auth system)
-- CREATE POLICY "Users can access their own chatbot chunks" ON chatbot_knowledge_chunks
--     FOR ALL USING (chatbot_id IN (
--         SELECT id FROM chatbots WHERE user_id = auth.uid()
--     ));

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_chunks_updated_at 
    BEFORE UPDATE ON chatbot_knowledge_chunks 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function for embedding cache management
CREATE OR REPLACE FUNCTION get_cached_embedding(
    text_content text,
    content_type_param text
)
RETURNS vector(768)
LANGUAGE plpgsql
AS $$
DECLARE
    content_hash_param text;
    cached_embedding vector(768);
BEGIN
    -- Generate hash for the content
    content_hash_param := encode(digest(lower(trim(text_content)), 'sha256'), 'hex');

    -- Try to get cached embedding
    SELECT embedding INTO cached_embedding
    FROM embedding_cache
    WHERE content_hash = content_hash_param
    AND content_type = content_type_param;

    -- Update access statistics if found
    IF cached_embedding IS NOT NULL THEN
        UPDATE embedding_cache
        SET last_accessed = NOW(),
            access_count = access_count + 1
        WHERE content_hash = content_hash_param
        AND content_type = content_type_param;
    END IF;

    RETURN cached_embedding;
END;
$$;

-- Function to store embedding in cache
CREATE OR REPLACE FUNCTION store_embedding_cache(
    text_content text,
    content_type_param text,
    embedding_param vector(768),
    model_version_param text DEFAULT 'text-embedding-004'
)
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
    content_hash_param text;
BEGIN
    -- Generate hash for the content
    content_hash_param := encode(digest(lower(trim(text_content)), 'sha256'), 'hex');

    -- Store in cache (upsert)
    INSERT INTO embedding_cache (
        content_hash,
        content_type,
        original_text,
        embedding,
        model_version,
        content_length
    ) VALUES (
        content_hash_param,
        content_type_param,
        left(text_content, 5000), -- Truncate for storage
        embedding_param,
        model_version_param,
        length(text_content)
    )
    ON CONFLICT (content_hash, content_type)
    DO UPDATE SET
        last_accessed = NOW(),
        access_count = embedding_cache.access_count + 1,
        embedding = embedding_param,
        model_version = model_version_param;

    RETURN true;
END;
$$;

-- Function to cleanup old cache entries
CREATE OR REPLACE FUNCTION cleanup_embedding_cache(
    days_old integer DEFAULT 30,
    min_access_count integer DEFAULT 2
)
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
    deleted_count integer;
BEGIN
    DELETE FROM embedding_cache
    WHERE last_accessed < (NOW() - INTERVAL '1 day' * days_old)
    AND access_count < min_access_count;

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$;

-- Comments for documentation
COMMENT ON TABLE chatbot_knowledge_chunks IS 'Main table storing document chunks with multi-embedding support';
COMMENT ON TABLE chunk_metadata IS 'Rich metadata for intelligent chunk filtering and retrieval';
COMMENT ON TABLE chunk_relationships IS 'Relationships between chunks for context-aware retrieval';
COMMENT ON TABLE embedding_cache IS 'Cache for embeddings to avoid regeneration and reduce API costs';
COMMENT ON TABLE llm_processing_logs IS 'Logs for LLM processing monitoring and debugging';

COMMENT ON FUNCTION match_chunks_multi_embedding IS 'Multi-embedding vector similarity search with weighted scoring';
COMMENT ON FUNCTION filter_chunks_by_metadata IS 'Fast metadata-based chunk filtering';
COMMENT ON FUNCTION get_related_chunks IS 'Retrieve related chunks based on relationships';
COMMENT ON FUNCTION hybrid_search IS 'Combined metadata filtering and vector similarity search';
COMMENT ON FUNCTION get_cached_embedding IS 'Retrieve cached embedding to avoid regeneration';
COMMENT ON FUNCTION store_embedding_cache IS 'Store embedding in cache for future use';
COMMENT ON FUNCTION cleanup_embedding_cache IS 'Remove old, unused cache entries';
