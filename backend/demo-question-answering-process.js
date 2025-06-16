/**
 * Demo: Complete User Question Answering Process
 * Shows step-by-step how a user question gets processed and answered
 */

require('dotenv').config();

// Import our enhanced services
const MultiVectorSearchService = require('./services/multiVectorSearchService');
const LLMMetadataService = require('./services/llmMetadataService');
const EnhancedEmbeddingService = require('./services/enhancedEmbeddingService');
const SupabaseChunkStorage = require('./services/supabaseChunkStorage');

/**
 * Demo Configuration
 */
const DEMO_CONFIG = {
  chatbotId: 'demo_chatbot_123',
  userQuestion: 'What is machine learning and how does it work?',
  // Simulated user context
  userContext: {
    userId: 'user_123',
    sessionId: 'session_456',
    previousQuestions: [
      'Tell me about artificial intelligence',
      'What are the different types of AI?'
    ]
  }
};

/**
 * Step 1: Receive and Analyze User Question
 */
async function step1_AnalyzeUserQuestion(question, context) {
  console.log('🔍 STEP 1: ANALYZING USER QUESTION');
  console.log('=' .repeat(60));
  console.log(`📝 User Question: "${question}"`);
  console.log(`👤 User Context: ${context.previousQuestions.length} previous questions`);
  console.log(`🔗 Session ID: ${context.sessionId}`);
  
  // Initialize LLM metadata service for query analysis
  const metadataService = new LLMMetadataService();
  
  try {
    console.log('\n🧠 Analyzing question with LLM...');
    const queryAnalysis = await metadataService.analyzeQueryMetadata(question);
    
    console.log('✅ Query Analysis Results:');
    console.log(`   🎯 Intent: ${queryAnalysis.intent}`);
    console.log(`   📚 Topics: ${JSON.stringify(queryAnalysis.topics)}`);
    console.log(`   🔑 Keywords: ${JSON.stringify(queryAnalysis.keywords)}`);
    console.log(`   ❓ Question Type: ${JSON.stringify(queryAnalysis.question_type)}`);
    console.log(`   📊 Complexity Level: ${queryAnalysis.complexity_level}`);
    console.log(`   👥 Audience Level: ${queryAnalysis.audience_level}`);
    console.log(`   🎯 Recommended Strategy: ${queryAnalysis.search_strategy}`);
    console.log(`   ⚖️ Embedding Weights: ${JSON.stringify(queryAnalysis.embedding_weights)}`);
    
    return queryAnalysis;
  } catch (error) {
    console.log('⚠️ LLM analysis failed, using fallback analysis...');
    
    // Fallback analysis
    const fallbackAnalysis = {
      intent: 'search',
      topics: ['machine learning', 'artificial intelligence'],
      keywords: question.toLowerCase().split(/\s+/).filter(w => w.length > 2),
      question_type: ['factual', 'conceptual'],
      complexity_level: 'intermediate',
      audience_level: 'general',
      search_strategy: 'comprehensive',
      embedding_weights: {
        content: 0.4,
        topics: 0.25,
        keywords: 0.2,
        question_type: 0.15
      }
    };
    
    console.log('✅ Fallback Analysis Results:');
    console.log(`   🎯 Intent: ${fallbackAnalysis.intent}`);
    console.log(`   📚 Topics: ${JSON.stringify(fallbackAnalysis.topics)}`);
    console.log(`   🔑 Keywords: ${JSON.stringify(fallbackAnalysis.keywords)}`);
    
    return fallbackAnalysis;
  }
}

/**
 * Step 2: Generate Query Embeddings
 */
