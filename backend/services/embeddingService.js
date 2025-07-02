const { GoogleGenerativeAIEmbeddings } = require("@langchain/google-genai");

/**
 * Embedding Service using Google Gemini
 * Handles text embedding generation for vector search
 */
class EmbeddingService {
  constructor() {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY environment variable is required");
    }

    this.embeddings = new GoogleGenerativeAIEmbeddings({
      apiKey: process.env.GEMINI_API_KEY,
      model: "text-embedding-004", // Gemini's embedding model
    });
    this.batchSize = 100; // Maximum texts to process in one batch
  }

  /**
   * Generate embedding for a single text
   * @param {string} text - Text to embed
   * @returns {Promise<Array>} Embedding vector
   */
  async generateEmbedding(text) {
    try {
      if (!text || typeof text !== "string") {
        throw new Error("Text must be a non-empty string");
      }

      // Clean and prepare text
      const cleanText = this.prepareTextForEmbedding(text);

      // Generate embedding using LangChain GoogleGenerativeAIEmbeddings
      const result = await this.embeddings.embedQuery(cleanText);

      if (!result || !Array.isArray(result)) {
        throw new Error(
          "Failed to generate embedding: Invalid response from Gemini"
        );
      }

      return result;
    } catch (error) {
      console.error("Error generating embedding:", error);
      throw new Error(`Failed to generate embedding: ${error.message}`);
    }
  }

  /**
   * Generate embeddings for multiple texts in batch
   * @param {Array<string>} texts - Array of texts to embed
   * @returns {Promise<Array<Array>>} Array of embedding vectors
   */
  async generateBatchEmbeddings(texts) {
    try {
      if (!Array.isArray(texts) || texts.length === 0) {
        throw new Error("Texts must be a non-empty array");
      }

      // Clean all texts
      const cleanTexts = texts.map((text) =>
        this.prepareTextForEmbedding(text)
      );

      // Use LangChain's embedDocuments method for batch processing
      const embeddings = await this.embeddings.embedDocuments(cleanTexts);

      if (!embeddings || !Array.isArray(embeddings)) {
        throw new Error(
          "Failed to generate batch embeddings: Invalid response from Gemini"
        );
      }

      return embeddings;
    } catch (error) {
      console.error("Error generating batch embeddings:", error);
      throw new Error(`Failed to generate batch embeddings: ${error.message}`);
    }
  }

  /**
   * Generate embeddings for chunks with metadata
   * @param {Array} chunks - Array of chunk objects with text and metadata
   * @returns {Promise<Array>} Array of chunks with embeddings
   */
  async generateChunkEmbeddings(chunks) {
    try {
      if (!Array.isArray(chunks) || chunks.length === 0) {
        throw new Error("Chunks must be a non-empty array");
      }

      console.log(`Generating embeddings for ${chunks.length} chunks...`);

      const texts = chunks.map((chunk) => chunk.text);
      const embeddings = await this.generateBatchEmbeddings(texts);

      // Combine chunks with their embeddings
      const chunksWithEmbeddings = chunks.map((chunk, index) => ({
        ...chunk,
        embedding: embeddings[index],
        embeddingGenerated: embeddings[index] !== null,
      }));

      // Filter out chunks that failed to generate embeddings
      const successfulChunks = chunksWithEmbeddings.filter(
        (chunk) => chunk.embeddingGenerated
      );

      console.log(
        `Successfully generated embeddings for ${successfulChunks.length}/${chunks.length} chunks`
      );

      return successfulChunks;
    } catch (error) {
      console.error("Error generating chunk embeddings:", error);
      throw new Error(`Failed to generate chunk embeddings: ${error.message}`);
    }
  }

  /**
   * Prepare text for embedding generation
   * @param {string} text - Raw text
   * @returns {string} Cleaned text
   */
  prepareTextForEmbedding(text) {
    return text
      .trim()
      .replace(/\s+/g, " ") // Normalize whitespace
      .slice(0, 8000); // Limit text length for embedding model
  }

  /**
   * Utility function to add delay
   * @param {number} ms - Milliseconds to delay
   * @returns {Promise} Promise that resolves after delay
   */
  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get embedding dimension
   * @returns {number} Embedding vector dimension
   */
  getEmbeddingDimension() {
    return 768; // Gemini text-embedding-004 dimension (may vary)
  }

  /**
   * Validate embedding vector
   * @param {Array} embedding - Embedding vector to validate
   * @returns {boolean} True if valid
   */
  validateEmbedding(embedding) {
    return (
      Array.isArray(embedding) &&
      embedding.length > 0 &&
      embedding.every((val) => typeof val === "number" && !isNaN(val))
    );
  }
}

module.exports = EmbeddingService;
