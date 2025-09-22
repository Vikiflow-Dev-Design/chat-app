const dotenv = require('dotenv');
const mongoose = require('mongoose');
const VectorProcessingService = require('./services/vectorProcessingService');
const ChatbotKnowledge = require('./models/ChatbotKnowledge');

dotenv.config();

console.log('🔄 Processing Existing Knowledge for Vector Storage...\n');

async function processExistingKnowledge() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Initialize vector processing service
    const vectorService = new VectorProcessingService();
    console.log('✅ Vector processing service initialized');
    
    // Get all knowledge documents
    const knowledgeDocuments = await ChatbotKnowledge.find();
    console.log(`📚 Found ${knowledgeDocuments.length} knowledge documents\n`);
    
    if (knowledgeDocuments.length === 0) {
      console.log('No knowledge documents found to process.');
      return;
    }
    
    let totalProcessed = 0;
    let totalErrors = 0;
    
    for (const knowledge of knowledgeDocuments) {
      console.log(`🤖 Processing chatbot: ${knowledge.chatbotId}`);
      
      // Process files
      if (knowledge.files && knowledge.files.length > 0) {
        console.log(`   📄 Processing ${knowledge.files.length} files...`);
        
        for (const file of knowledge.files) {
          if (file.isActive) {
            try {
              console.log(`      📝 Processing file: ${file.title}`);
              const result = await vectorService.processFileContent(file, knowledge.chatbotId.toString());
              console.log(`      ✅ File processed: ${result.chunksStored} chunks stored`);
              totalProcessed++;
            } catch (error) {
              console.log(`      ❌ File processing failed: ${error.message}`);
              totalErrors++;
            }
          }
        }
      }
      
      // Process texts
      if (knowledge.texts && knowledge.texts.length > 0) {
        console.log(`   📝 Processing ${knowledge.texts.length} text entries...`);
        
        for (const text of knowledge.texts) {
          if (text.isActive) {
            try {
              console.log(`      📄 Processing text: ${text.title}`);
              const result = await vectorService.processTextContent(text, knowledge.chatbotId.toString());
              console.log(`      ✅ Text processed: ${result.chunksStored} chunks stored`);
              totalProcessed++;
            } catch (error) {
              console.log(`      ❌ Text processing failed: ${error.message}`);
              totalErrors++;
            }
          }
        }
      }
      
      // Process Q&A items
      if (knowledge.qaItems && knowledge.qaItems.length > 0) {
        console.log(`   ❓ Processing ${knowledge.qaItems.length} Q&A groups...`);
        
        for (const qaGroup of knowledge.qaItems) {
          if (qaGroup.isActive) {
            try {
              console.log(`      📋 Processing Q&A: ${qaGroup.title}`);
              const result = await vectorService.processQAContent(qaGroup, knowledge.chatbotId.toString());
              console.log(`      ✅ Q&A processed: ${result.chunksStored} chunks stored`);
              totalProcessed++;
            } catch (error) {
              console.log(`      ❌ Q&A processing failed: ${error.message}`);
              totalErrors++;
            }
          }
        }
      }
      
      console.log(''); // Empty line for readability
    }
    
    console.log('🎉 Processing Complete!');
    console.log(`📊 Summary:`);
    console.log(`   ✅ Successfully processed: ${totalProcessed} items`);
    console.log(`   ❌ Errors: ${totalErrors} items`);
    
    if (totalProcessed > 0) {
      console.log('\n🔍 Testing vector search...');
      
      // Test vector search with the first chatbot
      const firstKnowledge = knowledgeDocuments[0];
      const testQuery = "What information do you have?";
      
      try {
        const searchResults = await vectorService.semanticSearch(
          testQuery,
          firstKnowledge.chatbotId.toString(),
          3,
          0.5
        );
        
        console.log(`   📊 Search test: Found ${searchResults.length} results`);
        if (searchResults.length > 0) {
          console.log(`   🎯 Best match similarity: ${searchResults[0].similarity?.toFixed(4)}`);
          console.log(`   📝 Preview: "${searchResults[0].chunk_text?.substring(0, 100)}..."`);
        }
      } catch (searchError) {
        console.log(`   ❌ Search test failed: ${searchError.message}`);
      }
    }
    
    console.log('\n📋 Next Steps:');
    console.log('   1. Test your chatbot by asking questions');
    console.log('   2. The AI should now use vector search to find relevant information');
    console.log('   3. Check the chat logs for "Found X relevant knowledge chunks via vector search"');
    
  } catch (error) {
    console.error('\n❌ Processing failed:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run processing
processExistingKnowledge().catch(console.error);
