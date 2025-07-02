/**
 * Embedding Configuration
 * Controls whether embedding generation is enabled or disabled
 * Set ENABLE_EMBEDDINGS=false to disconnect embedding generation while preserving code
 */

const EMBEDDING_CONFIG = {
  // Main feature flag - set to false to disable all embedding generation
  ENABLE_EMBEDDINGS: process.env.ENABLE_EMBEDDINGS !== "false", // Default: true (enabled)

  // Individual embedding type controls (for granular control)
  ENABLE_CONTENT_EMBEDDINGS: process.env.ENABLE_CONTENT_EMBEDDINGS !== "false",
  ENABLE_TOPIC_EMBEDDINGS: process.env.ENABLE_TOPIC_EMBEDDINGS !== "false",
  ENABLE_KEYWORD_EMBEDDINGS: process.env.ENABLE_KEYWORD_EMBEDDINGS !== "false",
  ENABLE_HEADING_EMBEDDINGS: process.env.ENABLE_HEADING_EMBEDDINGS !== "false",
  ENABLE_SECTION_EMBEDDINGS: process.env.ENABLE_SECTION_EMBEDDINGS !== "false",
  ENABLE_AUDIENCE_EMBEDDINGS:
    process.env.ENABLE_AUDIENCE_EMBEDDINGS !== "false",
  ENABLE_QUESTION_TYPE_EMBEDDINGS:
    process.env.ENABLE_QUESTION_TYPE_EMBEDDINGS !== "false",

  // Caching controls
  ENABLE_EMBEDDING_CACHE: process.env.ENABLE_EMBEDDING_CACHE !== "false",

  // Vector search controls
  ENABLE_VECTOR_SEARCH: process.env.ENABLE_VECTOR_SEARCH !== "false",

  // Fallback behavior when embeddings are disabled
  FALLBACK_TO_METADATA_SEARCH:
    process.env.FALLBACK_TO_METADATA_SEARCH !== "false",
  FALLBACK_TO_TEXT_SEARCH: process.env.FALLBACK_TO_TEXT_SEARCH !== "false",

  // Development and debugging
  LOG_EMBEDDING_SKIPS: process.env.LOG_EMBEDDING_SKIPS === "true",
  PRESERVE_EMBEDDING_PLACEHOLDERS:
    process.env.PRESERVE_EMBEDDING_PLACEHOLDERS !== "false",
};

// Document Processing Configuration
const DOCLING_CONFIG = {
  // Main feature flag - set to false to disable Docling processing and use LLM fallback
  ENABLE_DOCLING: process.env.ENABLE_DOCLING !== "false", // Default: true (enabled)

  // Docling service controls
  ENABLE_DOCLING_SERVICE_CHECK:
    process.env.ENABLE_DOCLING_SERVICE_CHECK !== "false",
  DOCLING_SERVICE_TIMEOUT:
    parseInt(process.env.DOCLING_SERVICE_TIMEOUT) || 30000, // 30 seconds

  // Fallback behavior when Docling is disabled
  FORCE_LLM_FALLBACK: process.env.FORCE_LLM_FALLBACK === "true",
  FALLBACK_TO_LLM_PROCESSING:
    process.env.FALLBACK_TO_LLM_PROCESSING !== "false",

  // Development and debugging
  LOG_DOCLING_SKIPS: process.env.LOG_DOCLING_SKIPS === "true",
  PRESERVE_DOCLING_METADATA: process.env.PRESERVE_DOCLING_METADATA !== "false",
};

/**
 * Check if embeddings are enabled globally
 * @returns {boolean} True if embeddings are enabled
 */
function areEmbeddingsEnabled() {
  return EMBEDDING_CONFIG.ENABLE_EMBEDDINGS;
}

/**
 * Check if a specific embedding type is enabled
 * @param {string} embeddingType - Type of embedding (content, topics, keywords, etc.)
 * @returns {boolean} True if the specific embedding type is enabled
 */