async function step2_GenerateQueryEmbeddings(question, queryAnalysis) {
  console.log('\n🎯 STEP 2: GENERATING QUERY EMBEDDINGS');
  console.log('=' .repeat(60));
  
  const embeddingService = new EnhancedEmbeddingService();
  const queryEmbeddings = {};
  
  try {
    console.log('🔄 Generating multiple embedding types for optimal search...');
    
    // Generate content embedding (main query)
    console.log('   📝 Generating content embedding...');
    queryEmbeddings.content = await embeddingService.generateEmbeddingWithCache(question, 'content');
    console.log(`   ✅ Content embedding: ${queryEmbeddings.content.length} dimensions`);
    
    // Generate topic-focused embedding
    if (queryAnalysis.topics?.length > 0) {
      console.log('   📚 Generating topics embedding...');
      const topicsText = embeddingService.convertMetadataToText(queryAnalysis.topics, 'topics');
      queryEmbeddings.topics = await embeddingService.generateEmbeddingWithCache(topicsText, 'topics');
      console.log(`   ✅ Topics embedding: ${queryEmbeddings.topics.length} dimensions`);
    }
    
    // Generate keyword-focused embedding
    if (queryAnalysis.keywords?.length > 0) {
      console.log('   🔑 Generating keywords embedding...');
      const keywordsText = embeddingService.convertMetadataToText(queryAnalysis.keywords, 'keywords');
      queryEmbeddings.keywords = await embeddingService.generateEmbeddingWithCache(keywordsText, 'keywords');
      console.log(`   ✅ Keywords embedding: ${queryEmbeddings.keywords.length} dimensions`);
    }
    
    // Generate question-type embedding
    if (queryAnalysis.question_type?.length > 0) {
      console.log('   ❓ Generating question type embedding...');
      const questionTypeText = embeddingService.convertMetadataToText(queryAnalysis.question_type, 'question_type');
      queryEmbeddings.question_type = await embeddingService.generateEmbeddingWithCache(questionTypeText, 'question_type');
      console.log(`   ✅ Question type embedding: ${queryEmbeddings.question_type.length} dimensions`);
    }
    
    console.log(`\n📊 Generated ${Object.keys(queryEmbeddings).length} embedding types for multi-dimensional search`);
    return queryEmbeddings;
    
  } catch (error) {
    console.log(`⚠️ Embedding generation failed: ${error.message}`);
    console.log('🔄 Using basic content embedding only...');
    
    // Fallback to basic content embedding
    try {
      queryEmbeddings.content = await embeddingService.generateEmbeddingWithCache(question, 'content');
      console.log(`✅ Fallback content embedding: ${queryEmbeddings.content.length} dimensions`);
      return queryEmbeddings;
    } catch (fallbackError) {
      console.log(`❌ All embedding generation failed: ${fallbackError.message}`);
      return {};
    }
  }
}

/**
 * Step 3: Perform Multi-Vector Search
 */
async function step3_PerformMultiVectorSearch(chatbotId, queryEmbeddings, queryAnalysis) {
  console.log('\n🔍 STEP 3: PERFORMING MULTI-VECTOR SEARCH');
  console.log('=' .repeat(60));
  
  const chunkStorage = new SupabaseChunkStorage();
  
  try {
    console.log('🎯 Executing multi-embedding search...');
    console.log(`   📊 Search Strategy: ${queryAnalysis.search_strategy}`);
    console.log(`   ⚖️ Embedding Weights: ${JSON.stringify(queryAnalysis.embedding_weights)}`);
    console.log(`   🎯 Similarity Threshold: 0.7`);
    console.log(`   📄 Max Results: 10`);
    
    const searchResults = await chunkStorage.multiEmbeddingSearch({
      chatbotId: chatbotId,
      embeddings: queryEmbeddings,
      embeddingWeights: queryAnalysis.embedding_weights,
      similarityThreshold: 0.7,
      limit: 10
    });
    
    console.log(`\n✅ Search completed: ${searchResults.length} relevant chunks found`);
    
    if (searchResults.length > 0) {
      console.log('\n📊 Top Search Results:');
      searchResults.slice(0, 3).forEach((result, index) => {
        console.log(`\n   ${index + 1}. Chunk ID: ${result.id}`);
        console.log(`      📊 Combined Similarity: ${(result.combined_similarity || 0).toFixed(3)}`);
        console.log(`      📝 Content Similarity: ${(result.content_similarity || 0).toFixed(3)}`);
        console.log(`      📚 Topics Similarity: ${(result.topics_similarity || 0).toFixed(3)}`);
        console.log(`      🔑 Keywords Similarity: ${(result.keywords_similarity || 0).toFixed(3)}`);
        console.log(`      📄 Content Preview: "${result.content?.substring(0, 100) || 'N/A'}..."`);
        console.log(`      🏷️ Document Section: ${result.document_section || 'N/A'}`);
      });
    } else {
      console.log('⚠️ No relevant chunks found. This could mean:');
      console.log('   • No documents uploaded for this chatbot');
      console.log('   • Similarity threshold too high');
      console.log('   • Question not related to uploaded content');
    }
    
    return searchResults;
    
  } catch (error) {
    console.log(`❌ Multi-vector search failed: ${error.message}`);
    console.log('🔄 Attempting fallback search...');
    
    try {
      // Fallback to basic content search
      const fallbackResults = await chunkStorage.hybridSearch({
        chatbotId: chatbotId,
        queryEmbeddings: { content: queryEmbeddings.content },
        embeddingWeights: { content: 1.0 },
        metadataFilters: {},
        similarityThreshold: 0.5,
        limit: 5,
        useMultiEmbedding: false
      });
      
      console.log(`✅ Fallback search completed: ${fallbackResults.length} chunks found`);
      return fallbackResults;
      
    } catch (fallbackError) {
      console.log(`❌ Fallback search also failed: ${fallbackError.message}`);
      return [];
    }
  }
}

