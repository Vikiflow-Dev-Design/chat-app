# Vector Search Implementation

This document describes the hybrid database architecture implementation that adds vector search capabilities to the Chat Agency Spark platform.

## Overview

The system now uses a **hybrid approach**:
- **MongoDB**: Continues to store all existing data (users, chatbots, knowledge metadata)
- **Supabase**: Added for vector search capabilities on chatbot knowledge content
- **Google Gemini**: Used for generating embeddings and text processing

## Architecture

```
Knowledge Upload → MongoDB Save → Success Response → 
Background Process: Text Chunking → Embedding Generation → 
Supabase Vector Storage → Sync Confirmation
```

## Components

### 1. Text Chunking Service (`services/textChunkingService.js`)
- Intelligently splits text into optimal chunks for vector storage
- Handles different content types (files, text, Q&A)
- Maintains context overlap between chunks
- Configurable chunk sizes and overlap

### 2. Embedding Service (`services/embeddingService.js`)
- Uses Google Gemini's `text-embedding-004` model
- Generates 768-dimensional embeddings
- Supports batch processing for efficiency
- Includes error handling and retry logic

### 3. Supabase Vector Service (`services/supabaseVectorService.js`)
- Manages vector storage and retrieval in Supabase
- Implements similarity search using pgvector
- Handles CRUD operations for vector data
- Provides statistics and cleanup functions

### 4. Vector Processing Service (`services/vectorProcessingService.js`)
- Orchestrates the complete pipeline
- Processes different content types
- Manages updates and deletions
- Provides semantic search capabilities

## Database Schema

### Supabase Table: `chatbot_knowledge_vectors`

```sql
CREATE TABLE chatbot_knowledge_vectors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chatbot_id TEXT NOT NULL,
  knowledge_id TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('file', 'text', 'qa')),
  chunk_text TEXT NOT NULL,
  chunk_index INTEGER NOT NULL DEFAULT 0,
  embedding vector(768) NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Setup Instructions

### 1. Environment Variables

Add to your `.env` file:
```env
# Supabase Configuration
SUPABASE_URL=your_supabase_project_url_here
SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Google Gemini API (if not already set)
GEMINI_API_KEY=your_gemini_api_key_here
```

### 2. Install Dependencies

```bash
cd backend
npm install
```

### 3. Supabase Setup

1. Create a new Supabase project or use existing one
2. Run the setup script:
   ```bash
   npm run setup-vectors
   ```
3. Follow the instructions to run the SQL migration in Supabase SQL editor

### 4. Database Migration

Copy and run the SQL from `backend/migrations/supabase_vector_setup.sql` in your Supabase SQL editor.

## Usage

### Automatic Processing

The system automatically processes knowledge when:
- Files are uploaded
- Text entries are added
- Q&A pairs are created

### Manual Processing

You can also process existing knowledge:

```javascript
const VectorProcessingService = require('./services/vectorProcessingService');
const vectorService = new VectorProcessingService();

// Process a file
await vectorService.processFileContent(fileData, chatbotId);

// Process text
await vectorService.processTextContent(textData, chatbotId);

// Process Q&A
await vectorService.processQAContent(qaData, chatbotId);
```

### Semantic Search

```javascript
// Perform semantic search
const results = await vectorService.semanticSearch(
  'user query',
  chatbotId,
  5,    // limit
  0.7   // similarity threshold
);
```

## Integration Points

### 1. Knowledge Upload Routes
- `POST /api/chatbot-knowledge/file`
- `POST /api/chatbot-knowledge/text`
- `POST /api/chatbot-knowledge/qa`

All routes now trigger vector processing after successful MongoDB storage.

### 2. Chat System
The `searchKnowledgeBase` function in `utils/langchainService.js` now:
1. First attempts vector similarity search
2. Falls back to traditional MongoDB text search if needed
3. Provides better, more relevant results

### 3. Cleanup
Delete operations automatically clean up associated vectors:
- `DELETE /api/chatbot-knowledge/file/:chatbotId/:fileId`
- `DELETE /api/chatbot-knowledge/text/:chatbotId/:textId`
- `DELETE /api/chatbot-knowledge/qa/:chatbotId/:qaId`

## Benefits

### 1. Semantic Search
- Better understanding of user intent
- Finds relevant content even with different wording
- Improved context matching

### 2. Scalability
- Supabase handles vector operations efficiently
- Optimized for similarity search
- Better performance with large knowledge bases

### 3. Flexibility
- Maintains existing MongoDB structure
- Gradual migration possible
- Fallback to traditional search

### 4. Enhanced Chat Responses
- More relevant knowledge retrieval
- Better context for AI responses
- Improved user experience

## Monitoring

### Vector Statistics
```javascript
const stats = await vectorService.getProcessingStats(chatbotId);
console.log(stats);
// {
//   totalChunks: 150,
//   sourceTypes: { file: 80, text: 50, qa: 20 },
//   uniqueKnowledgeSources: 15
// }
```

### Error Handling
- Vector processing failures don't affect main knowledge storage
- Comprehensive logging for debugging
- Graceful fallback to traditional search

## Troubleshooting

### Common Issues

1. **Missing Environment Variables**
   - Ensure SUPABASE_URL and SUPABASE_ANON_KEY are set
   - Verify GEMINI_API_KEY is configured

2. **Vector Table Not Found**
   - Run the SQL migration in Supabase
   - Check table permissions

3. **Embedding Generation Fails**
   - Verify Gemini API key
   - Check API quotas and limits

4. **Search Returns No Results**
   - Check if vectors were processed
   - Verify similarity threshold (try lowering it)
   - Ensure knowledge exists for the chatbot

### Logs
Monitor the console for vector processing logs:
- `Starting vector processing for...`
- `Vector processing completed...`
- `Found X relevant knowledge chunks via vector search`

## Future Enhancements

- [ ] Batch processing for existing knowledge
- [ ] Advanced chunking strategies
- [ ] Multiple embedding models support
- [ ] Vector search analytics dashboard
- [ ] Performance optimization tools
