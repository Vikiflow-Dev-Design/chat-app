/**
 * Test script for dynamic response implementation
 */

const fetch = require('node-fetch');

// Configuration
const API_BASE_URL = 'http://localhost:5000';
const TEST_CHATBOT_ID = '68397df155fa8d7c57e07e2d';
const TEST_SESSION_ID = '688c8c2ef5734440da923096';

// Test cases for dynamic responses
const testCases = [
  {
    name: "Identity Query - Who are you",
    query: "who are you",
    expectedType: "dynamic_identity",
    description: "Should get dynamic identity response"
  },
  {
    name: "Identity Query - What are you",
    query: "what are you",
    expectedType: "dynamic_identity", 
    description: "Should get dynamic identity response"
  },
  {
    name: "Help Query - What can you help with",
    query: "what can you help me with",
    expectedType: "dynamic_suggestions",
    description: "Should get 5 auto-generated suggestions"
  },
  {
    name: "Help Query - What do you do",
    query: "what do you do",
    expectedType: "dynamic_suggestions",
    description: "Should get 5 auto-generated suggestions"
  },
  {
    name: "Role Reversal - How can I help you",
    query: "how can i help you",
    expectedType: "role_reversal",
    description: "Should handle role reversal gracefully"
  },
  {
    name: "Generic Greeting - Hello",
    query: "hello",
    expectedType: "behavior_prompt",
    description: "Should use behavior prompt"
  },
  {
    name: "Generic Question - How are you",
    query: "how are you doing",
    expectedType: "behavior_prompt",
    description: "Should use behavior prompt"
  },
  {
    name: "Knowledge Query - Test",
    query: "is he illiterate",
    expectedType: "knowledge",
    description: "Should still work with knowledge base"
  }
];

/**
 * Send test message and analyze response
 */
async function testDynamicResponse(testCase) {
  try {
    console.log(`\n🧪 Testing: "${testCase.query}"`);
    console.log(`📋 Expected: ${testCase.description}`);
    console.log('─'.repeat(60));
    
    const response = await fetch(`${API_BASE_URL}/api/chat/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionId: TEST_SESSION_ID,
        content: testCase.query,
        visitorId: 'test-visitor'
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const botResponse = data.message.content;
    
    console.log('✅ Response received:');
    console.log(`📝 "${botResponse}"`);
    
    // Analyze response characteristics
    const analysis = analyzeResponse(botResponse, testCase);
    
    console.log('\n📊 Analysis:');
    Object.entries(analysis).forEach(([key, value]) => {
      const icon = value ? '✅' : '❌';
      console.log(`${icon} ${key}: ${value}`);
    });
    
    return {
      testCase: testCase.name,
      query: testCase.query,
      response: botResponse,
      analysis: analysis,
      success: Object.values(analysis).every(v => v === true || typeof v === 'string')
    };
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return {
      testCase: testCase.name,
      query: testCase.query,
      error: error.message,
      success: false
    };
  }
}

/**
 * Analyze response characteristics
 */
function analyzeResponse(response, testCase) {
  const analysis = {};
  
  // Check for dynamic identity responses
  if (testCase.expectedType === 'dynamic_identity') {
    analysis['Contains AI assistant mention'] = response.toLowerCase().includes('ai assistant');
    analysis['Natural language (no technical terms)'] = !response.toLowerCase().includes('knowledge base');
    analysis['Helpful tone'] = response.toLowerCase().includes('help');
  }
  
  // Check for dynamic suggestions
  if (testCase.expectedType === 'dynamic_suggestions') {
    const bulletPoints = (response.match(/•/g) || []).length;
    analysis['Has bullet points'] = bulletPoints > 0;
    analysis['Has 5 or fewer suggestions'] = bulletPoints <= 5 && bulletPoints > 0;
    analysis['Asks follow-up question'] = response.toLowerCase().includes('what would you like') || 
                                         response.toLowerCase().includes('what interests you');
    analysis['Auto-generated content'] = !response.includes('Victor Ezekiel') || 
                                        response.includes('about') || response.includes('topics');
  }
  
  // Check for role reversal handling
  if (testCase.expectedType === 'role_reversal') {
    analysis['Acknowledges kindness'] = response.toLowerCase().includes('kind') || 
                                       response.toLowerCase().includes('appreciate');
    analysis['Explains AI nature'] = response.toLowerCase().includes('ai') || 
                                    response.toLowerCase().includes("don't need help");
    analysis['Redirects helpfully'] = response.toLowerCase().includes('help you');
  }
  
  // Check for behavior prompt usage
  if (testCase.expectedType === 'behavior_prompt') {
    analysis['Conversational tone'] = response.length > 20;
    analysis['Friendly response'] = response.toLowerCase().includes('hello') || 
                                   response.toLowerCase().includes('great') ||
                                   response.toLowerCase().includes('help');
  }
  
  // Check for knowledge responses
  if (testCase.expectedType === 'knowledge') {
    analysis['Contains specific information'] = response.length > 50;
    analysis['Not generic response'] = !response.toLowerCase().includes('how can i help');
  }
  
  // General checks
  analysis['Response length'] = `${response.length} characters`;
  analysis['No error messages'] = !response.toLowerCase().includes('error') && 
                                 !response.toLowerCase().includes('trouble');
  
  return analysis;
}

/**
 * Run all tests
 */
async function runDynamicResponseTests() {
  console.log('🚀 Testing Dynamic Response Implementation');
  console.log('═'.repeat(70));
  
  const results = [];
  
  for (const testCase of testCases) {
    const result = await testDynamicResponse(testCase);
    results.push(result);
    
    // Wait between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Summary
  console.log('\n🎯 TEST SUMMARY');
  console.log('═'.repeat(70));
  
  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`✅ Passed: ${passed}/${results.length}`);
  console.log(`❌ Failed: ${failed}/${results.length}`);
  
  if (failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED! Dynamic responses are working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Check the details above.');
  }
  
  console.log('\n📊 DETAILED RESULTS:');
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${result.testCase}`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });
}

// Run tests
if (require.main === module) {
  runDynamicResponseTests().catch(console.error);
}

module.exports = { runDynamicResponseTests, testDynamicResponse };