function isEmbeddingTypeEnabled(embeddingType) {
  if (!areEmbeddingsEnabled()) {
    return false;
  }

  const typeKey = `ENABLE_${embeddingType.toUpperCase()}_EMBEDDINGS`;
  return EMBEDDING_CONFIG[typeKey] !== false;
}

/**
 * Check if vector search is enabled
 * @returns {boolean} True if vector search is enabled
 */
function isVectorSearchEnabled() {
  return EMBEDDING_CONFIG.ENABLE_VECTOR_SEARCH && areEmbeddingsEnabled();
}

/**
 * Get fallback search strategy when embeddings are disabled
 * @returns {Object} Fallback configuration
 */
function getFallbackSearchStrategy() {
  return {
    useMetadataSearch: EMBEDDING_CONFIG.FALLBACK_TO_METADATA_SEARCH,
    useTextSearch: EMBEDDING_CONFIG.FALLBACK_TO_TEXT_SEARCH,
    logSkips: EMBEDDING_CONFIG.LOG_EMBEDDING_SKIPS,
  };
}

/**
 * Log embedding skip message (if logging is enabled)
 * @param {string} operation - Operation that was skipped
 * @param {string} reason - Reason for skipping
 */
function logEmbeddingSkip(operation, reason = "embeddings disabled") {
  if (EMBEDDING_CONFIG.LOG_EMBEDDING_SKIPS) {
    console.log(`⏭️ Skipping ${operation}: ${reason}`);
  }
}

/**
 * Check if Docling processing is enabled
 * @returns {boolean} True if Docling processing is enabled
 */
function isDoclingEnabled() {
  return DOCLING_CONFIG.ENABLE_DOCLING;
}

/**
 * Check if Docling service availability check is enabled
 * @returns {boolean} True if service check is enabled
 */
function isDoclingServiceCheckEnabled() {
  return DOCLING_CONFIG.ENABLE_DOCLING_SERVICE_CHECK && isDoclingEnabled();
}

/**
 * Check if LLM fallback should be forced (skip Docling entirely)
 * @returns {boolean} True if LLM fallback should be forced
 */
function shouldForceLLMFallback() {
  return DOCLING_CONFIG.FORCE_LLM_FALLBACK || !isDoclingEnabled();
}

/**
 * Get Docling service timeout
 * @returns {number} Timeout in milliseconds
 */
function getDoclingTimeout() {
  return DOCLING_CONFIG.DOCLING_SERVICE_TIMEOUT;
}

/**
 * Log Docling skip message (if logging is enabled)
 * @param {string} operation - Operation that was skipped
 * @param {string} reason - Reason for skipping
 */
function logDoclingSkip(operation, reason = "Docling disabled") {
  if (DOCLING_CONFIG.LOG_DOCLING_SKIPS) {
    console.log(`⏭️ Skipping ${operation}: ${reason}`);
  }
}

/**
 * Get fallback processing strategy when Docling is disabled
 * @returns {Object} Fallback configuration
 */
function getDoclingFallbackStrategy() {
  return {
    useLLMProcessing: DOCLING_CONFIG.FALLBACK_TO_LLM_PROCESSING,
    preserveMetadata: DOCLING_CONFIG.PRESERVE_DOCLING_METADATA,
    logSkips: DOCLING_CONFIG.LOG_DOCLING_SKIPS,
    forceFallback: DOCLING_CONFIG.FORCE_LLM_FALLBACK,
  };
}

module.exports = {
  EMBEDDING_CONFIG,
  DOCLING_CONFIG,
  areEmbeddingsEnabled,
  isEmbeddingTypeEnabled,
  isVectorSearchEnabled,
  getFallbackSearchStrategy,
  logEmbeddingSkip,
  isDoclingEnabled,
  isDoclingServiceCheckEnabled,
  shouldForceLLMFallback,
  getDoclingTimeout,
  logDoclingSkip,
  getDoclingFallbackStrategy,
};
