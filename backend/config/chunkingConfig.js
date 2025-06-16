/**
 * Chunking Configuration
 * Optimized settings for different content types and use cases
 */

const CHUNKING_CONFIGS = {
  // Default configuration
  default: {
    maxChunkSize: 800,      // Reduced from 1000 for better precision
    chunkOverlap: 150,      // Reduced from 200 for less redundancy
    minChunkSize: 100,
  },

  // File content (PDFs, documents)
  file: {
    maxChunkSize: 1200,     // Reduced from 1500 for better retrieval
    chunkOverlap: 200,      // Keep higher overlap for documents
    minChunkSize: 150,
  },

  // Text content (manual entries)
  text: {
    maxChunkSize: 600,      // Smaller for focused retrieval
    chunkOverlap: 100,      // Less overlap for shorter content
    minChunkSize: 100,
  },

  // Q&A content (each pair is one chunk)
  qa: {
    maxChunkSize: 500,      // Limit very long Q&A pairs
    chunkOverlap: 0,        // No overlap for Q&A
    minChunkSize: 50,
  },

  // Optimized for semantic search
  semantic: {
    maxChunkSize: 512,      // Optimal for most embedding models
    chunkOverlap: 64,       // 12.5% overlap
    minChunkSize: 128,
  },

  // Large context for complex documents
  large: {
    maxChunkSize: 2000,
    chunkOverlap: 300,
    minChunkSize: 200,
  },

  // Small chunks for precise retrieval
  precise: {
    maxChunkSize: 400,
    chunkOverlap: 50,
    minChunkSize: 100,
  }
};

/**
 * Get chunking configuration by type
 * @param {string} type - Configuration type
 * @returns {object} Chunking configuration
 */
function getChunkingConfig(type = 'default') {
  return CHUNKING_CONFIGS[type] || CHUNKING_CONFIGS.default;
}

/**
 * Get optimal configuration based on content characteristics
 * @param {string} contentType - Type of content (file, text, qa)
 * @param {number} contentLength - Length of content
 * @param {string} strategy - Chunking strategy (semantic, large, precise)
 * @returns {object} Optimal chunking configuration
 */
function getOptimalConfig(contentType, contentLength, strategy = 'default') {
  // Use strategy-specific config if specified
  if (strategy !== 'default' && CHUNKING_CONFIGS[strategy]) {
    return CHUNKING_CONFIGS[strategy];
  }

  // Content-type specific logic
  switch (contentType) {
    case 'file':
      // For very large files, use larger chunks
      if (contentLength > 10000) {
        return CHUNKING_CONFIGS.large;
      }
      return CHUNKING_CONFIGS.file;

    case 'text':
      // For short text, use precise chunking
      if (contentLength < 2000) {
        return CHUNKING_CONFIGS.precise;
      }
      return CHUNKING_CONFIGS.text;

    case 'qa':
      return CHUNKING_CONFIGS.qa;

    default:
      return CHUNKING_CONFIGS.semantic; // Default to semantic-optimized
  }
}

/**
 * Calculate optimal chunk count for content
 * @param {number} contentLength - Length of content
 * @param {object} config - Chunking configuration
 * @returns {number} Estimated chunk count
 */
function estimateChunkCount(contentLength, config) {
  const effectiveChunkSize = config.maxChunkSize - config.chunkOverlap;
  return Math.ceil(contentLength / effectiveChunkSize);
}

/**
 * Validate chunking configuration
 * @param {object} config - Configuration to validate
 * @returns {boolean} Whether configuration is valid
 */
function validateConfig(config) {
  return (
    config.maxChunkSize > 0 &&
    config.minChunkSize > 0 &&
    config.chunkOverlap >= 0 &&
    config.maxChunkSize > config.minChunkSize &&
    config.chunkOverlap < config.maxChunkSize
  );
}

module.exports = {
  CHUNKING_CONFIGS,
  getChunkingConfig,
  getOptimalConfig,
  estimateChunkCount,
  validateConfig
};
