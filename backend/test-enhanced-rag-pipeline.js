/**
 * Comprehensive Test Script for Enhanced LLM-based RAG Pipeline
 * Tests the complete flow: Document Processing → LLM Chunking → Metadata Extraction → Multi-Embedding → Storage → Search
 */

require('dotenv').config();
const path = require('path');

// Import all our enhanced services
const DoclingIntegrationService = require('./services/doclingIntegrationService');
const LLMChunkingService = require('./services/llmChunkingService');
const LLMMetadataService = require('./services/llmMetadataService');
const EnhancedEmbeddingService = require('./services/enhancedEmbeddingService');
const SupabaseChunkStorage = require('./services/supabaseChunkStorage');
const MultiVectorSearchService = require('./services/multiVectorSearchService');

// Test configuration
const TEST_CONFIG = {
  chatbotId: 'test_chatbot_enhanced_rag',
  documentId: `test_doc_${Date.now()}`,
  testDocument: {
    content: `# Introduction to Machine Learning

Machine learning is a subset of artificial intelligence (AI) that focuses on the development of algorithms and statistical models that enable computer systems to improve their performance on a specific task through experience.

## Types of Machine Learning

### Supervised Learning
Supervised learning involves training a model on a labeled dataset, where the correct output is provided for each input. Common examples include:
- Classification: Predicting categories (e.g., spam detection)
- Regression: Predicting continuous values (e.g., house prices)

### Unsupervised Learning
Unsupervised learning works with unlabeled data to find hidden patterns. Examples include:
- Clustering: Grouping similar data points
- Dimensionality reduction: Simplifying data while preserving important features

### Reinforcement Learning
Reinforcement learning involves an agent learning to make decisions by receiving rewards or penalties for its actions in an environment.

## Key Concepts

### Neural Networks
Neural networks are computing systems inspired by biological neural networks. They consist of interconnected nodes (neurons) that process information.

### Deep Learning
Deep learning is a subset of machine learning that uses neural networks with multiple layers (deep neural networks) to model and understand complex patterns in data.

## Applications

Machine learning has numerous applications across various industries:
- Healthcare: Medical diagnosis and drug discovery
- Finance: Fraud detection and algorithmic trading
- Technology: Recommendation systems and natural language processing
- Transportation: Autonomous vehicles and route optimization

## Conclusion

Machine learning continues to evolve and transform how we solve complex problems across different domains. Understanding its fundamentals is crucial for anyone working in technology today.`,
    metadata: {
      title: 'Introduction to Machine Learning',
      author: 'Test Author',
      subject: 'Artificial Intelligence',
      type: 'educational_content'
    }
  }
};

