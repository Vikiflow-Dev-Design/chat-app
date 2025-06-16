/**
 * Intelligent Search Route with Multi-Vector Search
 * Provides advanced search capabilities using LLM-powered query analysis and multi-embedding search
 */

const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");

// Import enhanced search services
const MultiVectorSearchService = require("../services/multiVectorSearchService");
const Chatbot = require("../models/Chatbot");

// Initialize search service
const searchService = new MultiVectorSearchService();

/**
 * Intelligent search endpoint with LLM-powered query analysis
 * POST /api/intelligent-search/query
 */
router.post("/query", auth, async (req, res) => {
  try {
    const {
      query,
      chatbotId,
      maxResults = 10,
      similarityThreshold = 0.7,
      includeRelated = true,
      contextWindow = 3,
      useMetadataFiltering = true,
      searchStrategy = 'auto' // 'auto', 'content_focused', 'topic_focused', 'keyword_focused', 'question_oriented', 'comprehensive'
    } = req.body;

    if (!query || !chatbotId) {
      return res.status(400).json({
        success: false,
        error: "Query and chatbot ID are required",
      });
    }

    // Verify chatbot ownership
    const chatbot = await Chatbot.findOne({
      _id: chatbotId,
      userId: req.user.id,
    });

    if (!chatbot) {
      return res.status(404).json({
        success: false,
        error: "Chatbot not found or unauthorized",
      });
    }

    console.log(`🔍 Intelligent search request: "${query}" for chatbot ${chatbotId}`);

    // Perform intelligent search
    const searchResult = await searchService.intelligentSearch(
      query,
      chatbotId,
      {
        maxResults,
        similarityThreshold,
        includeRelated,
        contextWindow,
        useMetadataFiltering,
        searchStrategy
      }
    );

    console.log(`✅ Search completed: ${searchResult.results.length} results found`);

    res.json({
      success: true,
      query,
      chatbotId,
      results: searchResult.results,
      searchMetadata: searchResult.searchMetadata,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error("Error in intelligent search:", error);
    res.status(500).json({
      success: false,
      error: "Intelligent search failed",
      message: error.message,
    });
  }
});

/**
 * Get available search strategies
 * GET /api/intelligent-search/strategies
 */
router.get("/strategies", auth, async (req, res) => {
  try {
    const strategies = {
      content_focused: {
        weights: { content: 0.7, topics: 0.15, keywords: 0.1, question_type: 0.05 },
        description: 'Prioritizes content similarity for general queries',
        bestFor: ['general questions', 'content lookup', 'broad searches']
      },
      topic_focused: {
        weights: { topics: 0.5, content: 0.3, keywords: 0.15, question_type: 0.05 },
        description: 'Emphasizes topical relevance for thematic searches',
        bestFor: ['thematic searches', 'subject-specific queries', 'conceptual questions']
      },
      keyword_focused: {
        weights: { keywords: 0.4, content: 0.3, topics: 0.2, question_type: 0.1 },
        description: 'Targets specific terms and technical vocabulary',
        bestFor: ['technical terms', 'specific definitions', 'precise terminology']
      },
      question_oriented: {
        weights: { question_type: 0.4, content: 0.3, topics: 0.2, keywords: 0.1 },
        description: 'Optimized for Q&A scenarios and specific question types',
        bestFor: ['direct questions', 'how-to queries', 'factual questions']
      },
      comprehensive: {
        weights: { content: 0.3, topics: 0.25, keywords: 0.2, question_type: 0.15, audience: 0.05, heading_context: 0.05 },
        description: 'Balanced approach using all embedding types',
        bestFor: ['complex queries', 'multi-faceted searches', 'exploratory research']
      }
    };

    res.json({
      success: true,
      strategies,
      defaultStrategy: 'auto',
      embeddingTypes: [
        'content',
        'topics', 
        'keywords',
        'heading_context',
        'document_section',
        'audience',
        'question_type'
      ]
    });

  } catch (error) {
    console.error("Error getting search strategies:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get search strategies",
    });
  }
});

/**
 * Get search analytics for a chatbot
 * GET /api/intelligent-search/analytics/:chatbotId
 */
router.get("/analytics/:chatbotId", auth, async (req, res) => {
  try {
    const { chatbotId } = req.params;

    // Verify chatbot ownership
    const chatbot = await Chatbot.findOne({
      _id: chatbotId,
      userId: req.user.id,
    });

    if (!chatbot) {
      return res.status(404).json({
        success: false,
        error: "Chatbot not found or unauthorized",
      });
    }

    // Get search analytics
    const analytics = await searchService.getSearchAnalytics(chatbotId);

    res.json({
      success: true,
      chatbotId,
      analytics,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error("Error getting search analytics:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get search analytics",
    });
  }
});

/**
 * Test search with different strategies
 * POST /api/intelligent-search/test-strategies
 */
router.post("/test-strategies", auth, async (req, res) => {
  try {
    const {
      query,
      chatbotId,
      maxResults = 5,
      similarityThreshold = 0.7
    } = req.body;

    if (!query || !chatbotId) {
      return res.status(400).json({
        success: false,
        error: "Query and chatbot ID are required",
      });
    }

    // Verify chatbot ownership
    const chatbot = await Chatbot.findOne({
      _id: chatbotId,
      userId: req.user.id,
    });

    if (!chatbot) {
      return res.status(404).json({
        success: false,
        error: "Chatbot not found or unauthorized",
      });
    }

    console.log(`🧪 Testing search strategies for: "${query}"`);

    // Test all strategies
    const strategies = ['content_focused', 'topic_focused', 'keyword_focused', 'question_oriented', 'comprehensive'];
    const results = {};

    for (const strategy of strategies) {
      try {
        const searchResult = await searchService.intelligentSearch(
          query,
          chatbotId,
          {
            maxResults,
            similarityThreshold,
            includeRelated: false,
            searchStrategy: strategy
          }
        );

        results[strategy] = {
          resultCount: searchResult.results.length,
          topResult: searchResult.results[0] || null,
          avgRelevanceScore: searchResult.results.length > 0 ? 
            searchResult.results.reduce((sum, r) => sum + (r.relevanceScore || 0), 0) / searchResult.results.length : 0,
          strategy: searchResult.searchMetadata.strategy
        };
      } catch (strategyError) {
        results[strategy] = {
          error: strategyError.message
        };
      }
    }

    res.json({
      success: true,
      query,
      chatbotId,
      strategyComparison: results,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error("Error testing search strategies:", error);
    res.status(500).json({
      success: false,
      error: "Strategy testing failed",
      message: error.message,
    });
  }
});

/**
 * Clean up embedding cache
 * POST /api/intelligent-search/cleanup-cache
 */
router.post("/cleanup-cache", auth, async (req, res) => {
  try {
    const { daysOld = 30, minAccessCount = 2 } = req.body;

    console.log(`🧹 Cleaning up cache entries older than ${daysOld} days with less than ${minAccessCount} accesses`);

    const deletedCount = await searchService.embeddingService.cleanupCache(daysOld, minAccessCount);

    res.json({
      success: true,
      message: `Cleaned up ${deletedCount} old cache entries`,
      deletedCount,
      criteria: {
        daysOld,
        minAccessCount
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error("Error cleaning up cache:", error);
    res.status(500).json({
      success: false,
      error: "Cache cleanup failed",
      message: error.message,
    });
  }
});

module.exports = router;
