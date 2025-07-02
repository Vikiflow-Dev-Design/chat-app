const mongoose = require('mongoose');
const dotenv = require('dotenv');
const VectorProcessingService = require('./services/vectorProcessingService');
const { searchKnowledgeBase } = require('./utils/langchainService');
const Chatbot = require('./models/Chatbot');
const ChatbotKnowledge = require('./models/ChatbotKnowledge');

// Load environment variables
dotenv.config();

/**
 * Comprehensive RAG Pipeline Diagnostic Tool
 * Tests the entire Retrieval-Augmented Generation pipeline
 */
class RAGDiagnostic {
  constructor() {
    this.vectorService = new VectorProcessingService();
  }

  async runDiagnostics() {
    console.log('🔍 Starting RAG Pipeline Diagnostics...\n');

    try {
      // Connect to MongoDB
      await this.connectToMongoDB();
      
      // Test 1: Check Supabase connection and table
      await this.testSupabaseConnection();
      
      // Test 2: Check embedding service
      await this.testEmbeddingService();
      
      // Test 3: Check existing chatbots and knowledge
      await this.checkExistingData();
      
      // Test 4: Test vector search with existing data
      await this.testVectorSearch();
      
      // Test 5: Test full RAG pipeline
      await this.testFullRAGPipeline();
      
      console.log('\n✅ RAG Pipeline Diagnostics Complete!');
      
    } catch (error) {
      console.error('\n❌ Diagnostic failed:', error);
    } finally {
      await mongoose.disconnect();
    }
  }

  async connectToMongoDB() {
    console.log('1. 🔗 Testing MongoDB Connection...');
    try {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('   ✅ MongoDB connected successfully\n');
    } catch (error) {
      console.error('   ❌ MongoDB connection failed:', error.message);
      throw error;
    }
  }

  async testSupabaseConnection() {
    console.log('2. 🗄️  Testing Supabase Vector Database...');
    try {
      // Test basic connection
      const stats = await this.vectorService.vectorService.getVectorStats('test-chatbot');
      console.log('   ✅ Supabase connection successful');
      
      // Test if vector table exists by trying to query it
      const testResults = await this.vectorService.vectorService.supabase
        .from('chatbot_knowledge_vectors')
        .select('count(*)', { count: 'exact' })
        .limit(1);
      
      if (testResults.error) {
        console.error('   ❌ Vector table might not exist:', testResults.error.message);
        console.log('   💡 Please run the SQL migration in backend/migrations/supabase_vector_setup.sql');
      } else {
        console.log(`   ✅ Vector table exists with ${testResults.count || 0} total records`);
      }
      console.log('');
    } catch (error) {
      console.error('   ❌ Supabase test failed:', error.message);
      console.log('   💡 Check your SUPABASE_URL and SUPABASE_ANON_KEY environment variables\n');
    }
  }

  async testEmbeddingService() {
    console.log('3. 🧠 Testing Embedding Service...');
    try {
      const testText = "This is a test document about artificial intelligence and machine learning.";
      const embedding = await this.vectorService.embeddingService.generateEmbedding(testText);
      
      console.log(`   ✅ Embedding generated successfully`);
      console.log(`   📊 Embedding dimension: ${embedding.length}`);
      console.log(`   🔢 First 5 values: [${embedding.slice(0, 5).map(v => v.toFixed(4)).join(', ')}...]`);
      console.log('');
    } catch (error) {
      console.error('   ❌ Embedding generation failed:', error.message);
      console.log('   💡 Check your GEMINI_API_KEY environment variable\n');
    }
  }