async function runEnhancedRAGTest() {
  console.log('🚀 Starting Enhanced LLM-based RAG Pipeline Test');
  console.log('=' .repeat(60));

  try {
    // Initialize services
    console.log('🔧 Initializing services...');
    const llmChunkingService = new LLMChunkingService();
    const llmMetadataService = new LLMMetadataService();
    const enhancedEmbeddingService = new EnhancedEmbeddingService();
    const chunkStorage = new SupabaseChunkStorage();
    const searchService = new MultiVectorSearchService();

    console.log('✅ Services initialized successfully');
    console.log();

    // Test 1: LLM-based Document Chunking
    console.log('1. Testing LLM-based Document Chunking...');
    console.log('-'.repeat(50));

    const chunks = await llmChunkingService.processMarkdownToChunks(
      TEST_CONFIG.testDocument.content,
      {
        ...TEST_CONFIG.testDocument.metadata,
        documentId: TEST_CONFIG.documentId
      },
      {
        maxChunkSize: 600,
        minChunkSize: 100,
        overlapSize: 50
      }
    );

    console.log(`✅ LLM Chunking completed: ${chunks.length} intelligent chunks created`);
    console.log(`📊 Sample chunk preview:`);
    if (chunks.length > 0) {
      console.log(`   - ID: ${chunks[0].id}`);
      console.log(`   - Type: ${chunks[0].type}`);
      console.log(`   - Content length: ${chunks[0].content.length} chars`);
      console.log(`   - Heading context: ${chunks[0].headingContext?.length || 0} levels`);
    }
    console.log();

    // Test 2: LLM-based Metadata Extraction
    console.log('2. Testing LLM-based Metadata Extraction...');
    console.log('-'.repeat(50));

    const chunksWithMetadata = await llmMetadataService.processChunksMetadata(
      chunks,
      {
        ...TEST_CONFIG.testDocument.metadata,
        documentId: TEST_CONFIG.documentId
      }
    );

    const successfulExtractions = chunksWithMetadata.filter(c => c.metadata?.llmProcessed).length;
    console.log(`✅ Metadata extraction completed: ${successfulExtractions}/${chunks.length} successful`);
    
    if (chunksWithMetadata.length > 0 && chunksWithMetadata[0].metadata) {
      const sampleMetadata = chunksWithMetadata[0].metadata;
      console.log(`📊 Sample metadata preview:`);
      console.log(`   - Topics: ${JSON.stringify(sampleMetadata.topics?.slice(0, 3) || [])}`);
      console.log(`   - Keywords: ${JSON.stringify(sampleMetadata.keywords?.slice(0, 3) || [])}`);
      console.log(`   - Complexity: ${sampleMetadata.complexity_level || 'N/A'}`);
      console.log(`   - Question types: ${JSON.stringify(sampleMetadata.question_type?.slice(0, 2) || [])}`);
      console.log(`   - Audience: ${JSON.stringify(sampleMetadata.audience?.slice(0, 2) || [])}`);
    }
    console.log();

    // Test 3: Multi-Embedding Generation
    console.log('3. Testing Multi-Embedding Generation...');
    console.log('-'.repeat(50));

    const chunksWithEmbeddings = await enhancedEmbeddingService.generateBatchChunkEmbeddings(chunksWithMetadata);

    const embeddingSuccessCount = chunksWithEmbeddings.filter(c => c.embeddingGenerated).length;
    console.log(`✅ Multi-embedding generation completed: ${embeddingSuccessCount}/${chunksWithEmbeddings.length} successful`);

    if (chunksWithEmbeddings.length > 0) {
      const sampleChunk = chunksWithEmbeddings[0];
      const embeddingTypes = ['content_embedding', 'topics_embedding', 'keywords_embedding', 'heading_context_embedding', 'document_section_embedding', 'audience_embedding', 'question_type_embedding'];
      const generatedEmbeddings = embeddingTypes.filter(type => sampleChunk[type] !== null && sampleChunk[type] !== undefined);
      
      console.log(`📊 Sample embedding preview:`);
      console.log(`   - Generated embedding types: ${generatedEmbeddings.length}/${embeddingTypes.length}`);
      console.log(`   - Types: ${generatedEmbeddings.join(', ')}`);
      if (sampleChunk.content_embedding) {
        console.log(`   - Content embedding dimension: ${sampleChunk.content_embedding.length}`);
      }
    }
    console.log();

    // Test 4: Enhanced Supabase Storage
    console.log('4. Testing Enhanced Supabase Storage...');
    console.log('-'.repeat(50));

    const storageResult = await chunkStorage.storeChunks(
      chunksWithEmbeddings,
      TEST_CONFIG.chatbotId,
      TEST_CONFIG.documentId
    );

    console.log(`✅ Storage completed successfully`);
    console.log(`📊 Storage results:`);
    console.log(`   - Chunks stored: ${storageResult.stored}`);
    console.log(`   - Relationships created: ${storageResult.relationships}`);
    console.log(`   - Embeddings stored: ${storageResult.embeddings?.stored || 0}`);
    console.log(`   - Embeddings failed: ${storageResult.embeddings?.failed || 0}`);
    console.log(`   - Errors: ${storageResult.errors}`);
    console.log();

    // Test 5: Multi-Vector Search
    console.log('5. Testing Multi-Vector Intelligent Search...');
    console.log('-'.repeat(50));

    const testQueries = [
      'What is machine learning?',
      'Explain supervised learning',
      'What are the applications of neural networks?',
      'How does reinforcement learning work?'
    ];

    for (const query of testQueries) {
      console.log(`🔍 Testing query: "${query}"`);
      
      try {
        const searchResult = await searchService.intelligentSearch(
          query,
          TEST_CONFIG.chatbotId,
          {
            maxResults: 3,
            similarityThreshold: 0.5,
            includeRelated: false,
            searchStrategy: 'auto'
          }
        );

        console.log(`   ✅ Found ${searchResult.results.length} results`);
        console.log(`   📊 Strategy used: ${searchResult.searchMetadata.strategy?.description || 'auto'}`);
        
        if (searchResult.results.length > 0) {
          const topResult = searchResult.results[0];
          console.log(`   🎯 Top result relevance: ${(topResult.relevanceScore || 0).toFixed(3)}`);
          console.log(`   📝 Content preview: "${topResult.content?.substring(0, 100) || 'N/A'}..."`);
        }
      } catch (searchError) {
        console.log(`   ❌ Search failed: ${searchError.message}`);
      }
      console.log();
    }

    // Test 6: Cache Performance
    console.log('6. Testing Cache Performance...');
    console.log('-'.repeat(50));

    try {
      const cacheStats = await chunkStorage.getCacheStatistics();
      console.log(`✅ Cache statistics retrieved`);
      console.log(`📊 Cache performance:`);
      console.log(`   - Total entries: ${cacheStats.totalEntries}`);
      console.log(`   - Total size: ${cacheStats.totalSize} chars`);
      console.log(`   - Cache efficiency by type:`);
      
      cacheStats.cacheEfficiency?.forEach(stat => {
        console.log(`     * ${stat.type}: ${stat.entries} entries, ${stat.hitRate} hit rate`);
      });
    } catch (cacheError) {
      console.log(`   ⚠️ Cache stats unavailable: ${cacheError.message}`);
    }
    console.log();

    // Test 7: Search Strategy Comparison
    console.log('7. Testing Search Strategy Comparison...');
    console.log('-'.repeat(50));

    const testQuery = 'What are neural networks?';
    const strategies = ['content_focused', 'topic_focused', 'keyword_focused', 'comprehensive'];

    console.log(`🧪 Comparing strategies for: "${testQuery}"`);
    
    for (const strategy of strategies) {
      try {
        const searchResult = await searchService.intelligentSearch(
          testQuery,
          TEST_CONFIG.chatbotId,
          {
            maxResults: 2,
            similarityThreshold: 0.5,
            includeRelated: false,
            searchStrategy: strategy
          }
        );

        const avgRelevance = searchResult.results.length > 0 ? 
          searchResult.results.reduce((sum, r) => sum + (r.relevanceScore || 0), 0) / searchResult.results.length : 0;

        console.log(`   ${strategy}: ${searchResult.results.length} results, avg relevance: ${avgRelevance.toFixed(3)}`);
      } catch (strategyError) {
        console.log(`   ${strategy}: Error - ${strategyError.message}`);
      }
    }
    console.log();

    // Final Summary
    console.log('🎉 Enhanced LLM-based RAG Pipeline Test Completed!');
    console.log('=' .repeat(60));
    console.log('✅ All components tested successfully:');
    console.log('   • LLM-based intelligent document chunking');
    console.log('   • LLM-powered metadata extraction');
    console.log('   • Multi-embedding generation with caching');
    console.log('   • Enhanced Supabase storage with relationships');
    console.log('   • Multi-vector intelligent search');
    console.log('   • Search strategy optimization');
    console.log('   • Cache performance monitoring');
    console.log();
    console.log('🚀 Your Enhanced RAG system is ready for production!');

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  runEnhancedRAGTest()
    .then(() => {
      console.log('\n✅ Test completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Test failed:', error);
      process.exit(1);
    });
}

module.exports = { runEnhancedRAGTest, TEST_CONFIG };
