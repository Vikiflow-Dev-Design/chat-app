/**
 * Relationship-Based Chunking Service
 * Creates intelligent chunks with relationships and metadata for advanced RAG workflows
 */

const { v4: uuidv4 } = require("uuid");

class RelationshipChunkingService {
  constructor() {
    this.chunkIdCounter = 0;
  }

  /**
   * Process markdown content into relationship-based chunks
   * @param {string} markdownContent - Clean markdown from Docling
   * @param {Object} documentMetadata - Document metadata from Docling
   * @param {Object} options - Chunking options
   * @returns {Array} Array of relationship-aware chunks
   */
  async processMarkdownToChunks(
    markdownContent,
    documentMetadata,
    options = {}
  ) {
    try {
      console.log("🔗 Starting relationship-based chunking...");

      const {
        maxChunkSize = 800,
        minChunkSize = 100,
        overlapSize = 100,
        preserveStructure = true,
      } = options;

      // Step 1: Parse document structure
      const documentStructure = this.parseDocumentStructure(markdownContent);

      // Step 2: Create semantic chunks based on structure
      const semanticChunks = this.createSemanticChunks(
        documentStructure,
        maxChunkSize,
        minChunkSize
      );

      // Step 3: Establish relationships between chunks
      const chunksWithRelationships =
        this.establishChunkRelationships(semanticChunks);

      // Step 4: Generate metadata for each chunk
      const chunksWithMetadata = await this.generateChunkMetadata(
        chunksWithRelationships,
        documentMetadata
      );

      // Step 5: Add overlap content for context
      const finalChunks = this.addContextualOverlap(
        chunksWithMetadata,
        overlapSize
      );

      console.log(`✅ Created ${finalChunks.length} relationship-based chunks`);

      return finalChunks;
    } catch (error) {
      console.error("Error in relationship-based chunking:", error);
      throw error;
    }
  }

  /**
   * Parse document structure from markdown
   * @param {string} markdownContent - Markdown content
   * @returns {Object} Document structure with sections and elements
   */
  parseDocumentStructure(markdownContent) {
    console.log("📋 Parsing document structure...");

    const lines = markdownContent.split("\n");
    const structure = {
      title: "",
      sections: [],
      currentSection: null,
      elements: [],
    };

    let currentElement = {
      type: "text",
      content: "",
      level: 0,
      lineStart: 0,
      lineEnd: 0,
    };

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();

      // Detect headings
      const headingMatch = trimmedLine.match(/^(#{1,6})\s+(.+)$/);
      if (headingMatch) {
        // Save previous element
        if (currentElement.content.trim()) {
          structure.elements.push({ ...currentElement, lineEnd: index - 1 });
        }

        const level = headingMatch[1].length;
        const title = headingMatch[2];

        // Create heading element
        currentElement = {
          type: "heading",
          content: title,
          level: level,
          lineStart: index,
          lineEnd: index,
          originalLine: line,
        };

        structure.elements.push({ ...currentElement });

        // Start new text element
        currentElement = {
          type: "text",
          content: "",
          level: level,
          lineStart: index + 1,
          lineEnd: index + 1,
          parentHeading: title,
        };

        return;
      }

      // Detect tables
      if (trimmedLine.includes("|") && trimmedLine.split("|").length > 2) {
        if (currentElement.type !== "table") {
          // Save previous element
          if (currentElement.content.trim()) {
            structure.elements.push({ ...currentElement, lineEnd: index - 1 });
          }

          // Start table element
          currentElement = {
            type: "table",
            content: line + "\n",
            level: currentElement.level,
            lineStart: index,
            lineEnd: index,
            parentHeading: currentElement.parentHeading,
          };
        } else {
          currentElement.content += line + "\n";
          currentElement.lineEnd = index;
        }
        return;
      }

      // Detect code blocks
      if (trimmedLine.startsWith("```")) {
        if (currentElement.type !== "code") {
          // Save previous element
          if (currentElement.content.trim()) {
            structure.elements.push({ ...currentElement, lineEnd: index - 1 });
          }

          // Start code element
          currentElement = {
            type: "code",
            content: line + "\n",
            level: currentElement.level,
            lineStart: index,
            lineEnd: index,
            parentHeading: currentElement.parentHeading,
            language: trimmedLine.substring(3),
          };
        } else {
          currentElement.content += line + "\n";
          currentElement.lineEnd = index;
          // End code block
          structure.elements.push({ ...currentElement });

          // Start new text element
          currentElement = {
            type: "text",
            content: "",
            level: currentElement.level,
            lineStart: index + 1,
            lineEnd: index + 1,
            parentHeading: currentElement.parentHeading,
          };
        }
        return;
      }

      // Detect lists
      if (trimmedLine.match(/^[-*+]\s+/) || trimmedLine.match(/^\d+\.\s+/)) {
        if (currentElement.type !== "list") {
          // Save previous element
          if (currentElement.content.trim()) {
            structure.elements.push({ ...currentElement, lineEnd: index - 1 });
          }

          // Start list element
          currentElement = {
            type: "list",
            content: line + "\n",
            level: currentElement.level,
            lineStart: index,
            lineEnd: index,
            parentHeading: currentElement.parentHeading,
          };
        } else {
          currentElement.content += line + "\n";
          currentElement.lineEnd = index;
        }
        return;
      }

      // Regular text
      if (currentElement.type === "text") {
        if (trimmedLine) {
          currentElement.content += line + "\n";
          currentElement.lineEnd = index;
        } else if (currentElement.content.trim()) {
          // Empty line - end current text element
          structure.elements.push({ ...currentElement });

          // Start new text element
          currentElement = {
            type: "text",
            content: "",
            level: currentElement.level,
            lineStart: index + 1,
            lineEnd: index + 1,
            parentHeading: currentElement.parentHeading,
          };
        }
      } else {
        // Non-text element encountered regular text
        if (currentElement.content.trim()) {
          structure.elements.push({ ...currentElement });
        }

        // Start new text element
        currentElement = {
          type: "text",
          content: trimmedLine ? line + "\n" : "",
          level: currentElement.level,
          lineStart: index,
          lineEnd: index,
          parentHeading: currentElement.parentHeading,
        };
      }
    });

    // Add final element
    if (currentElement.content.trim()) {
      structure.elements.push({ ...currentElement, lineEnd: lines.length - 1 });
    }

    console.log(`📊 Parsed ${structure.elements.length} document elements`);
    return structure;
  }

