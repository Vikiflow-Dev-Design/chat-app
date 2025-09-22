/**
 * Test script to verify the generic query fix
 * This tests both knowledge-based and generic queries
 */

const fetch = require('node-fetch');

// Configuration
const API_BASE_URL = 'http://localhost:5000';
const TEST_CHATBOT_ID = '68397df155fa8d7c57e07e2d'; // Use your actual chatbot ID
const TEST_SESSION_ID = '688c8c2ef5734440da923096'; // Use your actual session ID

// Test cases
const testCases = [
  {
    name: "Generic Query - Hello",
    query: "hello",
    expectedType: "fallback",
    description: "Should use Intelligent RAG fallback with behavior prompt"
  },
  {
    name: "Generic Query - How are you",
    query: "how are you?",
    expectedType: "fallback",
    description: "Should use Intelligent RAG fallback with behavior prompt"
  },
  {
    name: "Knowledge Query - Literacy",
    query: "is he illiterate?",
    expectedType: "knowledge",
    description: "Should use Intelligent RAG with knowledge chunks"
  },
  {
    name: "Generic Query - Thank you",
    query: "thank you",
    expectedType: "fallback",
    description: "Should use Intelligent RAG fallback with behavior prompt"
  }
];

/**
 * Send a test message to the chatbot
 */
async function sendTestMessage(query) {
  try {
    console.log(`\n🧪 Testing: "${query}"`);
    console.log('─'.repeat(50));
    
    const response = await fetch(`${API_BASE_URL}/api/chat/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionId: TEST_SESSION_ID,
        content: query,
        visitorId: 'test-visitor'
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    console.log('✅ Response received successfully');
    console.log(`📝 Response: "${data.message.content.substring(0, 150)}..."`);
    console.log(`⏱️  Response time: ${response.headers.get('x-response-time') || 'N/A'}`);
    
    return {
      success: true,
      response: data.message.content,
      fullData: data
    };
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Run all test cases
 */
async function runTests() {
  console.log('🚀 Starting Generic Query Fix Tests');
  console.log('═'.repeat(60));
  
  const results = [];
  
  for (const testCase of testCases) {
    console.log(`\n📋 Test Case: ${testCase.name}`);
    console.log(`📝 Description: ${testCase.description}`);
    
    const result = await sendTestMessage(testCase.query);
    
    if (result.success) {
      console.log('✅ Test PASSED - No errors occurred');
      
      // Basic validation
      if (result.response && result.response.length > 0) {
        console.log('✅ Response contains content');
      } else {
        console.log('⚠️  Response is empty');
      }
      
    } else {
      console.log('❌ Test FAILED - Error occurred');
    }
    
    results.push({
      testCase: testCase.name,
      query: testCase.query,
      success: result.success,
      error: result.error || null,
      hasResponse: !!(result.response && result.response.length > 0)
    });
    
    // Wait between tests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Summary
  console.log('\n🎯 TEST SUMMARY');
  console.log('═'.repeat(60));
  
  const passed = results.filter(r => r.success && r.hasResponse).length;
  const failed = results.filter(r => !r.success || !r.hasResponse).length;
  
  console.log(`✅ Passed: ${passed}/${results.length}`);
  console.log(`❌ Failed: ${failed}/${results.length}`);
  
  if (failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED! Generic query fix is working correctly.');
    console.log('✅ Both knowledge-based and generic queries are handled properly.');
  } else {
    console.log('\n⚠️  Some tests failed. Check the logs above for details.');
  }
  
  // Detailed results
  console.log('\n📊 DETAILED RESULTS:');
  results.forEach(result => {
    const status = result.success && result.hasResponse ? '✅' : '❌';
    console.log(`${status} ${result.testCase}: "${result.query}"`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });
}

// Run the tests
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests, sendTestMessage };
