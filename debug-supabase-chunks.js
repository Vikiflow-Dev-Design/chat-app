const dotenv = require("dotenv");
const path = require("path");

// Load environment variables from backend directory
dotenv.config({ path: path.join(__dirname, "backend", ".env") });

const { createClient } = require("@supabase/supabase-js");

console.log("🔍 Debugging Supabase Chunks Storage...\n");

async function debugSupabaseChunks() {
  try {
    // Check environment variables
    console.log("1. Environment Variables:");
    console.log(
      "   SUPABASE_URL:",
      process.env.SUPABASE_URL ? "✅ Set" : "❌ Missing"
    );
    console.log(
      "   SUPABASE_ANON_KEY:",
      process.env.SUPABASE_ANON_KEY ? "✅ Set" : "❌ Missing"
    );

    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
      console.log("\n❌ Missing Supabase environment variables!");
      console.log(
        "Please check your .env file and ensure SUPABASE_URL and SUPABASE_ANON_KEY are set."
      );
      return;
    }

    // Create Supabase client
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );
    console.log("\n2. Supabase Connection: ✅ Client created");

    // Check if tables exist
    console.log("\n3. Checking Tables:");

    const tables = [
      "chatbot_knowledge_chunks",
      "chunk_metadata",
      "chunk_relationships",
    ];

    for (const table of tables) {
      try {
        const { data, error, count } = await supabase
          .from(table)
          .select("*", { count: "exact" })
          .limit(1);

        if (error) {
          console.log(`   ❌ ${table}: ${error.message}`);
          if (error.message.includes("does not exist")) {
            console.log(`      💡 Table ${table} needs to be created`);
          }
        } else {
          console.log(`   ✅ ${table}: exists (${count || 0} rows)`);
        }
      } catch (tableError) {
        console.log(`   ❌ ${table}: ${tableError.message}`);
      }
    }

    // Check for recent chunks
    console.log("\n4. Recent Chunks:");
    try {
      const { data: recentChunks, error } = await supabase
        .from("chatbot_knowledge_chunks")
        .select(
          "id, chatbot_id, document_id, chunk_type, content_length, created_at"
        )
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) {
        console.log(`   ❌ Error fetching chunks: ${error.message}`);
      } else if (recentChunks.length === 0) {
        console.log("   📭 No chunks found in database");
      } else {
        console.log(`   📦 Found ${recentChunks.length} recent chunks:`);
        recentChunks.forEach((chunk, index) => {
          console.log(`      ${index + 1}. ID: ${chunk.id}`);
          console.log(`         Chatbot: ${chunk.chatbot_id}`);
          console.log(`         Document: ${chunk.document_id}`);
          console.log(`         Type: ${chunk.chunk_type}`);
          console.log(`         Length: ${chunk.content_length} chars`);
          console.log(
            `         Created: ${new Date(chunk.created_at).toLocaleString()}`
          );
          console.log("");
        });
      }
    } catch (chunkError) {
      console.log(`   ❌ Error checking chunks: ${chunkError.message}`);
    }

    // Check for chunks by chatbot ID (if you have a specific one)
    console.log("\n5. Chunks by Chatbot:");
    try {
      const { data: chatbotChunks, error } = await supabase
        .from("chatbot_knowledge_chunks")
        .select("chatbot_id, count(*)")
        .group("chatbot_id");

      if (error) {
        console.log(`   ❌ Error grouping by chatbot: ${error.message}`);
      } else if (chatbotChunks.length === 0) {
        console.log("   📭 No chunks found for any chatbot");
      } else {
        console.log(`   📊 Chunks per chatbot:`);
        chatbotChunks.forEach((group) => {
          console.log(
            `      Chatbot ${group.chatbot_id}: ${group.count} chunks`
          );
        });
      }
    } catch (groupError) {
      console.log(`   ❌ Error grouping chunks: ${groupError.message}`);
    }

    // Test chunk insertion (optional)
    console.log("\n6. Testing Chunk Insertion:");
    const testChunk = {
      id: `test_chunk_${Date.now()}`,
      chatbot_id: "test_chatbot",
      document_id: "test_document",
      content: "This is a test chunk for debugging purposes.",
      chunk_type: "text",
      chunk_index: 1,
      content_length: 45,
      word_count: 9,
      heading_context: JSON.stringify(["Test Section"]),
      document_section: "test",
      created_at: new Date().toISOString(),
    };

    try {
      const { data: insertResult, error: insertError } = await supabase
        .from("chatbot_knowledge_chunks")
        .insert(testChunk)
        .select();

      if (insertError) {
        console.log(`   ❌ Test insertion failed: ${insertError.message}`);
        console.log(`   💡 This might indicate permission or schema issues`);
      } else {
        console.log(
          `   ✅ Test chunk inserted successfully: ${insertResult[0].id}`
        );

        // Clean up test chunk
        await supabase
          .from("chatbot_knowledge_chunks")
          .delete()
          .eq("id", testChunk.id);
        console.log(`   🧹 Test chunk cleaned up`);
      }
    } catch (insertTestError) {
      console.log(`   ❌ Test insertion error: ${insertTestError.message}`);
    }

    console.log("\n✅ Supabase debugging complete!");
  } catch (error) {
    console.error("\n❌ Debug failed:", error.message);
    console.log("\n💡 Troubleshooting steps:");
    console.log("   1. Verify your Supabase project URL and API key");
    console.log("   2. Check if the pgvector extension is enabled");
    console.log(
      "   3. Run the SQL schema from backend/database/supabase-chunk-schema.sql"
    );
    console.log("   4. Verify Row Level Security (RLS) policies if enabled");
  }
}

// Run the debug
debugSupabaseChunks().catch(console.error);
