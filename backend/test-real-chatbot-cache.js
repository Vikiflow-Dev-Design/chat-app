const dotenv = require("dotenv");
const { createClient } = require("@supabase/supabase-js");
const MetadataCacheService = require("./services/intelligentRAG/MetadataCacheService");

dotenv.config();

async function testRealChatbotCache() {
  try {
    console.log("🔍 TESTING METADATA CACHE WITH REAL CHATBOT DATA");
    console.log("===============================================\n");

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );

    // 1. Find actual chatbot IDs that have chunks
    console.log("1. Finding chatbots with knowledge chunks:");
    
    const { data: chatbotIds, error: chatbotError } = await supabase
      .from("chatbot_knowledge_chunks")
      .select("chatbot_id")
      .limit(5);

    if (chatbotError) {
      console.log(`   ❌ Error: ${chatbotError.message}`);
      return;
    }

    if (!chatbotIds || chatbotIds.length === 0) {
      console.log("   ⚠️  No chatbots with knowledge chunks found");
      return;
    }

    // Get unique chatbot IDs
    const uniqueChatbotIds = [...new Set(chatbotIds.map(item => item.chatbot_id))];
    console.log(`   ✅ Found ${uniqueChatbotIds.length} chatbot(s) with chunks:`);
    uniqueChatbotIds.forEach(id => console.log(`      - ${id}`));

    // 2. Test metadata cache with first chatbot
    const testChatbotId = uniqueChatbotIds[0];
    console.log(`\n2. Testing metadata cache with chatbot: ${testChatbotId}`);

    const metadataCache = new MetadataCacheService();
    
    const startTime = Date.now();
    const cache = await metadataCache.getMetadataCache(testChatbotId);
    const endTime = Date.now();

    console.log(`   ✅ Cache retrieval successful in ${endTime - startTime}ms`);
    console.log(`   📊 Total chunks: ${cache.totalChunks}`);
    console.log(`   📅 Last updated: ${cache.lastUpdated}`);
    console.log(`   ⏰ Expires at: ${cache.expiresAt}`);

    // 3. Show sample chunk data
    if (cache.chunks && cache.chunks.length > 0) {
      console.log("\n3. Sample chunk data:");
      const sampleChunk = cache.chunks[0];
      console.log(`   📄 Chunk ID: ${sampleChunk.id}`);
      console.log(`   📝 Document ID: ${sampleChunk.document_id}`);
      console.log(`   🔢 Chunk Index: ${sampleChunk.chunk_index}`);
      console.log(`   📋 Document Section: ${sampleChunk.document_section || 'N/A'}`);
      console.log(`   🏷️  Topics: ${JSON.stringify(sampleChunk.topics)}`);
      console.log(`   🔑 Keywords: ${JSON.stringify(sampleChunk.keywords)}`);
      console.log(`   👥 Audience: ${JSON.stringify(sampleChunk.audience)}`);
      console.log(`   ❓ Question Types: ${JSON.stringify(sampleChunk.question_types)}`);
    }

    // 4. Test cache statistics
    console.log("\n4. Cache statistics:");
    const stats = metadataCache.getCacheStats(testChatbotId);
    console.log(`   📊 Cache exists: ${stats.exists}`);
    console.log(`   ✅ Cache valid: ${stats.isValid}`);
    console.log(`   💾 Memory size: ${Math.round(stats.memorySize / 1024)} KB`);

    // 5. Test cache refresh
    console.log("\n5. Testing cache refresh:");
    const refreshStartTime = Date.now();
    const refreshedCache = await metadataCache.refreshCache(testChatbotId);
    const refreshEndTime = Date.now();
    
    console.log(`   ✅ Cache refresh successful in ${refreshEndTime - refreshStartTime}ms`);
    console.log(`   📊 Refreshed chunks: ${refreshedCache.totalChunks}`);

    console.log("\n🎉 METADATA CACHE IS WORKING CORRECTLY!");
    console.log("✅ Your Step 1: Metadata Cache Retrieval is properly configured");

  } catch (error) {
    console.error("❌ Test failed:", error.message);
    console.log("\n💡 This indicates there may still be configuration issues");
  }
}

testRealChatbotCache().catch(console.error);
