const IntelligentRAGController = require("../services/intelligentRAG/IntelligentRAGController");

// Initialize controller for cache invalidation
const ragController = new IntelligentRAGController();

/**
 * Middleware to invalidate cache when content is uploaded/modified
 */
class CacheInvalidationMiddleware {
  /**
   * Invalidate cache after successful upload
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Next middleware function
   */
  static invalidateAfterUpload(req, res, next) {
    // Store original res.json to intercept response
    const originalJson = res.json;
    
    res.json = function(data) {
      // Check if upload was successful
      if (data && data.success && req.body && req.body.chatbotId) {
        const chatbotId = req.body.chatbotId;
        
        console.log(`🔄 Upload successful, invalidating cache for chatbot: ${chatbotId}`);
        
        // Invalidate cache asynchronously
        setImmediate(() => {
          try {
            ragController.invalidateCache(chatbotId);
          } catch (error) {
            console.error(`❌ Error invalidating cache after upload:`, error);
          }
        });
      }
      
      // Call original res.json
      return originalJson.call(this, data);
    };
    
    next();
  }

  /**
   * Invalidate cache after successful content modification
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Next middleware function
   */
  static invalidateAfterModification(req, res, next) {
    // Store original res.json to intercept response
    const originalJson = res.json;
    
    res.json = function(data) {
      // Check if modification was successful
      if (data && data.success) {
        let chatbotId = null;
        
        // Try to get chatbotId from different sources
        if (req.params && req.params.chatbotId) {
          chatbotId = req.params.chatbotId;
        } else if (req.body && req.body.chatbotId) {
          chatbotId = req.body.chatbotId;
        } else if (req.query && req.query.chatbotId) {
          chatbotId = req.query.chatbotId;
        }
        
        if (chatbotId) {
          console.log(`🔄 Content modified, invalidating cache for chatbot: ${chatbotId}`);
          
          // Invalidate cache asynchronously
          setImmediate(() => {
            try {
              ragController.invalidateCache(chatbotId);
            } catch (error) {
              console.error(`❌ Error invalidating cache after modification:`, error);
            }
          });
        }
      }
      
      // Call original res.json
      return originalJson.call(this, data);
    };
    
    next();
  }

  /**
   * Invalidate cache after successful deletion
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Next middleware function
   */
  static invalidateAfterDeletion(req, res, next) {
    // Store original res.json to intercept response
    const originalJson = res.json;
    
    res.json = function(data) {
      // Check if deletion was successful
      if (data && (data.success || data.message)) {
        let chatbotId = null;
        
        // Try to get chatbotId from different sources
        if (req.params && req.params.chatbotId) {
          chatbotId = req.params.chatbotId;
        } else if (req.body && req.body.chatbotId) {
          chatbotId = req.body.chatbotId;
        }
        
        if (chatbotId) {
          console.log(`🔄 Content deleted, invalidating cache for chatbot: ${chatbotId}`);
          
          // Invalidate cache asynchronously
          setImmediate(() => {
            try {
              ragController.invalidateCache(chatbotId);
            } catch (error) {
              console.error(`❌ Error invalidating cache after deletion:`, error);
            }
          });
        }
      }
      
      // Call original res.json
      return originalJson.call(this, data);
    };
    
    next();
  }

  /**
   * Manual cache invalidation (for direct calls)
   * @param {string} chatbotId - Chatbot ID
   */
  static invalidateCache(chatbotId) {
    try {
      console.log(`🔄 Manual cache invalidation for chatbot: ${chatbotId}`);
      ragController.invalidateCache(chatbotId);
    } catch (error) {
      console.error(`❌ Error in manual cache invalidation:`, error);
    }
  }

  /**
   * Warm cache for a chatbot (preload cache)
   * @param {string} chatbotId - Chatbot ID
   */
  static async warmCache(chatbotId) {
    try {
      console.log(`🔥 Warming cache for chatbot: ${chatbotId}`);
      await ragController.ragService.metadataCache.getMetadataCache(chatbotId);
      console.log(`✅ Cache warmed for chatbot: ${chatbotId}`);
    } catch (error) {
      console.error(`❌ Error warming cache:`, error);
    }
  }

  /**
   * Middleware to warm cache after successful upload
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Next middleware function
   */
  static warmCacheAfterUpload(req, res, next) {
    // Store original res.json to intercept response
    const originalJson = res.json;
    
    res.json = function(data) {
      // Check if upload was successful
      if (data && data.success && req.body && req.body.chatbotId) {
        const chatbotId = req.body.chatbotId;
        
        console.log(`🔥 Upload successful, warming cache for chatbot: ${chatbotId}`);
        
        // Warm cache asynchronously after a short delay
        setTimeout(async () => {
          try {
            await CacheInvalidationMiddleware.warmCache(chatbotId);
          } catch (error) {
            console.error(`❌ Error warming cache after upload:`, error);
          }
        }, 2000); // 2 second delay to allow upload processing to complete
      }
      
      // Call original res.json
      return originalJson.call(this, data);
    };
    
    next();
  }
}

module.exports = CacheInvalidationMiddleware;
