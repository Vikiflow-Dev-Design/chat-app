const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');

dotenv.config();

console.log('🔍 Simple Upload Test - Checking Current State...\n');

async function simpleTest() {
  try {
    // 1. Check Supabase connection
    console.log('1. Checking Supabase connection...');
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
    
    // Check current chunks
    const { data: chunks, error: chunksError, count } = await supabase
      .from('chatbot_knowledge_chunks')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(10);

    if (chunksError) {
      console.log('   ❌ Error:', chunksError.message);
      return;
    }

    console.log(`   📊 Total chunks in database: ${count || 0}`);
    
    if (chunks && chunks.length > 0) {
      console.log('   📦 Recent chunks:');
      chunks.forEach((chunk, index) => {
        console.log(`      ${index + 1}. ID: ${chunk.id}`);
        console.log(`         Chatbot: ${chunk.chatbot_id}`);
        console.log(`         Document: ${chunk.document_id}`);
        console.log(`         Content: ${chunk.content.substring(0, 80)}...`);
        console.log(`         Created: ${new Date(chunk.created_at).toLocaleString()}`);
        console.log('');
      });
    } else {
      console.log('   📭 No chunks found');
    }

    // 2. Check metadata
    const { data: metadata, error: metaError, count: metaCount } = await supabase
      .from('chunk_metadata')
      .select('*', { count: 'exact' })
      .limit(5);

    if (!metaError) {
      console.log(`   🏷️ Metadata records: ${metaCount || 0}`);
    }

    // 3. Check relationships
    const { data: relationships, error: relError, count: relCount } = await supabase
      .from('chunk_relationships')
      .select('*', { count: 'exact' })
      .limit(5);

    if (!relError) {
      console.log(`   🔗 Relationship records: ${relCount || 0}`);
    }

    // 4. Test if we can insert a simple chunk
    console.log('\n2. Testing chunk insertion...');
    const testChunk = {
      id: `simple_test_${Date.now()}`,
      chatbot_id: 'test_bot',
      document_id: 'test_doc',
      content: 'This is a simple test chunk to verify insertion works.',
      chunk_type: 'text',
      chunk_index: 1,
      content_length: 58,
      word_count: 11,
      heading_context: JSON.stringify(['Test']),
      document_section: 'test'
    };

    const { data: insertResult, error: insertError } = await supabase
      .from('chatbot_knowledge_chunks')
      .insert(testChunk)
      .select();

    if (insertError) {
      console.log('   ❌ Insert failed:', insertError.message);
    } else {
      console.log('   ✅ Insert successful:', insertResult[0].id);
      
      // Clean up
      await supabase
        .from('chatbot_knowledge_chunks')
        .delete()
        .eq('id', testChunk.id);
      console.log('   🧹 Test chunk cleaned up');
    }

    // 5. Check if backend is accessible
    console.log('\n3. Checking backend accessibility...');
    try {
      const http = require('http');
      
      const options = {
        hostname: 'localhost',
        port: 5000,
        path: '/api/health',
        method: 'GET'
      };

      const req = http.request(options, (res) => {
        console.log(`   📡 Backend status: ${res.statusCode}`);
        
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const health = JSON.parse(data);
            console.log('   ✅ Backend is running:', health);
          } catch (e) {
            console.log('   📄 Backend response:', data);
          }
        });
      });

      req.on('error', (error) => {
        console.log('   ❌ Backend connection error:', error.message);
      });

      req.end();

    } catch (error) {
      console.log('   ❌ Backend check failed:', error.message);
    }

    console.log('\n✅ Simple test complete!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
simpleTest().catch(console.error);
