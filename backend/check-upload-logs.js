const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');
const mongoose = require('mongoose');

dotenv.config();

// Import models
const ChatbotKnowledge = require('./models/ChatbotKnowledge');
const Chatbot = require('./models/Chatbot');

console.log('🔍 Checking Upload Logs and Database State...\n');

async function checkUploadState() {
  try {
    // 1. Connect to MongoDB
    console.log('1. Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('   ✅ Connected to MongoDB');

    // 2. Check recent chatbot knowledge uploads
    console.log('\n2. Checking recent uploads in MongoDB...');
    const recentKnowledge = await ChatbotKnowledge.find({})
      .sort({ updatedAt: -1 })
      .limit(5);

    console.log(`   📊 Found ${recentKnowledge.length} knowledge documents`);

    recentKnowledge.forEach((knowledge, index) => {
      console.log(`\n   ${index + 1}. Chatbot ID: ${knowledge.chatbotId}`);
      console.log(`      Files: ${knowledge.files.length}`);
      
      knowledge.files.forEach((file, fileIndex) => {
        console.log(`      File ${fileIndex + 1}: ${file.name}`);
        console.log(`         Status: ${file.processingStatus}`);
        console.log(`         Advanced RAG: ${file.advancedRAGEnabled || 'false'}`);
        console.log(`         Chunks: ${file.chunkCount || 0}`);
        console.log(`         Supabase Doc ID: ${file.supabaseDocumentId || 'none'}`);
        console.log(`         Created: ${new Date(file.createdAt).toLocaleString()}`);
        if (file.processingError) {
          console.log(`         ❌ Error: ${file.processingError}`);
        }
      });
    });

    // 3. Check Supabase chunks
    console.log('\n3. Checking Supabase chunks...');
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
    
    const { data: chunks, error: chunksError, count } = await supabase
      .from('chatbot_knowledge_chunks')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(10);

    if (chunksError) {
      console.log('   ❌ Error querying Supabase:', chunksError.message);
    } else {
      console.log(`   📦 Total chunks in Supabase: ${count || 0}`);
      
      if (chunks && chunks.length > 0) {
        console.log('   📋 Recent chunks:');
        chunks.forEach((chunk, index) => {
          console.log(`      ${index + 1}. ID: ${chunk.id}`);
          console.log(`         Chatbot: ${chunk.chatbot_id}`);
          console.log(`         Document: ${chunk.document_id}`);
          console.log(`         Content: ${chunk.content.substring(0, 60)}...`);
          console.log(`         Created: ${new Date(chunk.created_at).toLocaleString()}`);
        });
      }
    }

    // 4. Check for failed uploads
    console.log('\n4. Checking for failed uploads...');
    const failedUploads = await ChatbotKnowledge.find({
      'files.processingStatus': 'failed'
    });

    if (failedUploads.length > 0) {
      console.log(`   ❌ Found ${failedUploads.length} documents with failed uploads:`);
      failedUploads.forEach((knowledge, index) => {
        const failedFiles = knowledge.files.filter(f => f.processingStatus === 'failed');
        failedFiles.forEach(file => {
          console.log(`      ${index + 1}. File: ${file.name}`);
          console.log(`         Error: ${file.processingError}`);
          console.log(`         Time: ${new Date(file.createdAt).toLocaleString()}`);
        });
      });
    } else {
      console.log('   ✅ No failed uploads found');
    }

    // 5. Check for processing uploads
    console.log('\n5. Checking for stuck processing uploads...');
    const processingUploads = await ChatbotKnowledge.find({
      'files.processingStatus': { $in: ['processing', 'chunking', 'storing'] }
    });

    if (processingUploads.length > 0) {
      console.log(`   ⏳ Found ${processingUploads.length} documents with uploads in progress:`);
      processingUploads.forEach((knowledge, index) => {
        const processingFiles = knowledge.files.filter(f => 
          ['processing', 'chunking', 'storing'].includes(f.processingStatus)
        );
        processingFiles.forEach(file => {
          console.log(`      ${index + 1}. File: ${file.name}`);
          console.log(`         Status: ${file.processingStatus}`);
          console.log(`         Started: ${new Date(file.createdAt).toLocaleString()}`);
          const timeDiff = Date.now() - new Date(file.createdAt).getTime();
          console.log(`         Duration: ${Math.round(timeDiff / 1000)}s`);
        });
      });
    } else {
      console.log('   ✅ No stuck uploads found');
    }

    // 6. Summary and recommendations
    console.log('\n6. Summary and Recommendations:');
    
    const totalFiles = recentKnowledge.reduce((sum, k) => sum + k.files.length, 0);
    const completedFiles = recentKnowledge.reduce((sum, k) => 
      sum + k.files.filter(f => f.processingStatus === 'completed').length, 0
    );
    const advancedRAGFiles = recentKnowledge.reduce((sum, k) => 
      sum + k.files.filter(f => f.advancedRAGEnabled).length, 0
    );

    console.log(`   📊 Statistics:`);
    console.log(`      Total files uploaded: ${totalFiles}`);
    console.log(`      Completed files: ${completedFiles}`);
    console.log(`      Advanced RAG files: ${advancedRAGFiles}`);
    console.log(`      Supabase chunks: ${count || 0}`);

    if (count === 0 && completedFiles > 0) {
      console.log('\n   🔍 Issue Identified: Files are completing but chunks are not in Supabase');
      console.log('   💡 Possible causes:');
      console.log('      - Supabase storage service is failing silently');
      console.log('      - RLS policies are still blocking inserts');
      console.log('      - Network connectivity issues to Supabase');
      console.log('      - Environment variables are incorrect');
    } else if (completedFiles === 0) {
      console.log('\n   🔍 Issue Identified: No files are completing processing');
      console.log('   💡 Possible causes:');
      console.log('      - Docling service is not running');
      console.log('      - Authentication issues');
      console.log('      - Chunking service errors');
    }

    await mongoose.disconnect();
    console.log('\n✅ Analysis complete!');

  } catch (error) {
    console.error('\n❌ Analysis failed:', error.message);
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
  }
}

// Run the check
checkUploadState().catch(console.error);
