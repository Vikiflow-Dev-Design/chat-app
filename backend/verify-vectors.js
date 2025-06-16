const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');

dotenv.config();

console.log('🔍 Verifying Vector Database Setup...\n');

async function verifyVectorSetup() {
  try {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
    
    console.log('1. Testing vector table access...');
    
    // Test if we can query the vector table
    const { data, error, count } = await supabase
      .from('chatbot_knowledge_vectors')
      .select('*', { count: 'exact' })
      .limit(1);
    
    if (error) {
      console.log('   ❌ Vector table error:', error.message);
      if (error.message.includes('does not exist')) {
        console.log('\n💡 Setup Required:');
        console.log('   Please run the SQL migration in Supabase dashboard:');
        console.log('   1. Go to https://supabase.com/dashboard');
        console.log('   2. Navigate to SQL Editor');
        console.log('   3. Run backend/migrations/supabase_vector_setup.sql');
      }
      return false;
    }
    
    console.log('   ✅ Vector table accessible');
    console.log(`   📊 Current records: ${count || 0}`);
    
    console.log('\n2. Testing vector insert...');
    
    // Test inserting a vector
    const testVector = Array(768).fill(0).map(() => Math.random() - 0.5);
    const { data: insertData, error: insertError } = await supabase
      .from('chatbot_knowledge_vectors')
      .insert({
        chatbot_id: 'test-verify',
        knowledge_id: 'test-knowledge',
        source_type: 'text',
        chunk_text: 'This is a test chunk for verification.',
        chunk_index: 0,
        embedding: testVector,
        metadata: { test: true, timestamp: new Date().toISOString() }
      })
      .select();
    
    if (insertError) {
      console.log('   ❌ Vector insert failed:', insertError.message);
      return false;
    }
    
    console.log('   ✅ Vector insert successful');
    const testId = insertData[0]?.id;
    
    console.log('\n3. Testing vector search...');
    
    // Test the match_documents function
    const queryVector = Array(768).fill(0).map(() => Math.random() - 0.5);
    const { data: searchData, error: searchError } = await supabase
      .rpc('match_documents', {
        query_embedding: queryVector,
        chatbot_id: 'test-verify',
        match_threshold: 0.1,
        match_count: 5
      });
    
    if (searchError) {
      console.log('   ❌ Vector search failed:', searchError.message);
      if (searchError.message.includes('function match_documents')) {
        console.log('   💡 The match_documents function was not created properly');
      }
    } else {
      console.log('   ✅ Vector search successful');
      console.log(`   📊 Found ${searchData?.length || 0} results`);
    }
    
    console.log('\n4. Cleaning up test data...');
    
    // Clean up test data
    if (testId) {
      const { error: deleteError } = await supabase
        .from('chatbot_knowledge_vectors')
        .delete()
        .eq('id', testId);
      
      if (deleteError) {
        console.log('   ⚠️  Cleanup warning:', deleteError.message);
      } else {
        console.log('   ✅ Test data cleaned up');
      }
    }
    
    console.log('\n🎉 Vector database setup verified!');
    console.log('\n📋 Next Steps:');
    console.log('   1. Upload knowledge to your chatbot (files, text, Q&A)');
    console.log('   2. Test chat functionality');
    console.log('   3. Check if AI uses vector search in responses');
    
    return true;
    
  } catch (error) {
    console.error('\n❌ Verification failed:', error.message);
    return false;
  }
}

// Also test if existing knowledge has vectors
async function checkExistingVectors() {
  try {
    const mongoose = require('mongoose');
    await mongoose.connect(process.env.MONGODB_URI);
    
    const ChatbotKnowledge = require('./models/ChatbotKnowledge');
    const knowledge = await ChatbotKnowledge.findOne();
    
    if (knowledge) {
      console.log('\n5. Checking existing knowledge vectors...');
      
      const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
      const { data, error, count } = await supabase
        .from('chatbot_knowledge_vectors')
        .select('*', { count: 'exact' })
        .eq('chatbot_id', knowledge.chatbotId.toString());
      
      if (error) {
        console.log('   ❌ Error checking vectors:', error.message);
      } else {
        console.log(`   📊 Chatbot ${knowledge.chatbotId} has ${count || 0} vector chunks`);
        
        if (count === 0) {
          console.log('   💡 No vectors found for existing knowledge');
          console.log('   🔄 You may need to re-upload your knowledge to generate vectors');
        }
      }
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.log('\n⚠️  Could not check existing vectors:', error.message);
  }
}

// Run verification
async function runVerification() {
  const success = await verifyVectorSetup();
  if (success) {
    await checkExistingVectors();
  }
}

runVerification().catch(console.error);
