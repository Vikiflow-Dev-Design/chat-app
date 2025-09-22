const SupabaseChunkStorage = require("../supabaseChunkStorage");

/**
 * Metadata Cache Service
 * Manages per-chatbot metadata caching for intelligent RAG
 */
class MetadataCacheService {
  constructor() {
    // In-memory cache: chatbotId -> metadata
    this.cache = new Map();
    this.cacheExpiry = 60 * 60 * 1000; // 1 hour default expiry
    this.isBuilding = new Set(); // Track which caches are currently being built

    // Initialize chunk storage instance
    try {
      this.chunkStorage = new SupabaseChunkStorage();
      console.log("✅ MetadataCacheService: SupabaseChunkStorage initialized");

      // Verify supabase client is available
      if (!this.chunkStorage.supabase) {
        console.error("❌ MetadataCacheService: Supabase client not available");
        throw new Error(
          "Supabase client not initialized in SupabaseChunkStorage"
        );
      }
    } catch (error) {
      console.error(
        "❌ MetadataCacheService: Failed to initialize SupabaseChunkStorage:",
        error
      );
      throw error;
    }
  }

  /**
   * Get cached metadata for a chatbot
   * @param {string} chatbotId - Chatbot ID
   * @returns {Promise<Object>} Cached metadata or builds new cache
   */
  async getMetadataCache(chatbotId) {
    try {
      // Check if cache exists and is valid
      if (this.isCacheValid(chatbotId)) {
        console.log(`📋 Using cached metadata for chatbot: ${chatbotId}`);
        return this.cache.get(chatbotId);
      }

      // Prevent multiple simultaneous cache builds for same chatbot
      if (this.isBuilding.has(chatbotId)) {
        console.log(
          `⏳ Cache build in progress for chatbot: ${chatbotId}, waiting...`
        );
        await this.waitForCacheBuild(chatbotId);
        return this.cache.get(chatbotId);
      }

      // Build new cache
      console.log(`🔄 Building metadata cache for chatbot: ${chatbotId}`);
      return await this.buildCache(chatbotId);
    } catch (error) {
      console.error(
        `❌ Error getting metadata cache for chatbot ${chatbotId}:`,
        error
      );
      throw new Error(`Failed to get metadata cache: ${error.message}`);
    }
  }

  /**
   * Build metadata cache for a chatbot
   * @param {string} chatbotId - Chatbot ID
   * @returns {Promise<Object>} Built cache
   */
  async buildCache(chatbotId) {
    try {
      this.isBuilding.add(chatbotId);

      // Debug: Check if chunkStorage and supabase are available
      console.log("🔍 Debug - chunkStorage:", !!this.chunkStorage);
      console.log(
        "🔍 Debug - chunkStorage.supabase:",
        !!this.chunkStorage?.supabase
      );
      console.log("🔍 Debug - chunkStorage type:", typeof this.chunkStorage);

      if (!this.chunkStorage) {
        throw new Error("chunkStorage is not initialized");
      }

      if (!this.chunkStorage.supabase) {
        throw new Error("chunkStorage.supabase is not available");
      }

      // Fetch all chunks with metadata (excluding embeddings)
      const { data: chunks, error } = await this.chunkStorage.supabase
        .from("chatbot_knowledge_chunks")
        .select(
          `
          id,
          document_id,
          chunk_index,
          chunk_type,
          document_section,
          heading_context,
          content_length,
          word_count,
          created_at,
          chunk_metadata (
            topics,
            keywords,
            entities,
            complexity_level,
            question_types,
            audience,
            prerequisites,
            related_concepts
          )
        `
        )
        .eq("chatbot_id", chatbotId)
        .order("chunk_index", { ascending: true });

      if (error) {
        throw new Error(`Supabase error: ${error.message}`);
      }

      if (!chunks || chunks.length === 0) {
        console.log(`📭 No chunks found for chatbot: ${chatbotId}`);
        const emptyCache = {
          chatbotId,
          lastUpdated: new Date().toISOString(),
          expiresAt: new Date(Date.now() + this.cacheExpiry),
          totalChunks: 0,
          chunks: [],
        };
        this.cache.set(chatbotId, emptyCache);
        return emptyCache;
      }

      // Transform chunks to include parsed metadata
      const transformedChunks = chunks.map((chunk) => {
        const metadata = chunk.chunk_metadata?.[0] || {};

        return {
          id: chunk.id,
          document_id: chunk.document_id,
          chunk_index: chunk.chunk_index,
          chunk_type: chunk.chunk_type || "text",
          document_section: chunk.document_section || "content",
          heading_context: this.parseHeadingContext(chunk.heading_context),
          content_length: chunk.content_length || 0,
          word_count: chunk.word_count || 0,
          created_at: chunk.created_at,
          // Parsed metadata from chunk_metadata table
          topics: this.parseJsonField(metadata.topics, []),
          keywords: this.parseJsonField(metadata.keywords, []),
          entities: this.parseJsonField(metadata.entities, []),
          complexity_level: metadata.complexity_level || null,
          question_types: this.parseJsonField(metadata.question_types, []),
          audience: this.parseJsonField(metadata.audience, []),
          prerequisites: this.parseJsonField(metadata.prerequisites, []),
          related_concepts: this.parseJsonField(metadata.related_concepts, []),
          // Note: original_metadata field not available in current table structure
          original_metadata: {},
        };
      });

      // Build the cache object
      const cache = {
        chatbotId,
        lastUpdated: new Date().toISOString(),
        expiresAt: new Date(Date.now() + this.cacheExpiry),
        totalChunks: transformedChunks.length,
        chunks: transformedChunks,
      };

      // Store in cache
      this.cache.set(chatbotId, cache);

      console.log(
        `✅ Metadata cache built for chatbot ${chatbotId}: ${transformedChunks.length} chunks`
      );

      return cache;
    } catch (error) {
      console.error(`❌ Error building cache for chatbot ${chatbotId}:`, error);
      throw error;
    } finally {
      this.isBuilding.delete(chatbotId);
    }
  }

