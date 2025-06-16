/**
 * Enhanced Supabase Chunk Storage Service
 * Handles storage and retrieval of LLM-based chunks with multi-embedding support
 */

const { createClient } = require("@supabase/supabase-js");
const {
  areEmbeddingsEnabled,
  logEmbeddingSkip,
} = require("../config/embeddingConfig");

class SupabaseChunkStorage {
  constructor() {
    // Check environment variables
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
      console.error("❌ SupabaseChunkStorage: Missing environment variables");
      console.error(
        "SUPABASE_URL:",
        process.env.SUPABASE_URL ? "✅ Set" : "❌ Missing"
      );
      console.error(
        "SUPABASE_ANON_KEY:",
        process.env.SUPABASE_ANON_KEY ? "✅ Set" : "❌ Missing"
      );
      throw new Error("Missing required Supabase environment variables");
    }

    try {
      this.supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_ANON_KEY
      );
      console.log(
        "✅ SupabaseChunkStorage: Supabase client created successfully"
      );
    } catch (error) {
      console.error(
        "❌ SupabaseChunkStorage: Failed to create Supabase client:",
        error
      );
      throw error;
    }

    // Table names
    this.CHUNKS_TABLE = "chatbot_knowledge_chunks";
    this.RELATIONSHIPS_TABLE = "chunk_relationships";
    this.METADATA_TABLE = "chunk_metadata";
    this.CACHE_TABLE = "embedding_cache";
    this.LOGS_TABLE = "llm_processing_logs";

    // Embedding types for multi-embedding support
    this.EMBEDDING_TYPES = [
      "content_embedding",
      "topics_embedding",
      "keywords_embedding",
      "heading_context_embedding",
      "document_section_embedding",
      "audience_embedding",
      "question_type_embedding",
    ];
  }

  /**
   * Store LLM-based chunks with multi-embedding support in Supabase
   * @param {Array} chunks - Array of LLM-processed chunks with embeddings
   * @param {string} chatbotId - ID of the chatbot
   * @param {string} documentId - ID of the source document
   * @returns {Promise<Object>} Storage result
   */
  async storeChunks(chunks, chatbotId, documentId) {
    try {
      console.log(
        `📦 Storing ${chunks.length} LLM-based chunks in Supabase...`
      );

      const results = {
        chunks: [],
        relationships: [],
        metadata: [],
        errors: [],
        embeddings: {
          stored: 0,
          failed: 0,
        },
      };

      // Process each chunk with proper indexing
      for (let index = 0; index < chunks.length; index++) {
        const chunk = chunks[index];
        try {
          // 1. Prepare main chunk data with multi-embedding support
          const chunkData = {
            id: chunk.id,
            chatbot_id: chatbotId,
            document_id: documentId,
            content: chunk.content, // Original markdown format preserved
            chunk_type: chunk.type || "text",
            chunk_index:
              chunk.metadata?.chunkIndex || chunk.chunkIndex || index, // 0-based index for DB consistency, frontend displays as +1
            content_length: chunk.content.length,
            word_count:
              chunk.metadata?.wordCount ||
              chunk.wordCount ||
              chunk.content.split(/\s+/).length,
            heading_context: chunk.headingContext
              ? JSON.stringify(chunk.headingContext)
              : null,
            document_section: chunk.metadata?.documentSection || "Content",

            // Multi-embedding fields
            content_embedding: chunk.content_embedding || null,
            topics_embedding: chunk.topics_embedding || null,
            keywords_embedding: chunk.keywords_embedding || null,
            heading_context_embedding: chunk.heading_context_embedding || null,
            document_section_embedding:
              chunk.document_section_embedding || null,
            audience_embedding: chunk.audience_embedding || null,
            question_type_embedding: chunk.question_type_embedding || null,

            // LLM processing metadata
            llm_processed: chunk.metadata?.llmProcessed || false,
            llm_processing_version: chunk.metadata?.processingVersion || "v1.0",
            processing_method: chunk.metadata?.processingMethod || "llm_based",

            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          const { data: chunkResult, error: chunkError } = await this.supabase
            .from(this.CHUNKS_TABLE)
            .insert(chunkData)
            .select();

          if (chunkError) throw chunkError;
          results.chunks.push(chunkResult[0]);

          // Count successful embeddings (only if embeddings are enabled)
          if (areEmbeddingsEnabled()) {
            this.EMBEDDING_TYPES.forEach((embeddingType) => {
              if (chunk[embeddingType]) {
                results.embeddings.stored++;
              } else {
                results.embeddings.failed++;
              }
            });
          } else {
            // If embeddings are disabled, don't count as failures
            logEmbeddingSkip("embedding storage counting");
          }

          // 2. Store enhanced chunk metadata (LLM-extracted)
          if (chunk.metadata) {
            const metadataData = {
              chunk_id: chunk.id,
              topics: JSON.stringify(chunk.metadata.topics || []),
              keywords: JSON.stringify(chunk.metadata.keywords || []),
              entities: JSON.stringify(chunk.metadata.entities || []),
              complexity_level:
                chunk.metadata.complexity_level ||
                chunk.metadata.complexityLevel ||
                "beginner",
              question_types: JSON.stringify(
                chunk.metadata.question_type ||
                  chunk.metadata.questionTypes ||
                  []
              ),
              audience: JSON.stringify(chunk.metadata.audience || []),
              prerequisites: JSON.stringify(chunk.metadata.prerequisites || []),
              related_concepts: JSON.stringify(
                chunk.metadata.related_concepts ||
                  chunk.metadata.relatedConcepts ||
                  []
              ),
              source_document: JSON.stringify({
                documentId: documentId,
                processingMethod:
                  chunk.metadata.processingMethod || "llm_based",
                llmProcessed: chunk.metadata.llmProcessed || false,
                extractedAt:
                  chunk.metadata.extractedAt || new Date().toISOString(),
              }),
              processing_version: chunk.metadata.processingVersion || "v1.0",
            };

            const { data: metadataResult, error: metadataError } =
              await this.supabase
                .from(this.METADATA_TABLE)
                .insert(metadataData)
                .select();

            if (metadataError) throw metadataError;
            results.metadata.push(metadataResult[0]);
          }

          // 3. Store relationships (enhanced for LLM-based chunks)
          const relationships = [];

          if (chunk.relationships && Array.isArray(chunk.relationships)) {
            // New LLM-based relationship structure
            chunk.relationships.forEach((relationship) => {
              relationships.push({
                chunk_id: chunk.id,
                related_chunk_id: relationship.targetChunkId,
                relationship_type: relationship.type,
                relationship_direction: relationship.direction,
                strength: relationship.strength || 0.5,
                metadata: JSON.stringify({
                  llmGenerated: true,
                  confidence: relationship.confidence || 0.8,
                  reason: relationship.reason || "LLM-detected relationship",
                }),
              });
            });
          } else if (
            chunk.relationships &&
            typeof chunk.relationships === "object"
          ) {
            // Legacy relationship structure support

            // Sequential relationships
            if (chunk.relationships.sequential?.previous) {
              relationships.push({
                chunk_id: chunk.id,
                related_chunk_id: chunk.relationships.sequential.previous,
                relationship_type: "sequential",
                relationship_direction: "previous",
                strength: 1.0,
              });
            }

            if (chunk.relationships.sequential?.next) {
              relationships.push({
                chunk_id: chunk.id,
                related_chunk_id: chunk.relationships.sequential.next,
                relationship_type: "sequential",
                relationship_direction: "next",
                strength: 1.0,
              });
            }

            // Hierarchical relationships
            if (chunk.relationships.hierarchical?.parent) {
              relationships.push({
                chunk_id: chunk.id,
                related_chunk_id: chunk.relationships.hierarchical.parent,
                relationship_type: "hierarchical",
                relationship_direction: "parent",
                strength: 0.9,
              });
            }

            if (chunk.relationships.hierarchical?.siblings) {
              chunk.relationships.hierarchical.siblings.forEach((siblingId) => {
                relationships.push({
                  chunk_id: chunk.id,
                  related_chunk_id: siblingId,
                  relationship_type: "hierarchical",
                  relationship_direction: "sibling",
                  strength: 0.7,
                });
              });
            }

            // Topical relationships
            if (chunk.relationships.topical) {
              chunk.relationships.topical.forEach((topical) => {
                relationships.push({
                  chunk_id: chunk.id,
                  related_chunk_id: topical.chunkId,
                  relationship_type: "topical",
                  relationship_direction: "bidirectional",
                  strength: topical.similarity,
                  metadata: JSON.stringify({
                    sharedKeywords: topical.sharedKeywords,
                    similarity: topical.similarity,
                  }),
                });
              });
            }
          }

          // Insert relationships
          if (relationships.length > 0) {
            const { data: relationshipResults, error: relationshipError } =
              await this.supabase
                .from(this.RELATIONSHIPS_TABLE)
                .insert(relationships)
                .select();

            if (relationshipError) throw relationshipError;
            results.relationships.push(...relationshipResults);
          }
        } catch (chunkError) {
          console.error(`Error storing chunk ${chunk.id}:`, chunkError);
          results.errors.push({
            chunkId: chunk.id,
            error: chunkError.message,
          });
        }
      }

      console.log(
        `✅ Stored ${results.chunks.length} LLM-based chunks with ${results.relationships.length} relationships`
      );
      console.log(
        `📊 Embeddings: ${results.embeddings.stored} stored, ${results.embeddings.failed} failed`
      );

      return {
        success: true,
        stored: results.chunks.length,
        relationships: results.relationships.length,
        errors: results.errors.length,
        embeddings: results.embeddings,
        results,
      };
    } catch (error) {
      console.error("Error storing LLM-based chunks in Supabase:", error);
      throw error;
    }
  }

  /**
   * Perform multi-embedding vector search
   * @param {Object} searchParams - Multi-embedding search parameters
   * @returns {Promise<Array>} Search results with combined similarity scores
   */
  async multiEmbeddingSearch(searchParams) {
    try {
      const {
        chatbotId,
        embeddings = {},
        embeddingWeights = {
          content: 0.4,
          topics: 0.2,
          keywords: 0.15,
          heading_context: 0.1,
          document_section: 0.05,
          audience: 0.05,
          question_type: 0.05,
        },
        similarityThreshold = 0.7,
        limit = 10,
      } = searchParams;

      // Check if embeddings are enabled
      if (!areEmbeddingsEnabled()) {
        logEmbeddingSkip("multi-embedding search");
        console.log(
          "⏭️ Embeddings disabled - falling back to metadata-only search"
        );

        // Return metadata-only search results
        return await this.queryChunksByMetadata({}, chatbotId);
      }

      console.log("🎯 Performing multi-embedding search...");

      try {
        // Try the advanced multi-embedding search function first
        const { data: results, error } = await this.supabase.rpc(
          "match_chunks_multi_embedding",
          {
            content_embedding: embeddings.content || null,
            topics_embedding: embeddings.topics || null,
            keywords_embedding: embeddings.keywords || null,
            heading_context_embedding: embeddings.heading_context || null,
            document_section_embedding: embeddings.document_section || null,
            audience_embedding: embeddings.audience || null,
            question_type_embedding: embeddings.question_type || null,
            match_threshold: similarityThreshold,
            match_count: limit,
            chatbot_id_filter: chatbotId,
            embedding_weights: JSON.stringify(embeddingWeights),
          }
        );

        if (error) throw error;

        console.log(
          `✅ Multi-embedding search returned ${results.length} results`
        );
        return results;
      } catch (advancedError) {
        console.warn(
          "Advanced multi-embedding search failed, falling back to simple search:",
          advancedError.message
        );

        // Fallback to simple content-based search
        const contentEmbedding = embeddings.content || embeddings.query;
        if (!contentEmbedding) {
          console.warn("No content embedding available for fallback search");
          return [];
        }

        const { data: fallbackResults, error: fallbackError } =
          await this.supabase.rpc("hybrid_search", {
            query_embedding: contentEmbedding,
            chatbot_id_param: chatbotId,
            similarity_threshold: similarityThreshold,
            limit_count: limit,
          });

        if (fallbackError) throw fallbackError;

        console.log(
          `✅ Fallback search returned ${fallbackResults.length} results`
        );
        return fallbackResults;
      }
    } catch (error) {
      console.error("Error in multi-embedding search:", error);
      throw error;
    }
  }

  /**
   * Query chunks using metadata filters
   * @param {Object} filters - Metadata filters for chunk retrieval
   * @param {string} chatbotId - ID of the chatbot
   * @returns {Promise<Array>} Filtered chunks
   */
  async queryChunksByMetadata(filters, chatbotId) {
    try {
      console.log("🔍 Querying chunks by metadata:", filters);

      let query = this.supabase
        .from(this.CHUNKS_TABLE)
        .select(
          `
          *,
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
        .eq("chatbot_id", chatbotId);

      // Apply metadata filters
      if (filters.topics && filters.topics.length > 0) {
        // Use JSON operators to search within topics array
        const topicConditions = filters.topics
          .map((topic) => `chunk_metadata.topics @> '["${topic}"]'`)
          .join(" OR ");
        query = query.or(topicConditions, { foreignTable: "chunk_metadata" });
      }

      if (filters.questionTypes && filters.questionTypes.length > 0) {
        const questionConditions = filters.questionTypes
          .map((type) => `chunk_metadata.question_types @> '["${type}"]'`)
          .join(" OR ");
        query = query.or(questionConditions, {
          foreignTable: "chunk_metadata",
        });
      }

      if (filters.audience && filters.audience.length > 0) {
        const audienceConditions = filters.audience
          .map((aud) => `chunk_metadata.audience @> '["${aud}"]'`)
          .join(" OR ");
        query = query.or(audienceConditions, {
          foreignTable: "chunk_metadata",
        });
      }

      if (filters.complexityLevel) {
        query = query.eq(
          "chunk_metadata.complexity_level",
          filters.complexityLevel,
          { foreignTable: "chunk_metadata" }
        );
      }

      if (filters.keywords && filters.keywords.length > 0) {
        // Search for any of the keywords
        const keywordConditions = filters.keywords
          .map((keyword) => `chunk_metadata.keywords @> '["${keyword}"]'`)
          .join(" OR ");
        query = query.or(keywordConditions, { foreignTable: "chunk_metadata" });
      }

      // Execute query
      const { data, error } = await query.limit(filters.limit || 20);

      if (error) throw error;

      console.log(`✅ Found ${data.length} chunks matching metadata filters`);
      return data;
    } catch (error) {
      console.error("Error querying chunks by metadata:", error);

      // Fallback: return all chunks for the chatbot if metadata filtering fails
      console.log("🔄 Falling back to basic chatbot filtering...");
      try {
        const { data: fallbackData, error: fallbackError } = await this.supabase
          .from(this.CHUNKS_TABLE)
          .select(
            "id, content, chunk_type, document_section, heading_context, content_length, word_count"
          )
          .eq("chatbot_id", chatbotId)
          .limit(filters.limit || 50);

        if (fallbackError) throw fallbackError;

        console.log(`✅ Fallback query returned ${fallbackData.length} chunks`);
        return fallbackData;
      } catch (fallbackError) {
        console.error("Fallback query also failed:", fallbackError);
        return []; // Return empty array as last resort
      }
    }
  }

  /**
   * Get related chunks for a given chunk
   * @param {string} chunkId - ID of the source chunk
   * @param {Array} relationshipTypes - Types of relationships to include
   * @param {number} maxResults - Maximum number of related chunks to return
   * @returns {Promise<Array>} Related chunks with relationship info
   */
  async getRelatedChunks(
    chunkId,
    relationshipTypes = ["all"],
    maxResults = 10
  ) {
    try {
      console.log(`🔗 Getting related chunks for ${chunkId}`);

      let query = this.supabase
        .from(this.RELATIONSHIPS_TABLE)
        .select(
          `
          *,
          related_chunk:related_chunk_id (
            *,
            chunk_metadata (
              topics,
              keywords,
              complexity_level,
              question_types,
              audience
            )
          )
        `
        )
        .eq("chunk_id", chunkId);

      // Filter by relationship types
      if (!relationshipTypes.includes("all")) {
        query = query.in("relationship_type", relationshipTypes);
      }

      // Order by relationship strength
      query = query.order("strength", { ascending: false });

      if (maxResults) {
        query = query.limit(maxResults);
      }

      const { data, error } = await query;

      if (error) throw error;

      console.log(`✅ Found ${data.length} related chunks`);
      return data;
    } catch (error) {
      console.error("Error getting related chunks:", error);
      throw error;
    }
  }

  /**
   * Perform enhanced hybrid search: metadata filtering + multi-embedding vector similarity
   * @param {Object} searchParams - Search parameters
   * @returns {Promise<Array>} Search results
   */
  async hybridSearch(searchParams) {
    try {
      const {
        chatbotId,
        queryEmbeddings = {},
        embeddingWeights = {},
        metadataFilters = {},
        similarityThreshold = 0.7,
        limit = 10,
        useMultiEmbedding = true,
      } = searchParams;

      console.log("🔍 Performing enhanced hybrid search...");

      // Step 1: Filter by metadata (fast pre-filtering)
      const metadataFilteredChunks = await this.queryChunksByMetadata(
        metadataFilters,
        chatbotId
      );

      if (metadataFilteredChunks.length === 0) {
        console.log("No chunks found matching metadata filters");
        return [];
      }

      console.log(
        `📊 Metadata filtering reduced search space to ${metadataFilteredChunks.length} chunks`
      );

      // Step 2: Choose search strategy
      if (useMultiEmbedding && Object.keys(queryEmbeddings).length > 0) {
        // Use multi-embedding search
        return await this.multiEmbeddingSearch({
          chatbotId,
          embeddings: queryEmbeddings,
          embeddingWeights,
          similarityThreshold,
          limit,
        });
      } else {
        // Fallback to single embedding search
        const chunkIds = metadataFilteredChunks.map((chunk) => chunk.id);
        const queryEmbedding = queryEmbeddings.content || queryEmbeddings.query;

        if (!queryEmbedding) {
          console.warn("No query embedding provided for search");
          return metadataFilteredChunks.slice(0, limit);
        }

        const { data: vectorResults, error } = await this.supabase.rpc(
          "match_chunks_multi_embedding",
          {
            content_embedding: queryEmbedding,
            match_threshold: similarityThreshold,
            match_count: limit,
            chatbot_id_filter: chatbotId,
          }
        );

        if (error) throw error;

        console.log(
          `✅ Hybrid search returned ${vectorResults.length} results`
        );
        return vectorResults;
      }
    } catch (error) {
      console.error("Error in enhanced hybrid search:", error);
      throw error;
    }
  }

  /**
   * Get embedding cache statistics
   * @returns {Promise<Object>} Cache statistics
   */
  async getCacheStatistics() {
    try {
      // Get all cache entries and calculate statistics manually
      const { data: cacheEntries, error } = await this.supabase
        .from(this.CACHE_TABLE)
        .select("content_type, access_count, content_length");

      if (error) throw error;

      // Group by content type and calculate statistics
      const typeStats = {};
      let totalEntries = 0;
      let totalSize = 0;

      cacheEntries.forEach((entry) => {
        const type = entry.content_type;
        if (!typeStats[type]) {
          typeStats[type] = {
            count: 0,
            totalAccess: 0,
            totalSize: 0,
          };
        }

        typeStats[type].count++;
        typeStats[type].totalAccess += entry.access_count || 0;
        typeStats[type].totalSize += entry.content_length || 0;

        totalEntries++;
        totalSize += entry.content_length || 0;
      });

      // Calculate averages and hit rates
      const byType = Object.entries(typeStats).map(([type, stats]) => ({
        content_type: type,
        count: stats.count,
        avg: stats.count > 0 ? stats.totalAccess / stats.count : 0,
        sum: stats.totalSize,
      }));

      const cacheEfficiency = byType.map((stat) => ({
        type: stat.content_type,
        entries: stat.count,
        avgAccess: stat.avg.toFixed(2),
        hitRate:
          stat.avg > 1
            ? (((stat.avg - 1) / stat.avg) * 100).toFixed(2) + "%"
            : "0%",
      }));

      return {
        totalEntries,
        totalSize,
        byType,
        cacheEfficiency,
      };
    } catch (error) {
      console.error("Error getting cache statistics:", error);

      // Return basic stats if detailed calculation fails
      return {
        totalEntries: 0,
        totalSize: 0,
        byType: [],
        cacheEfficiency: [],
        error: error.message,
      };
    }
  }

  /**
   * Clean up old cache entries
   * @param {number} daysOld - Days old threshold
   * @param {number} minAccessCount - Minimum access count threshold
   * @returns {Promise<number>} Number of deleted entries
   */
  async cleanupCache(daysOld = 30, minAccessCount = 2) {
    try {
      const { data: deletedCount, error } = await this.supabase.rpc(
        "cleanup_embedding_cache",
        {
          days_old: daysOld,
          min_access_count: minAccessCount,
        }
      );

      if (error) throw error;

      console.log(`🧹 Cleaned up ${deletedCount} old cache entries`);
      return deletedCount;
    } catch (error) {
      console.error("Error cleaning up cache:", error);
      throw error;
    }
  }

  /**
   * Get chunk statistics for analytics
   * @param {string} chatbotId - ID of the chatbot
   * @returns {Promise<Object>} Chunk statistics
   */
  async getChunkStatistics(chatbotId) {
    try {
      const { data: chunks, error } = await this.supabase
        .from(this.CHUNKS_TABLE)
        .select(
          `
          *,
          chunk_metadata (
            topics,
            complexity_level,
            question_types,
            audience
          )
        `
        )
        .eq("chatbot_id", chatbotId);

      if (error) throw error;

      // Calculate statistics
      const stats = {
        totalChunks: chunks.length,
        avgChunkSize:
          chunks.reduce((sum, c) => sum + c.content_length, 0) / chunks.length,
        chunkTypes: [...new Set(chunks.map((c) => c.chunk_type))],
        topics: [
          ...new Set(
            chunks.flatMap((c) => JSON.parse(c.chunk_metadata?.topics || "[]"))
          ),
        ],
        complexityLevels: [
          ...new Set(
            chunks
              .map((c) => c.chunk_metadata?.complexity_level)
              .filter(Boolean)
          ),
        ],
        questionTypes: [
          ...new Set(
            chunks.flatMap((c) =>
              JSON.parse(c.chunk_metadata?.question_types || "[]")
            )
          ),
        ],
        audiences: [
          ...new Set(
            chunks.flatMap((c) =>
              JSON.parse(c.chunk_metadata?.audience || "[]")
            )
          ),
        ],
      };

      return stats;
    } catch (error) {
      console.error("Error getting chunk statistics:", error);
      throw error;
    }
  }
}

module.exports = SupabaseChunkStorage;
