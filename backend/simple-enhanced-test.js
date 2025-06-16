/**
 * Simple test to verify Enhanced RAG services can be imported and initialized
 */

console.log('🚀 Starting Simple Enhanced RAG Test...');

try {
  // Load environment
  require('dotenv').config();
  console.log('✅ Environment loaded');
  
  // Check environment variables
  console.log('🔧 Checking environment variables...');
  console.log(`   - GEMINI_API_KEY: ${process.env.GEMINI_API_KEY ? 'Set' : 'Not set'}`);
  console.log(`   - SUPABASE_URL: ${process.env.SUPABASE_URL ? 'Set' : 'Not set'}`);
  console.log(`   - SUPABASE_ANON_KEY: ${process.env.SUPABASE_ANON_KEY ? 'Set' : 'Not set'}`);
  
  // Test service imports
  console.log('📦 Testing service imports...');
  
  try {
    const LLMChunkingService = require('./services/llmChunkingService');
    console.log('   ✅ LLMChunkingService imported');
    
    const LLMMetadataService = require('./services/llmMetadataService');
    console.log('   ✅ LLMMetadataService imported');
    
    const EnhancedEmbeddingService = require('./services/enhancedEmbeddingService');
    console.log('   ✅ EnhancedEmbeddingService imported');
    
    const SupabaseChunkStorage = require('./services/supabaseChunkStorage');
    console.log('   ✅ SupabaseChunkStorage imported');
    
    const MultiVectorSearchService = require('./services/multiVectorSearchService');
    console.log('   ✅ MultiVectorSearchService imported');
    
    // Test service initialization
    console.log('🔧 Testing service initialization...');
    
    const llmChunkingService = new LLMChunkingService();
    console.log('   ✅ LLMChunkingService initialized');
    
    const llmMetadataService = new LLMMetadataService();
    console.log('   ✅ LLMMetadataService initialized');
    
    const enhancedEmbeddingService = new EnhancedEmbeddingService();
    console.log('   ✅ EnhancedEmbeddingService initialized');
    
    const chunkStorage = new SupabaseChunkStorage();
    console.log('   ✅ SupabaseChunkStorage initialized');
    
    const searchService = new MultiVectorSearchService();
    console.log('   ✅ MultiVectorSearchService initialized');
    
    console.log('🎉 All services imported and initialized successfully!');
    console.log('✅ Enhanced RAG system is ready for testing');
    
  } catch (importError) {
    console.error('❌ Service import/initialization failed:', importError.message);
    console.error('Stack trace:', importError.stack);
    process.exit(1);
  }
  
} catch (error) {
  console.error('❌ Test failed:', error.message);
  console.error('Stack trace:', error.stack);
  process.exit(1);
}

console.log('\n🚀 Simple test completed successfully!');