  /**
   * Create semantic chunks based on document structure
   * @param {Object} documentStructure - Parsed document structure
   * @param {number} maxChunkSize - Maximum chunk size
   * @param {number} minChunkSize - Minimum chunk size
   * @returns {Array} Array of semantic chunks
   */
  createSemanticChunks(documentStructure, maxChunkSize, minChunkSize) {
    console.log("🧩 Creating semantic chunks...");

    const chunks = [];
    let currentChunk = {
      id: this.generateChunkId(),
      content: "",
      elements: [],
      type: "mixed",
      headingContext: [],
      size: 0,
    };

    documentStructure.elements.forEach((element, index) => {
      const elementSize = element.content.length;

      // If adding this element would exceed max size, finalize current chunk
      if (
        currentChunk.size + elementSize > maxChunkSize &&
        currentChunk.size > minChunkSize
      ) {
        if (currentChunk.content.trim()) {
          chunks.push({ ...currentChunk });
        }

        // Start new chunk
        currentChunk = {
          id: this.generateChunkId(),
          content: "",
          elements: [],
          type: "mixed",
          headingContext: [...currentChunk.headingContext],
          size: 0,
        };
      }

      // Add element to current chunk
      currentChunk.elements.push(element);
      currentChunk.content += element.content + "\n";
      currentChunk.size += elementSize;

      // Update heading context
      if (element.type === "heading") {
        // Remove headings of same or lower level
        currentChunk.headingContext = currentChunk.headingContext.filter(
          (h) => h.level < element.level
        );
        currentChunk.headingContext.push({
          level: element.level,
          title: element.content,
          line: element.lineStart,
        });
      }

      // Determine chunk type
      if (currentChunk.elements.length === 1) {
        currentChunk.type = element.type;
      } else if (currentChunk.type !== element.type) {
        currentChunk.type = "mixed";
      }
    });

    // Add final chunk
    if (currentChunk.content.trim()) {
      chunks.push(currentChunk);
    }

    console.log(`✅ Created ${chunks.length} semantic chunks`);
    return chunks;
  }

