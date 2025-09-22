const IntelligentRAGService = require("./IntelligentRAGService");
const Chatbot = require("../../models/Chatbot");

/**
 * Intelligent RAG Controller
 * Main controller for intelligent RAG operations
 */
class IntelligentRAGController {
  constructor() {
    this.ragService = new IntelligentRAGService();
  }

  /**
   * Process a user query using intelligent RAG
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async processQuery(req, res) {
    try {
      const { chatbotId, query, userId } = req.body;

      // Validation
      if (!chatbotId || !query) {
        return res.status(400).json({
          success: false,
          error: "Missing required fields: chatbotId and query"
        });
      }

      if (typeof query !== 'string' || query.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: "Query must be a non-empty string"
        });
      }

      // Verify chatbot ownership if userId is provided
      if (userId) {
        const chatbot = await Chatbot.findOne({
          _id: chatbotId,
          userId: userId
        });

        if (!chatbot) {
          return res.status(404).json({
            success: false,
            error: "Chatbot not found or unauthorized"
          });
        }
      }

      // Get chatbot for behavior prompt
      const chatbot = await Chatbot.findById(chatbotId);
      if (!chatbot) {
        return res.status(404).json({
          success: false,
          error: "Chatbot not found"
        });
      }

      const behaviorPrompt = chatbot.agentTemplate?.behaviorPrompt || "";

      console.log(`🚀 Processing intelligent RAG query for chatbot: ${chatbotId}`);
      console.log(`👤 User query: "${query}"`);

      // Process query with intelligent RAG
      const result = await this.ragService.processQuery(
        chatbotId,
        query.trim(),
        behaviorPrompt
      );

      // Add request metadata
      result.request_metadata = {
        chatbot_id: chatbotId,
        user_id: userId,
        query: query.trim(),
        timestamp: new Date().toISOString(),
        behavior_prompt_used: !!behaviorPrompt
      };

      console.log(`✅ Query processed successfully. Type: ${result.response_type}`);

      res.json(result);

    } catch (error) {
      console.error(`❌ Error in processQuery:`, error);
      res.status(500).json({
        success: false,
        error: "Internal server error",
        message: error.message
      });
    }
  }

  /**
   * Get cache status for a chatbot
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getCacheStatus(req, res) {
    try {
      const { chatbotId } = req.params;
      const { userId } = req.query;

      if (!chatbotId) {
        return res.status(400).json({
          success: false,
          error: "Missing chatbotId parameter"
        });
      }

      // Verify chatbot ownership if userId is provided
      if (userId) {
        const chatbot = await Chatbot.findOne({
          _id: chatbotId,
          userId: userId
        });

        if (!chatbot) {
          return res.status(404).json({
            success: false,
            error: "Chatbot not found or unauthorized"
          });
        }
      }

      const cacheStats = this.ragService.getCacheStats(chatbotId);

      res.json({
        success: true,
        cache_status: cacheStats
      });

    } catch (error) {
      console.error(`❌ Error getting cache status:`, error);
      res.status(500).json({
        success: false,
        error: "Internal server error",
        message: error.message
      });
    }
  }

  /**
   * Refresh cache for a chatbot
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async refreshCache(req, res) {
    try {
      const { chatbotId } = req.params;
      const { userId } = req.body;

      if (!chatbotId) {
        return res.status(400).json({
          success: false,
          error: "Missing chatbotId parameter"
        });
      }

      // Verify chatbot ownership if userId is provided
      if (userId) {
        const chatbot = await Chatbot.findOne({
          _id: chatbotId,
          userId: userId
        });

        if (!chatbot) {
          return res.status(404).json({
            success: false,
            error: "Chatbot not found or unauthorized"
          });
        }
      }

      console.log(`🔄 Refreshing cache for chatbot: ${chatbotId}`);

      // Refresh the cache
      const refreshedCache = await this.ragService.metadataCache.refreshCache(chatbotId);

      res.json({
        success: true,
        message: "Cache refreshed successfully",
        cache_info: {
          chatbot_id: refreshedCache.chatbotId,
          total_chunks: refreshedCache.totalChunks,
          last_updated: refreshedCache.lastUpdated,
          expires_at: refreshedCache.expiresAt
        }
      });

    } catch (error) {
      console.error(`❌ Error refreshing cache:`, error);
      res.status(500).json({
        success: false,
        error: "Internal server error",
        message: error.message
      });
    }
  }

  /**
   * Invalidate cache for a chatbot (called when new content is uploaded)
   * @param {string} chatbotId - Chatbot ID
   */
  invalidateCache(chatbotId) {
    try {
      console.log(`🗑️ Invalidating cache for chatbot: ${chatbotId}`);
      this.ragService.invalidateCache(chatbotId);
    } catch (error) {
      console.error(`❌ Error invalidating cache:`, error);
    }
  }

  /**
   * Get system statistics
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getSystemStats(req, res) {
    try {
      const cachedChatbots = this.ragService.metadataCache.getCachedChatbots();
      
      const stats = {
        cached_chatbots: cachedChatbots.length,
        cached_chatbot_ids: cachedChatbots,
        system_info: {
          service_name: "Intelligent RAG",
          version: "1.0.0",
          uptime: process.uptime(),
          memory_usage: process.memoryUsage()
        }
      };

      res.json({
        success: true,
        stats: stats
      });

    } catch (error) {
      console.error(`❌ Error getting system stats:`, error);
      res.status(500).json({
        success: false,
        error: "Internal server error",
        message: error.message
      });
    }
  }

  /**
   * Health check endpoint
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async healthCheck(req, res) {
    try {
      // Basic health checks
      const health = {
        status: "healthy",
        timestamp: new Date().toISOString(),
        services: {
          metadata_cache: "operational",
          chunk_retrieval: "operational",
          llm_service: "operational"
        }
      };

      // Test Gemini API connection
      try {
        const testModel = this.ragService.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        await testModel.generateContent("test");
        health.services.llm_service = "operational";
      } catch (error) {
        health.services.llm_service = "degraded";
        health.status = "degraded";
      }

      res.json({
        success: true,
        health: health
      });

    } catch (error) {
      console.error(`❌ Error in health check:`, error);
      res.status(500).json({
        success: false,
        health: {
          status: "unhealthy",
          timestamp: new Date().toISOString(),
          error: error.message
        }
      });
    }
  }

  /**
   * Clear all caches (admin endpoint)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async clearAllCaches(req, res) {
    try {
      console.log(`🧹 Clearing all metadata caches`);
      
      this.ragService.metadataCache.clearAllCaches();

      res.json({
        success: true,
        message: "All caches cleared successfully"
      });

    } catch (error) {
      console.error(`❌ Error clearing caches:`, error);
      res.status(500).json({
        success: false,
        error: "Internal server error",
        message: error.message
      });
    }
  }
}

module.exports = IntelligentRAGController;
