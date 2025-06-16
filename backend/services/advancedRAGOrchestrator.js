/**
 * Advanced RAG Orchestrator
 * Coordinates the entire advanced RAG workflow from query to answer
 */

const IntelligentQueryProcessor = require('./intelligentQueryProcessor');
const HybridSearchService = require('./hybridSearchService');
const ContextAwareAnswerGenerator = require('./contextAwareAnswerGenerator');
const SupabaseChunkStorage = require('./supabaseChunkStorage');

class AdvancedRAGOrchestrator {
  constructor() {
    this.queryProcessor = new IntelligentQueryProcessor();
    this.hybridSearch = new HybridSearchService();
    this.answerGenerator = new ContextAwareAnswerGenerator();
    this.chunkStorage = new SupabaseChunkStorage();
  }

  /**
   * Process a complete RAG workflow from user query to final answer
   * @param {Object} params - RAG processing parameters
   * @returns {Promise<Object>} Complete RAG response
   */
  async processRAGWorkflow(params) {
    const startTime = Date.now();
    
    try {
      const {
        userQuery,
        chatbotId,
        conversationId,
        userProfile = {},
        chatbotConfig = {},
        options = {}
      } = params;

      console.log(`🚀 Starting Advanced RAG Workflow for: "${userQuery}"`);

      // Step 1: Get available metadata from knowledge base
      const availableMetadata = await this.getAvailableMetadata(chatbotId);
      
      // Step 2: Intelligent Query Processing
      console.log('\n📋 Step 1: Intelligent Query Processing');
      const processedQuery = await this.queryProcessor.processQuery(
        userQuery,
        chatbotId,
        conversationId,
        availableMetadata
      );

      // Handle special cases (unclear queries, clarification needed)
      if (processedQuery.queryProcessingResult === 'clarification_needed') {
        return this.handleClarificationNeeded(processedQuery, startTime);
      }

      // Step 3: Hybrid Search
      console.log('\n🔍 Step 2: Hybrid Search');
      const searchResults = await this.hybridSearch.performHybridSearch({
        processedQuery,
        chatbotId,
        conversationId,
        maxResults: options.maxResults || 10,
        includeRelated: options.includeRelated !== false,
        contextWindow: options.contextWindow || 3
      });

      // Handle no results
      if (searchResults.results.length === 0) {
        return this.handleNoResults(userQuery, processedQuery, startTime);
      }

      // Step 4: Context-Aware Answer Generation
      console.log('\n🤖 Step 3: Context-Aware Answer Generation');
      const generatedAnswer = await this.answerGenerator.generateAnswer({
        userQuery,
        processedQuery,
        searchResults: searchResults.results,
        conversationContext: this.queryProcessor.getConversationContext(conversationId),
        userProfile,
        chatbotConfig
      });

      // Step 5: Compile final response
      const finalResponse = this.compileFinalResponse(
        userQuery,
        processedQuery,
        searchResults,
        generatedAnswer,
        startTime
      );

      console.log(`\n✅ Advanced RAG Workflow completed in ${Date.now() - startTime}ms`);
      return finalResponse;

    } catch (error) {
      console.error('Error in Advanced RAG Workflow:', error);
      return this.handleError(error, params.userQuery, startTime);
    }
  }

  /**
   * Get available metadata from the knowledge base
   * @param {string} chatbotId - Chatbot ID
   * @returns {Promise<Object>} Available metadata
   */
  async getAvailableMetadata(chatbotId) {
    try {
      const stats = await this.chunkStorage.getChunkStatistics(chatbotId);
      return {
        topics: stats.topics || [],
        questionTypes: stats.questionTypes || [],
        audiences: stats.audiences || [],
        complexityLevels: stats.complexityLevels || ['beginner', 'intermediate', 'advanced']
      };
    } catch (error) {
      console.warn('Could not get metadata from knowledge base:', error.message);
      // Return default metadata
      return {
        topics: ['General'],
        questionTypes: ['general'],
        audiences: ['general'],
        complexityLevels: ['beginner', 'intermediate', 'advanced']
      };
    }
  }

  /**
   * Handle clarification needed response
   * @param {Object} processedQuery - Processed query with clarification
   * @param {number} startTime - Start time
   * @returns {Object} Clarification response
   */
  handleClarificationNeeded(processedQuery, startTime) {
    console.log('💬 Handling clarification needed...');
    
    return {
      type: 'clarification_needed',
      message: processedQuery.message,
      suggestions: processedQuery.suggestions,
      availableTopics: processedQuery.availableTopics,
      originalQuery: processedQuery.originalQuery,
      processingTime: Date.now() - startTime,
      workflow: {
        step: 'query_processing',
        result: 'clarification_needed'
      }
    };
  }

  /**
   * Handle no search results
   * @param {string} userQuery - Original user query
   * @param {Object} processedQuery - Processed query
   * @param {number} startTime - Start time
   * @returns {Object} No results response
   */
  handleNoResults(userQuery, processedQuery, startTime) {
    console.log('🔍 Handling no search results...');
    
    return {
      type: 'no_results',
      message: "I couldn't find specific information about that topic in the knowledge base.",
      suggestions: [
        'Try rephrasing your question',
        'Use different keywords',
        'Ask about a related topic',
        'Check if the information exists in the knowledge base'
      ],
      searchMetadata: processedQuery.searchMetadata,
      originalQuery: userQuery,
      processingTime: Date.now() - startTime,
      workflow: {
        step: 'hybrid_search',
        result: 'no_results'
      }
    };
  }

