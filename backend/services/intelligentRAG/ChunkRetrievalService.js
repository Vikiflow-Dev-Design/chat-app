const SupabaseChunkStorage = require("../supabaseChunkStorage");

/**
 * Chunk Retrieval Service
 * Handles fetching full chunk content by IDs
 */
class ChunkRetrievalService {
  constructor() {
    this.maxChunksPerQuery = 10; // Safety limit
    this.chunkStorage = new SupabaseChunkStorage();
  }

  /**
   * Get chunks by their IDs
   * @param {string} chatbotId - Chatbot ID
   * @param {Array<string>} chunkIds - Array of chunk IDs
   * @returns {Promise<Array>} Array of chunks with full content
   */
  async getChunksByIds(chatbotId, chunkIds) {
    try {
      if (!chunkIds || chunkIds.length === 0) {
        console.log(`⚠️ No chunk IDs provided for retrieval`);
        return [];
      }

      // Safety check - limit number of chunks
      if (chunkIds.length > this.maxChunksPerQuery) {
        console.log(
          `⚠️ Too many chunks requested (${chunkIds.length}), limiting to ${this.maxChunksPerQuery}`
        );
        chunkIds = chunkIds.slice(0, this.maxChunksPerQuery);
      }

      console.log(
        `📦 Retrieving ${chunkIds.length} chunks for chatbot: ${chatbotId}`
      );
      console.log(`🔍 Chunk IDs: ${chunkIds.join(", ")}`);

      // Fetch chunks from Supabase
      const { data: chunks, error } = await this.chunkStorage.supabase
        .from("chatbot_knowledge_chunks")
        .select(
          `
          id,
          document_id,
          chunk_index,
          content,
          chunk_type,
          document_section,
          heading_context,
          content_length,
          word_count,
          created_at,
          updated_at
        `
        )
        .eq("chatbot_id", chatbotId)
        .in("id", chunkIds)
        .order("chunk_index", { ascending: true });

      if (error) {
        console.error(`❌ Supabase error retrieving chunks:`, error);
        throw new Error(`Failed to retrieve chunks: ${error.message}`);
      }

      if (!chunks || chunks.length === 0) {
        console.log(`📭 No chunks found for provided IDs`);
        return [];
      }

      // Transform chunks and ensure they're in the requested order
      const transformedChunks = chunks.map((chunk) => ({
        id: chunk.id,
        document_id: chunk.document_id,
        chunk_index: chunk.chunk_index,
        content: chunk.content,
        chunk_type: chunk.chunk_type || "text",
        document_section: chunk.document_section || "content",
        heading_context: this.parseHeadingContext(chunk.heading_context),
        content_length: chunk.content_length || chunk.content?.length || 0,
        word_count: chunk.word_count || this.countWords(chunk.content),
        metadata: chunk.metadata || {},
        created_at: chunk.created_at,
        updated_at: chunk.updated_at,
      }));

      // Sort chunks to match the requested order
      const orderedChunks = this.orderChunksByRequestedIds(
        transformedChunks,
        chunkIds
      );

      console.log(`✅ Successfully retrieved ${orderedChunks.length} chunks`);

      // Log chunk details for debugging
      orderedChunks.forEach((chunk, index) => {
        console.log(
          `   ${index + 1}. Chunk ${chunk.chunk_index + 1} (${chunk.id}): ${
            chunk.content_length
          } chars`
        );
      });

      return orderedChunks;
    } catch (error) {
      console.error(`❌ Error retrieving chunks by IDs:`, error);
      throw new Error(`Chunk retrieval failed: ${error.message}`);
    }
  }

  /**
   * Get chunks by document ID
   * @param {string} chatbotId - Chatbot ID
   * @param {string} documentId - Document ID
   * @param {number} limit - Maximum number of chunks to retrieve
   * @returns {Promise<Array>} Array of chunks
   */
  async getChunksByDocumentId(chatbotId, documentId, limit = 20) {
    try {
      console.log(`📄 Retrieving chunks for document: ${documentId}`);

      const { data: chunks, error } = await this.chunkStorage.supabase
        .from("chatbot_knowledge_chunks")
        .select(
          `
          id,
          document_id,
          chunk_index,
          content,
          chunk_type,
          document_section,
          heading_context,
          content_length,
          word_count,
          metadata
        `
        )
        .eq("chatbot_id", chatbotId)
        .like("document_id", `%${documentId}%`)
        .order("chunk_index", { ascending: true })
        .limit(limit);

      if (error) {
        throw new Error(
          `Failed to retrieve chunks by document: ${error.message}`
        );
      }

      return chunks || [];
    } catch (error) {
      console.error(`❌ Error retrieving chunks by document ID:`, error);
      throw error;
    }
  }

