const dotenv = require("dotenv");
const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

dotenv.config();

console.log("🚀 Setting up Supabase Vector Database...\n");

async function setupSupabase() {
  try {
    // Create Supabase client
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );

    console.log("1. Testing Supabase connection...");

    // Test basic connection
    const { data: testData, error: testError } = await supabase
      .from("_supabase_migrations")
      .select("*")
      .limit(1);

    if (testError && !testError.message.includes("does not exist")) {
      console.log("   ❌ Supabase connection failed:", testError.message);
      return;
    }

    console.log("   ✅ Supabase connection successful");

    console.log("\n2. Checking if vector table exists...");

    // Check if vector table exists
    const { data: tableData, error: tableError } = await supabase
      .from("chatbot_knowledge_vectors")
      .select("*")
      .limit(1);

    if (tableError) {
      if (tableError.message.includes("does not exist")) {
        console.log("   ❌ Vector table does not exist");
        console.log("\n3. Creating vector table...");

        // Read the SQL migration file
        const sqlPath = path.join(
          __dirname,
          "migrations",
          "supabase_vector_setup.sql"
        );

        if (!fs.existsSync(sqlPath)) {
          console.log("   ❌ SQL migration file not found at:", sqlPath);
          return;
        }

        const sqlContent = fs.readFileSync(sqlPath, "utf8");
        console.log("   📄 SQL migration file loaded");

        // Split SQL into individual statements
        const statements = sqlContent
          .split(";")
          .map((stmt) => stmt.trim())
          .filter((stmt) => stmt.length > 0 && !stmt.startsWith("--"));

        console.log(`   🔧 Executing ${statements.length} SQL statements...`);

        console.log("\n💡 Manual Setup Required:");
        console.log(
          "   The vector table needs to be created manually in Supabase."
        );
        console.log("\n📋 Setup Instructions:");
        console.log(
          "   1. Go to your Supabase dashboard: https://supabase.com/dashboard"
        );
        console.log("   2. Select your project");
        console.log('   3. Navigate to "SQL Editor" in the left sidebar');
        console.log('   4. Click "New Query"');
        console.log("   5. Copy and paste the entire contents of:");
        console.log("      backend/migrations/supabase_vector_setup.sql");
        console.log('   6. Click "Run" to execute the SQL');
        console.log("   7. Run this setup script again to verify");

        console.log("\n📄 SQL File Location:");
        console.log(`   ${sqlPath}`);

        return;

        // Test the table again
        console.log("\n4. Verifying table creation...");
        const { data: verifyData, error: verifyError } = await supabase
          .from("chatbot_knowledge_vectors")
          .select("*")
          .limit(1);

        if (verifyError) {
          console.log("   ❌ Table verification failed:", verifyError.message);
          console.log("\n💡 Manual Setup Required:");
          console.log("   1. Go to your Supabase dashboard");
          console.log("   2. Navigate to SQL Editor");
          console.log(
            "   3. Copy and paste the contents of backend/migrations/supabase_vector_setup.sql"
          );
          console.log("   4. Execute the SQL script");
          console.log("   5. Run this setup script again");
        } else {
          console.log("   ✅ Vector table created successfully!");
        }
      } else {
        console.log("   ❌ Table check failed:", tableError.message);
      }
    } else {
      console.log("   ✅ Vector table already exists");
      console.log(`   📊 Table has ${tableData?.length || 0} sample records`);
    }

    console.log("\n5. Testing vector operations...");

    // Test insert operation
    const testVector = Array(768)
      .fill(0)
      .map(() => Math.random() - 0.5);
    const { data: insertData, error: insertError } = await supabase
      .from("chatbot_knowledge_vectors")
      .insert({
        chatbot_id: "test-setup",
        knowledge_id: "test-knowledge",
        source_type: "text",
        chunk_text: "This is a test chunk for setup verification.",
        chunk_index: 0,
        embedding: testVector,
        metadata: { test: true },
      })
      .select();

    if (insertError) {
      console.log("   ❌ Vector insert test failed:", insertError.message);
    } else {
      console.log("   ✅ Vector insert test successful");

      // Clean up test data
      const testId = insertData[0]?.id;
      if (testId) {
        await supabase
          .from("chatbot_knowledge_vectors")
          .delete()
          .eq("id", testId);
        console.log("   🧹 Test data cleaned up");
      }
    }

    console.log("\n🎉 Supabase setup complete!");
    console.log("\n📋 Next steps:");
    console.log(
      "   1. Upload some knowledge to your chatbot (files, text, or Q&A)"
    );
    console.log("   2. Test the chat functionality");
    console.log(
      "   3. The AI should now use vector search to answer questions"
    );
  } catch (error) {
    console.error("\n❌ Setup failed:", error.message);
    console.log("\n💡 Troubleshooting:");
    console.log("   1. Check your SUPABASE_URL and SUPABASE_ANON_KEY");
    console.log(
      "   2. Ensure your Supabase project has the pgvector extension enabled"
    );
    console.log("   3. Check your Supabase project permissions");
  }
}

// Run setup
setupSupabase().catch(console.error);
