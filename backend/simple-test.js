const dotenv = require('dotenv');
dotenv.config();

console.log('🔍 Simple RAG Test Starting...\n');

// Test 1: Environment Variables
console.log('1. Environment Variables:');
console.log('   MONGODB_URI:', process.env.MONGODB_URI ? '✅ Set' : '❌ Missing');
console.log('   GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? '✅ Set' : '❌ Missing');
console.log('   SUPABASE_URL:', process.env.SUPABASE_URL ? '✅ Set' : '❌ Missing');
console.log('   SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing');
console.log('');

// Test 2: Supabase Connection
async function testSupabase() {
  console.log('2. Testing Supabase Connection...');
  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
    
    // Test basic connection
    const { data, error } = await supabase
      .from('chatbot_knowledge_vectors')
      .select('count(*)', { count: 'exact' })
      .limit(1);
    
    if (error) {
      console.log('   ❌ Supabase error:', error.message);
      if (error.message.includes('relation "chatbot_knowledge_vectors" does not exist')) {
        console.log('   💡 Vector table does not exist. Please run the SQL migration.');
      }
    } else {
      console.log('   ✅ Supabase connected successfully');
      console.log(`   📊 Vector table has ${data?.[0]?.count || 0} records`);
    }
  } catch (error) {
    console.log('   ❌ Supabase connection failed:', error.message);
  }
  console.log('');
}

// Test 3: Embedding Service
async function testEmbedding() {
  console.log('3. Testing Embedding Service...');
  try {
    const EmbeddingService = require('./services/embeddingService');
    const embeddingService = new EmbeddingService();
    
    const testText = "This is a test document about AI and machine learning.";
    const embedding = await embeddingService.generateEmbedding(testText);
    
    console.log('   ✅ Embedding generated successfully');
    console.log(`   📊 Dimension: ${embedding.length}`);
    console.log(`   🔢 Sample values: [${embedding.slice(0, 3).map(v => v.toFixed(4)).join(', ')}...]`);
  } catch (error) {
    console.log('   ❌ Embedding generation failed:', error.message);
  }
  console.log('');
}

// Test 4: MongoDB Connection
async function testMongoDB() {
  console.log('4. Testing MongoDB Connection...');
  try {
    const mongoose = require('mongoose');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('   ✅ MongoDB connected successfully');
    
    // Check for chatbots
    const Chatbot = require('./models/Chatbot');
    const chatbotCount = await Chatbot.countDocuments();
    console.log(`   📊 Found ${chatbotCount} chatbots`);
    
    // Check for knowledge
    const ChatbotKnowledge = require('./models/ChatbotKnowledge');
    const knowledgeCount = await ChatbotKnowledge.countDocuments();
    console.log(`   📚 Found ${knowledgeCount} knowledge documents`);
    
    await mongoose.disconnect();
  } catch (error) {
    console.log('   ❌ MongoDB connection failed:', error.message);
  }
  console.log('');
}

// Run all tests
async function runTests() {
  await testSupabase();
  await testEmbedding();
  await testMongoDB();
  
  console.log('🎯 Test Summary:');
  console.log('   If all tests pass, the RAG pipeline should work.');
  console.log('   If any test fails, that component needs to be fixed first.');
  console.log('');
}

runTests().catch(console.error);