  /**
   * Establish relationships between chunks
   * @param {Array} chunks - Array of semantic chunks
   * @returns {Array} Chunks with relationship information
   */
  establishChunkRelationships(chunks) {
    console.log("🔗 Establishing chunk relationships...");

    return chunks.map((chunk, index) => {
      const relationships = {
        sequential: {
          previous: index > 0 ? chunks[index - 1].id : null,
          next: index < chunks.length - 1 ? chunks[index + 1].id : null,
        },
        hierarchical: {
          parent: null,
          children: [],
          siblings: [],
        },
        topical: [],
        references: [],
      };

      // Find hierarchical relationships based on heading context
      if (chunk.headingContext.length > 0) {
        const currentLevel = Math.max(
          ...chunk.headingContext.map((h) => h.level)
        );

        // Find parent (chunk with heading of higher level)
        for (let i = index - 1; i >= 0; i--) {
          const prevChunk = chunks[i];
          if (prevChunk.headingContext.length > 0) {
            const prevLevel = Math.max(
              ...prevChunk.headingContext.map((h) => h.level)
            );
            if (prevLevel < currentLevel) {
              relationships.hierarchical.parent = prevChunk.id;
              break;
            }
          }
        }

        // Find siblings (chunks with same heading level)
        chunks.forEach((otherChunk, otherIndex) => {
          if (otherIndex !== index && otherChunk.headingContext.length > 0) {
            const otherLevel = Math.max(
              ...otherChunk.headingContext.map((h) => h.level)
            );
            if (otherLevel === currentLevel) {
              relationships.hierarchical.siblings.push(otherChunk.id);
            }
          }
        });
      }

      // Find topical relationships (chunks with similar content)
      const chunkKeywords = this.extractKeywords(chunk.content);
      chunks.forEach((otherChunk, otherIndex) => {
        if (otherIndex !== index) {
          const otherKeywords = this.extractKeywords(otherChunk.content);
          const similarity = this.calculateKeywordSimilarity(
            chunkKeywords,
            otherKeywords
          );

          if (similarity > 0.3) {
            // Threshold for topical relationship
            relationships.topical.push({
              chunkId: otherChunk.id,
              similarity: similarity,
              sharedKeywords: chunkKeywords.filter((k) =>
                otherKeywords.includes(k)
              ),
            });
          }
        }
      });

      return {
        ...chunk,
        relationships,
      };
    });
  }

  /**
   * Generate chunk ID
   * @returns {string} Unique chunk ID
   */
  generateChunkId() {
    return `chunk_${Date.now()}_${++this.chunkIdCounter}`;
  }

  /**
   * Extract keywords from text
   * @param {string} text - Text content
   * @returns {Array} Array of keywords
   */
  extractKeywords(text) {
    // Simple keyword extraction (can be enhanced with NLP)
    const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter((word) => word.length > 3)
      .filter((word) => !this.isStopWord(word));

    // Return unique words
    return [...new Set(words)];
  }

  /**
   * Check if word is a stop word
   * @param {string} word - Word to check
   * @returns {boolean} True if stop word
   */
  isStopWord(word) {
    const stopWords = [
      "this",
      "that",
      "with",
      "have",
      "will",
      "from",
      "they",
      "know",
      "want",
      "been",
      "good",
      "much",
      "some",
      "time",
      "very",
      "when",
      "come",
      "here",
      "just",
      "like",
      "long",
      "make",
      "many",
      "over",
      "such",
      "take",
      "than",
      "them",
      "well",
      "were",
    ];
    return stopWords.includes(word);
  }

  /**
   * Calculate similarity between keyword sets
   * @param {Array} keywords1 - First set of keywords
   * @param {Array} keywords2 - Second set of keywords
   * @returns {number} Similarity score (0-1)
   */
  calculateKeywordSimilarity(keywords1, keywords2) {
    if (keywords1.length === 0 || keywords2.length === 0) return 0;

    const intersection = keywords1.filter((k) => keywords2.includes(k));
    const union = [...new Set([...keywords1, ...keywords2])];

    return intersection.length / union.length;
  }

