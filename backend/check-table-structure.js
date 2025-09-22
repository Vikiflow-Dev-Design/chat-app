const dotenv = require("dotenv");
const { createClient } = require("@supabase/supabase-js");

dotenv.config();

async function checkTableStructure() {
  try {
    console.log("🔍 CHECKING SUPABASE TABLE STRUCTURE");
    console.log("====================================\n");

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );

    // Check the structure of chatbot_knowledge_chunks table
    console.log("1. Checking chatbot_knowledge_chunks table structure:");
    
    const { data: chunks, error: chunksError } = await supabase
      .from("chatbot_knowledge_chunks")
      .select("*")
      .limit(1);

    if (chunksError) {
      console.log(`   ❌ Error: ${chunksError.message}`);
    } else if (chunks && chunks.length > 0) {
      console.log("   ✅ Sample record found");
      console.log("   📋 Available columns:");
      Object.keys(chunks[0]).forEach(column => {
        console.log(`      - ${column}`);
      });
    } else {
      console.log("   ⚠️  Table exists but no data found");
      
      // Try to get table info from information_schema
      console.log("\n   🔍 Attempting to get column info from information_schema...");
      
      const { data: columnInfo, error: columnError } = await supabase
        .rpc('get_table_columns', { table_name: 'chatbot_knowledge_chunks' });
      
      if (columnError) {
        console.log(`   ❌ Could not get column info: ${columnError.message}`);
      } else {
        console.log("   📋 Table columns:");
        columnInfo?.forEach(col => {
          console.log(`      - ${col.column_name} (${col.data_type})`);
        });
      }
    }

    // Check chunk_metadata table
    console.log("\n2. Checking chunk_metadata table structure:");
    
    const { data: metadata, error: metadataError } = await supabase
      .from("chunk_metadata")
      .select("*")
      .limit(1);

    if (metadataError) {
      console.log(`   ❌ Error: ${metadataError.message}`);
    } else if (metadata && metadata.length > 0) {
      console.log("   ✅ Sample record found");
      console.log("   📋 Available columns:");
      Object.keys(metadata[0]).forEach(column => {
        console.log(`      - ${column}`);
      });
    } else {
      console.log("   ⚠️  Table exists but no data found");
    }

    // Check what columns the MetadataCacheService expects
    console.log("\n3. Expected columns by MetadataCacheService:");
    console.log("   📋 Required in chatbot_knowledge_chunks:");
    const expectedColumns = [
      "id", "document_id", "chunk_index", "chunk_type", 
      "document_section", "heading_context", "metadata", 
      "content_length", "word_count", "created_at"
    ];
    
    expectedColumns.forEach(col => {
      console.log(`      - ${col}`);
    });

    console.log("\n   📋 Required in chunk_metadata:");
    const expectedMetadataColumns = [
      "topics", "keywords", "entities", "complexity_level",
      "question_types", "audience", "prerequisites", "related_concepts"
    ];
    
    expectedMetadataColumns.forEach(col => {
      console.log(`      - ${col}`);
    });

    console.log("\n4. Diagnosis:");
    if (chunks && chunks.length > 0) {
      const hasMetadataColumn = chunks[0].hasOwnProperty('metadata');
      if (!hasMetadataColumn) {
        console.log("   ❌ ISSUE FOUND: 'metadata' column is missing from chatbot_knowledge_chunks table");
        console.log("   💡 SOLUTION: You need to add the missing column or update your table schema");
      } else {
        console.log("   ✅ All required columns appear to be present");
      }
    }

  } catch (error) {
    console.error("❌ Error checking table structure:", error.message);
  }
}

checkTableStructure().catch(console.error);
