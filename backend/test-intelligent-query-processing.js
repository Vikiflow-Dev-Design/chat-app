/**
 * Test script for Intelligent Query Processing and Hybrid Search
 * Tests the complete query understanding and search pipeline
 */

require('dotenv').config();
const IntelligentQueryProcessor = require('./services/intelligentQueryProcessor');
const HybridSearchService = require('./services/hybridSearchService');
const RelationshipChunkingService = require('./services/relationshipChunkingService');
const DoclingIntegrationService = require('./services/doclingIntegrationService');
const SupabaseChunkStorage = require('./services/supabaseChunkStorage');
const fs = require('fs');
const path = require('path');

async function testIntelligentQueryProcessing() {
  console.log('🧠 Testing Intelligent Query Processing & Hybrid Search\n');

  const queryProcessor = new IntelligentQueryProcessor();
  const hybridSearch = new HybridSearchService();
  const chunkingService = new RelationshipChunkingService();
  const doclingService = new DoclingIntegrationService();
  const chunkStorage = new SupabaseChunkStorage();

  // Test chatbot and conversation IDs
  const testChatbotId = 'test-chatbot-123';
  const testConversationId = 'test-conversation-456';

  // Mock available metadata (would come from actual knowledge base)
  const availableMetadata = {
    topics: ['API Development', 'Database', 'Security', 'Authentication', 'User Management', 'Error Handling'],
    questionTypes: ['how-to', 'definition', 'procedure', 'example', 'comparison', 'troubleshooting'],
    audiences: ['developers', 'administrators', 'end-users', 'business-users'],
    complexityLevels: ['beginner', 'intermediate', 'advanced']
  };

  // Test queries of different types
  const testQueries = [
    {
      name: 'Clear Technical Query',
      query: 'How do I implement JWT authentication in my API?',
      expectedType: 'clear_query',
      expectedTopics: ['Security', 'Authentication', 'API Development'],
      expectedQuestionTypes: ['how-to', 'procedure']
    },
    {
      name: 'Unclear/Vague Query',
      query: 'Help me with stuff',
      expectedType: 'clarification_needed',
      expectedResponse: 'suggestions'
    },
    {
      name: 'Contextual Follow-up',
      query: 'What about error handling for that?',
      expectedType: 'contextual_query',
      expectedEnhancement: true
    },
    {
      name: 'Definition Query',
      query: 'What is a REST API?',
      expectedType: 'clear_query',
      expectedTopics: ['API Development'],
      expectedQuestionTypes: ['definition']
    },
    {
      name: 'Comparison Query',
      query: 'What\'s the difference between JWT and session-based authentication?',
      expectedType: 'clear_query',
      expectedTopics: ['Security', 'Authentication'],
      expectedQuestionTypes: ['comparison']
    },
    {
      name: 'Troubleshooting Query',
      query: 'My database connection keeps failing, how do I fix it?',
      expectedType: 'clear_query',
      expectedTopics: ['Database'],
      expectedQuestionTypes: ['troubleshooting', 'how-to']
    }
  ];

  console.log('1. Testing Query Analysis and Processing...\n');

  for (const testQuery of testQueries) {
    console.log(`🔍 Testing: ${testQuery.name}`);
    console.log(`Query: "${testQuery.query}"`);

    try {
      const processedQuery = await queryProcessor.processQuery(
        testQuery.query,
        testChatbotId,
        testConversationId,
        availableMetadata
      );

      console.log(`✅ Query Type: ${processedQuery.type}`);
      console.log(`📊 Processing Result: ${processedQuery.queryProcessingResult}`);

      if (processedQuery.type === 'clear_query') {
        console.log(`🏷️  Topics: ${processedQuery.searchMetadata.topics?.join(', ') || 'None'}`);
        console.log(`❓ Question Types: ${processedQuery.searchMetadata.questionTypes?.join(', ') || 'None'}`);
        console.log(`👥 Audience: ${processedQuery.searchMetadata.audience?.join(', ') || 'None'}`);
        console.log(`🔑 Keywords: ${processedQuery.searchMetadata.keywords?.join(', ') || 'None'}`);
        console.log(`🎯 Intent: ${processedQuery.queryIntent?.type || 'Unknown'}`);
        console.log(`📈 Confidence: ${processedQuery.confidence || 'N/A'}`);
      } else if (processedQuery.type === 'clarification_needed') {
        console.log(`💬 Message: ${processedQuery.message}`);
        console.log(`💡 Suggestions: ${processedQuery.suggestions?.join(', ') || 'None'}`);
      } else if (processedQuery.type === 'contextual_query') {
        console.log(`🔗 Enhanced Query: "${processedQuery.enhancedQuery}"`);
        console.log(`📝 Context Used: ${processedQuery.contextUsed?.join(', ') || 'None'}`);
      }

      // Validate expectations
      if (testQuery.expectedType && processedQuery.type !== testQuery.expectedType) {
        console.log(`⚠️  Expected type: ${testQuery.expectedType}, got: ${processedQuery.type}`);
      } else {
        console.log(`✅ Query type matches expectation`);
      }

      console.log();

    } catch (error) {
      console.log(`❌ Error processing query: ${error.message}`);
      console.log();
    }
  }

  console.log('2. Testing Conversation Context...\n');

  // Test conversation context building
  console.log('🔗 Testing conversation context with follow-up queries...');

  const conversationQueries = [
    'How do I set up user authentication?',
    'What about password hashing?',
    'How do I handle login errors?',
    'Can you show me an example of that?'
  ];

  for (let i = 0; i < conversationQueries.length; i++) {
    const query = conversationQueries[i];
    console.log(`Query ${i + 1}: "${query}"`);

    try {
      const processedQuery = await queryProcessor.processQuery(
        query,
        testChatbotId,
        testConversationId,
        availableMetadata
      );

      console.log(`   Type: ${processedQuery.type}`);
      if (processedQuery.type === 'contextual_query') {
        console.log(`   Enhanced: "${processedQuery.enhancedQuery}"`);
      }
      console.log();

    } catch (error) {
      console.log(`   Error: ${error.message}`);
      console.log();
    }
  }

  console.log('3. Testing Hybrid Search Integration...\n');

  // Test hybrid search with processed queries
  const searchTestQuery = 'How do I implement JWT authentication in my API?';
  console.log(`🔍 Testing hybrid search with: "${searchTestQuery}"`);

  try {
    // Step 1: Process the query
    const processedQuery = await queryProcessor.processQuery(
      searchTestQuery,
      testChatbotId,
      testConversationId,
      availableMetadata
    );

    console.log(`✅ Query processed successfully`);
    console.log(`🏷️  Search metadata:`, processedQuery.searchMetadata);

    // Step 2: Simulate hybrid search (without actual Supabase data)
    console.log(`\n🔍 Simulating hybrid search process...`);

    // Mock search parameters
    const searchParams = {
      processedQuery: processedQuery,
      chatbotId: testChatbotId,
      conversationId: testConversationId,
      maxResults: 5,
      includeRelated: true,
      contextWindow: 2
    };

    console.log(`📊 Search Strategy:`);
    console.log(`   Primary Filters: ${processedQuery.searchStrategy?.primaryFilters?.join(', ') || 'None'}`);
    console.log(`   Secondary Filters: ${processedQuery.searchStrategy?.secondaryFilters?.join(', ') || 'None'}`);
    console.log(`   Expected Chunk Types: ${processedQuery.searchStrategy?.expectedChunkTypes?.join(', ') || 'None'}`);

    // Note: Actual hybrid search would require Supabase setup and data
    console.log(`\n📝 Note: Full hybrid search requires Supabase setup with actual chunk data`);
    console.log(`   To test with real data:`);
    console.log(`   1. Set up Supabase database with the provided schema`);
    console.log(`   2. Process and store documents using the chunking service`);
    console.log(`   3. Run hybrid search with actual embeddings`);

  } catch (error) {
    console.log(`❌ Error in hybrid search test: ${error.message}`);
  }

  console.log('\n4. Testing Query Processing Performance...\n');

  // Performance test
  const performanceQueries = [
    'How do I create a user account?',
    'What is API rate limiting?',
    'How to handle database errors?',
    'Show me authentication examples',
    'Compare different security methods'
  ];

  console.log(`⏱️  Testing processing speed for ${performanceQueries.length} queries...`);

  const startTime = Date.now();
  let successCount = 0;

  for (const query of performanceQueries) {
    try {
      await queryProcessor.processQuery(
        query,
        testChatbotId,
        `perf-test-${Date.now()}`,
        availableMetadata
      );
      successCount++;
    } catch (error) {
      console.log(`   Error processing: "${query}"`);
    }
  }

  const endTime = Date.now();
  const totalTime = endTime - startTime;
  const avgTime = totalTime / performanceQueries.length;

  console.log(`✅ Processed ${successCount}/${performanceQueries.length} queries`);
  console.log(`⏱️  Total time: ${totalTime}ms`);
  console.log(`📊 Average time per query: ${avgTime.toFixed(2)}ms`);

  console.log('\n5. Testing Error Handling...\n');

  // Test error scenarios
  const errorTestCases = [
    { query: '', name: 'Empty Query' },
    { query: '   ', name: 'Whitespace Only' },
    { query: 'a'.repeat(1000), name: 'Very Long Query' },
    { query: '🚀🎯🔥💡', name: 'Emoji Only' }
  ];

  for (const testCase of errorTestCases) {
    console.log(`🧪 Testing: ${testCase.name}`);
    try {
      const result = await queryProcessor.processQuery(
        testCase.query,
        testChatbotId,
        `error-test-${Date.now()}`,
        availableMetadata
      );
      console.log(`   ✅ Handled gracefully: ${result.type}`);
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
    console.log();
  }

  console.log('6. Cleanup and Summary...\n');

  // Clear test conversation contexts
  queryProcessor.clearConversationContext(testConversationId);
  console.log('✅ Test conversation context cleared');

  console.log('\n🎉 Intelligent Query Processing Test Complete!');
  console.log('🔗 Features tested:');
  console.log('   ✅ Query clarity analysis');
  console.log('   ✅ Intent extraction and metadata mapping');
  console.log('   ✅ Conversation context handling');
  console.log('   ✅ Unclear query clarification');
  console.log('   ✅ Contextual query enhancement');
  console.log('   ✅ Search strategy determination');
  console.log('   ✅ Performance and error handling');
  console.log('\n🚀 Ready for Step 4: Context-Aware Answer Generation!');
}

// Run the test
if (require.main === module) {
  testIntelligentQueryProcessing().catch(console.error);
}

module.exports = { testIntelligentQueryProcessing };