  /**
   * Generate rich metadata for each chunk
   * @param {Array} chunks - Chunks with relationships
   * @param {Object} documentMetadata - Original document metadata
   * @returns {Array} Chunks with rich metadata
   */
  async generateChunkMetadata(chunks, documentMetadata) {
    console.log("🏷️ Generating chunk metadata...");

    return chunks.map((chunk, index) => {
      const keywords = this.extractKeywords(chunk.content);
      const entities = this.extractEntities(chunk.content);

      const metadata = {
        // Basic information
        chunkId: chunk.id,
        chunkIndex: index,
        chunkType: chunk.type,

        // Content analysis
        topics: this.identifyTopics(chunk.content, keywords),
        entities: entities,
        keywords: keywords.slice(0, 10), // Top 10 keywords

        // Document structure
        headingContext: chunk.headingContext,
        documentSection:
          chunk.headingContext.length > 0
            ? chunk.headingContext[chunk.headingContext.length - 1].title
            : "Introduction",

        // Content characteristics
        contentLength: chunk.content.length,
        wordCount: chunk.content.split(/\s+/).length,
        complexityLevel: this.assessComplexity(chunk.content),

        // Question types this chunk can answer
        questionTypes: this.identifyQuestionTypes(chunk.content, chunk.type),

        // Target audience
        audience: this.identifyAudience(chunk.content, entities),

        // Prerequisites
        prerequisites: this.identifyPrerequisites(
          chunk.content,
          chunk.headingContext
        ),

        // Related concepts
        relatedConcepts: this.extractRelatedConcepts(chunk.content, keywords),

        // Original document metadata
        sourceDocument: {
          title: documentMetadata.title || "Unknown",
          fileType: documentMetadata.file_type || documentMetadata.fileType,
          processingMethod: documentMetadata.processing_method,
          totalLength: documentMetadata.total_length,
        },

        // Processing metadata
        createdAt: new Date().toISOString(),
        processingVersion: "1.0.0",
      };

      return {
        ...chunk,
        metadata,
      };
    });
  }

  /**
   * Identify topics from content and keywords
   * @param {string} content - Chunk content
   * @param {Array} keywords - Extracted keywords
   * @returns {Array} Array of identified topics
   */
  identifyTopics(content, keywords) {
    const topics = [];

    // Technical topics
    if (
      keywords.some((k) =>
        ["api", "endpoint", "request", "response", "http"].includes(k)
      )
    ) {
      topics.push("API Development");
    }
    if (
      keywords.some((k) => ["database", "query", "table", "schema"].includes(k))
    ) {
      topics.push("Database");
    }
    if (
      keywords.some((k) =>
        ["authentication", "security", "token", "password"].includes(k)
      )
    ) {
      topics.push("Security");
    }
    if (
      keywords.some((k) =>
        ["function", "method", "class", "variable"].includes(k)
      )
    ) {
      topics.push("Programming");
    }

    // Business topics
    if (
      keywords.some((k) =>
        ["user", "customer", "client", "service"].includes(k)
      )
    ) {
      topics.push("User Management");
    }
    if (
      keywords.some((k) =>
        ["process", "workflow", "step", "procedure"].includes(k)
      )
    ) {
      topics.push("Process");
    }

    return topics.length > 0 ? topics : ["General"];
  }

  /**
   * Extract entities from content
   * @param {string} content - Chunk content
   * @returns {Array} Array of entities
   */
  extractEntities(content) {
    const entities = [];

    // Extract URLs
    const urls = content.match(/https?:\/\/[^\s]+/g) || [];
    entities.push(...urls.map((url) => ({ type: "url", value: url })));

    // Extract code snippets
    const codeBlocks = content.match(/```[\s\S]*?```/g) || [];
    entities.push(...codeBlocks.map((code) => ({ type: "code", value: code })));

    // Extract file paths
    const filePaths =
      content.match(/[a-zA-Z]:[\\\/][^\s]+|\/[^\s]+\.[a-zA-Z]+/g) || [];
    entities.push(
      ...filePaths.map((path) => ({ type: "filepath", value: path }))
    );

    // Extract email addresses
    const emails =
      content.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
    entities.push(...emails.map((email) => ({ type: "email", value: email })));

    return entities;
  }