  /**
   * Check if cache is valid for a chatbot
   * @param {string} chatbotId - Chatbot ID
   * @returns {boolean} True if cache is valid
   */
  isCacheValid(chatbotId) {
    const cache = this.cache.get(chatbotId);
    if (!cache) return false;

    const now = new Date();
    const expiresAt = new Date(cache.expiresAt);

    return now < expiresAt;
  }

  /**
   * Invalidate cache for a chatbot (call when new content is uploaded)
   * @param {string} chatbotId - Chatbot ID
   */
  invalidateCache(chatbotId) {
    if (this.cache.has(chatbotId)) {
      this.cache.delete(chatbotId);
      console.log(`🗑️ Cache invalidated for chatbot: ${chatbotId}`);
    }
  }

  /**
   * Refresh cache for a chatbot (force rebuild)
   * @param {string} chatbotId - Chatbot ID
   * @returns {Promise<Object>} Refreshed cache
   */
  async refreshCache(chatbotId) {
    this.invalidateCache(chatbotId);
    return await this.buildCache(chatbotId);
  }

  /**
   * Get cache statistics
   * @param {string} chatbotId - Chatbot ID
   * @returns {Object} Cache stats
   */
  getCacheStats(chatbotId) {
    const cache = this.cache.get(chatbotId);
    if (!cache) {
      return { exists: false };
    }

    return {
      exists: true,
      chatbotId: cache.chatbotId,
      lastUpdated: cache.lastUpdated,
      expiresAt: cache.expiresAt,
      totalChunks: cache.totalChunks,
      isValid: this.isCacheValid(chatbotId),
      memorySize: JSON.stringify(cache).length,
    };
  }

  /**
   * Parse JSON field safely
   * @param {string|Array} field - Field to parse
   * @param {*} defaultValue - Default value if parsing fails
   * @returns {*} Parsed value or default
   */
  parseJsonField(field, defaultValue = null) {
    if (!field) return defaultValue;
    if (Array.isArray(field)) return field;

    try {
      return JSON.parse(field);
    } catch (error) {
      console.warn(`Failed to parse JSON field:`, field);
      return defaultValue;
    }
  }

  /**
   * Parse heading context safely
   * @param {string|Array} headingContext - Heading context to parse
   * @returns {Array} Parsed heading context
   */
  parseHeadingContext(headingContext) {
    if (!headingContext) return [];
    if (Array.isArray(headingContext)) return headingContext;

    try {
      return JSON.parse(headingContext);
    } catch (error) {
      console.warn(`Failed to parse heading context:`, headingContext);
      return [];
    }
  }

  /**
   * Wait for cache build to complete
   * @param {string} chatbotId - Chatbot ID
   * @returns {Promise<void>}
   */
  async waitForCacheBuild(chatbotId, maxWait = 30000) {
    const startTime = Date.now();

    while (this.isBuilding.has(chatbotId)) {
      if (Date.now() - startTime > maxWait) {
        throw new Error(`Cache build timeout for chatbot: ${chatbotId}`);
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  /**
   * Clear all caches (for memory management)
   */
  clearAllCaches() {
    this.cache.clear();
    console.log(`🧹 All metadata caches cleared`);
  }

  /**
   * Get all cached chatbot IDs
   * @returns {Array<string>} Array of cached chatbot IDs
   */
  getCachedChatbots() {
    return Array.from(this.cache.keys());
  }
}

module.exports = MetadataCacheService;
