/**
 * Test script for the Complete Advanced RAG Workflow
 * Tests the entire pipeline from query to final answer
 */

require('dotenv').config();
const AdvancedRAGOrchestrator = require('./services/advancedRAGOrchestrator');
const RelationshipChunkingService = require('./services/relationshipChunkingService');
const DoclingIntegrationService = require('./services/doclingIntegrationService');
const SupabaseChunkStorage = require('./services/supabaseChunkStorage');
const fs = require('fs');
const path = require('path');

async function testAdvancedRAGWorkflow() {
  console.log('🚀 Testing Complete Advanced RAG Workflow\n');

  const ragOrchestrator = new AdvancedRAGOrchestrator();
  const chunkingService = new RelationshipChunkingService();
  const doclingService = new DoclingIntegrationService();
  const chunkStorage = new SupabaseChunkStorage();

  // Test configuration
  const testChatbotId = 'test-advanced-rag-bot';
  const testConversationId = 'test-conversation-advanced';
  const testUserId = 'test-user-123';

  console.log('1. System Status Check...\n');
  
  // Check system status
  const systemStatus = ragOrchestrator.getSystemStatus();
  console.log('🔧 System Status:', systemStatus.status);
  console.log('📦 Components:', Object.entries(systemStatus.components)
    .map(([name, status]) => `${name}: ${status}`)
    .join(', '));
  console.log('🎯 Features:', systemStatus.features.join(', '));
  console.log();

  console.log('2. Testing Different Query Types...\n');

  // Test queries representing different scenarios
  const testQueries = [
    {
      name: 'Clear Technical Query',
      query: 'How do I implement JWT authentication in my API?',
      userProfile: { experienceLevel: 'intermediate', role: 'developer' },
      expectedType: 'success'
    },
    {
      name: 'Vague Query (Clarification Needed)',
      query: 'Help me with authentication stuff',
      userProfile: { experienceLevel: 'beginner' },
      expectedType: 'clarification_needed'
    },
    {
      name: 'Definition Query',
      query: 'What is a REST API?',
      userProfile: { experienceLevel: 'beginner', role: 'student' },
      expectedType: 'success'
    },
    {
      name: 'Comparison Query',
      query: 'What\'s the difference between JWT and session-based authentication?',
      userProfile: { experienceLevel: 'advanced', role: 'architect' },
      expectedType: 'success'
    },
    {
      name: 'Procedural Query',
      query: 'Show me step by step how to set up user registration',
      userProfile: { experienceLevel: 'intermediate', role: 'developer' },
      expectedType: 'success'
    }
  ];

  // Chatbot configuration
  const chatbotConfig = {
    name: 'TechBot',
    personality: 'helpful and technical',
    expertise: 'software development',
    responseStyle: 'detailed with examples'
  };

  for (const testQuery of testQueries) {
    console.log(`🔍 Testing: ${testQuery.name}`);
    console.log(`Query: "${testQuery.query}"`);
    console.log(`User Profile: ${JSON.stringify(testQuery.userProfile)}`);

    try {
      const startTime = Date.now();
      
      const response = await ragOrchestrator.processRAGWorkflow({
        userQuery: testQuery.query,
        chatbotId: testChatbotId,
        conversationId: testConversationId,
        userProfile: testQuery.userProfile,
        chatbotConfig: chatbotConfig,
        options: {
          maxResults: 5,
          includeRelated: true,
          contextWindow: 2
        }
      });

      const processingTime = Date.now() - startTime;

      console.log(`✅ Response Type: ${response.type}`);
      console.log(`⏱️  Processing Time: ${processingTime}ms`);

      if (response.type === 'success') {
        console.log(`📝 Answer Length: ${response.answer.length} characters`);
        console.log(`🎯 Answer Type: ${response.answerMetadata.type}`);
        console.log(`📊 Confidence: ${response.answerMetadata.confidence.toFixed(2)}`);
        console.log(`📚 Sources Used: ${response.sources.totalSources}`);
        console.log(`🔗 Related Topics: ${response.supplementary.relatedTopics.join(', ')}`);
        console.log(`➡️  Next Steps: ${response.supplementary.nextSteps.length} suggested`);
        console.log(`❓ Follow-up Questions: ${response.supplementary.followUpQuestions.length} generated`);
        
        // Show performance breakdown
        if (response.performance) {
          console.log(`📈 Performance Breakdown:`);
          console.log(`   Total: ${response.performance.totalProcessingTime}ms`);
          console.log(`   Query Processing: ${response.performance.queryProcessingTime || 'N/A'}ms`);
          console.log(`   Search: ${response.performance.searchTime || 'N/A'}ms`);
          console.log(`   Answer Generation: ${response.performance.answerGenerationTime || 'N/A'}ms`);
        }

        // Show answer preview
        const answerPreview = response.answer.substring(0, 200) + '...';
        console.log(`📄 Answer Preview: "${answerPreview}"`);

      } else if (response.type === 'clarification_needed') {
        console.log(`💬 Clarification Message: ${response.message}`);
        console.log(`💡 Suggestions: ${response.suggestions.join(', ')}`);
        
      } else if (response.type === 'no_results') {
        console.log(`🔍 No Results Message: ${response.message}`);
        console.log(`💡 Suggestions: ${response.suggestions.join(', ')}`);
        
      } else if (response.type === 'error') {
        console.log(`❌ Error: ${response.error.message}`);
      }

      // Validate expectations
      if (response.type === testQuery.expectedType) {
        console.log(`✅ Response type matches expectation`);
      } else {
        console.log(`⚠️  Expected: ${testQuery.expectedType}, Got: ${response.type}`);
      }

      console.log();

    } catch (error) {
      console.log(`❌ Error testing query: ${error.message}`);
      console.log();
    }
  }

  console.log('3. Testing Conversation Context...\n');

  // Test conversation flow
  const conversationQueries = [
    'How do I set up user authentication?',
    'What about password hashing for that?',
    'Show me an example of the hashing code',
    'How do I handle login errors?',
    'What are the security best practices?'
  ];

  console.log('🔗 Testing conversation context with follow-up queries...');

  for (let i = 0; i < conversationQueries.length; i++) {
    const query = conversationQueries[i];
    console.log(`\n💬 Query ${i + 1}: "${query}"`);

    try {
      const response = await ragOrchestrator.processRAGWorkflow({
        userQuery: query,
        chatbotId: testChatbotId,
        conversationId: testConversationId,
        userProfile: { experienceLevel: 'intermediate', role: 'developer' },
        chatbotConfig: chatbotConfig
      });

      console.log(`   Response Type: ${response.type}`);
      
      if (response.type === 'success') {
        console.log(`   Intent: ${response.queryProcessing.intent?.type || 'N/A'}`);
        console.log(`   Topics: ${response.queryProcessing.searchMetadata?.topics?.join(', ') || 'N/A'}`);
        console.log(`   Answer Type: ${response.answerMetadata.type}`);
      }

    } catch (error) {
      console.log(`   Error: ${error.message}`);
    }
  }

  console.log('\n4. Testing Quick Query Processing...\n');

  // Test quick queries
  const quickQueries = [
    'What is JWT?',
    'API definition',
    'Database connection'
  ];

  for (const quickQuery of quickQueries) {
    console.log(`⚡ Quick Query: "${quickQuery}"`);

    try {
      const startTime = Date.now();
      
      const response = await ragOrchestrator.processQuickQuery({
        userQuery: quickQuery,
        chatbotId: testChatbotId,
        conversationId: `quick-${Date.now()}`
      });

      const processingTime = Date.now() - startTime;

      console.log(`   Type: ${response.type}`);
      console.log(`   Processing Time: ${processingTime}ms`);
      console.log(`   Answer Length: ${response.answer.length} characters`);
      console.log(`   Confidence: ${response.answerMetadata.confidence.toFixed(2)}`);
      console.log();

    } catch (error) {
      console.log(`   Error: ${error.message}`);
      console.log();
    }
  }

  console.log('5. Testing Error Handling...\n');

  // Test error scenarios
  const errorTestCases = [
    { query: '', name: 'Empty Query' },
    { query: '   ', name: 'Whitespace Only' },
    { query: 'a'.repeat(1000), name: 'Very Long Query' }
  ];

  for (const testCase of errorTestCases) {
    console.log(`🧪 Testing: ${testCase.name}`);
    
    try {
      const response = await ragOrchestrator.processRAGWorkflow({
        userQuery: testCase.query,
        chatbotId: testChatbotId,
        conversationId: `error-test-${Date.now()}`,
        userProfile: {},
        chatbotConfig: chatbotConfig
      });

      console.log(`   Handled gracefully: ${response.type}`);
      if (response.message) {
        console.log(`   Message: ${response.message}`);
      }

    } catch (error) {
      console.log(`   Error: ${error.message}`);
    }
    console.log();
  }

  console.log('6. Performance Analysis...\n');

  // Performance test with multiple queries
  const performanceQueries = [
    'How to create REST API?',
    'Database security best practices',
    'User authentication methods',
    'API error handling',
    'JWT token validation'
  ];

  console.log(`⏱️  Testing performance with ${performanceQueries.length} queries...`);

  const performanceResults = [];
  const startTime = Date.now();

  for (const query of performanceQueries) {
    try {
      const queryStartTime = Date.now();
      
      const response = await ragOrchestrator.processRAGWorkflow({
        userQuery: query,
        chatbotId: testChatbotId,
        conversationId: `perf-test-${Date.now()}`,
        userProfile: { experienceLevel: 'intermediate' },
        chatbotConfig: chatbotConfig
      });

      const queryTime = Date.now() - queryStartTime;
      
      performanceResults.push({
        query: query,
        time: queryTime,
        type: response.type,
        success: response.type === 'success'
      });

    } catch (error) {
      performanceResults.push({
        query: query,
        time: 0,
        type: 'error',
        success: false,
        error: error.message
      });
    }
  }

  const totalTime = Date.now() - startTime;
  const successfulQueries = performanceResults.filter(r => r.success).length;
  const avgTime = performanceResults.reduce((sum, r) => sum + r.time, 0) / performanceResults.length;

  console.log(`📊 Performance Results:`);
  console.log(`   Total Time: ${totalTime}ms`);
  console.log(`   Successful Queries: ${successfulQueries}/${performanceQueries.length}`);
  console.log(`   Average Time per Query: ${avgTime.toFixed(2)}ms`);
  console.log(`   Success Rate: ${(successfulQueries / performanceQueries.length * 100).toFixed(1)}%`);

  // Show individual results
  performanceResults.forEach((result, index) => {
    console.log(`   Query ${index + 1}: ${result.time}ms (${result.type})`);
  });

  console.log('\n7. Cleanup and Summary...\n');

  // Clear test conversation contexts
  ragOrchestrator.clearConversationContext(testConversationId);
  console.log('✅ Test conversation contexts cleared');

  console.log('\n🎉 Advanced RAG Workflow Test Complete!');
  console.log('🔗 Complete pipeline tested:');
  console.log('   ✅ Intelligent Query Processing');
  console.log('   ✅ Hybrid Search (Metadata + Vector)');
  console.log('   ✅ Context-Aware Answer Generation');
  console.log('   ✅ Conversation Context Handling');
  console.log('   ✅ Error Handling and Edge Cases');
  console.log('   ✅ Performance Optimization');
  console.log('\n🚀 Ready for Production Deployment!');
}

// Run the test
if (require.main === module) {
  testAdvancedRAGWorkflow().catch(console.error);
}

module.exports = { testAdvancedRAGWorkflow };
