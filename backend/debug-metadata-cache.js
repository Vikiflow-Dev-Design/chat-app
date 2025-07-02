const dotenv = require("dotenv");
const { createClient } = require("@supabase/supabase-js");

dotenv.config();

console.log("🔍 DEBUGGING METADATA CACHE CONFIGURATION");
console.log("==========================================\n");

async function debugMetadataCache() {
  try {
    // 1. Check environment variables
    console.log("1. Environment Variables:");
    console.log(`   SUPABASE_URL: ${process.env.SUPABASE_URL ? '✅ Set' : '❌ Missing'}`);
    console.log(`   SUPABASE_ANON_KEY: ${process.env.SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}`);
    
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
      console.log("\n❌ Missing Supabase credentials. Please check your .env file.");
      return;
    }

    // 2. Test Supabase connection
    console.log("\n2. Supabase Connection:");
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );
    console.log("   ✅ Client created");

    // 3. Check required tables
    console.log("\n3. Required Tables Check:");
    
    const requiredTables = [
      "chatbot_knowledge_chunks",
      "chunk_metadata"
    ];

    let allTablesExist = true;

    for (const tableName of requiredTables) {
      try {
        const { data, error, count } = await supabase
          .from(tableName)
          .select("*", { count: "exact" })
          .limit(1);

        if (error) {
          console.log(`   ❌ ${tableName}: ${error.message}`);
          if (error.message.includes("does not exist")) {
            console.log(`      💡 Table '${tableName}' needs to be created`);
            allTablesExist = false;
          }
        } else {
          console.log(`   ✅ ${tableName}: exists (${count || 0} rows)`);
        }
      } catch (tableError) {
        console.log(`   ❌ ${tableName}: ${tableError.message}`);
        allTablesExist = false;
      }
    }

    // 4. Test MetadataCacheService initialization
    console.log("\n4. MetadataCacheService Test:");
    try {
      const MetadataCacheService = require("./services/intelligentRAG/MetadataCacheService");
      const metadataCache = new MetadataCacheService();
      console.log("   ✅ MetadataCacheService initialized successfully");
      
      // Test with a dummy chatbot ID
      console.log("\n5. Testing Cache Retrieval:");
      const testChatbotId = "test-chatbot-123";
      
      try {
        const cache = await metadataCache.getMetadataCache(testChatbotId);
        console.log(`   ✅ Cache retrieval successful for ${testChatbotId}`);
        console.log(`   📊 Total chunks: ${cache.totalChunks}`);
        console.log(`   📅 Last updated: ${cache.lastUpdated}`);
      } catch (cacheError) {
        console.log(`   ⚠️  Cache retrieval completed with: ${cacheError.message}`);
        console.log("   💡 This is expected if no chunks exist for the test chatbot");
      }
      
    } catch (serviceError) {
      console.log(`   ❌ MetadataCacheService initialization failed: ${serviceError.message}`);
      allTablesExist = false;
    }

    // 5. Recommendations
    console.log("\n6. Recommendations:");
    if (!allTablesExist) {
      console.log("   🔧 SETUP REQUIRED:");
      console.log("   1. Run the Supabase schema setup:");
      console.log("      - Go to your Supabase project dashboard");
      console.log("      - Navigate to SQL Editor");
      console.log("      - Copy and paste the contents of:");
      console.log("        backend/database/supabase-chunk-schema.sql");
      console.log("      - Execute the SQL");
      console.log("   2. Or run: node backend/setup-supabase.js");
      console.log("   3. Then test again with: node backend/debug-metadata-cache.js");
    } else {
      console.log("   ✅ Metadata cache configuration appears to be correct!");
      console.log("   💡 If you're still having issues, check:");
      console.log("      - Row Level Security (RLS) policies in Supabase");
      console.log("      - Whether your chatbot has uploaded knowledge chunks");
      console.log("      - Network connectivity to Supabase");
    }

  } catch (error) {
    console.error("\n❌ Debug failed:", error.message);
    console.log("\n💡 Common issues:");
    console.log("   - Invalid Supabase credentials");
    console.log("   - Network connectivity problems");
    console.log("   - Missing required tables in Supabase");
  }
}

// Run the debug
debugMetadataCache().catch(console.error);
