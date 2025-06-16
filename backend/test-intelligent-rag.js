/**
 * Test script for Intelligent RAG System
 * Run with: node test-intelligent-rag.js
 */

require("dotenv").config();
const IntelligentRAGService = require("./services/intelligentRAG/IntelligentRAGService");

async function testIntelligentRAG() {
  console.log("🧪 Testing Intelligent RAG System");
  console.log("=" .repeat(50));

  const ragService = new IntelligentRAGService();

  // Test chatbot ID (replace with a real one from your database)
  const testChatbotId = "675e8b8b5b8a9c001f123456"; // Replace with actual chatbot ID
  const testQueries = [
    "who is victor exekiel",
    "what is this document about",
    "hello",
    "tell me about that thing",
    "explain the main concepts"
  ];

  console.log(`📋 Testing with chatbot ID: ${testChatbotId}`);
  console.log(`🔍 Test queries: ${testQueries.length}`);
  console.log("");

  for (let i = 0; i < testQueries.length; i++) {
    const query = testQueries[i];
    console.log(`\n🔍 Test ${i + 1}: "${query}"`);
    console.log("-".repeat(40));

    try {
      const startTime = Date.now();
      
      // Test the intelligent RAG query
      const result = await ragService.processQuery(
        testChatbotId,
        query,
        "You are a helpful AI assistant. Be friendly and informative."
      );

      const responseTime = Date.now() - startTime;

      console.log(`✅ Response received in ${responseTime}ms`);
      console.log(`📊 Response type: ${result.response_type}`);
      console.log(`🔄 Fallback used: ${result.fallback_used}`);
      
      if (result.chunks_used) {
        console.log(`📦 Chunks used: ${result.chunks_used.length}`);
        result.chunks_used.forEach((chunk, idx) => {
          console.log(`   ${idx + 1}. Chunk ${chunk.chunk_index + 1} (${chunk.id})`);
        });
      }

      if (result.metadata) {
        console.log(`🧠 LLM reasoning: ${result.metadata.reasoning || 'N/A'}`);
        console.log(`🎯 Confidence: ${result.metadata.confidence || 'N/A'}`);
      }

      console.log(`💬 Answer: ${result.answer.substring(0, 200)}${result.answer.length > 200 ? '...' : ''}`);

    } catch (error) {
      console.error(`❌ Error testing query "${query}":`, error.message);
    }
  }

  // Test cache functionality
  console.log("\n" + "=".repeat(50));
  console.log("🗄️ Testing Cache Functionality");
  console.log("=".repeat(50));

  try {
    // Get cache stats
    const cacheStats = ragService.getCacheStats(testChatbotId);
    console.log("📊 Cache Stats:", JSON.stringify(cacheStats, null, 2));

    // Test cache building
    console.log("\n🔄 Testing cache building...");
    const cache = await ragService.metadataCache.getMetadataCache(testChatbotId);
    console.log(`✅ Cache built successfully: ${cache.totalChunks} chunks`);

    if (cache.chunks.length > 0) {
      console.log("\n📋 Sample chunk metadata:");
      const sampleChunk = cache.chunks[0];
      console.log(`   ID: ${sampleChunk.id}`);
      console.log(`   Topics: ${JSON.stringify(sampleChunk.topics)}`);
      console.log(`   Keywords: ${JSON.stringify(sampleChunk.keywords)}`);
      console.log(`   Document Section: ${sampleChunk.document_section}`);
      console.log(`   Chunk Type: ${sampleChunk.chunk_type}`);
    }

  } catch (error) {
    console.error("❌ Error testing cache:", error.message);
  }

  console.log("\n" + "=".repeat(50));
  console.log("🎉 Intelligent RAG Testing Complete!");
  console.log("=".repeat(50));
}

// Run the test
if (require.main === module) {
  testIntelligentRAG()
    .then(() => {
      console.log("\n✅ All tests completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ Test failed:", error);
      process.exit(1);
    });
}

module.exports = { testIntelligentRAG };
