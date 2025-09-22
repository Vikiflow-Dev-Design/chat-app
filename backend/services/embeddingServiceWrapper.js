/**
 * Embedding Service Wrapper
 * Provides conditional embedding generation based on configuration
 * Preserves all original embedding code while allowing disconnection
 */

const { 
  areEmbeddingsEnabled, 
  isEmbeddingTypeEnabled, 
  isVectorSearchEnabled,
  getFallbackSearchStrategy,
  logEmbeddingSkip 
} = require('../config/embeddingConfig');

// Import original embedding services (preserved)
const EmbeddingService = require('./embeddingService');
const EnhancedEmbeddingService = require('./enhancedEmbeddingService');

class EmbeddingServiceWrapper {
  constructor() {
    // Initialize original services (always available for future use)
    try {
      this.originalEmbeddingService = new EmbeddingService();
      this.originalEnhancedEmbeddingService = new EnhancedEmbeddingService();
      this.servicesInitialized = true;
    } catch (error) {
      console.warn('⚠️ Original embedding services not initialized (may be due to missing API keys):', error.message);
      this.servicesInitialized = false;
    }
    
    this.fallbackStrategy = getFallbackSearchStrategy();
  }

  /**
   * Generate single embedding (with conditional execution)
   * @param {string} text - Text to embed
   * @returns {Promise<Array|null>} Embedding vector or null if disabled
   */
  async generateEmbedding(text) {
    if (!areEmbeddingsEnabled()) {
      logEmbeddingSkip('single embedding generation');
      return null;
    }

    if (!this.servicesInitialized) {
      logEmbeddingSkip('single embedding generation', 'services not initialized');
      return null;
    }

    return await this.originalEmbeddingService.generateEmbedding(text);
  }

  /**
   * Generate batch embeddings (with conditional execution)
   * @param {Array} texts - Array of texts to embed
   * @returns {Promise<Array>} Array of embeddings or empty array if disabled
   */
  async generateBatchEmbeddings(texts) {
    if (!areEmbeddingsEnabled()) {
      logEmbeddingSkip('batch embedding generation');
      return texts.map(() => null);
    }

    if (!this.servicesInitialized) {
      logEmbeddingSkip('batch embedding generation', 'services not initialized');
      return texts.map(() => null);
    }

    return await this.originalEmbeddingService.generateBatchEmbeddings(texts);
  }

  /**
   * Generate embedding with cache (with conditional execution)
   * @param {string} text - Text to embed
   * @param {string} contentType - Type of content
   * @returns {Promise<Array|null>} Embedding vector or null if disabled
   */
  async generateEmbeddingWithCache(text, contentType) {
    if (!areEmbeddingsEnabled() || !isEmbeddingTypeEnabled(contentType)) {
      logEmbeddingSkip(`${contentType} embedding with cache`);
      return null;
    }

    if (!this.servicesInitialized) {
      logEmbeddingSkip(`${contentType} embedding with cache`, 'services not initialized');
      return null;
    }

    return await this.originalEnhancedEmbeddingService.generateEmbeddingWithCache(text, contentType);
  }

  /**
   * Generate batch chunk embeddings (with conditional execution)
   * @param {Array} chunks - Array of chunks with metadata
   * @returns {Promise<Array>} Chunks with embeddings or original chunks if disabled
   */
  async generateBatchChunkEmbeddings(chunks) {
    if (!areEmbeddingsEnabled()) {
      logEmbeddingSkip('batch chunk embeddings');
      // Return chunks without embeddings but with metadata preserved
      return chunks.map(chunk => ({
        ...chunk,
        embeddingGenerated: false,
        embeddingSkipped: true,
        embeddingSkipReason: 'embeddings disabled'
      }));
    }

    if (!this.servicesInitialized) {
      logEmbeddingSkip('batch chunk embeddings', 'services not initialized');
      return chunks.map(chunk => ({
        ...chunk,
        embeddingGenerated: false,
        embeddingSkipped: true,
        embeddingSkipReason: 'services not initialized'
      }));
    }

    return await this.originalEnhancedEmbeddingService.generateBatchChunkEmbeddings(chunks);
  }

  /**
   * Generate chunk embeddings (with conditional execution)
   * @param {Array} chunks - Array of chunk objects
   * @returns {Promise<Array>} Chunks with embeddings or original chunks if disabled
   */
  async generateChunkEmbeddings(chunks) {
    if (!areEmbeddingsEnabled()) {
      logEmbeddingSkip('chunk embeddings');
      return chunks.map(chunk => ({
        ...chunk,
        embedding: null,
        embeddingGenerated: false,
        embeddingSkipped: true
      }));
    }

    if (!this.servicesInitialized) {
      logEmbeddingSkip('chunk embeddings', 'services not initialized');
      return chunks.map(chunk => ({
        ...chunk,
        embedding: null,
        embeddingGenerated: false,
        embeddingSkipped: true
      }));
    }

    return await this.originalEmbeddingService.generateChunkEmbeddings(chunks);
  }

  /**
   * Convert metadata to text (always available)
   * @param {*} metadata - Metadata to convert
   * @param {string} type - Type of metadata
   * @returns {string} Text representation
   */
  convertMetadataToText(metadata, type) {
    if (this.servicesInitialized && this.originalEnhancedEmbeddingService.convertMetadataToText) {
      return this.originalEnhancedEmbeddingService.convertMetadataToText(metadata, type);
    }
    
    // Fallback conversion
    if (Array.isArray(metadata)) {
      return metadata.join(', ');
    }
    return String(metadata || '');
  }

  /**
   * Check if embeddings are currently enabled
   * @returns {boolean} True if embeddings are enabled
   */
  isEnabled() {
    return areEmbeddingsEnabled() && this.servicesInitialized;
  }

  /**
   * Check if vector search is enabled
   * @returns {boolean} True if vector search is enabled
   */
  isVectorSearchEnabled() {
    return isVectorSearchEnabled() && this.servicesInitialized;
  }

  /**
   * Get embedding status information
   * @returns {Object} Status information
   */
  getStatus() {
    return {
      embeddingsEnabled: areEmbeddingsEnabled(),
      servicesInitialized: this.servicesInitialized,
      vectorSearchEnabled: this.isVectorSearchEnabled(),
      fallbackStrategy: this.fallbackStrategy,
      availableServices: {
        embeddingService: !!this.originalEmbeddingService,
        enhancedEmbeddingService: !!this.originalEnhancedEmbeddingService
      }
    };
  }

  /**
   * Get original services (for direct access when needed)
   * @returns {Object} Original services
   */
  getOriginalServices() {
    return {
      embeddingService: this.originalEmbeddingService,
      enhancedEmbeddingService: this.originalEnhancedEmbeddingService
    };
  }
}

module.exports = EmbeddingServiceWrapper;
