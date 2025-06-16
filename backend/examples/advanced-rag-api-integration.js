/**
 * Example API Integration for Advanced RAG System
 * Shows how to integrate the advanced RAG workflow into your existing chatbot API
 */

const express = require('express');
const AdvancedRAGOrchestrator = require('../services/advancedRAGOrchestrator');
const RelationshipChunkingService = require('../services/relationshipChunkingService');
const DoclingIntegrationService = require('../services/doclingIntegrationService');
const SupabaseChunkStorage = require('../services/supabaseChunkStorage');

// Initialize services
const ragOrchestrator = new AdvancedRAGOrchestrator();
const chunkingService = new RelationshipChunkingService();
const doclingService = new DoclingIntegrationService();
const chunkStorage = new SupabaseChunkStorage();

/**
 * Enhanced chatbot message endpoint with Advanced RAG
 */
async function handleAdvancedRAGMessage(req, res) {
  try {
    const {
      message,
      chatbotId,
      conversationId,
      userId,
      userProfile = {},
      options = {}
    } = req.body;

    // Validate required fields
    if (!message || !chatbotId) {
      return res.status(400).json({
        error: 'Missing required fields: message and chatbotId'
      });
    }

    console.log(`🤖 Processing message for chatbot ${chatbotId}: "${message}"`);

    // Get chatbot configuration (from your existing database)
    const chatbotConfig = await getChatbotConfig(chatbotId);
    
    // Enhance user profile with any stored preferences
    const enhancedUserProfile = await enhanceUserProfile(userId, userProfile);

    // Process with Advanced RAG
    const response = await ragOrchestrator.processRAGWorkflow({
      userQuery: message,
      chatbotId: chatbotId,
      conversationId: conversationId || `conv_${userId}_${Date.now()}`,
      userProfile: enhancedUserProfile,
      chatbotConfig: chatbotConfig,
      options: {
        maxResults: options.maxResults || 8,
        includeRelated: options.includeRelated !== false,
        contextWindow: options.contextWindow || 3
      }
    });

    // Log interaction for analytics
    await logInteraction({
      userId,
      chatbotId,
      conversationId,
      message,
      response,
      processingTime: response.performance?.totalProcessingTime
    });

    // Format response for frontend
    const formattedResponse = formatResponseForFrontend(response);

    res.json({
      success: true,
      ...formattedResponse
    });

  } catch (error) {
    console.error('Error in advanced RAG message handling:', error);
    
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'I encountered an error while processing your message. Please try again.',
      type: 'error'
    });
  }
}

/**
 * Quick answer endpoint for simple queries
 */