/**
 * Step 4: Generate AI Response
 */
async function step4_GenerateAIResponse(question, searchResults, queryAnalysis) {
  console.log('\n🤖 STEP 4: GENERATING AI RESPONSE');
  console.log('=' .repeat(60));
  
  console.log('📝 Preparing context for AI response generation...');
  console.log(`   📚 Retrieved Chunks: ${searchResults.length}`);
  console.log(`   🎯 Question Type: ${queryAnalysis.question_type?.join(', ') || 'general'}`);
  console.log(`   📊 Complexity Level: ${queryAnalysis.complexity_level}`);
  
  // Prepare context from search results
  const context = searchResults.slice(0, 5).map((result, index) => {
    return {
      chunkId: result.id,
      content: result.content,
      relevance: result.combined_similarity || result.content_similarity || 0,
      section: result.document_section,
      metadata: result.metadata
    };
  });
  
  console.log('\n📋 Context Preparation:');
  context.forEach((chunk, index) => {
    console.log(`   ${index + 1}. Relevance: ${chunk.relevance.toFixed(3)} | Section: ${chunk.section || 'N/A'}`);
    console.log(`      Content: "${chunk.content?.substring(0, 80) || 'N/A'}..."`);
  });
  
  // Simulate AI response generation (in real implementation, this would call your LLM)
  const simulatedResponse = generateSimulatedResponse(question, context, queryAnalysis);
  
  console.log('\n✅ AI Response Generated:');
  console.log(`📝 Response Length: ${simulatedResponse.response.length} characters`);
  console.log(`📚 Sources Used: ${simulatedResponse.sourcesUsed} chunks`);
  console.log(`🎯 Confidence: ${simulatedResponse.confidence}`);
  
  console.log('\n🤖 AI Response:');
  console.log('─'.repeat(60));
  console.log(simulatedResponse.response);
  console.log('─'.repeat(60));
  
  return simulatedResponse;
}

/**
 * Simulate AI response generation
 */
function generateSimulatedResponse(question, context, queryAnalysis) {
  if (context.length === 0) {
    return {
      response: `I don't have specific information about "${question}" in the uploaded documents. Could you please upload relevant documents or ask about topics that are covered in the existing knowledge base?`,
      sourcesUsed: 0,
      confidence: 'low',
      sources: []
    };
  }
  
  // Simulate a comprehensive response based on context
  const response = `Based on the information in your documents, I can provide you with a comprehensive answer about ${queryAnalysis.topics?.join(' and ') || 'your question'}.

${context.slice(0, 3).map((chunk, index) => 
  `**Key Point ${index + 1}** (from ${chunk.section || 'document'}):
${chunk.content?.substring(0, 200) || 'Content not available'}...`
).join('\n\n')}

This information comes from ${context.length} relevant sections of your uploaded documents, with high confidence based on the semantic similarity to your question.

Would you like me to elaborate on any specific aspect or provide more details about any particular point?`;

  return {
    response: response,
    sourcesUsed: context.length,
    confidence: context.length >= 3 ? 'high' : context.length >= 1 ? 'medium' : 'low',
    sources: context.map(chunk => ({
      chunkId: chunk.chunkId,
      section: chunk.section,
      relevance: chunk.relevance
    }))
  };
}