  /**
   * Handle errors in the workflow
   * @param {Error} error - Error object
   * @param {string} userQuery - Original user query
   * @param {number} startTime - Start time
   * @returns {Object} Error response
   */
  handleError(error, userQuery, startTime) {
    console.error('❌ Handling workflow error:', error);
    
    return {
      type: 'error',
      message: 'I encountered an error while processing your question. Please try again.',
      error: {
        message: error.message,
        type: error.constructor.name
      },
      originalQuery: userQuery,
      processingTime: Date.now() - startTime,
      workflow: {
        step: 'error_handling',
        result: 'error'
      }
    };
  }

  /**
   * Compile the final response with all components
   * @param {string} userQuery - Original user query
   * @param {Object} processedQuery - Processed query
   * @param {Object} searchResults - Search results
   * @param {Object} generatedAnswer - Generated answer
   * @param {number} startTime - Start time
   * @returns {Object} Final compiled response
   */
  compileFinalResponse(userQuery, processedQuery, searchResults, generatedAnswer, startTime) {
    console.log('📦 Compiling final response...');

    const response = {
      // Main answer
      type: 'success',
      answer: generatedAnswer.answer,
      
      // Query processing information
      queryProcessing: {
        originalQuery: userQuery,
        processedType: processedQuery.type,
        intent: processedQuery.queryIntent,
        searchMetadata: processedQuery.searchMetadata,
        confidence: processedQuery.confidence
      },

      // Search information
      searchInfo: {
        strategy: searchResults.searchStrategy,
        totalFound: searchResults.totalFound,
        metadataCandidates: searchResults.metadataCandidates,
        resultsUsed: searchResults.results.length
      },

      // Answer metadata
      answerMetadata: generatedAnswer.answerMetadata,

      // Context information
      context: generatedAnswer.context,

      // Supplementary information
      supplementary: generatedAnswer.supplementary,

      // Source attribution
      sources: generatedAnswer.sources,

      // Response formatting
      formatting: generatedAnswer.formatting,

      // Performance metrics
      performance: {
        totalProcessingTime: Date.now() - startTime,
        queryProcessingTime: processedQuery.processingTime || 0,
        searchTime: searchResults.processingTime || 0,
        answerGenerationTime: generatedAnswer.answerMetadata.processingTime || 0
      },

      // Workflow information
      workflow: {
        version: '1.0.0',
        steps: ['query_processing', 'hybrid_search', 'answer_generation'],
        result: 'success'
      }
    };

    return response;
  }

  /**
   * Process a quick query for simple questions
   * @param {Object} params - Quick query parameters
   * @returns {Promise<Object>} Quick response
   */
  async processQuickQuery(params) {
    const startTime = Date.now();
    
    try {
      const { userQuery, chatbotId, conversationId } = params;

      console.log(`⚡ Processing quick query: "${userQuery}"`);

      // Simple metadata filtering
      const searchResults = await this.chunkStorage.queryChunksByMetadata(
        { keywords: this.extractSimpleKeywords(userQuery), limit: 3 },
        chatbotId
      );

      // Generate quick answer
      const quickAnswer = await this.answerGenerator.generateQuickAnswer(
        userQuery,
        searchResults
      );

      return {
        type: 'quick_success',
        answer: quickAnswer.answer,
        answerMetadata: quickAnswer.answerMetadata,
        sources: quickAnswer.sources,
        processingTime: Date.now() - startTime,
        workflow: {
          version: '1.0.0',
          steps: ['quick_search', 'quick_answer'],
          result: 'success'
        }
      };

    } catch (error) {
      console.error('Error in quick query processing:', error);
      return this.handleError(error, params.userQuery, startTime);
    }
  }

  /**
   * Extract simple keywords for quick queries
   * @param {string} query - User query
   * @returns {Array} Simple keywords
   */
  extractSimpleKeywords(query) {
    return query.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2)
      .filter(word => !['how', 'what', 'why', 'when', 'where', 'the', 'and', 'for', 'with'].includes(word))
      .slice(0, 5);
  }

  /**
   * Get conversation history for context
   * @param {string} conversationId - Conversation ID
   * @returns {Object} Conversation context
   */
  getConversationContext(conversationId) {
    return this.queryProcessor.getConversationContext(conversationId);
  }

  /**
   * Clear conversation context
   * @param {string} conversationId - Conversation ID
   */
  clearConversationContext(conversationId) {
    this.queryProcessor.clearConversationContext(conversationId);
  }

  /**
   * Get system status and health
   * @returns {Object} System status
   */
  getSystemStatus() {
    return {
      status: 'operational',
      components: {
        queryProcessor: 'operational',
        hybridSearch: 'operational',
        answerGenerator: 'operational',
        chunkStorage: 'operational'
      },
      version: '1.0.0',
      features: [
        'intelligent_query_processing',
        'hybrid_search',
        'relationship_aware_chunking',
        'context_aware_answers',
        'conversation_context',
        'metadata_filtering'
      ]
    };
  }
}

module.exports = AdvancedRAGOrchestrator;