  /**
   * Get chunk preview (content snippet)
   * @param {string} chatbotId - Chatbot ID
   * @param {string} chunkId - Chunk ID
   * @param {number} maxLength - Maximum preview length
   * @returns {Promise<Object>} Chunk preview
   */
  async getChunkPreview(chatbotId, chunkId, maxLength = 200) {
    try {
      const { data: chunk, error } = await this.chunkStorage.supabase
        .from("chatbot_knowledge_chunks")
        .select("id, chunk_index, content, document_section, chunk_type")
        .eq("chatbot_id", chatbotId)
        .eq("id", chunkId)
        .single();

      if (error || !chunk) {
        return null;
      }

      return {
        id: chunk.id,
        chunk_index: chunk.chunk_index,
        document_section: chunk.document_section,
        chunk_type: chunk.chunk_type,
        preview:
          chunk.content.substring(0, maxLength) +
          (chunk.content.length > maxLength ? "..." : ""),
        full_length: chunk.content.length,
      };
    } catch (error) {
      console.error(`❌ Error getting chunk preview:`, error);
      return null;
    }
  }

  /**
   * Validate chunk IDs format
   * @param {Array<string>} chunkIds - Array of chunk IDs
   * @returns {Array<string>} Valid chunk IDs
   */
  validateChunkIds(chunkIds) {
    if (!Array.isArray(chunkIds)) {
      return [];
    }

    return chunkIds.filter((id) => {
      if (typeof id !== "string" || id.trim().length === 0) {
        console.warn(`⚠️ Invalid chunk ID: ${id}`);
        return false;
      }
      return true;
    });
  }

  /**
   * Order chunks by requested IDs
   * @param {Array} chunks - Retrieved chunks
   * @param {Array<string>} requestedIds - Requested chunk IDs in order
   * @returns {Array} Ordered chunks
   */
  orderChunksByRequestedIds(chunks, requestedIds) {
    const chunkMap = new Map(chunks.map((chunk) => [chunk.id, chunk]));
    const orderedChunks = [];

    for (const id of requestedIds) {
      const chunk = chunkMap.get(id);
      if (chunk) {
        orderedChunks.push(chunk);
      } else {
        console.warn(`⚠️ Requested chunk not found: ${id}`);
      }
    }

    return orderedChunks;
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
   * Count words in text
   * @param {string} text - Text to count words in
   * @returns {number} Word count
   */
  countWords(text) {
    if (!text || typeof text !== "string") return 0;
    return text.trim().split(/\s+/).length;
  }

  /**
   * Get chunks statistics for a chatbot
   * @param {string} chatbotId - Chatbot ID
   * @returns {Promise<Object>} Chunks statistics
   */
  async getChunksStats(chatbotId) {
    try {
      const { data, error } = await this.chunkStorage.supabase
        .from("chatbot_knowledge_chunks")
        .select("id, content_length, word_count, chunk_type, document_section")
        .eq("chatbot_id", chatbotId);

      if (error) {
        throw new Error(`Failed to get chunks stats: ${error.message}`);
      }

      const chunks = data || [];

      return {
        total_chunks: chunks.length,
        total_characters: chunks.reduce(
          (sum, chunk) => sum + (chunk.content_length || 0),
          0
        ),
        total_words: chunks.reduce(
          (sum, chunk) => sum + (chunk.word_count || 0),
          0
        ),
        chunk_types: this.groupBy(chunks, "chunk_type"),
        document_sections: this.groupBy(chunks, "document_section"),
        average_chunk_size:
          chunks.length > 0
            ? Math.round(
                chunks.reduce(
                  (sum, chunk) => sum + (chunk.content_length || 0),
                  0
                ) / chunks.length
              )
            : 0,
      };
    } catch (error) {
      console.error(`❌ Error getting chunks stats:`, error);
      throw error;
    }
  }

  /**
   * Group array by property
   * @param {Array} array - Array to group
   * @param {string} property - Property to group by
   * @returns {Object} Grouped object
   */
  groupBy(array, property) {
    return array.reduce((groups, item) => {
      const key = item[property] || "unknown";
      groups[key] = (groups[key] || 0) + 1;
      return groups;
    }, {});
  }
}

module.exports = ChunkRetrievalService;