async function handleQuickAnswer(req, res) {
  try {
    const { message, chatbotId, conversationId } = req.body;

    if (!message || !chatbotId) {
      return res.status(400).json({
        error: 'Missing required fields: message and chatbotId'
      });
    }

    const response = await ragOrchestrator.processQuickQuery({
      userQuery: message,
      chatbotId: chatbotId,
      conversationId: conversationId || `quick_${Date.now()}`
    });

    res.json({
      success: true,
      answer: response.answer,
      confidence: response.answerMetadata.confidence,
      processingTime: response.processingTime,
      type: 'quick_answer'
    });

  } catch (error) {
    console.error('Error in quick answer:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

/**
 * Document upload and processing endpoint
 */
async function handleDocumentUpload(req, res) {
  try {
    const { chatbotId } = req.params;
    const uploadedFile = req.file;

    if (!uploadedFile) {
      return res.status(400).json({
        error: 'No file uploaded'
      });
    }

    console.log(`📄 Processing document upload for chatbot ${chatbotId}`);

    // Step 1: Process document with Docling
    const doclingResult = await doclingService.processDocument(
      uploadedFile.path,
      uploadedFile.mimetype.includes('pdf') ? 'pdf' : 'txt',
      'markdown'
    );

    if (!doclingResult.success) {
      throw new Error('Document processing failed');
    }

    // Step 2: Create relationship-based chunks
    const chunks = await chunkingService.processMarkdownToChunks(
      doclingResult.markdownContent,
      doclingResult.metadata,
      {
        maxChunkSize: 800,
        minChunkSize: 100,
        overlapSize: 100
      }
    );

    // Step 3: Store chunks in Supabase
    const storageResult = await chunkStorage.storeChunks(
      chunks,
      chatbotId,
      `doc_${Date.now()}`
    );

    // Step 4: Generate embeddings (this would be done asynchronously in production)
    // await generateEmbeddingsForChunks(chunks);

    res.json({
      success: true,
      message: 'Document processed and stored successfully',
      chunksCreated: storageResult.stored,
      relationshipsCreated: storageResult.relationships,
      processingMethod: doclingResult.metadata.processing_method,
      documentMetadata: {
        title: uploadedFile.originalname,
        size: uploadedFile.size,
        type: uploadedFile.mimetype,
        chunks: chunks.length
      }
    });

  } catch (error) {
    console.error('Error processing document upload:', error);
    res.status(500).json({
      success: false,
      error: 'Document processing failed',
      message: error.message
    });
  }
}

/**
 * Get chatbot knowledge base statistics
 */
async function getKnowledgeBaseStats(req, res) {
  try {
    const { chatbotId } = req.params;

    const stats = await chunkStorage.getChunkStatistics(chatbotId);

    res.json({
      success: true,
      statistics: stats,
      capabilities: {
        intelligentQueryProcessing: true,
        hybridSearch: true,
        relationshipAwareChunking: true,
        contextAwareAnswers: true,
        conversationContext: true,
        metadataFiltering: true
      }
    });

  } catch (error) {
    console.error('Error getting knowledge base stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get statistics'
    });
  }
}

/**
 * System health check endpoint
 */
async function getSystemHealth(req, res) {
  try {
    const systemStatus = ragOrchestrator.getSystemStatus();
    
    // Add additional health checks
    const healthChecks = {
      ...systemStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      environment: process.env.NODE_ENV || 'development'
    };

    res.json({
      success: true,
      health: healthChecks
    });

  } catch (error) {
    console.error('Error getting system health:', error);
    res.status(500).json({
      success: false,
      error: 'Health check failed'
    });
  }
}

// Helper functions

/**
 * Get chatbot configuration from database
 */
async function getChatbotConfig(chatbotId) {
  // This would fetch from your existing chatbot database
  // For now, return a default configuration
  return {
    name: 'AI Assistant',
    personality: 'helpful and professional',
    expertise: 'general knowledge',
    responseStyle: 'comprehensive with examples',
    language: 'en',
    maxResponseLength: 2000
  };
}

/**
 * Enhance user profile with stored preferences
 */
async function enhanceUserProfile(userId, userProfile) {
  // This would fetch user preferences from your database
  // For now, return the provided profile with defaults
  return {
    experienceLevel: 'intermediate',
    role: 'user',
    preferences: {
      detailLevel: 'medium',
      includeExamples: true,
      language: 'en'
    },
    ...userProfile
  };
}

/**
 * Log interaction for analytics
 */
async function logInteraction(interactionData) {
  // This would log to your analytics system
  console.log('📊 Logging interaction:', {
    userId: interactionData.userId,
    chatbotId: interactionData.chatbotId,
    messageLength: interactionData.message.length,
    responseType: interactionData.response.type,
    processingTime: interactionData.processingTime,
    timestamp: new Date().toISOString()
  });
}

/**
 * Format response for frontend consumption
 */
function formatResponseForFrontend(response) {
  const formatted = {
    type: response.type,
    answer: response.answer
  };

  // Add type-specific formatting
  if (response.type === 'success') {
    formatted.metadata = {
      confidence: response.answerMetadata.confidence,
      complexity: response.answerMetadata.complexity,
      sourceCount: response.sources.totalSources,
      processingTime: response.performance.totalProcessingTime
    };

    formatted.supplementary = {
      relatedTopics: response.supplementary.relatedTopics,
      nextSteps: response.supplementary.nextSteps,
      followUpQuestions: response.supplementary.followUpQuestions
    };

    formatted.sources = {
      sections: response.sources.sections,
      confidence: response.sources.confidence
    };

  } else if (response.type === 'clarification_needed') {
    formatted.message = response.message;
    formatted.suggestions = response.suggestions;

  } else if (response.type === 'no_results') {
    formatted.message = response.message;
    formatted.suggestions = response.suggestions;
  }

  return formatted;
}

// Example Express.js route setup
function setupAdvancedRAGRoutes(app) {
  // Main chatbot message endpoint
  app.post('/api/chatbots/:chatbotId/messages/advanced', handleAdvancedRAGMessage);
  
  // Quick answer endpoint
  app.post('/api/chatbots/:chatbotId/messages/quick', handleQuickAnswer);
  
  // Document upload endpoint
  app.post('/api/chatbots/:chatbotId/documents', handleDocumentUpload);
  
  // Knowledge base statistics
  app.get('/api/chatbots/:chatbotId/knowledge/stats', getKnowledgeBaseStats);
  
  // System health check
  app.get('/api/system/health', getSystemHealth);
}

module.exports = {
  handleAdvancedRAGMessage,
  handleQuickAnswer,
  handleDocumentUpload,
  getKnowledgeBaseStats,
  getSystemHealth,
  setupAdvancedRAGRoutes
};
