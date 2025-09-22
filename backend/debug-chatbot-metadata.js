const dotenv = require("dotenv");
const { createClient } = require("@supabase/supabase-js");
const MetadataCacheService = require("./services/intelligentRAG/MetadataCacheService");
const IntelligentRAGService = require("./services/intelligentRAG/IntelligentRAGService");

dotenv.config();

async function debugChatbotMetadata() {
  try {
    console.log("🔍 DEBUGGING CHATBOT METADATA");
    console.log("============================");
    
    const chatbotId = "68397df155fa8d7c57e07e2d";
    console.log(`🤖 Chatbot ID: ${chatbotId}\n`);

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );

    // 1. Check raw chunks in database
    console.log("1. RAW CHUNKS IN DATABASE:");
    console.log("==========================");
    
    const { data: rawChunks, error: rawError } = await supabase
      .from("chatbot_knowledge_chunks")
      .select(`
        id,
        document_id,
        chunk_index,
        chunk_type,
        document_section,
        heading_context,
        content_length,
        word_count,
        content,
        created_at
      `)
      .eq("chatbot_id", chatbotId)
      .order("chunk_index", { ascending: true });

    if (rawError) {
      console.log(`❌ Error fetching raw chunks: ${rawError.message}`);
      return;
    }

    console.log(`📊 Total chunks found: ${rawChunks.length}`);
    
    rawChunks.forEach((chunk, idx) => {
      console.log(`\n📄 Chunk ${idx + 1}:`);
      console.log(`   ID: ${chunk.id}`);
      console.log(`   Document ID: ${chunk.document_id}`);
      console.log(`   Index: ${chunk.chunk_index}`);
      console.log(`   Type: ${chunk.chunk_type || 'N/A'}`);
      console.log(`   Section: ${chunk.document_section || 'N/A'}`);
      console.log(`   Heading: ${chunk.heading_context || 'N/A'}`);
      console.log(`   Content Length: ${chunk.content_length}`);
      console.log(`   Word Count: ${chunk.word_count}`);
      console.log(`   Content Preview: "${chunk.content.substring(0, 200)}..."`);
      
      // Check if content contains "Victor" or "Ezekiel"
      const hasVictor = chunk.content.toLowerCase().includes('victor');
      const hasEzekiel = chunk.content.toLowerCase().includes('ezekiel');
      console.log(`   Contains "Victor": ${hasVictor ? '✅' : '❌'}`);
      console.log(`   Contains "Ezekiel": ${hasEzekiel ? '✅' : '❌'}`);
    });

    // 2. Check chunk metadata
    console.log("\n\n2. CHUNK METADATA:");
    console.log("==================");
    
    const { data: metadata, error: metaError } = await supabase
      .from("chunk_metadata")
      .select("*")
      .in("chunk_id", rawChunks.map(c => c.id));

    if (metaError) {
      console.log(`❌ Error fetching metadata: ${metaError.message}`);
    } else {
      console.log(`📊 Metadata records found: ${metadata.length}`);
      
      metadata.forEach((meta, idx) => {
        console.log(`\n🏷️  Metadata ${idx + 1}:`);
        console.log(`   Chunk ID: ${meta.chunk_id}`);
        console.log(`   Topics: ${JSON.stringify(meta.topics)}`);
        console.log(`   Keywords: ${JSON.stringify(meta.keywords)}`);
        console.log(`   Entities: ${JSON.stringify(meta.entities)}`);
        console.log(`   Complexity: ${meta.complexity_level}`);
        console.log(`   Question Types: ${JSON.stringify(meta.question_types)}`);
        console.log(`   Audience: ${JSON.stringify(meta.audience)}`);
        console.log(`   Prerequisites: ${JSON.stringify(meta.prerequisites)}`);
        console.log(`   Related Concepts: ${JSON.stringify(meta.related_concepts)}`);
        
        // Check if metadata contains "Victor" or "Ezekiel"
        const metaStr = JSON.stringify(meta).toLowerCase();
        const hasVictor = metaStr.includes('victor');
        const hasEzekiel = metaStr.includes('ezekiel');
        console.log(`   Metadata contains "Victor": ${hasVictor ? '✅' : '❌'}`);
        console.log(`   Metadata contains "Ezekiel": ${hasEzekiel ? '✅' : '❌'}`);
      });
    }

    // 3. Test metadata cache service
    console.log("\n\n3. METADATA CACHE SERVICE:");
    console.log("==========================");
    
    const metadataCache = new MetadataCacheService();
    const cache = await metadataCache.getMetadataCache(chatbotId);
    
    console.log(`📊 Cache total chunks: ${cache.totalChunks}`);
    console.log(`📅 Cache last updated: ${cache.lastUpdated}`);
    console.log(`⏰ Cache expires at: ${cache.expiresAt}`);
    
    console.log("\n📋 Cached chunk summaries:");
    cache.chunks.forEach((chunk, idx) => {
      console.log(`\n   Chunk ${idx + 1} (${chunk.id}):`);
      console.log(`      Topics: ${JSON.stringify(chunk.topics)}`);
      console.log(`      Keywords: ${JSON.stringify(chunk.keywords)}`);
      console.log(`      Entities: ${JSON.stringify(chunk.entities)}`);
      console.log(`      Document Section: ${chunk.document_section || 'N/A'}`);
      console.log(`      Question Types: ${JSON.stringify(chunk.question_types)}`);
      console.log(`      Audience: ${JSON.stringify(chunk.audience)}`);
      
      // Check if cached data contains "Victor" or "Ezekiel"
      const cacheStr = JSON.stringify(chunk).toLowerCase();
      const hasVictor = cacheStr.includes('victor');
      const hasEzekiel = cacheStr.includes('ezekiel');
      console.log(`      Contains "Victor": ${hasVictor ? '✅' : '❌'}`);
      console.log(`      Contains "Ezekiel": ${hasEzekiel ? '✅' : '❌'}`);
    });

    // 4. Test the actual query
    console.log("\n\n4. TESTING QUERY: 'Who is Victor Ezekiel?'");
    console.log("==========================================");
    
    const intelligentRAG = new IntelligentRAGService();
    const testQuery = "Who is Victor Ezekiel?";
    const behaviorPrompt = "You are a helpful AI assistant.";
    
    console.log(`🔍 Query: "${testQuery}"`);
    console.log("🧠 Processing with Intelligent RAG...");
    
    const result = await intelligentRAG.processQuery(
      chatbotId,
      testQuery,
      behaviorPrompt
    );
    
    console.log(`\n📊 Result Summary:`);
    console.log(`   Success: ${result.success}`);
    console.log(`   Response Type: ${result.response_type}`);
    console.log(`   Fallback Used: ${result.fallback_used}`);
    console.log(`   Chunks Used: ${result.chunks_used ? result.chunks_used.length : 0}`);
    
    if (result.chunks_used && result.chunks_used.length > 0) {
      console.log(`\n📦 Selected Chunks:`);
      result.chunks_used.forEach((chunk, idx) => {
        console.log(`   ${idx + 1}. ${chunk.id} (Index: ${chunk.chunk_index})`);
        console.log(`      Preview: "${chunk.preview}"`);
      });
    }
    
    if (result.metadata) {
      console.log(`\n💭 LLM Analysis:`);
      console.log(`   Reasoning: ${result.metadata.reasoning}`);
      console.log(`   Confidence: ${result.metadata.confidence}`);
    }
    
    if (result.answer) {
      console.log(`\n📝 Generated Answer:`);
      console.log(`"${result.answer}"`);
    }

    // 5. Analysis and recommendations
    console.log("\n\n5. ANALYSIS & RECOMMENDATIONS:");
    console.log("==============================");
    
    const victorChunks = rawChunks.filter(chunk => 
      chunk.content.toLowerCase().includes('victor')
    );
    const ezekielChunks = rawChunks.filter(chunk => 
      chunk.content.toLowerCase().includes('ezekiel')
    );
    
    console.log(`📊 Chunks containing "Victor": ${victorChunks.length}`);
    console.log(`📊 Chunks containing "Ezekiel": ${ezekielChunks.length}`);
    
    if (victorChunks.length === 0 && ezekielChunks.length === 0) {
      console.log("❌ ISSUE: No chunks contain 'Victor' or 'Ezekiel' in content");
      console.log("💡 SOLUTION: Check if the knowledge base was uploaded correctly");
    } else if (metadata.length === 0) {
      console.log("❌ ISSUE: No metadata found for chunks");
      console.log("💡 SOLUTION: Metadata needs to be generated for chunks");
    } else {
      const victorMeta = metadata.filter(meta => 
        JSON.stringify(meta).toLowerCase().includes('victor')
      );
      const ezekielMeta = metadata.filter(meta => 
        JSON.stringify(meta).toLowerCase().includes('ezekiel')
      );
      
      console.log(`📊 Metadata containing "Victor": ${victorMeta.length}`);
      console.log(`📊 Metadata containing "Ezekiel": ${ezekielMeta.length}`);
      
      if (victorMeta.length === 0 && ezekielMeta.length === 0) {
        console.log("❌ ISSUE: Metadata doesn't contain 'Victor' or 'Ezekiel'");
        console.log("💡 SOLUTION: Metadata extraction may need improvement");
      } else {
        console.log("✅ Content and metadata look good");
        console.log("💡 Check LLM analysis prompt or function calling");
      }
    }

  } catch (error) {
    console.error("❌ Debug failed:", error.message);
    console.error(error.stack);
  }
}

debugChatbotMetadata().catch(console.error);
