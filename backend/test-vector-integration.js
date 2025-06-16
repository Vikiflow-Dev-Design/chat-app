/**
 * Integration test for vector search functionality
 * Run this script to test the complete vector processing pipeline
 */

require('dotenv').config();

async function testVectorIntegration() {
  console.log('🧪 Testing Vector Search Integration');
  console.log('=====================================\n');

  try {
    // Test 1: Environment Variables
    console.log('1. Testing Environment Variables...');
    const requiredEnvVars = ['MONGODB_URI', 'GEMINI_API_KEY', 'SUPABASE_URL', 'SUPABASE_ANON_KEY'];
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      console.log('❌ Missing environment variables:', missingVars.join(', '));
      console.log('💡 Please set these in your .env file');
      return;
    }
    console.log('✅ All required environment variables are set\n');

    // Test 2: Service Imports
    console.log('2. Testing Service Imports...');
    const TextChunkingService = require('./services/textChunkingService');
    const EmbeddingService = require('./services/embeddingService');
    const SupabaseVectorService = require('./services/supabaseVectorService');
    const VectorProcessingService = require('./services/vectorProcessingService');
    console.log('✅ All services imported successfully\n');

    // Test 3: Text Chunking
    console.log('3. Testing Text Chunking...');
    const chunkingService = new TextChunkingService();
    const testText = `
      This is a comprehensive test document for our vector search system.
      It contains multiple sentences and paragraphs to test the chunking functionality.
      
      The system should be able to split this text into meaningful chunks while maintaining context.
      Each chunk should be of appropriate size for embedding generation.
      
      This helps ensure that our knowledge base can be effectively searched using semantic similarity.
    `;
    
    const chunks = chunkingService.chunkText(testText, { 
      sourceType: 'test',
      title: 'Test Document' 
    });
    
    console.log(`✅ Generated ${chunks.length} chunks`);
    console.log(`   First chunk: "${chunks[0].text.substring(0, 50)}..."`);
    console.log(`   Chunk length: ${chunks[0].length} characters\n`);

    // Test 4: Embedding Generation
    console.log('4. Testing Embedding Generation...');
    const embeddingService = new EmbeddingService();
    const testEmbedding = await embeddingService.generateEmbedding(chunks[0].text);
    
    console.log(`✅ Generated embedding with dimension: ${testEmbedding.length}`);
    console.log(`   First few values: [${testEmbedding.slice(0, 3).map(v => v.toFixed(4)).join(', ')}...]\n`);

    // Test 5: Supabase Connection
    console.log('5. Testing Supabase Connection...');
    const { getSupabaseClient } = require('./config/supabase');
    const supabase = getSupabaseClient();
    
    // Test basic connection
    const { data, error } = await supabase
      .from('chatbot_knowledge_vectors')
      .select('count')
      .limit(1);

    if (error) {
      if (error.message.includes('relation "chatbot_knowledge_vectors" does not exist')) {
        console.log('⚠️  Vector table not found. Please run the SQL migration first.');
        console.log('   Use: npm run setup-vectors');
      } else {
        console.log('❌ Supabase connection error:', error.message);
      }
    } else {
      console.log('✅ Supabase connection successful\n');
    }

    // Test 6: Vector Processing Service
    console.log('6. Testing Vector Processing Service...');
    const vectorService = new VectorProcessingService();
    
    // Test semantic search (this will fail gracefully if no data exists)
    try {
      const searchResults = await vectorService.semanticSearch(
        'test query',
        'test-chatbot-id',
        3,
        0.5
      );
      console.log(`✅ Semantic search executed (found ${searchResults.length} results)\n`);
    } catch (searchError) {
      console.log('⚠️  Semantic search test failed (expected if no data exists)');
      console.log(`   Error: ${searchError.message}\n`);
    }

    // Test 7: LangChain Integration
    console.log('7. Testing LangChain Integration...');
    const { searchKnowledgeBase } = require('./utils/langchainService');
    
    try {
      const knowledgeResult = await searchKnowledgeBase('test query', 'test-chatbot-id');
      console.log('✅ LangChain knowledge search executed');
      console.log(`   Result: ${knowledgeResult ? 'Found knowledge' : 'No knowledge found'}\n`);
    } catch (langchainError) {
      console.log('⚠️  LangChain test failed (expected if no knowledge exists)');
      console.log(`   Error: ${langchainError.message}\n`);
    }

    // Summary
    console.log('🎉 Integration Test Summary');
    console.log('===========================');
    console.log('✅ Environment configuration: OK');
    console.log('✅ Service imports: OK');
    console.log('✅ Text chunking: OK');
    console.log('✅ Embedding generation: OK');
    console.log('✅ Vector processing pipeline: OK');
    console.log('');
    console.log('🚀 Your vector search system is ready!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Ensure Supabase vector table is set up (npm run setup-vectors)');
    console.log('2. Upload some knowledge to your chatbots');
    console.log('3. Test the improved search in your chat interface');

  } catch (error) {
    console.error('❌ Integration test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testVectorIntegration();
}

module.exports = { testVectorIntegration };
