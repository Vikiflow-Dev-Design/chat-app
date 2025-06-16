const crypto = require("crypto");
const { createClient } = require("@supabase/supabase-js");

/**
 * Enhanced Embedding Service with Multi-Embedding Support and Caching
 * Handles generation of multiple embedding types for different metadata
 */
class EnhancedEmbeddingService {
  constructor() {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY environment variable is required");
    }

    // Initialize Supabase for caching
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );

    this.geminiApiKey = process.env.GEMINI_API_KEY;
    this.embeddingModel = "text-embedding-004";
    this.embeddingDimensions = 768; // Gemini's actual output dimensions
    this.batchSize = 100;

    // Embedding types and their text conversion strategies
    this.embeddingTypes = {
      content: {
        weight: 0.4,
        converter: (text) => text, // Use content as-is
      },
      topics: {
        weight: 0.2,
        converter: (topics) =>
          `Topics: ${
            Array.isArray(topics) ? topics.join(", ") : topics
          }. Related concepts and themes.`,
      },
      keywords: {
        weight: 0.15,
        converter: (keywords) =>
          `Keywords: ${
            Array.isArray(keywords) ? keywords.join(", ") : keywords
          }. Important terms and concepts.`,
      },
      heading_context: {
        weight: 0.1,
        converter: (context) => {
          if (Array.isArray(context)) {
            return `Navigation: ${context
              .map((h) => h.title || h)
              .join(" > ")}. Document structure and hierarchy.`;
          }
          return `Context: ${context}`;
        },
      },
      document_section: {
        weight: 0.05,
        converter: (section) =>
          `Section: ${section}. Document organization and categorization.`,
      },
      audience: {
        weight: 0.05,
        converter: (audience) =>
          `Audience: ${
            Array.isArray(audience) ? audience.join(", ") : audience
          }. Target readers and skill levels.`,
      },
      question_type: {
        weight: 0.05,
        converter: (types) =>
          `Question types: ${
            Array.isArray(types) ? types.join(", ") : types
          }. Answerable question categories.`,
      },
    };
  }

  /**
   * Generate hash for content caching
   * @param {string} text - Text to hash
   * @returns {string} SHA-256 hash
   */
  generateContentHash(text) {
    return crypto
      .createHash("sha256")
      .update(text.trim().toLowerCase())
      .digest("hex");
  }

  /**
   * Check if embedding exists in cache
   * @param {string} text - Text content
   * @param {string} contentType - Type of content
   * @returns {Promise<Array|null>} Cached embedding or null
   */
  async getCachedEmbedding(text, contentType) {
    try {
      const { data, error } = await this.supabase.rpc("get_cached_embedding", {
        text_content: text,
        content_type_param: contentType,
      });

      if (error) {
        console.warn(`Cache lookup error for ${contentType}:`, error.message);
        return null;
      }

      if (data) {
        console.log(`✅ Cache hit for ${contentType} (${text.length} chars)`);
        return data;
      }

      return null;
    } catch (error) {
      console.warn(`Cache lookup failed for ${contentType}:`, error.message);
      return null;
    }
  }

  /**
   * Store embedding in cache
   * @param {string} text - Text content
   * @param {string} contentType - Type of content
   * @param {Array} embedding - Generated embedding
   */
  async storeEmbeddingInCache(text, contentType, embedding) {
    try {
      await this.supabase.rpc("store_embedding_cache", {
        text_content: text,
        content_type_param: contentType,
        embedding_param: embedding,
        model_version_param: this.embeddingModel,
      });

      console.log(`💾 Cached ${contentType} embedding (${text.length} chars)`);
    } catch (error) {
      console.warn(`Failed to cache ${contentType} embedding:`, error.message);
    }
  }

  /**
   * Generate single embedding using Gemini API
   * @param {string} text - Text to embed
   * @returns {Promise<Array>} Embedding vector
   */
  async generateSingleEmbedding(text) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${this.embeddingModel}:embedContent?key=${this.geminiApiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: `models/${this.embeddingModel}`,
            content: {
              parts: [{ text: text }],
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Gemini API error: ${response.status} ${response.statusText}`
        );
      }

      const result = await response.json();

      if (!result.embedding || !result.embedding.values) {
        throw new Error("Invalid embedding response from Gemini API");
      }

      return result.embedding.values;
    } catch (error) {
      console.error("Error generating embedding:", error);
      throw new Error(`Failed to generate embedding: ${error.message}`);
    }
  }

  /**
   * Generate embedding with caching support
   * @param {string} text - Text to embed
   * @param {string} contentType - Type of content for caching
   * @returns {Promise<Array>} Embedding vector
   */
  async generateEmbeddingWithCache(text, contentType) {
    if (!text || typeof text !== "string" || text.trim().length === 0) {
      throw new Error("Text must be a non-empty string");
    }

    const cleanText = text.trim();

    // Check cache first
    const cachedEmbedding = await this.getCachedEmbedding(
      cleanText,
      contentType
    );
    if (cachedEmbedding) {
      return cachedEmbedding;
    }

    // Generate new embedding
    console.log(
      `🔄 Generating ${contentType} embedding (${cleanText.length} chars)`
    );
    const embedding = await this.generateSingleEmbedding(cleanText);

    // Store in cache
    await this.storeEmbeddingInCache(cleanText, contentType, embedding);

    return embedding;
  }

  /**
   * Convert metadata to embedding-friendly text
   * @param {any} value - Metadata value
   * @param {string} type - Embedding type
   * @returns {string} Converted text
   */
  convertMetadataToText(value, type) {
    if (!value) return "";

    const converter = this.embeddingTypes[type]?.converter;
    if (!converter) {
      return String(value);
    }

    return converter(value);
  }

  /**
   * Generate all embeddings for a chunk
   * @param {Object} chunkData - Chunk data with content and metadata
   * @returns {Promise<Object>} Object with all embeddings
   */
  async generateChunkEmbeddings(chunkData) {
    try {
      console.log(`🎯 Generating multi-embeddings for chunk: ${chunkData.id}`);

      const embeddings = {};
      const embeddingPromises = [];

      // Generate embeddings for each type
      for (const [type, config] of Object.entries(this.embeddingTypes)) {
        let textToEmbed = "";

        switch (type) {
          case "content":
            textToEmbed = chunkData.content || "";
            break;
          case "topics":
            textToEmbed = this.convertMetadataToText(
              chunkData.metadata?.topics,
              type
            );
            break;
          case "keywords":
            textToEmbed = this.convertMetadataToText(
              chunkData.metadata?.keywords,
              type
            );
            break;
          case "heading_context":
            textToEmbed = this.convertMetadataToText(
              chunkData.headingContext,
              type
            );
            break;
          case "document_section":
            textToEmbed = this.convertMetadataToText(
              chunkData.metadata?.documentSection,
              type
            );
            break;
          case "audience":
            textToEmbed = this.convertMetadataToText(
              chunkData.metadata?.audience,
              type
            );
            break;
          case "question_type":
            textToEmbed = this.convertMetadataToText(
              chunkData.metadata?.questionTypes,
              type
            );
            break;
        }

        if (textToEmbed && textToEmbed.trim().length > 0) {
          embeddingPromises.push(
            this.generateEmbeddingWithCache(textToEmbed, type)
              .then((embedding) => ({ type, embedding, text: textToEmbed }))
              .catch((error) => {
                console.error(`Failed to generate ${type} embedding:`, error);
                return { type, embedding: null, error: error.message };
              })
          );
        } else {
          embeddings[`${type}_embedding`] = null;
        }
      }

      // Wait for all embeddings to complete
      const results = await Promise.all(embeddingPromises);

      // Organize results
      results.forEach((result) => {
        if (result.embedding) {
          embeddings[`${result.type}_embedding`] = result.embedding;
        }
      });

      console.log(
        `✅ Generated ${Object.keys(embeddings).length} embeddings for chunk ${
          chunkData.id
        }`
      );

      return embeddings;
    } catch (error) {
      console.error("Error generating chunk embeddings:", error);
      throw new Error(`Failed to generate chunk embeddings: ${error.message}`);
    }
  }

  /**
   * Generate batch embeddings for multiple chunks
   * @param {Array} chunks - Array of chunk data
   * @returns {Promise<Array>} Array of chunks with embeddings
   */
  async generateBatchChunkEmbeddings(chunks) {
    try {
      console.log(`🔄 Generating embeddings for ${chunks.length} chunks...`);

      const chunksWithEmbeddings = [];

      // Process chunks in batches to avoid overwhelming the API
      for (let i = 0; i < chunks.length; i += this.batchSize) {
        const batch = chunks.slice(i, i + this.batchSize);
        console.log(
          `Processing batch ${Math.floor(i / this.batchSize) + 1}/${Math.ceil(
            chunks.length / this.batchSize
          )}`
        );

        const batchPromises = batch.map(async (chunk) => {
          try {
            const embeddings = await this.generateChunkEmbeddings(chunk);
            return {
              ...chunk,
              ...embeddings,
              embeddingGenerated: true,
            };
          } catch (error) {
            console.error(
              `Failed to generate embeddings for chunk ${chunk.id}:`,
              error
            );
            return {
              ...chunk,
              embeddingGenerated: false,
              embeddingError: error.message,
            };
          }
        });

        const batchResults = await Promise.all(batchPromises);
        chunksWithEmbeddings.push(...batchResults);

        // Small delay between batches to respect rate limits
        if (i + this.batchSize < chunks.length) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }

      const successCount = chunksWithEmbeddings.filter(
        (c) => c.embeddingGenerated
      ).length;
      console.log(
        `✅ Successfully generated embeddings for ${successCount}/${chunks.length} chunks`
      );

      return chunksWithEmbeddings;
    } catch (error) {
      console.error("Error in batch embedding generation:", error);
      throw new Error(`Failed to generate batch embeddings: ${error.message}`);
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
      const { data, error } = await this.supabase.rpc(
        "cleanup_embedding_cache",
        {
          days_old: daysOld,
          min_access_count: minAccessCount,
        }
      );

      if (error) {
        throw error;
      }

      console.log(`🧹 Cleaned up ${data} old cache entries`);
      return data;
    } catch (error) {
      console.error("Error cleaning up cache:", error);
      throw new Error(`Failed to cleanup cache: ${error.message}`);
    }
  }
}

module.exports = EnhancedEmbeddingService;
