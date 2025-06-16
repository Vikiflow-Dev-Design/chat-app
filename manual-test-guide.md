# Manual Test Guide for Supabase Chunks Issue

## Quick Diagnostic Steps

### 1. Check Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to **Table Editor**
4. Check these tables:
   - `chatbot_knowledge_chunks` - Should show your chunks
   - `chunk_metadata` - Should show metadata records
   - `chunk_relationships` - Should show relationships

### 2. Run SQL Query in Supabase
Go to **SQL Editor** and run:

```sql
-- Check total chunks
SELECT COUNT(*) as total_chunks FROM chatbot_knowledge_chunks;

-- Check recent activity
SELECT 
    id, 
    chatbot_id, 
    document_id, 
    chunk_type,
    content_length,
    created_at 
FROM chatbot_knowledge_chunks 
ORDER BY created_at DESC 
LIMIT 10;

-- Check RLS status
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('chatbot_knowledge_chunks', 'chunk_metadata', 'chunk_relationships');
```

### 3. Test File Upload with Browser DevTools
1. Open your frontend application
2. Press **F12** to open Developer Tools
3. Go to **Network** tab
4. Try uploading a file
5. Look for the request to `/api/chatbot-knowledge/advanced-upload`
6. Check the response:
   - **200/201**: Success - check response body for details
   - **400**: Bad request - check error message
   - **401**: Authentication issue
   - **404**: Route not found
   - **500**: Server error

### 4. Check Backend Logs
If you have access to the backend console/logs, look for:
- `🚀 Starting Advanced RAG File Upload Process`
- `✅ Stored X chunks with Y relationships`
- Any error messages

### 5. Test Direct Supabase Insert
In Supabase SQL Editor, try inserting a test chunk:

```sql
INSERT INTO chatbot_knowledge_chunks (
    id,
    chatbot_id,
    document_id,
    content,
    chunk_type,
    chunk_index,
    content_length,
    word_count,
    heading_context,
    document_section
) VALUES (
    'manual_test_' || extract(epoch from now()),
    'test_chatbot',
    'test_document',
    'This is a manual test chunk to verify Supabase insertion works.',
    'text',
    1,
    65,
    12,
    '["Manual Test"]',
    'test'
);
```

If this fails, the issue is with Supabase permissions/constraints.

### 6. Common Issues and Solutions

#### Issue: "Row violates row-level security policy"
**Solution**: RLS is still enabled. Run:
```sql
ALTER TABLE chatbot_knowledge_chunks DISABLE ROW LEVEL SECURITY;
ALTER TABLE chunk_metadata DISABLE ROW LEVEL SECURITY;
ALTER TABLE chunk_relationships DISABLE ROW LEVEL SECURITY;
```

#### Issue: Upload returns 401 Unauthorized
**Solution**: 
- Make sure you're logged in
- Check if JWT token is valid
- Verify the Authorization header

#### Issue: Upload returns 404 Chatbot not found
**Solution**:
- Verify the chatbot ID exists
- Make sure the chatbot belongs to your user account

#### Issue: Upload succeeds but no chunks appear
**Solution**:
- Check if Docling service is running on port 8001
- Verify Supabase environment variables
- Check for silent errors in chunk storage

### 7. Emergency Workaround

If Advanced RAG is not working, you can temporarily:

1. **Disable Advanced RAG** in the frontend
2. **Use legacy upload** to test basic functionality
3. **Check if regular uploads work** and create entries in MongoDB

### 8. Next Steps Based on Results

**If Supabase manual insert works:**
- Issue is in the upload workflow
- Check authentication and chatbot ownership

**If Supabase manual insert fails:**
- Issue is with Supabase configuration
- Check RLS policies and table permissions

**If upload reaches backend but fails:**
- Check backend logs for specific error
- Verify all services (Docling, Supabase) are accessible

**If upload doesn't reach backend:**
- Check frontend configuration
- Verify API URL and authentication

## Contact Points for Further Help

If you're still stuck after these tests, please share:
1. Results of the Supabase SQL queries
2. Network tab screenshot from browser DevTools
3. Any error messages from backend logs
4. Results of the manual Supabase insert test

This will help pinpoint the exact issue location.