  async checkExistingData() {
    console.log('4. 📚 Checking Existing Knowledge Data...');
    try {
      // Get all chatbots
      const chatbots = await Chatbot.find().limit(5);
      console.log(`   📋 Found ${chatbots.length} chatbots`);
      
      if (chatbots.length === 0) {
        console.log('   ⚠️  No chatbots found. Create a chatbot first.\n');
        return;
      }

      // Check knowledge for each chatbot
      for (const chatbot of chatbots) {
        const knowledge = await ChatbotKnowledge.findOne({ chatbotId: chatbot._id });
        if (knowledge) {
          const fileCount = knowledge.files?.length || 0;
          const textCount = knowledge.texts?.length || 0;
          const qaCount = knowledge.qaItems?.length || 0;
          
          console.log(`   🤖 Chatbot "${chatbot.name}" (${chatbot._id}):`);
          console.log(`      📄 Files: ${fileCount}, 📝 Texts: ${textCount}, ❓ Q&A: ${qaCount}`);
          
          // Check vector storage for this chatbot
          const vectorStats = await this.vectorService.vectorService.getVectorStats(chatbot._id.toString());
          console.log(`      🔍 Vector chunks: ${vectorStats.totalChunks || 0}`);
        } else {
          console.log(`   🤖 Chatbot "${chatbot.name}": No knowledge data`);
        }
      }
      console.log('');
    } catch (error) {
      console.error('   ❌ Error checking existing data:', error.message);
    }
  }

  async testVectorSearch() {
    console.log('5. 🔍 Testing Vector Search...');
    try {
      // Get a chatbot with knowledge
      const knowledge = await ChatbotKnowledge.findOne({
        $or: [
          { 'files.0': { $exists: true } },
          { 'texts.0': { $exists: true } },
          { 'qaItems.0': { $exists: true } }
        ]
      });

      if (!knowledge) {
        console.log('   ⚠️  No knowledge data found to test search\n');
        return;
      }

      const chatbotId = knowledge.chatbotId.toString();
      console.log(`   🎯 Testing search with chatbot: ${chatbotId}`);

      // Test different queries
      const testQueries = [
        "What is this about?",
        "artificial intelligence",
        "machine learning",
        "help me understand"
      ];

      for (const query of testQueries) {
        console.log(`   🔎 Query: "${query}"`);
        
        try {
          const results = await this.vectorService.semanticSearch(query, chatbotId, 3, 0.5);
          console.log(`      📊 Found ${results.length} vector results`);
          
          if (results.length > 0) {
            console.log(`      🎯 Best match similarity: ${results[0].similarity?.toFixed(4) || 'N/A'}`);
            console.log(`      📝 Preview: "${results[0].chunk_text?.substring(0, 100) || 'N/A'}..."`);
          }
        } catch (searchError) {
          console.error(`      ❌ Search failed: ${searchError.message}`);
        }
      }
      console.log('');
    } catch (error) {
      console.error('   ❌ Vector search test failed:', error.message);
    }
  }

  async testFullRAGPipeline() {
    console.log('6. 🚀 Testing Full RAG Pipeline...');
    try {
      // Get a chatbot with knowledge
      const knowledge = await ChatbotKnowledge.findOne({
        $or: [
          { 'files.0': { $exists: true } },
          { 'texts.0': { $exists: true } },
          { 'qaItems.0': { $exists: true } }
        ]
      });

      if (!knowledge) {
        console.log('   ⚠️  No knowledge data found to test RAG pipeline\n');
        return;
      }

      const chatbotId = knowledge.chatbotId.toString();
      console.log(`   🎯 Testing RAG with chatbot: ${chatbotId}`);

      const testQuery = "What information do you have?";
      console.log(`   🔎 Query: "${testQuery}"`);

      // Test the searchKnowledgeBase function (used in chat)
      const knowledgeResult = await searchKnowledgeBase(testQuery, chatbotId);
      
      if (knowledgeResult) {
        console.log(`   ✅ RAG pipeline returned knowledge`);
        console.log(`   📄 Knowledge length: ${knowledgeResult.length} characters`);
        console.log(`   📝 Preview: "${knowledgeResult.substring(0, 200)}..."`);
      } else {
        console.log('   ❌ RAG pipeline returned no knowledge');
        console.log('   💡 This means vector search found no relevant results');
      }
      console.log('');
    } catch (error) {
      console.error('   ❌ RAG pipeline test failed:', error.message);
    }
  }
}

// Run diagnostics if this file is executed directly
if (require.main === module) {
  const diagnostic = new RAGDiagnostic();
  diagnostic.runDiagnostics().catch(console.error);
}

module.exports = RAGDiagnostic;
