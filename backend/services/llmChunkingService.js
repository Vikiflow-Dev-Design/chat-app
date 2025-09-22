const crypto = require("crypto");
const { createClient } = require("@supabase/supabase-js");

/**
 * LLM-Based Intelligent Chunking Service
 * Uses Gemini LLM for document structure analysis and semantic chunking
 */
class LLMChunkingService {
  constructor() {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY environment variable is required");
    }

    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );

    this.geminiApiKey = process.env.GEMINI_API_KEY;
    this.model = "gemini-1.5-pro";
    this.maxTokens = 8192;
    this.temperature = 0.1; // Low temperature for consistent analysis
  }

  /**
   * Generate unique chunk ID
   * @returns {string} Unique chunk identifier
   */
  generateChunkId() {
    return `chunk_${Date.now()}_${crypto.randomBytes(8).toString("hex")}`;
  }

  /**
   * Log LLM processing for monitoring
   * @param {string} stage - Processing stage
   * @param {Object} data - Processing data
   * @param {boolean} success - Success status
   * @param {string} error - Error message if failed
   */
  async logLLMProcessing(stage, data, success = true, error = null) {
    try {
      await this.supabase.from("llm_processing_logs").insert({
        chunk_id: data.chunkId || null,
        document_id: data.documentId || null,
        processing_stage: stage,
        llm_model: this.model,
        prompt_tokens: data.promptTokens || null,
        completion_tokens: data.completionTokens || null,
        total_tokens: data.totalTokens || null,
        processing_time_ms: data.processingTime || null,
        success: success,
        error_message: error,
        llm_response: data.llmResponse || null,
      });
    } catch (logError) {
      console.warn("Failed to log LLM processing:", logError.message);
    }
  }

  /**
   * Call Gemini API with retry logic and exponential backoff
   * @param {string} prompt - Prompt for the LLM
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} LLM response
   */
  async callGeminiAPI(prompt, options = {}) {
    const startTime = Date.now();
    const maxRetries = options.maxRetries || 3;
    const baseDelay = options.baseDelay || 1000; // 1 second base delay

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Add delay for retries (exponential backoff)
        if (attempt > 0) {
          const delay =
            baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000; // Add jitter
          console.log(
            `⏳ Retrying Gemini API call in ${Math.round(delay)}ms (attempt ${
              attempt + 1
            }/${maxRetries + 1})`
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
        }

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.geminiApiKey}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              contents: [
                {
                  parts: [{ text: prompt }],
                },
              ],
              generationConfig: {
                temperature: options.temperature || this.temperature,
                maxOutputTokens: options.maxTokens || this.maxTokens,
                topP: 0.8,
                topK: 40,
              },
            }),
          }
        );

        if (!response.ok) {
          const errorText = await response.text();

          // Check if it's a rate limit error
          if (response.status === 429) {
            if (attempt < maxRetries) {
              console.warn(
                `⚠️ Rate limited (429), retrying... (attempt ${attempt + 1}/${
                  maxRetries + 1
                })`
              );
              continue; // Retry with exponential backoff
            } else {
              throw new Error(
                `Gemini API rate limit exceeded after ${
                  maxRetries + 1
                } attempts`
              );
            }
          }

          throw new Error(
            `Gemini API error: ${response.status} ${response.statusText} - ${errorText}`
          );
        }

        const result = await response.json();
        const processingTime = Date.now() - startTime;

        if (
          !result.candidates ||
          !result.candidates[0] ||
          !result.candidates[0].content
        ) {
          throw new Error("Invalid response from Gemini API");
        }

        const content = result.candidates[0].content.parts[0].text;

        // Log successful call
        if (attempt > 0) {
          console.log(`✅ Gemini API call succeeded on attempt ${attempt + 1}`);
        }

        return {
          content,
          processingTime,
          usage: result.usageMetadata || {},
          attempts: attempt + 1,
        };
      } catch (error) {
        // If this is the last attempt or not a retryable error, throw
        if (
          attempt === maxRetries ||
          (error.message &&
            !error.message.includes("429") &&
            !error.message.includes("rate limit"))
        ) {
          const processingTime = Date.now() - startTime;
          console.error("Gemini API call failed after all retries:", error);

          // Log the failure
          await this.logLLMProcessing(
            options.stage || "unknown",
            { processingTime, attempts: attempt + 1, ...options },
            false,
            error.message
          );

          throw error;
        }

        // Continue to next retry attempt
        console.warn(`⚠️ Attempt ${attempt + 1} failed: ${error.message}`);
      }
    }
  }

  /**
   * Analyze document structure using LLM
   * @param {string} markdownContent - Document content
   * @param {Object} documentMetadata - Document metadata
   * @returns {Promise<Object>} Document structure analysis
   */
  async analyzeDocumentStructure(markdownContent, documentMetadata) {
    console.log("🔍 Analyzing document structure with LLM...");

    const prompt = `
Analyze the following markdown document and provide a detailed structural analysis.

DOCUMENT METADATA:
${JSON.stringify(documentMetadata, null, 2)}

DOCUMENT CONTENT:
${markdownContent.substring(0, 8000)} ${
      markdownContent.length > 8000 ? "...[truncated]" : ""
    }

Please analyze and return a JSON response with the following structure:
{
  "documentType": "article|manual|guide|reference|other",
  "mainSections": [
    {
      "title": "section title",
      "level": 1,
      "startPosition": 0,
      "endPosition": 500,
      "subsections": [...]
    }
  ],
  "headingHierarchy": [
    {
      "level": 1,
      "title": "heading text",
      "position": 100,
      "context": "brief description"
    }
  ],
  "contentBlocks": [
    {
      "type": "text|code|list|table|image",
      "startPosition": 0,
      "endPosition": 200,
      "significance": "high|medium|low"
    }
  ],
  "semanticBoundaries": [
    {
      "position": 500,
      "reason": "topic change|section break|context shift",
      "confidence": 0.9
    }
  ],
  "chunkingRecommendations": {
    "optimalChunkSize": 800,
    "preserveStructure": true,
    "splitStrategy": "semantic|structural|hybrid"
  }
}

Focus on identifying logical content boundaries, semantic coherence, and optimal chunking points.
`;

    try {
      const response = await this.callGeminiAPI(prompt, {
        stage: "structure_analysis",
        documentId: documentMetadata.documentId,
      });

      // Parse JSON response
      let structureAnalysis;
      try {
        structureAnalysis = JSON.parse(response.content);
      } catch (parseError) {
        console.warn("Failed to parse structure analysis JSON, using fallback");
        structureAnalysis = this.createFallbackStructure(markdownContent);
      }

      await this.logLLMProcessing("structure_analysis", {
        documentId: documentMetadata.documentId,
        processingTime: response.processingTime,
        promptTokens: response.usage.promptTokenCount,
        completionTokens: response.usage.candidatesTokenCount,
        totalTokens: response.usage.totalTokenCount,
        llmResponse: structureAnalysis,
      });

      console.log("✅ Document structure analyzed successfully");
      return structureAnalysis;
    } catch (error) {
      console.error("Error analyzing document structure:", error);
      console.log("🔄 Using fallback structure analysis...");
      return this.createFallbackStructure(markdownContent);
    }
  }

  /**
   * Create fallback structure analysis when LLM fails
   * @param {string} markdownContent - Document content
   * @returns {Object} Basic structure analysis
   */
  createFallbackStructure(markdownContent) {
    const lines = markdownContent.split("\n");
    const headings = [];
    const semanticBoundaries = [];

    lines.forEach((line, index) => {
      const headingMatch = line.match(/^(#{1,6})\s+(.+)/);
      if (headingMatch) {
        headings.push({
          level: headingMatch[1].length,
          title: headingMatch[2],
          position: markdownContent.indexOf(line),
          context: "Heading detected",
        });
      }
    });

    // Create semantic boundaries at major headings
    headings.forEach((heading) => {
      if (heading.level <= 2) {
        semanticBoundaries.push({
          position: heading.position,
          reason: "major heading",
          confidence: 0.8,
        });
      }
    });

    return {
      documentType: "other",
      mainSections: [],
      headingHierarchy: headings,
      contentBlocks: [],
      semanticBoundaries: semanticBoundaries,
      chunkingRecommendations: {
        optimalChunkSize: 800,
        preserveStructure: true,
        splitStrategy: "structural",
      },
    };
  }

  /**
   * Generate semantic chunks using LLM analysis
   * @param {string} markdownContent - Document content
   * @param {Object} structureAnalysis - Structure analysis from LLM
   * @param {Object} options - Chunking options
   * @returns {Promise<Array>} Array of semantic chunks
   */
  async generateSemanticChunks(
    markdownContent,
    structureAnalysis,
    options = {}
  ) {
    console.log("🧩 Generating semantic chunks with LLM...");

    const {
      maxChunkSize = structureAnalysis.chunkingRecommendations
        ?.optimalChunkSize || 800,
      minChunkSize = 100,
      overlapSize = 100,
    } = options;

    const chunks = [];
    const semanticBoundaries = structureAnalysis.semanticBoundaries || [];

    // Sort boundaries by position
    semanticBoundaries.sort((a, b) => a.position - b.position);

    let currentPosition = 0;
    let chunkIndex = 0;

    for (let i = 0; i <= semanticBoundaries.length; i++) {
      const nextBoundary = semanticBoundaries[i];
      const endPosition = nextBoundary
        ? nextBoundary.position
        : markdownContent.length;

      const sectionContent = markdownContent.substring(
        currentPosition,
        endPosition
      );

      if (sectionContent.trim().length < minChunkSize) {
        // Section too small, merge with next or previous
        continue;
      }

      if (sectionContent.length <= maxChunkSize) {
        // Section fits in one chunk
        const chunk = await this.createChunkFromContent(
          sectionContent,
          chunkIndex,
          structureAnalysis,
          currentPosition
        );
        chunks.push(chunk);
        chunkIndex++;
      } else {
        // Section too large, split further
        const subChunks = await this.splitLargeSection(
          sectionContent,
          chunkIndex,
          structureAnalysis,
          currentPosition,
          maxChunkSize,
          minChunkSize
        );
        chunks.push(...subChunks);
        chunkIndex += subChunks.length;
      }

      currentPosition = endPosition;
    }

    // Add contextual overlap between chunks
    this.addContextualOverlap(chunks, overlapSize);

    console.log(`✅ Generated ${chunks.length} semantic chunks`);
    return chunks;
  }

  /**
   * Create a chunk from content section
   * @param {string} content - Chunk content
   * @param {number} index - Chunk index
   * @param {Object} structureAnalysis - Document structure
   * @param {number} startPosition - Start position in document
   * @returns {Promise<Object>} Chunk object
   */
  async createChunkFromContent(
    content,
    index,
    structureAnalysis,
    startPosition
  ) {
    // Find relevant headings for this chunk
    const relevantHeadings =
      structureAnalysis.headingHierarchy?.filter(
        (heading) =>
          heading.position >= startPosition &&
          heading.position <= startPosition + content.length
      ) || [];

    // Build heading context
    const headingContext = relevantHeadings.map((heading) => ({
      level: heading.level,
      title: heading.title,
      position: heading.position - startPosition,
    }));

    return {
      id: this.generateChunkId(),
      content: content.trim(),
      type: this.determineChunkType(content),
      chunkIndex: index,
      headingContext: headingContext,
      size: content.length,
      wordCount: content.split(/\s+/).length,
      startPosition: startPosition,
      endPosition: startPosition + content.length,
      relationships: [], // Will be populated later
      metadata: {
        chunkIndex: index,
        contentLength: content.length,
        wordCount: content.split(/\s+/).length,
        documentSection:
          headingContext.length > 0
            ? headingContext[headingContext.length - 1].title
            : "Introduction",
      },
    };
  }

  /**
   * Split large section into smaller chunks
   * @param {string} content - Section content
   * @param {number} startIndex - Starting chunk index
   * @param {Object} structureAnalysis - Document structure
   * @param {number} startPosition - Start position in document
   * @param {number} maxChunkSize - Maximum chunk size
   * @param {number} minChunkSize - Minimum chunk size
   * @returns {Promise<Array>} Array of sub-chunks
   */
  async splitLargeSection(
    content,
    startIndex,
    structureAnalysis,
    startPosition,
    maxChunkSize,
    minChunkSize
  ) {
    const chunks = [];
    const sentences = content
      .split(/[.!?]+/)
      .filter((s) => s.trim().length > 0);

    let currentChunk = "";
    let chunkIndex = startIndex;
    let currentPosition = 0;

    for (const sentence of sentences) {
      const sentenceWithPunctuation = sentence.trim() + ".";

      if (
        currentChunk.length + sentenceWithPunctuation.length > maxChunkSize &&
        currentChunk.length >= minChunkSize
      ) {
        // Create chunk from current content
        const chunk = await this.createChunkFromContent(
          currentChunk,
          chunkIndex,
          structureAnalysis,
          startPosition + currentPosition
        );
        chunks.push(chunk);

        currentPosition += currentChunk.length;
        currentChunk = sentenceWithPunctuation;
        chunkIndex++;
      } else {
        currentChunk += (currentChunk ? " " : "") + sentenceWithPunctuation;
      }
    }

    // Add remaining content as final chunk
    if (currentChunk.trim().length >= minChunkSize) {
      const chunk = await this.createChunkFromContent(
        currentChunk,
        chunkIndex,
        structureAnalysis,
        startPosition + currentPosition
      );
      chunks.push(chunk);
    }

    return chunks;
  }

  /**
   * Determine chunk type based on content
   * @param {string} content - Chunk content
   * @returns {string} Chunk type
   */
  determineChunkType(content) {
    if (content.includes("```") || content.includes("`")) {
      return "code";
    }
    if (content.match(/^\s*[-*+]\s/m) || content.match(/^\s*\d+\.\s/m)) {
      return "list";
    }
    if (content.includes("|") && content.includes("---")) {
      return "table";
    }
    if (content.includes("![") || content.includes("<img")) {
      return "image";
    }
    return "text";
  }

  /**
   * Add contextual overlap between chunks
   * @param {Array} chunks - Array of chunks
   * @param {number} overlapSize - Overlap size in characters
   */
  addContextualOverlap(chunks, overlapSize) {
    for (let i = 1; i < chunks.length; i++) {
      const prevChunk = chunks[i - 1];
      const currentChunk = chunks[i];

      // Add overlap from previous chunk
      const overlapText = prevChunk.content.slice(-overlapSize);
      if (overlapText.trim().length > 0) {
        currentChunk.content = `...${overlapText}\n\n${currentChunk.content}`;
        currentChunk.hasOverlap = true;
        currentChunk.overlapSource = prevChunk.id;
      }
    }
  }

  /**
   * Process markdown content into LLM-based chunks
   * @param {string} markdownContent - Clean markdown from Docling
   * @param {Object} documentMetadata - Document metadata
   * @param {Object} options - Chunking options
   * @returns {Promise<Array>} Array of intelligent chunks
   */
  async processMarkdownToChunks(
    markdownContent,
    documentMetadata,
    options = {}
  ) {
    try {
      console.log("🤖 Starting LLM-based intelligent chunking...");

      // Step 1: Analyze document structure with LLM
      const structureAnalysis = await this.analyzeDocumentStructure(
        markdownContent,
        documentMetadata
      );

      // Step 2: Generate semantic chunks based on LLM analysis
      const chunks = await this.generateSemanticChunks(
        markdownContent,
        structureAnalysis,
        options
      );

      // Step 3: Establish relationships between chunks
      this.establishChunkRelationships(chunks, structureAnalysis);

      console.log(
        `✅ LLM-based chunking completed: ${chunks.length} intelligent chunks created`
      );

      return chunks;
    } catch (error) {
      console.error("Error in LLM-based chunking:", error);
      throw new Error(`LLM chunking failed: ${error.message}`);
    }
  }

  /**
   * Establish relationships between chunks
   * @param {Array} chunks - Array of chunks
   * @param {Object} structureAnalysis - Document structure analysis
   */
  establishChunkRelationships(chunks, structureAnalysis) {
    console.log("🔗 Establishing chunk relationships...");

    chunks.forEach((chunk, index) => {
      const relationships = [];

      // Sequential relationships
      if (index > 0) {
        relationships.push({
          type: "sequential",
          direction: "previous",
          targetChunkId: chunks[index - 1].id,
          strength: 0.8,
        });
      }
      if (index < chunks.length - 1) {
        relationships.push({
          type: "sequential",
          direction: "next",
          targetChunkId: chunks[index + 1].id,
          strength: 0.8,
        });
      }

      // Hierarchical relationships based on headings
      const chunkHeadings = chunk.headingContext || [];
      chunks.forEach((otherChunk, otherIndex) => {
        if (index === otherIndex) return;

        const otherHeadings = otherChunk.headingContext || [];
        const sharedHeadings = chunkHeadings.filter((h1) =>
          otherHeadings.some((h2) => h2.title === h1.title)
        );

        if (sharedHeadings.length > 0) {
          relationships.push({
            type: "hierarchical",
            direction: "sibling",
            targetChunkId: otherChunk.id,
            strength: Math.min(0.9, sharedHeadings.length * 0.3),
          });
        }
      });

      chunk.relationships = relationships;
    });

    console.log("✅ Chunk relationships established");
  }
}

module.exports = LLMChunkingService;
