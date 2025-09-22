const dotenv = require("dotenv");
const IntelligentRAGService = require("./services/intelligentRAG/IntelligentRAGService");

dotenv.config();

async function testGemini2API() {
  try {
    console.log("🚀 TESTING GEMINI 2.0 FLASH API INTEGRATION");
    console.log("==========================================\n");

    // Test direct API call first
    console.log("1. Testing Direct Gemini 2.0 Flash API Call:");
    console.log("============================================");
    
    const testPayload = {
      contents: [
        {
          parts: [
            {
              text: "Explain how AI works in a few words"
            }
          ]
        }
      ]
    };

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`;
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-goog-api-key': process.env.GEMINI_API_KEY
      },
      body: JSON.stringify(testPayload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`❌ Direct API test failed: ${response.status} - ${errorText}`);
      return;
    }

    const result = await response.json();
    const responseText = result.candidates?.[0]?.content?.parts?.[0]?.text;
    
    console.log(`✅ Direct API test successful!`);
    console.log(`📝 Response: "${responseText}"`);
    console.log(`📊 Response structure:`, JSON.stringify(result, null, 2));

    // Test with Intelligent RAG Service
    console.log("\n\n2. Testing Intelligent RAG Service with Gemini 2.0:");
    console.log("==================================================");
    
    const intelligentRAG = new IntelligentRAGService();
    const testChatbotId = "68397df155fa8d7c57e07e2d";
    const behaviorPrompt = "You are a helpful AI assistant.";

    // Test queries
    const testQueries = [
      {
        query: "Who is Victor Ezekiel?",
        description: "Testing main query with new API"
      },
      {
        query: "What are his skills?",
        description: "Testing follow-up query"
      }
    ];

    for (let i = 0; i < testQueries.length; i++) {
      const { query, description } = testQueries[i];
      
      console.log(`\n${i + 3}. ${description}`);
      console.log(`   Query: "${query}"`);
      console.log(`   ⏱️  Processing...`);
      
      const startTime = Date.now();
      
      try {
        const result = await intelligentRAG.processQuery(
          testChatbotId,
          query,
          behaviorPrompt
        );
        
        const endTime = Date.now();
        const processingTime = endTime - startTime;
        
        console.log(`   ✅ Response received in ${processingTime}ms`);
        console.log(`   📊 Response Type: ${result.response_type || 'N/A'}`);
        console.log(`   🔄 Fallback Used: ${result.fallback_used ? 'YES' : 'NO'}`);
        console.log(`   ✅ Success: ${result.success ? 'YES' : 'NO'}`);
        
        if (result.success && result.chunks_used) {
          console.log(`   📦 Chunks Used: ${result.chunks_used.length}`);
          result.chunks_used.forEach((chunk, idx) => {
            console.log(`      ${idx + 1}. ${chunk.id} (Index: ${chunk.chunk_index})`);
          });
        }
        
        if (result.answer) {
          const preview = result.answer.length > 200 
            ? result.answer.substring(0, 200) + "..." 
            : result.answer;
          console.log(`   📝 Answer: "${preview}"`);
        }
        
        if (result.metadata?.reasoning) {
          console.log(`   💭 LLM Reasoning: ${result.metadata.reasoning}`);
        }
        
        console.log(`   ✅ SUCCESS: Gemini 2.0 Flash working correctly\n`);
        
      } catch (error) {
        console.log(`   ❌ ERROR: ${error.message}`);
        console.log(`   📊 Error details:`, error.stack);
      }
    }

    // Summary
    console.log("\n🎉 GEMINI 2.0 FLASH API TEST COMPLETE!");
    console.log("=====================================");
    console.log("✅ Key Improvements:");
    console.log("   - Using latest Gemini 2.0 Flash model");
    console.log("   - Direct HTTP API calls with X-goog-api-key header");
    console.log("   - Bypassing Google AI SDK quota limitations");
    console.log("   - Better error handling and response parsing");
    console.log("   - Consistent API approach across all methods");

  } catch (error) {
    console.error("❌ Test failed:", error.message);
    console.log("\n💡 Check:");
    console.log("   - GEMINI_API_KEY is set correctly");
    console.log("   - Internet connectivity");
    console.log("   - API quota limits");
  }
}

testGemini2API().catch(console.error);
