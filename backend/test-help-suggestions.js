/**
 * Test script specifically for help suggestions
 */

const fetch = require('node-fetch');

// Configuration
const API_BASE_URL = 'http://localhost:5000';
const TEST_CHATBOT_ID = '68397df155fa8d7c57e07e2d';
const TEST_SESSION_ID = '688d79b83f90aaf0464a4935';

// Test queries that should trigger help suggestions
const helpQueries = [
  "what can you help me with",
  "what can you help with", 
  "what do you do",
  "what can you do",
  "what can you assist with",
  "what can i ask you",
  "what can i ask about",
  "what topics can you help with",
  "what subjects can you help with",
  "what can i do for you",
  "what should i ask you",
  "what are you capable of"
];

/**
 * Test a single help query
 */
async function testHelpQuery(query) {
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
        visitorId: 'help-test-visitor'
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const botResponse = data.message.content;
    
    console.log(`📝 Response: "${botResponse}"`);
    
    // Check if it contains bullet points (suggestions)
    const bulletCount = (botResponse.match(/•/g) || []).length;
    const hasSuggestions = bulletCount > 0;
    const hasFollowUp = botResponse.toLowerCase().includes('what would you like') || 
                       botResponse.toLowerCase().includes('what interests you');
    
    console.log(`📊 Analysis:`);
    console.log(`   • Has bullet points: ${hasSuggestions} (${bulletCount} found)`);
    console.log(`   • Has follow-up question: ${hasFollowUp}`);
    console.log(`   • Response length: ${botResponse.length} characters`);
    
    if (hasSuggestions) {
      console.log(`   ✅ SUCCESS: Help suggestions triggered!`);
    } else {
      console.log(`   ❌ FAILED: No help suggestions found`);
    }
    
    return {
      query,
      response: botResponse,
      hasSuggestions,
      bulletCount,
      hasFollowUp,
      success: hasSuggestions
    };
    
  } catch (error) {
    console.error(`❌ Test failed: ${error.message}`);
    return {
      query,
      error: error.message,
      success: false
    };
  }
}

/**
 * Run all help suggestion tests
 */
async function runHelpSuggestionTests() {
  console.log('🎯 HELP SUGGESTIONS TEST');
  console.log('═'.repeat(60));
  console.log('Testing various ways users might ask for help...');
  
  const results = [];
  
  for (const query of helpQueries) {
    const result = await testHelpQuery(query);
    results.push(result);
    
    // Wait between tests
    await new Promise(resolve => setTimeout(resolve, 1500));
  }
  
  // Summary
  console.log('\n🎯 TEST SUMMARY');
  console.log('═'.repeat(60));
  
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`✅ Successful: ${successful}/${results.length}`);
  console.log(`❌ Failed: ${failed}/${results.length}`);
  
  if (successful > 0) {
    console.log('\n✅ WORKING PATTERNS:');
    results.filter(r => r.success).forEach(r => {
      console.log(`   • "${r.query}" → ${r.bulletCount} suggestions`);
    });
  }
  
  if (failed > 0) {
    console.log('\n❌ FAILED PATTERNS:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`   • "${r.query}" → ${r.error || 'No suggestions generated'}`);
    });
  }
  
  console.log('\n💡 DEBUGGING TIPS:');
  console.log('1. Check server logs for "🎯 TRIGGERED: Dynamic help suggestions"');
  console.log('2. Look for "🔍 DEBUG: Generating help suggestions" messages');
  console.log('3. Verify string matching is working correctly');
  console.log('4. Check if knowledge analysis is returning topics/keywords');
  
  return results;
}

// Run tests
if (require.main === module) {
  runHelpSuggestionTests().catch(console.error);
}

module.exports = { runHelpSuggestionTests, testHelpQuery };
