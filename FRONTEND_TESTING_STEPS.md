# 🧪 Frontend Testing Steps - Use Advanced RAG Upload

## 🚨 **Important: Use the New Advanced RAG System**

The error you're seeing is from the **legacy vector processing system**. Instead, use the **new Advanced RAG system** which is more robust and feature-rich.

## 🔧 **Quick Fix: Switch to Advanced RAG**

### **Step 1: Update Frontend to Use Advanced RAG**

In your frontend file upload component, make sure you're using the **new Advanced RAG endpoint**:

**Instead of:** `/api/chatbot-knowledge/upload` (legacy)
**Use:** `/api/chatbot-knowledge/advanced-upload` (new)

### **Step 2: Frontend Testing with Advanced RAG**

1. **Start All Services:**
```bash
# Terminal 1: Python Docling Service
cd python-services
python start_docling_service.py

# Terminal 2: Backend
cd backend
npm run dev

# Terminal 3: Frontend
npm run dev
```

2. **Test the Advanced RAG Upload:**

**Option A: Use the New AdvancedFileUpload Component**
```tsx
// Add this to your knowledge base page
import { AdvancedFileUpload } from '@/components/AdvancedFileUpload';

<AdvancedFileUpload
  chatbotId={chatbotId}
  onUploadComplete={(result) => {
    console.log('Advanced RAG upload complete:', result);
  }}
/>
```

**Option B: Test via API directly**
```javascript
// Use the new service
import { uploadFileWithAdvancedRAG } from '@/services/advancedRAGUploadService';

const result = await uploadFileWithAdvancedRAG(
  file,
  chatbotId,
  title,
  tags,
  token
);
```

### **Step 3: Verify Advanced RAG is Working**

Upload a test file and you should see:

```
✅ Processing stages:
1. Uploading... (0-10%)
2. Processing with Docling... (10-30%)
3. Creating relationship-based chunks... (30-60%)
4. Storing in Supabase... (60-80%)
5. Generating embeddings... (80-100%)
6. Completed!

✅ Results:
- Processed with langchain_docling
- Created X chunks
- Y relationships
- Completed in Zms
```

## 🔧 **Fix for Legacy System (If Needed)**

If you still want to fix the legacy system, the issue is that the `chatbot_knowledge_vectors` table doesn't exist in Supabase.

### **Create the Missing Table:**

Run this SQL in your Supabase SQL editor:

```sql
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_vectors_chatbot_id ON chatbot_knowledge_vectors(chatbot_id);
CREATE INDEX IF NOT EXISTS idx_vectors_knowledge_id ON chatbot_knowledge_vectors(knowledge_id);
CREATE INDEX IF NOT EXISTS idx_vectors_embedding ON chatbot_knowledge_vectors USING ivfflat (embedding vector_cosine_ops);

-- Create the match_documents function
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

## 🎯 **Recommended Testing Approach**

### **Use Advanced RAG System (Recommended)**

1. **Create a test file** (test-document.txt):
```text
# API Authentication Guide

## JWT Implementation
JSON Web Tokens provide secure authentication for APIs.

### Setup Steps
1. Install dependencies: npm install jsonwebtoken
2. Create secret key
3. Generate tokens
4. Validate tokens

### Code Example
```javascript
const jwt = require('jsonwebtoken');
function generateToken(user) {
  return jwt.sign({ userId: user.id }, process.env.JWT_SECRET);
}
```

### Security Best Practices
- Use strong secrets
- Set expiration times
- Validate all requests
```

2. **Upload via Advanced RAG:**
   - Use the new `/api/chatbot-knowledge/advanced-upload` endpoint
   - Watch for real-time processing updates
   - Verify chunks are created in Supabase

3. **Expected Results:**
   - Document parsed with Docling
   - 5-10 intelligent chunks created
   - Relationships established between chunks
   - Metadata extracted (topics, keywords, etc.)
   - Stored in new Supabase tables

### **Test Different File Types:**

1. **PDF Document** - Technical manual
2. **Word Document** - Business process
3. **Text File** - Code documentation
4. **HTML File** - Web content

## 🚀 **Complete Testing Checklist**

### **✅ Pre-Testing:**
- [ ] All 3 services running (Frontend, Backend, Docling)
- [ ] Environment variables configured
- [ ] Supabase database accessible

### **✅ Advanced RAG Testing:**
- [ ] Upload text file successfully
- [ ] See real-time progress updates
- [ ] Processing completes without errors
- [ ] Chunks created in Supabase
- [ ] Relationships established
- [ ] Embeddings generated

### **✅ Query Testing:**
- [ ] Ask questions about uploaded content
- [ ] Get intelligent, contextual answers
- [ ] Follow-up questions work
- [ ] Context is maintained

### **✅ Error Handling:**
- [ ] Invalid file types rejected
- [ ] Large files handled gracefully
- [ ] Service unavailable scenarios handled

## 🎉 **Success Criteria**

Your testing is successful when:

1. **Upload Works:** Files upload and process completely
2. **Processing Completes:** All stages finish without errors
3. **Data Stored:** Chunks appear in Supabase database
4. **Queries Work:** Can ask questions about uploaded content
5. **Performance Good:** Processing takes < 30 seconds for typical files

## 🔍 **Debugging Tips**

If you encounter issues:

1. **Check Browser Console:** Look for JavaScript errors
2. **Check Network Tab:** Verify API calls are successful
3. **Check Backend Logs:** Look for processing errors
4. **Check Supabase:** Verify data is being stored
5. **Test Services:** Run `npm run test-integration`

## 📞 **Need Help?**

If you encounter any issues:

1. **Share the exact error message**
2. **Specify which step failed**
3. **Include browser console logs**
4. **Mention which file type you're testing**

The Advanced RAG system is much more robust than the legacy system and should work smoothly! 🚀
