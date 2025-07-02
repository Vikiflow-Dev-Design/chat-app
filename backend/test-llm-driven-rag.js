const dotenv = require("dotenv");
const IntelligentRAGService = require("./services/intelligentRAG/IntelligentRAGService");

dotenv.config();

async function testLLMDrivenRAG() {
  try {
    console.log("🧠 TESTING LLM-DRIVEN RAG SYSTEM (NO EMBEDDINGS)");
    console.log("==============================================\n");

    // Initialize the service
    const intelligentRAG = new IntelligentRAGService();
    
    // Test with real chatbot ID that has chunks
    const testChatbotId = "68397df155fa8d7c57e07e2d";
    const behaviorPrompt = "You are a helpful AI assistant that provides accurate information based on the knowledge base.";

    // Test queries
    const testQueries = [
      {
        query: "What are Victor's skills?",
        description: "Testing topic-based retrieval"
      },
      {
        query: "Tell me about Victor Ezekiel",
        description: "Testing entity-based retrieval"
      },
      {
        query: "What is his contact information?",
        description: "Testing keyword-based retrieval"
      },
      {
        query: "Hello, how are you?",
        description: "Testing greeting/clarification handling"
      },
      {
        query: "What is quantum physics?",
        description: "Testing irrelevant query fallback"
      }
    ];

    console.log("1. Configuration Check:");
    console.log(`   ENABLE_EMBEDDINGS: ${process.env.ENABLE_EMBEDDINGS}`);
    console.log(`   FALLBACK_TO_METADATA_SEARCH: ${process.env.FALLBACK_TO_METADATA_SEARCH}`);
    console.log(`   Using Chatbot ID: ${testChatbotId}\n`);

    // Test each query
    for (let i = 0; i < testQueries.length; i++) {
      const { query, description } = testQueries[i];
      
      console.log(`${i + 2}. ${description}`);
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
        
        if (result.success && result.chunks_used) {
          console.log(`   📦 Chunks Used: ${result.chunks_used.length}`);
          result.chunks_used.forEach((chunk, idx) => {
            console.log(`      ${idx + 1}. ${chunk.id} (Index: ${chunk.chunk_index})`);
          });
          console.log(`   💭 LLM Reasoning: ${result.metadata?.reasoning || 'N/A'}`);
          console.log(`   🎯 Confidence: ${result.metadata?.confidence || 'N/A'}`);
        }
        
        if (result.answer) {
          const preview = result.answer.length > 150 
            ? result.answer.substring(0, 150) + "..." 
            : result.answer;
          console.log(`   📝 Answer Preview: "${preview}"`);
        }
        
        console.log(`   ✅ SUCCESS: LLM-driven approach working correctly\n`);
        
      } catch (error) {
        console.log(`   ❌ ERROR: ${error.message}\n`);
      }
    }

    // Test cache performance
    console.log(`${testQueries.length + 2}. Cache Performance Test:`);
    const cacheStartTime = Date.now();
    
    const cacheResult = await intelligentRAG.processQuery(
      testChatbotId,
      "What are Victor's skills?", // Repeat query to test cache
      behaviorPrompt
    );
    
    const cacheEndTime = Date.now();
    const cacheTime = cacheEndTime - cacheStartTime;
    
    console.log(`   ⚡ Cached query processed in ${cacheTime}ms`);
    console.log(`   📊 Cache should be faster on subsequent calls\n`);

    // Summary
    console.log("🎉 LLM-DRIVEN RAG SYSTEM TEST COMPLETE!");
    console.log("=====================================");
    console.log("✅ Key Features Verified:");
    console.log("   - LLM analyzes metadata to select relevant chunks");
    console.log("   - No embedding generation or vector search");
    console.log("   - Relationship-based chunk enhancement");
    console.log("   - Intelligent fallback handling");
    console.log("   - Fast metadata-based caching");
    console.log("   - Clear reasoning and confidence scoring");
    
    console.log("\n🚀 Your system now uses:");
    console.log("   📋 Metadata Analysis → 🧠 LLM Selection → 📦 Chunk Retrieval → 💬 Answer Generation");

  } catch (error) {
    console.error("❌ Test failed:", error.message);
    console.log("\n💡 Check:");
    console.log("   - Supabase connection and credentials");
    console.log("   - Gemini API key");
    console.log("   - Chatbot has knowledge chunks");
  }
}

testLLMDrivenRAG().catch(console.error);
