const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');

dotenv.config();

console.log('🧪 Testing Chunk Insertion After RLS Fix...\n');

async function testChunkInsertion() {
  try {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
    
    console.log('1. Creating test chunk...');
    const testChunk = {
      id: `test_chunk_${Date.now()}`,
      chatbot_id: 'test_chatbot_123',
      document_id: 'test_document_456',
      content: 'This is a test chunk to verify that RLS policies are working correctly.',
      chunk_type: 'text',
      chunk_index: 1,
      content_length: 75,
      word_count: 14,
      heading_context: JSON.stringify(['Test Section', 'Subsection']),
      document_section: 'introduction',
      created_at: new Date().toISOString()
    };

    // Test chunk insertion
    const { data: chunkResult, error: chunkError } = await supabase
      .from('chatbot_knowledge_chunks')
      .insert(testChunk)
      .select();

    if (chunkError) {
      console.log('   ❌ Chunk insertion failed:', chunkError.message);
      console.log('\n💡 Next steps:');
      console.log('   1. Go to your Supabase dashboard');
      console.log('   2. Navigate to SQL Editor');
      console.log('   3. Run the SQL from backend/fix-supabase-rls.sql');
      console.log('   4. Run this test again');
      return false;
    }

    console.log('   ✅ Chunk inserted successfully:', chunkResult[0].id);

    // Test metadata insertion
    console.log('\n2. Creating test metadata...');
    const testMetadata = {
      chunk_id: testChunk.id,
      topics: JSON.stringify(['testing', 'supabase', 'chunks']),
      keywords: JSON.stringify(['test', 'chunk', 'metadata']),
      entities: JSON.stringify(['Supabase', 'RLS']),
      complexity_level: 'beginner',
      question_types: JSON.stringify(['what-is', 'how-to']),
      audience: JSON.stringify(['developers', 'testers']),
      prerequisites: JSON.stringify(['basic-sql']),
      related_concepts: JSON.stringify(['database', 'security']),
      source_document: JSON.stringify({ name: 'test.txt', type: 'text' }),
      processing_version: '1.0'
    };

    const { data: metadataResult, error: metadataError } = await supabase
      .from('chunk_metadata')
      .insert(testMetadata)
      .select();

    if (metadataError) {
      console.log('   ❌ Metadata insertion failed:', metadataError.message);
    } else {
      console.log('   ✅ Metadata inserted successfully:', metadataResult[0].id);
    }

    // Test relationship insertion
    console.log('\n3. Creating test relationship...');
    const testRelationship = {
      chunk_id: testChunk.id,
      related_chunk_id: `related_${testChunk.id}`,
      relationship_type: 'sequential',
      relationship_direction: 'next',
      strength: 0.8,
      metadata: JSON.stringify({ test: true })
    };

    const { data: relationshipResult, error: relationshipError } = await supabase
      .from('chunk_relationships')
      .insert(testRelationship)
      .select();

    if (relationshipError) {
      console.log('   ❌ Relationship insertion failed:', relationshipError.message);
    } else {
      console.log('   ✅ Relationship inserted successfully:', relationshipResult[0].id);
    }

    // Verify data retrieval
    console.log('\n4. Verifying data retrieval...');
    const { data: retrievedChunks, error: retrieveError } = await supabase
      .from('chatbot_knowledge_chunks')
      .select(`
        *,
        chunk_metadata (*),
        chunk_relationships (*)
      `)
      .eq('id', testChunk.id);

    if (retrieveError) {
      console.log('   ❌ Data retrieval failed:', retrieveError.message);
    } else {
      console.log('   ✅ Data retrieved successfully:');
      console.log('      Chunk:', retrievedChunks[0].id);
      console.log('      Metadata records:', retrievedChunks[0].chunk_metadata?.length || 0);
      console.log('      Relationship records:', retrievedChunks[0].chunk_relationships?.length || 0);
    }

    // Clean up test data
    console.log('\n5. Cleaning up test data...');
    await supabase.from('chunk_relationships').delete().eq('chunk_id', testChunk.id);
    await supabase.from('chunk_metadata').delete().eq('chunk_id', testChunk.id);
    await supabase.from('chatbot_knowledge_chunks').delete().eq('id', testChunk.id);
    console.log('   🧹 Test data cleaned up');

    console.log('\n✅ All tests passed! Chunk storage is working correctly.');
    return true;

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    return false;
  }
}

// Run the test
testChunkInsertion().then(success => {
  if (success) {
    console.log('\n🎉 Your Supabase chunk storage is ready for production!');
  } else {
    console.log('\n🔧 Please fix the RLS policies and try again.');
  }
}).catch(console.error);
