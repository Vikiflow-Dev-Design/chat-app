/**
 * Text Chunking Service
 * Handles intelligent text splitting for optimal vector storage and retrieval
 */

const {
  getOptimalConfig,
  validateConfig,
} = require("../config/chunkingConfig");

class TextChunkingService {
  constructor(options = {}) {
    // Use optimized defaults
    const defaultConfig = getOptimalConfig("default");
    this.maxChunkSize = options.maxChunkSize || defaultConfig.maxChunkSize;
    this.chunkOverlap = options.chunkOverlap || defaultConfig.chunkOverlap;
    this.minChunkSize = options.minChunkSize || defaultConfig.minChunkSize;

    // Validate configuration
    if (!validateConfig(this)) {
      throw new Error("Invalid chunking configuration");
    }
  }

  /**
   * Split text into chunks with overlap
   * @param {string} text - The text to chunk
   * @param {object} metadata - Additional metadata for the chunks
   * @returns {Array} Array of chunk objects
   */
  chunkText(text, metadata = {}) {
    if (!text || typeof text !== "string") {
      throw new Error("Text must be a non-empty string");
    }

    // Clean and normalize text
    const cleanText = this.cleanText(text);

    // Split by sentences first for better semantic chunks
    const sentences = this.splitIntoSentences(cleanText);

    // Group sentences into chunks
    const chunks = this.groupSentencesIntoChunks(sentences);

    // Create chunk objects with metadata
    return chunks.map((chunk, index) => ({
      text: chunk.trim(),
      index: index,
      length: chunk.length,
      metadata: {
        ...metadata,
        chunkIndex: index,
        totalChunks: chunks.length,
      },
    }));
  }

  /**
   * Clean and normalize text
   * @param {string} text - Raw text
   * @returns {string} Cleaned text
   */
  cleanText(text) {
    return text
      .replace(/\r\n/g, "\n") // Normalize line endings
      .replace(/\r/g, "\n")
      .replace(/\n{3,}/g, "\n\n") // Reduce multiple newlines
      .replace(/\s{2,}/g, " ") // Reduce multiple spaces
      .trim();
  }

  /**
   * Split text into sentences
   * @param {string} text - Text to split
   * @returns {Array} Array of sentences
   */
  splitIntoSentences(text) {
    // Enhanced sentence splitting that handles common abbreviations
    const sentences = text
      .replace(/([.!?])\s+/g, "$1|SPLIT|")
      .split("|SPLIT|")
      .filter((sentence) => sentence.trim().length > 0);

    return sentences;
  }

  /**
   * Group sentences into chunks with overlap
   * @param {Array} sentences - Array of sentences
   * @returns {Array} Array of text chunks
   */
  groupSentencesIntoChunks(sentences) {
    const chunks = [];
    let currentChunk = "";
    let currentLength = 0;

    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i].trim();
      const sentenceLength = sentence.length;

