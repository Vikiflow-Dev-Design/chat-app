const dotenv = require("dotenv");
const { createClient } = require("@supabase/supabase-js");
const { EMBEDDING_CONFIG } = require("./config/embeddingConfig");

dotenv.config();

async function checkEmbeddingsStatus() {
  try {
    console.log("🔍 CHECKING EMBEDDINGS STATUS IN PROJECT");
    console.log("======================================\n");

    // 1. Check environment configuration
    console.log("1. Environment Configuration:");
    console.log(`   ENABLE_EMBEDDINGS: ${process.env.ENABLE_EMBEDDINGS || 'not set (defaults to true)'}`);
    console.log(`   ENABLE_VECTOR_SEARCH: ${process.env.ENABLE_VECTOR_SEARCH || 'not set (defaults to true)'}`);
    console.log(`   ENABLE_EMBEDDING_CACHE: ${process.env.ENABLE_EMBEDDING_CACHE || 'not set (defaults to true)'}`);
    console.log(`   GEMINI_API_KEY: ${process.env.GEMINI_API_KEY ? '✅ Set' : '❌ Missing'}`);

    // 2. Check embedding config
    console.log("\n2. Embedding Configuration Status:");
    console.log(`   Embeddings Enabled: ${EMBEDDING_CONFIG.ENABLE_EMBEDDINGS ? '✅ YES' : '❌ NO'}`);
    console.log(`   Vector Search Enabled: ${EMBEDDING_CONFIG.ENABLE_VECTOR_SEARCH ? '✅ YES' : '❌ NO'}`);
    console.log(`   Embedding Cache Enabled: ${EMBEDDING_CONFIG.ENABLE_EMBEDDING_CACHE ? '✅ YES' : '❌ NO'}`);

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );

    // 3. Check if chunks have embeddings
    console.log("\n3. Checking Chunk Embeddings in Database:");
    
    const { data: chunks, error } = await supabase
      .from("chatbot_knowledge_chunks")
      .select("id, content_embedding, topics_embedding, keywords_embedding")
      .limit(5);

    if (error) {
      console.log(`   ❌ Error: ${error.message}`);
      return;
    }

    if (!chunks || chunks.length === 0) {
      console.log("   ⚠️  No chunks found in database");
      return;
    }

    console.log(`   📊 Checked ${chunks.length} chunks:`);
    
    let hasContentEmbeddings = 0;
    let hasTopicsEmbeddings = 0;
    let hasKeywordsEmbeddings = 0;

    chunks.forEach((chunk, idx) => {
      const contentEmb = chunk.content_embedding ? '✅' : '❌';
      const topicsEmb = chunk.topics_embedding ? '✅' : '❌';
      const keywordsEmb = chunk.keywords_embedding ? '✅' : '❌';
      
      console.log(`      Chunk ${idx + 1}: Content ${contentEmb} | Topics ${topicsEmb} | Keywords ${keywordsEmb}`);
      
      if (chunk.content_embedding) hasContentEmbeddings++;
      if (chunk.topics_embedding) hasTopicsEmbeddings++;
      if (chunk.keywords_embedding) hasKeywordsEmbeddings++;
    });

    console.log(`\n   📈 Embedding Statistics:`);
    console.log(`      Content Embeddings: ${hasContentEmbeddings}/${chunks.length} chunks`);
    console.log(`      Topics Embeddings: ${hasTopicsEmbeddings}/${chunks.length} chunks`);
    console.log(`      Keywords Embeddings: ${hasKeywordsEmbeddings}/${chunks.length} chunks`);

    // 4. Test embedding service
    console.log("\n4. Testing Embedding Service:");
    try {
      const EmbeddingService = require("./services/embeddingService");
      const embeddingService = new EmbeddingService();
      
      console.log("   ✅ EmbeddingService initialized successfully");
      
      // Test embedding generation
      const testText = "This is a test query";
      const testEmbedding = await embeddingService.generateEmbedding(testText);
      
      console.log(`   ✅ Test embedding generated: ${testEmbedding.length} dimensions`);
      console.log(`   📊 Sample values: [${testEmbedding.slice(0, 3).map(v => v.toFixed(4)).join(', ')}...]`);
      
    } catch (embeddingError) {
      console.log(`   ❌ EmbeddingService error: ${embeddingError.message}`);
    }

    // 5. Check current query flow
    console.log("\n5. Current Query Processing Flow:");
    
    if (EMBEDDING_CONFIG.ENABLE_EMBEDDINGS && hasContentEmbeddings > 0) {
      console.log("   🎯 PRIMARY: Intelligent RAG with metadata-based chunk selection");
      console.log("   🔄 FALLBACK: Legacy system with vector search using embeddings");
      console.log("   📊 STATUS: ✅ EMBEDDINGS ARE BEING USED");
    } else if (EMBEDDING_CONFIG.ENABLE_EMBEDDINGS && hasContentEmbeddings === 0) {
      console.log("   ⚠️  CONFIGURATION: Embeddings enabled but no embeddings in database");
      console.log("   🔄 LIKELY FLOW: Metadata-only search with behavior prompt fallback");
      console.log("   📊 STATUS: ⚠️  EMBEDDINGS CONFIGURED BUT NOT POPULATED");
    } else {
      console.log("   🚫 CONFIGURATION: Embeddings disabled");
      console.log("   🔄 FLOW: Metadata-only search with behavior prompt fallback");
      console.log("   📊 STATUS: ❌ EMBEDDINGS NOT BEING USED");
    }

    // 6. Recommendations
    console.log("\n6. Recommendations:");
    
    if (!EMBEDDING_CONFIG.ENABLE_EMBEDDINGS) {
      console.log("   🔧 Enable embeddings by setting ENABLE_EMBEDDINGS=true in .env");
    } else if (hasContentEmbeddings === 0) {
      console.log("   🔧 Your chunks need embeddings generated. Options:");
      console.log("      - Re-upload your knowledge files to generate embeddings");
      console.log("      - Run embedding generation script on existing chunks");
      console.log("      - Check if embedding generation failed during upload");
    } else {
      console.log("   ✅ Embeddings are properly configured and populated!");
      console.log("   💡 Your system uses both metadata-based selection AND vector search");
    }

  } catch (error) {
    console.error("❌ Check failed:", error.message);
  }
}

checkEmbeddingsStatus().catch(console.error);
