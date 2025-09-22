const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const IntelligentRAGController = require("../services/intelligentRAG/IntelligentRAGController");

// Initialize controller
const ragController = new IntelligentRAGController();

/**
 * @route POST /api/intelligent-rag/query
 * @desc Process user query using intelligent RAG
 * @access Private
 */
router.post("/query", auth, async (req, res) => {
  await ragController.processQuery(req, res);
});

/**
 * @route POST /api/intelligent-rag/query/public
 * @desc Process user query using intelligent RAG (public endpoint for chat widget)
 * @access Public
 */
router.post("/query/public", async (req, res) => {
  await ragController.processQuery(req, res);
});

/**
 * @route GET /api/intelligent-rag/cache/status/:chatbotId
 * @desc Get cache status for a chatbot
 * @access Private
 */
router.get("/cache/status/:chatbotId", auth, async (req, res) => {
  await ragController.getCacheStatus(req, res);
});

/**
 * @route POST /api/intelligent-rag/cache/refresh/:chatbotId
 * @desc Refresh metadata cache for a chatbot
 * @access Private
 */
router.post("/cache/refresh/:chatbotId", auth, async (req, res) => {
  await ragController.refreshCache(req, res);
});

/**
 * @route DELETE /api/intelligent-rag/cache/:chatbotId
 * @desc Invalidate cache for a chatbot
 * @access Private
 */
router.delete("/cache/:chatbotId", auth, async (req, res) => {
  try {
    const { chatbotId } = req.params;

    if (!chatbotId) {
      return res.status(400).json({
        success: false,
        error: "Missing chatbotId parameter",
      });
    }

    ragController.invalidateCache(chatbotId);

    res.json({
      success: true,
      message: "Cache invalidated successfully",
      chatbot_id: chatbotId,
    });
  } catch (error) {
    console.error(`❌ Error invalidating cache:`, error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      message: error.message,
    });
  }
});

/**
 * @route GET /api/intelligent-rag/stats
 * @desc Get system statistics
 * @access Private
 */
router.get("/stats", auth, async (req, res) => {
  await ragController.getSystemStats(req, res);
});

/**
 * @route GET /api/intelligent-rag/health
 * @desc Health check endpoint
 * @access Public
 */
router.get("/health", async (req, res) => {
  await ragController.healthCheck(req, res);
});

/**
 * @route POST /api/intelligent-rag/admin/clear-caches
 * @desc Clear all caches (admin only)
 * @access Private
 */
router.post("/admin/clear-caches", auth, async (req, res) => {
  // TODO: Add admin role check here
  await ragController.clearAllCaches(req, res);
});

/**
 * @route GET /api/intelligent-rag/test/:chatbotId
 * @desc Test endpoint for development
 * @access Private
 */
router.get("/test/:chatbotId", auth, async (req, res) => {
  try {
    const { chatbotId } = req.params;

    // Test cache building
    const cacheStats = ragController.ragService.getCacheStats(chatbotId);

    res.json({
      success: true,
      test_results: {
        chatbot_id: chatbotId,
        cache_stats: cacheStats,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error(`❌ Error in test endpoint:`, error);
    res.status(500).json({
      success: false,
      error: "Test failed",
      message: error.message,
    });
  }
});

/**
 * @route POST /api/intelligent-rag/test-query/:chatbotId
 * @desc Test query processing for development
 * @access Private
 */
router.post("/test-query/:chatbotId", auth, async (req, res) => {
  try {
    const { chatbotId } = req.params;
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: "Query is required",
      });
    }

    console.log(`🧪 Testing query: "${query}" for chatbot: ${chatbotId}`);

    // Test the intelligent RAG query
    const result = await ragController.ragService.processQuery(
      chatbotId,
      query,
      "You are a helpful AI assistant. Be friendly and informative."
    );

    res.json({
      success: true,
      query: query,
      result: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error(`❌ Error in test query endpoint:`, error);
    res.status(500).json({
      success: false,
      error: "Test query failed",
      message: error.message,
    });
  }
});

module.exports = router;
