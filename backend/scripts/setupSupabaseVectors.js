/**
 * Setup script for Supabase vector database
 * Run this script after setting up your Supabase project to create the necessary tables and functions
 */

require('dotenv').config();
const { getSupabaseClient } = require('../config/supabase');
const fs = require('fs');
const path = require('path');

async function setupSupabaseVectors() {
  try {
    console.log('🚀 Starting Supabase vector database setup...');
    
    // Check if environment variables are set
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
      throw new Error('Missing Supabase environment variables. Please set SUPABASE_URL and SUPABASE_ANON_KEY');
    }

    const supabase = getSupabaseClient();
    console.log('✅ Connected to Supabase');

    // Read the SQL migration file
    const migrationPath = path.join(__dirname, '../migrations/supabase_vector_setup.sql');
    
    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Migration file not found at: ${migrationPath}`);
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    console.log('📄 Read migration SQL file');

    // Note: The SQL migration needs to be run manually in Supabase SQL editor
    // because the JavaScript client doesn't support running DDL statements
    console.log('\n⚠️  IMPORTANT: Manual Setup Required');
    console.log('=====================================');
    console.log('The vector database setup requires running SQL commands that cannot be executed');
    console.log('through the JavaScript client. Please follow these steps:');
    console.log('');
    console.log('1. Go to your Supabase project dashboard');
    console.log('2. Navigate to the SQL Editor');
    console.log('3. Copy and paste the contents of the following file:');
    console.log(`   ${migrationPath}`);
    console.log('4. Run the SQL commands');
    console.log('');
    console.log('Alternatively, you can copy the SQL from below:');
    console.log('=====================================');
    console.log(migrationSQL);
    console.log('=====================================');

    // Test basic connection
    const { data, error } = await supabase
      .from('chatbot_knowledge_vectors')
      .select('count')
      .limit(1);

    if (error) {
      if (error.message.includes('relation "chatbot_knowledge_vectors" does not exist')) {
        console.log('\n❌ Vector table not found. Please run the SQL migration first.');
        console.log('📋 Copy the SQL from above and run it in your Supabase SQL editor.');
      } else {
        console.log('\n❌ Error testing connection:', error.message);
      }
    } else {
      console.log('\n✅ Vector table exists and is accessible!');
      console.log('🎉 Supabase vector database setup is complete!');
    }

  } catch (error) {
    console.error('❌ Error setting up Supabase vectors:', error.message);
    process.exit(1);
  }
}

// Test vector operations
async function testVectorOperations() {
  try {
    console.log('\n🧪 Testing vector operations...');
    
    const VectorProcessingService = require('../services/vectorProcessingService');
    const vectorService = new VectorProcessingService();

    // Test embedding generation
    console.log('Testing embedding generation...');
    const testText = 'This is a test document for vector processing.';
    const embedding = await vectorService.embeddingService.generateEmbedding(testText);
    
    if (embedding && embedding.length > 0) {
      console.log(`✅ Embedding generated successfully (dimension: ${embedding.length})`);
    } else {
      console.log('❌ Failed to generate embedding');
      return;
    }

    // Test text chunking
    console.log('Testing text chunking...');
    const chunks = vectorService.chunkingService.chunkText(testText, { test: true });
    
    if (chunks && chunks.length > 0) {
      console.log(`✅ Text chunking successful (${chunks.length} chunks)`);
    } else {
      console.log('❌ Failed to chunk text');
      return;
    }

    console.log('🎉 All vector operations are working correctly!');

  } catch (error) {
    console.error('❌ Error testing vector operations:', error.message);
    
    if (error.message.includes('GEMINI_API_KEY')) {
      console.log('💡 Make sure to set your GEMINI_API_KEY environment variable');
    }
  }
}

// Main execution
async function main() {
  await setupSupabaseVectors();
  
  // Ask if user wants to test vector operations
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question('\nWould you like to test vector operations? (y/n): ', async (answer) => {
    if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
      await testVectorOperations();
    }
    
    console.log('\n✨ Setup complete! You can now use vector search in your chatbots.');
    console.log('📚 Next steps:');
    console.log('   1. Upload some knowledge to your chatbots');
    console.log('   2. The system will automatically process them for vector search');
    console.log('   3. Test the improved search capabilities in your chat interface');
    
    rl.close();
  });
}

if (require.main === module) {
  main();
}

module.exports = {
  setupSupabaseVectors,
  testVectorOperations
};