  /**
   * Assess content complexity
   * @param {string} content - Chunk content
   * @returns {string} Complexity level
   */
  assessComplexity(content) {
    const sentences = content.split(/[.!?]+/).length;
    const words = content.split(/\s+/).length;
    const avgWordsPerSentence = words / sentences;

    // Check for technical indicators
    const technicalTerms = (
      content.match(
        /\b(API|HTTP|JSON|XML|SQL|function|method|class|object|array)\b/gi
      ) || []
    ).length;
    const codeBlocks = (content.match(/```/g) || []).length / 2;

    if (avgWordsPerSentence > 20 || technicalTerms > 5 || codeBlocks > 0) {
      return "advanced";
    } else if (avgWordsPerSentence > 15 || technicalTerms > 2) {
      return "intermediate";
    } else {
      return "beginner";
    }
  }

  /**
   * Identify question types this chunk can answer
   * @param {string} content - Chunk content
   * @param {string} chunkType - Type of chunk
   * @returns {Array} Array of question types
   */
  identifyQuestionTypes(content, chunkType) {
    const questionTypes = [];

    if (chunkType === "heading") {
      questionTypes.push("overview", "definition");
    }

    if (content.toLowerCase().includes("how to") || content.includes("step")) {
      questionTypes.push("how-to", "procedure");
    }

    if (
      content.toLowerCase().includes("what is") ||
      content.toLowerCase().includes("definition")
    ) {
      questionTypes.push("definition", "explanation");
    }

    if (chunkType === "code") {
      questionTypes.push("implementation", "example");
    }

    if (chunkType === "table") {
      questionTypes.push("comparison", "reference");
    }

    if (chunkType === "list") {
      questionTypes.push("enumeration", "options");
    }

    return questionTypes.length > 0 ? questionTypes : ["general"];
  }

  /**
   * Identify target audience
   * @param {string} content - Chunk content
   * @param {Array} entities - Extracted entities
   * @returns {Array} Array of target audiences
   */
  identifyAudience(content, entities) {
    const audience = [];

    if (
      entities.some((e) => e.type === "code") ||
      content.includes("function") ||
      content.includes("API")
    ) {
      audience.push("developers");
    }

    if (
      content.toLowerCase().includes("admin") ||
      content.toLowerCase().includes("configure")
    ) {
      audience.push("administrators");
    }

    if (
      content.toLowerCase().includes("user") ||
      content.toLowerCase().includes("customer")
    ) {
      audience.push("end-users");
    }

    if (
      content.toLowerCase().includes("business") ||
      content.toLowerCase().includes("process")
    ) {
      audience.push("business-users");
    }

    return audience.length > 0 ? audience : ["general"];
  }

  /**
   * Identify prerequisites
   * @param {string} content - Chunk content
   * @param {Array} headingContext - Heading context
   * @returns {Array} Array of prerequisites
   */
  identifyPrerequisites(content, headingContext) {
    const prerequisites = [];

    // Based on heading context depth
    if (headingContext.length > 2) {
      prerequisites.push("basic understanding of previous sections");
    }

    // Technical prerequisites
    if (content.includes("API") || content.includes("endpoint")) {
      prerequisites.push("API knowledge");
    }

    if (content.includes("database") || content.includes("SQL")) {
      prerequisites.push("database concepts");
    }

    if (content.includes("authentication") || content.includes("token")) {
      prerequisites.push("security fundamentals");
    }

    return prerequisites;
  }

  /**
   * Extract related concepts
   * @param {string} content - Chunk content
   * @param {Array} keywords - Extracted keywords
   * @returns {Array} Array of related concepts
   */
  extractRelatedConcepts(content, keywords) {
    const concepts = [];

    // Group related keywords into concepts
    const techKeywords = keywords.filter((k) =>
      [
        "api",
        "database",
        "security",
        "authentication",
        "server",
        "client",
      ].includes(k)
    );
    if (techKeywords.length > 0) {
      concepts.push("technical-implementation");
    }

    const processKeywords = keywords.filter((k) =>
      ["step", "process", "workflow", "procedure"].includes(k)
    );
    if (processKeywords.length > 0) {
      concepts.push("process-management");
    }

    const userKeywords = keywords.filter((k) =>
      ["user", "customer", "account", "profile"].includes(k)
    );
    if (userKeywords.length > 0) {
      concepts.push("user-management");
    }

    return concepts;
  }

  /**
   * Add contextual overlap between chunks
   * @param {Array} chunks - Chunks with metadata
   * @param {number} overlapSize - Size of overlap
   * @returns {Array} Chunks with contextual overlap
   */
  addContextualOverlap(chunks, overlapSize) {
    console.log("🔄 Adding contextual overlap...");

    return chunks.map((chunk, index) => {
      const overlap = {
        previous: null,
        next: null,
      };

      // Add overlap from previous chunk
      if (index > 0) {
        const prevChunk = chunks[index - 1];
        const prevContent = prevChunk.content;
        const overlapContent = prevContent.slice(-overlapSize);

        overlap.previous = {
          chunkId: prevChunk.id,
          content: overlapContent,
          size: overlapContent.length,
        };
      }

      // Add overlap to next chunk
      if (index < chunks.length - 1) {
        const nextChunk = chunks[index + 1];
        const nextContent = nextChunk.content;
        const overlapContent = nextContent.slice(0, overlapSize);

        overlap.next = {
          chunkId: nextChunk.id,
          content: overlapContent,
          size: overlapContent.length,
        };
      }

      return {
        ...chunk,
        overlap,
      };
    });
  }
}

module.exports = RelationshipChunkingService;
