# 🔧 Quick Fix Guide: Switch to Advanced RAG

## 🚨 **Your Current Error Explained**

The error you're seeing:
```
Error inserting vector batch: {}
Error inserting vector chunks: {}
```

**Root Cause:** The legacy system is trying to insert into a Supabase table called `chatbot_knowledge_vectors` that doesn't exist.

## ✅ **Solution: Use the New Advanced RAG System**

### **Step 1: Verify Advanced RAG Route is Available**

Check that this route exists in your backend:
```
POST /api/chatbot-knowledge/advanced-upload
```

You should see this in your server logs when starting:
```
✅ Advanced RAG upload route loaded
```

### **Step 2: Update Frontend to Use Advanced RAG**

**Option A: Use the New Component (Recommended)**

Add the new component to your knowledge base page:

```tsx
// In your knowledge base component file
import { AdvancedFileUpload } from '@/components/AdvancedFileUpload';

// Replace your existing file upload with:
<AdvancedFileUpload
  chatbotId={chatbotId}
  onUploadComplete={(result) => {
    console.log('✅ Advanced RAG upload complete:', result);
    // Refresh your knowledge base list
    fetchKnowledgeBase();
  }}
  onUploadError={(error) => {
    console.error('❌ Upload failed:', error);
    // Show error to user
  }}
/>
```

**Option B: Update Existing Upload Code**

If you have existing upload code, change the endpoint:

```javascript
// OLD (causing the error):
const response = await fetch('/api/chatbot-knowledge/upload', {
  method: 'POST',
  body: formData
});

// NEW (Advanced RAG):
const response = await fetch('/api/chatbot-knowledge/advanced-upload', {
  method: 'POST',
  body: formData
});
```

### **Step 3: Test the Advanced RAG Upload**

1. **Start all services:**
```bash
# Terminal 1: Docling Service
cd python-services
python start_docling_service.py

# Terminal 2: Backend
cd backend
npm run dev

# Terminal 3: Frontend
npm run dev
```

2. **Upload a test file:**
   - Create a simple .txt file with some content
   - Upload through your frontend
   - You should see progress stages:
     - ✅ Uploading...
     - ✅ Processing with Docling...
     - ✅ Creating chunks...
     - ✅ Storing in Supabase...
     - ✅ Completed!

3. **Expected success message:**
```
✅ File processed with Advanced RAG successfully
📦 Created X chunks with Y relationships
⏱️ Completed in Zms
```

## 🔧 **Alternative: Fix Legacy System**

If you prefer to fix the legacy system instead, you need to create the missing Supabase table.

### **Create Missing Table in Supabase:**

1. **Go to your Supabase dashboard**
2. **Open SQL Editor**
3. **Run this SQL:**

```sql
-- Enable vector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create the legacy vectors table
CREATE TABLE IF NOT EXISTS chatbot_knowledge_vectors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chatbot_id TEXT NOT NULL,
    knowledge_id TEXT NOT NULL,
    source_type TEXT NOT NULL,
    chunk_text TEXT NOT NULL,
    chunk_index INTEGER,
    embedding vector(1536),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_vectors_chatbot_id ON chatbot_knowledge_vectors(chatbot_id);
CREATE INDEX IF NOT EXISTS idx_vectors_knowledge_id ON chatbot_knowledge_vectors(knowledge_id);
CREATE INDEX IF NOT EXISTS idx_vectors_embedding ON chatbot_knowledge_vectors USING ivfflat (embedding vector_cosine_ops);

-- Create the search function
CREATE OR REPLACE FUNCTION match_documents(
    query_embedding vector(1536),
    chatbot_id text,
    match_threshold float DEFAULT 0.7,
    match_count int DEFAULT 5
)
RETURNS TABLE (
    id uuid,
    chunk_text text,
    similarity float,
    metadata jsonb
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        chatbot_knowledge_vectors.id,
        chatbot_knowledge_vectors.chunk_text,
        (1 - (chatbot_knowledge_vectors.embedding <=> query_embedding)) as similarity,
        chatbot_knowledge_vectors.metadata
    FROM chatbot_knowledge_vectors
    WHERE 
        chatbot_knowledge_vectors.chatbot_id = match_documents.chatbot_id
        AND chatbot_knowledge_vectors.embedding IS NOT NULL
        AND (1 - (chatbot_knowledge_vectors.embedding <=> query_embedding)) > match_threshold
    ORDER BY chatbot_knowledge_vectors.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;
```

4. **Test the legacy upload again**

## 🎯 **Recommended Approach**

**Use the Advanced RAG system** because it:

✅ **More Reliable:** Better error handling and processing
✅ **More Intelligent:** Relationship-based chunking
✅ **Better Performance:** Metadata-driven filtering
✅ **More Features:** Real-time progress, better metadata
✅ **Future-Proof:** Built for advanced query processing

## 🧪 **Quick Test Steps**

### **Test Advanced RAG Upload:**

1. **Create test file** (test.txt):
```text
# Test Document
This is a test document for Advanced RAG processing.

## Features
- Document parsing with Docling
- Intelligent chunking
- Relationship mapping
- Metadata extraction

## Code Example
```javascript
console.log('Hello Advanced RAG!');
```
```

2. **Upload via frontend:**
   - Drag and drop the file
   - Watch progress updates
   - Verify completion

3. **Check results:**
   - Should see "Advanced RAG processing complete"
   - Check Supabase for new chunks in `chatbot_knowledge_chunks` table
   - Verify relationships in `chunk_relationships` table

## 🔍 **Troubleshooting**

### **If Advanced RAG Upload Fails:**

1. **Check Docling service:**
```bash
curl http://localhost:8001/health
```

2. **Check backend logs:**
   - Look for "Advanced RAG upload" messages
   - Check for any error details

3. **Check Supabase setup:**
   - Verify the new tables exist (from our previous setup)
   - Check environment variables

### **If Legacy Upload Still Needed:**

1. **Run the SQL above in Supabase**
2. **Restart your backend**
3. **Try upload again**

## 🎉 **Success Indicators**

You'll know it's working when:

✅ **File uploads without errors**
✅ **Progress shows all stages completing**
✅ **Success message appears**
✅ **Chunks appear in Supabase database**
✅ **Can query the uploaded content**

## 📞 **Next Steps**

1. **Switch to Advanced RAG upload** (recommended)
2. **Test with different file types** (PDF, DOCX, etc.)
3. **Test the query system** with uploaded content
4. **Monitor performance** and processing times

The Advanced RAG system will give you much better results and avoid the current error completely! 🚀
