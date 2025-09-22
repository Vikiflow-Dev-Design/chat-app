const dotenv = require('dotenv');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

dotenv.config();

console.log('🧪 Testing Complete Upload Workflow...\n');

async function testUploadWorkflow() {
  try {
    const backendUrl = 'http://localhost:5000';
    
    // Step 1: Check if backend is running
    console.log('1. Checking backend server...');
    try {
      const response = await fetch(`${backendUrl}/api/health`);
      if (response.ok) {
        const health = await response.json();
        console.log('   ✅ Backend server is running');
        console.log('   📊 Health:', health);
      } else {
        console.log('   ❌ Backend health check failed');
        return;
      }
    } catch (error) {
      console.log('   ❌ Cannot connect to backend:', error.message);
      return;
    }

    // Step 2: Check Advanced RAG endpoint
    console.log('\n2. Checking Advanced RAG endpoint...');
    try {
      const response = await fetch(`${backendUrl}/api/chatbot-knowledge/advanced-upload`, {
        method: 'OPTIONS'
      });
      console.log('   ✅ Advanced RAG endpoint is accessible');
    } catch (error) {
      console.log('   ❌ Advanced RAG endpoint not accessible:', error.message);
    }

    // Step 3: Create a test file
    console.log('\n3. Creating test file...');
    const testContent = `# Test Document for Advanced RAG

## Introduction
This is a test document to verify that the Advanced RAG workflow is working correctly.

## Section 1: Basic Information
The Advanced RAG system should process this document and create intelligent chunks.

### Subsection 1.1: Features
- Document parsing with Docling
- Relationship-based chunking
- Metadata generation
- Supabase storage

## Section 2: Technical Details
The system uses several components:
1. Docling for document processing
2. RelationshipChunkingService for intelligent chunking
3. SupabaseChunkStorage for storing chunks
4. Google Gemini for embeddings

## Conclusion
This document should be processed successfully and stored in Supabase.`;

    const testFilePath = path.join(__dirname, 'test-upload.txt');
    fs.writeFileSync(testFilePath, testContent);
    console.log('   ✅ Test file created:', testFilePath);

    // Step 4: Test file upload
    console.log('\n4. Testing file upload...');
    
    const formData = new FormData();
    formData.append('file', fs.createReadStream(testFilePath));
    formData.append('chatbotId', '6789abcd1234567890123456'); // Test chatbot ID
    formData.append('title', 'Test Advanced RAG Document');
    formData.append('useAdvancedRAG', 'true');

    try {
      const uploadResponse = await fetch(`${backendUrl}/api/chatbot-knowledge/advanced-upload`, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer mock_jwt_token_for_development',
          ...formData.getHeaders()
        },
        body: formData
      });

      const uploadResult = await uploadResponse.text();
      console.log('   📤 Upload response status:', uploadResponse.status);
      console.log('   📄 Upload response:', uploadResult);

      if (uploadResponse.ok) {
        const result = JSON.parse(uploadResult);
        console.log('   ✅ Upload successful!');
        console.log('   📊 Processing details:', result.processingDetails);
        
        // Step 5: Check Supabase for chunks
        console.log('\n5. Checking Supabase for chunks...');
        await checkSupabaseChunks(result.processingDetails?.storage?.supabaseDocumentId);
        
      } else {
        console.log('   ❌ Upload failed');
        console.log('   🔍 Response details:', uploadResult);
      }

    } catch (uploadError) {
      console.log('   ❌ Upload error:', uploadError.message);
    }

    // Clean up test file
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
      console.log('\n🧹 Test file cleaned up');
    }

  } catch (error) {
    console.error('\n❌ Test workflow failed:', error.message);
  }
}

async function checkSupabaseChunks(documentId) {
  try {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
    
    // Check for chunks
    const { data: chunks, error: chunksError } = await supabase
      .from('chatbot_knowledge_chunks')
      .select('*')
      .eq('document_id', documentId || 'any')
      .order('created_at', { ascending: false })
      .limit(10);

    if (chunksError) {
      console.log('   ❌ Error querying chunks:', chunksError.message);
      return;
    }

    console.log(`   📦 Found ${chunks.length} chunks in Supabase`);
    
    if (chunks.length > 0) {
      console.log('   ✅ Chunks are being stored successfully!');
      chunks.forEach((chunk, index) => {
        console.log(`      ${index + 1}. ID: ${chunk.id}`);
        console.log(`         Content: ${chunk.content.substring(0, 100)}...`);
        console.log(`         Type: ${chunk.chunk_type}`);
        console.log(`         Length: ${chunk.content_length} chars`);
        console.log('');
      });
    } else {
      console.log('   📭 No chunks found in Supabase');
      
      // Check total chunks across all documents
      const { data: allChunks, error: allError, count } = await supabase
        .from('chatbot_knowledge_chunks')
        .select('*', { count: 'exact' })
        .limit(1);

      if (!allError) {
        console.log(`   📊 Total chunks in database: ${count || 0}`);
      }
    }

    // Check metadata
    const { data: metadata, error: metadataError } = await supabase
      .from('chunk_metadata')
      .select('*')
      .limit(5);

    if (!metadataError) {
      console.log(`   🏷️ Found ${metadata.length} metadata records`);
    }

    // Check relationships
    const { data: relationships, error: relationshipsError } = await supabase
      .from('chunk_relationships')
      .select('*')
      .limit(5);

    if (!relationshipsError) {
      console.log(`   🔗 Found ${relationships.length} relationship records`);
    }

  } catch (error) {
    console.log('   ❌ Error checking Supabase:', error.message);
  }
}

// Run the test
testUploadWorkflow().catch(console.error);
