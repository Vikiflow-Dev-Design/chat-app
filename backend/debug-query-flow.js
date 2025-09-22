/**
 * Debug script to trace query flow issues
 */

const fetch = require('node-fetch');

// Configuration
const API_BASE_URL = 'http://localhost:5000';
const TEST_CHATBOT_ID = '68397df155fa8d7c57e07e2d';
const TEST_SESSION_ID = '688c8c2ef5734440da923096';

// Test queries that are problematic
const debugQueries = [
  {
    name: "Identity Query",
    query: "who are you",
    expected: "Should trigger dynamic identity response"
  },
  {
    name: "Role Reversal",
    query: "what can i do for you", 
    expected: "Should trigger role reversal response"
  },
  {
    name: "Help Query",
    query: "what can you help me with",
    expected: "Should trigger help suggestions"
  },
  {
    name: "TV Question (Out of Domain)",
    query: "how can i turn on a television",
    expected: "Should say it doesn't have that information"
  },
  {
    name: "Animal Question (Out of Domain)", 
    query: "what is an animal",
    expected: "Should say it doesn't have that information"
  },
  {
    name: "Knowledge Query",
    query: "is he illiterate",
    expected: "Should use knowledge base"
  }
];

/**
 * Send test query and capture detailed logs
 */
async function debugQuery(testQuery) {
  try {
    console.log(`\n🔍 DEBUGGING: "${testQuery.query}"`);
    console.log(`📋 Expected: ${testQuery.expected}`);
    console.log('═'.repeat(80));
    
    const startTime = Date.now();
    
    const response = await fetch(`${API_BASE_URL}/api/chat/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionId: TEST_SESSION_ID,
        content: testQuery.query,
        visitorId: 'debug-visitor'
      })
    });

    const endTime = Date.now();

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const botResponse = data.message.content;
    
    console.log(`⏱️  Response time: ${endTime - startTime}ms`);
    console.log(`📝 Bot Response:`);
    console.log(`"${botResponse}"`);
    
    // Analyze the response
    console.log(`\n📊 Response Analysis:`);
    console.log(`- Length: ${botResponse.length} characters`);
    console.log(`- Contains "AI assistant": ${botResponse.toLowerCase().includes('ai assistant')}`);
    console.log(`- Contains "knowledge base": ${botResponse.toLowerCase().includes('knowledge base')}`);
    console.log(`- Contains "Victor Ezekiel": ${botResponse.includes('Victor Ezekiel')}`);
    console.log(`- Contains "help": ${botResponse.toLowerCase().includes('help')}`);
    console.log(`- Contains bullet points: ${botResponse.includes('•')}`);
    console.log(`- Contains "I don't have": ${botResponse.toLowerCase().includes("i don't have") || botResponse.toLowerCase().includes("don't have")}`);
    console.log(`- Contains "outside": ${botResponse.toLowerCase().includes('outside')}`);
    console.log(`- Contains "training data": ${botResponse.toLowerCase().includes('training data')}`);
    
    return {
      query: testQuery.query,
      response: botResponse,
      responseTime: endTime - startTime,
      success: true
    };
    
  } catch (error) {
    console.error(`❌ Debug failed:`, error.message);
    return {
      query: testQuery.query,
      error: error.message,
      success: false
    };
  }
}

/**
 * Run debug session
 */
async function runDebugSession() {
  console.log('🔍 QUERY FLOW DEBUG SESSION');
  console.log('═'.repeat(80));
  console.log('This will help us understand why certain queries are not working as expected.');
  console.log('Watch the server logs for detailed debugging information.');
  
  const results = [];
  
  for (const testQuery of debugQueries) {
    const result = await debugQuery(testQuery);
    results.push(result);
    
    // Wait between queries to see logs clearly
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Summary
  console.log('\n🎯 DEBUG SUMMARY');
  console.log('═'.repeat(80));
  
  results.forEach((result, index) => {
    const testQuery = debugQueries[index];
    console.log(`\n${index + 1}. ${testQuery.name}`);
    console.log(`   Query: "${result.query}"`);
    if (result.success) {
      console.log(`   ✅ Response received (${result.responseTime}ms)`);
      console.log(`   📝 Preview: "${result.response.substring(0, 100)}..."`);
    } else {
      console.log(`   ❌ Failed: ${result.error}`);
    }
  });
  
  console.log('\n🔍 KEY ISSUES TO LOOK FOR IN SERVER LOGS:');
  console.log('1. Which path each query takes (function_call, fallback, clarification)');
  console.log('2. Whether dynamic responses are being triggered');
  console.log('3. What the LLM analysis returns for each query');
  console.log('4. Whether out-of-domain queries are properly identified');
  
  console.log('\n💡 NEXT STEPS:');
  console.log('1. Check server logs for DEBUG messages');
  console.log('2. Look for "TRIGGERED:" messages to see which responses activate');
  console.log('3. Check LLM analysis responses for out-of-domain queries');
  console.log('4. Verify behavior prompt is not overriding domain boundaries');
}

// Run debug session
if (require.main === module) {
  runDebugSession().catch(console.error);
}

module.exports = { runDebugSession, debugQuery };