      // If adding this sentence would exceed max chunk size, finalize current chunk
      if (
        currentLength + sentenceLength > this.maxChunkSize &&
        currentChunk.length > 0
      ) {
        if (currentChunk.length >= this.minChunkSize) {
          chunks.push(currentChunk.trim());
        }

        // Start new chunk with overlap
        currentChunk = this.createOverlapChunk(currentChunk, sentence);
        currentLength = currentChunk.length;
      } else {
        // Add sentence to current chunk
        currentChunk += (currentChunk ? " " : "") + sentence;
        currentLength += sentenceLength + (currentChunk ? 1 : 0); // +1 for space
      }
    }

    // Add the last chunk if it meets minimum size
    if (currentChunk.trim().length >= this.minChunkSize) {
      chunks.push(currentChunk.trim());
    }

    return chunks.length > 0 ? chunks : [sentences.join(" ")]; // Fallback to full text if no valid chunks
  }

  /**
   * Create overlap between chunks
   * @param {string} previousChunk - Previous chunk text
   * @param {string} newSentence - New sentence to start with
   * @returns {string} New chunk with overlap
   */
  createOverlapChunk(previousChunk, newSentence) {
    if (this.chunkOverlap <= 0) {
      return newSentence;
    }

    // Get the last part of previous chunk for overlap
    const overlapText = previousChunk.slice(-this.chunkOverlap);

    // Find the start of the last complete sentence in overlap
    const lastSentenceStart = Math.max(
      overlapText.lastIndexOf(". "),
      overlapText.lastIndexOf("! "),
      overlapText.lastIndexOf("? ")
    );

    if (lastSentenceStart > 0) {
      const overlap = overlapText.slice(lastSentenceStart + 2); // +2 to skip '. '
      return overlap + " " + newSentence;
    }

    return newSentence;
  }

  /**
   * Chunk different content types
   * @param {string} content - Content to chunk
   * @param {string} contentType - Type of content (file, text, qa)
   * @param {object} sourceMetadata - Metadata about the source
   * @returns {Array} Array of chunks
   */
  chunkByContentType(content, contentType, sourceMetadata = {}) {
    const baseMetadata = {
      contentType,
      sourceId: sourceMetadata.sourceId,
      chatbotId: sourceMetadata.chatbotId,
      ...sourceMetadata,
    };

    switch (contentType) {
      case "file":
        return this.chunkFileContent(content, baseMetadata);

      case "text":
        return this.chunkTextContent(content, baseMetadata);

      case "qa":
        return this.chunkQAContent(content, baseMetadata);

      default:
        return this.chunkText(content, baseMetadata);
    }
  }

  /**
   * Chunk file content
   * @param {string} content - File content
   * @param {object} metadata - File metadata
   * @returns {Array} Array of chunks
   */
  chunkFileContent(content, metadata) {
    // Get optimal configuration for file content
    const optimalConfig = getOptimalConfig("file", content.length);

    // Temporarily use optimal settings
    const originalConfig = {
      maxChunkSize: this.maxChunkSize,
      chunkOverlap: this.chunkOverlap,
      minChunkSize: this.minChunkSize,
    };

    this.maxChunkSize = optimalConfig.maxChunkSize;
    this.chunkOverlap = optimalConfig.chunkOverlap;
    this.minChunkSize = optimalConfig.minChunkSize;

    const chunks = this.chunkText(content, {
      ...metadata,
      sourceType: "file",
    });

    // Restore original configuration
    Object.assign(this, originalConfig);
    return chunks;
  }

  /**
   * Chunk text content
   * @param {string} content - Text content
   * @param {object} metadata - Text metadata
   * @returns {Array} Array of chunks
   */
  chunkTextContent(content, metadata) {
    // Get optimal configuration for text content
    const optimalConfig = getOptimalConfig("text", content.length);

    // Temporarily use optimal settings
    const originalConfig = {
      maxChunkSize: this.maxChunkSize,
      chunkOverlap: this.chunkOverlap,
      minChunkSize: this.minChunkSize,
    };

    this.maxChunkSize = optimalConfig.maxChunkSize;
    this.chunkOverlap = optimalConfig.chunkOverlap;
    this.minChunkSize = optimalConfig.minChunkSize;

    const chunks = this.chunkText(content, {
      ...metadata,
      sourceType: "text",
    });

    // Restore original configuration
    Object.assign(this, originalConfig);
    return chunks;
  }

  /**
   * Chunk Q&A content
   * @param {Array} qaItems - Array of Q&A pairs
   * @param {object} metadata - Q&A metadata
   * @returns {Array} Array of chunks
   */
  chunkQAContent(qaItems, metadata) {
    const chunks = [];

    qaItems.forEach((qa, index) => {
      // Each Q&A pair becomes its own chunk
      const qaPairText = `Question: ${qa.question}\nAnswer: ${qa.answer}`;

      chunks.push({
        text: qaPairText,
        index: index,
        length: qaPairText.length,
        metadata: {
          ...metadata,
          sourceType: "qa",
          questionId: qa._id || `qa_${index}`,
          question: qa.question,
          answer: qa.answer,
          chunkIndex: index,
          totalChunks: qaItems.length,
        },
      });
    });

    return chunks;
  }
}

module.exports = TextChunkingService;
