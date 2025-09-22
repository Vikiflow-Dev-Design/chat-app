const dotenv = require('dotenv');
const mongoose = require('mongoose');
const VectorProcessingService = require('./services/vectorProcessingService');
const { searchKnowledgeBase } = require('./utils/langchainService');
const ChatbotKnowledge = require('./models/ChatbotKnowledge');

dotenv.config();

console.log('🔍 RAG Pipeline Debug Tool\n');

async function debugRAGPipeline() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Get a chatbot with knowledge
    const knowledge = await ChatbotKnowledge.findOne({
      $or: [
        { 'files.0': { $exists: true } },
        { 'texts.0': { $exists: true } },
        { 'qaItems.0': { $exists: true } }
      ]
    });

    if (!knowledge) {
      console.log('❌ No knowledge data found. Please upload some content first.');
      return;
    }

    const chatbotId = knowledge.chatbotId.toString();
    console.log(`🤖 Testing with chatbot: ${chatbotId}`);
    
    // Show what knowledge exists
    console.log('\n📚 Available Knowledge:');
    console.log(`   📄 Files: ${knowledge.files?.length || 0}`);
    console.log(`   📝 Texts: ${knowledge.texts?.length || 0}`);
    console.log(`   ❓ Q&A Groups: ${knowledge.qaItems?.length || 0}`);
    
    // Initialize vector service
    const vectorService = new VectorProcessingService();
    
    // Check vector storage
    console.log('\n🔍 Checking Vector Storage:');
    const stats = await vectorService.vectorService.getVectorStats(chatbotId);
    console.log(`   📊 Total vector chunks: ${stats.totalChunks}`);
    console.log(`   📋 Source types:`, stats.sourceTypes);
    console.log(`   🔗 Unique sources: ${stats.uniqueKnowledgeSources}`);
    
    if (stats.totalChunks === 0) {
      console.log('\n⚠️  No vectors found! Processing knowledge now...');
      
      // Process existing knowledge
      if (knowledge.files?.length > 0) {
        for (const file of knowledge.files) {
          if (file.isActive) {
            console.log(`   📄 Processing file: ${file.title}`);
            try {
              const result = await vectorService.processFileContent(file, chatbotId);
              console.log(`      ✅ Stored ${result.chunksStored} chunks`);
            } catch (error) {
              console.log(`      ❌ Error: ${error.message}`);
            }
          }
        }
      }
      
      if (knowledge.texts?.length > 0) {
        for (const text of knowledge.texts) {
          if (text.isActive) {
            console.log(`   📝 Processing text: ${text.title}`);
            try {
              const result = await vectorService.processTextContent(text, chatbotId);
              console.log(`      ✅ Stored ${result.chunksStored} chunks`);
            } catch (error) {
              console.log(`      ❌ Error: ${error.message}`);
            }
          }
        }
      }
      
      // Update stats
      const newStats = await vectorService.vectorService.getVectorStats(chatbotId);
      console.log(`\n📊 After processing: ${newStats.totalChunks} vector chunks`);
    }
    
    // Test queries
    const testQueries = [
      "What is this document about?",
      "Tell me about the main topics",
      "What information do you have?",
      "artificial intelligence",
      "machine learning"
    ];
    
    console.log('\n🔎 Testing Vector Search:');
    
    for (const query of testQueries) {
      console.log(`\n   Query: "${query}"`);
      
      // Step 1: Generate query embedding
      console.log('   🧠 Generating query embedding...');
      try {
        const queryEmbedding = await vectorService.embeddingService.generateEmbedding(query);
        console.log(`      ✅ Query embedding: ${queryEmbedding.length} dimensions`);
        console.log(`      🔢 Sample values: [${queryEmbedding.slice(0, 3).map(v => v.toFixed(4)).join(', ')}...]`);
        
        // Step 2: Perform vector search
        console.log('   🔍 Performing vector similarity search...');
        const vectorResults = await vectorService.semanticSearch(query, chatbotId, 3, 0.5);
        console.log(`      📊 Vector search results: ${vectorResults.length}`);
        
        if (vectorResults.length > 0) {
          vectorResults.forEach((result, index) => {
            console.log(`      ${index + 1}. Similarity: ${result.similarity?.toFixed(4) || 'N/A'}`);
            console.log(`         Source: ${result.source_type} (${result.knowledge_id})`);
            console.log(`         Text: "${result.chunk_text?.substring(0, 80) || 'N/A'}..."`);
          });
        } else {
          console.log('      ⚠️  No vector results found');
        }
        
        // Step 3: Test full RAG pipeline
        console.log('   🚀 Testing full RAG pipeline...');
        const ragResult = await searchKnowledgeBase(query, chatbotId);
        
        if (ragResult) {
          console.log(`      ✅ RAG result: ${ragResult.length} characters`);
          console.log(`      📝 Preview: "${ragResult.substring(0, 150)}..."`);
        } else {
          console.log('      ❌ RAG returned no results');
        }
        
      } catch (error) {
        console.log(`      ❌ Error: ${error.message}`);
      }
    }
    
    console.log('\n🎯 Debug Summary:');
    console.log('   1. Check if vector chunks are being stored');
    console.log('   2. Verify query embeddings are generated');
    console.log('   3. Confirm similarity search returns results');
    console.log('   4. Ensure RAG pipeline uses vector results');
    
  } catch (error) {
    console.error('\n❌ Debug failed:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
  }
}

debugRAGPipeline().catch(console.error);