/**
 * Step 5: Return Response to User
 */
async function step5_ReturnResponse(response, searchResults) {
  console.log('\n📤 STEP 5: RETURNING RESPONSE TO USER');
  console.log('=' .repeat(60));
  
  const finalResponse = {
    success: true,
    response: response.response,
    metadata: {
      sourcesUsed: response.sourcesUsed,
      confidence: response.confidence,
      searchResults: searchResults.length,
      processingTime: Date.now(),
      searchStrategy: 'multi_vector_enhanced'
    },
    sources: response.sources,
    suggestions: [
      'Can you tell me more about this topic?',
      'What are the practical applications?',
      'Are there any examples or case studies?'
    ]
  };
  
  console.log('✅ Final Response Prepared:');
  console.log(`   📊 Success: ${finalResponse.success}`);
  console.log(`   📚 Sources Used: ${finalResponse.metadata.sourcesUsed}`);
  console.log(`   🎯 Confidence: ${finalResponse.metadata.confidence}`);
  console.log(`   🔍 Search Results: ${finalResponse.metadata.searchResults}`);
  console.log(`   💡 Suggestions: ${finalResponse.suggestions.length} follow-up questions`);
  
  return finalResponse;
}

/**
 * Main Demo Function - Complete Question Answering Process
 */
async function demonstrateQuestionAnsweringProcess() {
  console.log('🚀 DEMONSTRATING COMPLETE QUESTION ANSWERING PROCESS');
  console.log('=' .repeat(80));
  console.log(`❓ Demo Question: "${DEMO_CONFIG.userQuestion}"`);
  console.log(`🤖 Chatbot ID: ${DEMO_CONFIG.chatbotId}`);
  console.log('=' .repeat(80));
  
  try {
    // Step 1: Analyze user question
    const queryAnalysis = await step1_AnalyzeUserQuestion(
      DEMO_CONFIG.userQuestion, 
      DEMO_CONFIG.userContext
    );
    
    // Step 2: Generate query embeddings
    const queryEmbeddings = await step2_GenerateQueryEmbeddings(
      DEMO_CONFIG.userQuestion, 
      queryAnalysis
    );
    
    // Step 3: Perform multi-vector search
    const searchResults = await step3_PerformMultiVectorSearch(
      DEMO_CONFIG.chatbotId, 
      queryEmbeddings, 
      queryAnalysis
    );
    
    // Step 4: Generate AI response
    const aiResponse = await step4_GenerateAIResponse(
      DEMO_CONFIG.userQuestion, 
      searchResults, 
      queryAnalysis
    );
    
    // Step 5: Return response to user
    const finalResponse = await step5_ReturnResponse(aiResponse, searchResults);
    
    // Summary
    console.log('\n🎉 QUESTION ANSWERING PROCESS COMPLETED!');
    console.log('=' .repeat(80));
    console.log('✅ Process Summary:');
    console.log('   1. ✅ Question analyzed with LLM intelligence');
    console.log('   2. ✅ Multi-dimensional embeddings generated');
    console.log('   3. ✅ Advanced vector search performed');
    console.log('   4. ✅ AI response generated with context');
    console.log('   5. ✅ Response delivered to user');
    console.log('\n🚀 Your enhanced RAG system provides superior question answering!');
    
    return finalResponse;
    
  } catch (error) {
    console.error('\n❌ Question answering process failed:', error.message);
    console.error('Stack trace:', error.stack);
    throw error;
  }
}

// Run the demo if this file is executed directly
if (require.main === module) {
  demonstrateQuestionAnsweringProcess()
    .then((response) => {
      console.log('\n✅ Demo completed successfully');
      console.log('📋 Final Response Object:', JSON.stringify(response, null, 2));
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Demo failed:', error);
      process.exit(1);
    });
}

module.exports = { demonstrateQuestionAnsweringProcess, DEMO_CONFIG };
