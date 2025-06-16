const { createClient } = require("@supabase/supabase-js");

/**
 * LLM-Based Metadata Extraction Service
 * Uses Gemini LLM for intelligent metadata generation from chunks
 */
class LLMMetadataService {
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
    this.maxTokens = 4096;
    this.temperature = 0.2; // Low temperature for consistent metadata
  }

  /**
   * Call Gemini API for metadata extraction with retry logic
   * @param {string} prompt - Prompt for metadata extraction
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} LLM response
   */
  async callGeminiAPI(prompt, options = {}) {
    const startTime = Date.now();
    const maxRetries = options.maxRetries || 3;
    const baseDelay = options.baseDelay || 1000;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Add delay for retries (exponential backoff)
        if (attempt > 0) {
          const delay =
            baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000;
          console.log(
            `⏳ Retrying metadata API call in ${Math.round(delay)}ms (attempt ${
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
                `⚠️ Metadata API rate limited (429), retrying... (attempt ${
                  attempt + 1
                }/${maxRetries + 1})`
              );
              continue;
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

        if (attempt > 0) {
          console.log(
            `✅ Metadata API call succeeded on attempt ${attempt + 1}`
          );
        }

        return {
          content,
          processingTime,
          usage: result.usageMetadata || {},
          attempts: attempt + 1,
        };
      } catch (error) {
        if (
          attempt === maxRetries ||
          (error.message &&
            !error.message.includes("429") &&
            !error.message.includes("rate limit"))
        ) {
          console.error("Metadata API call failed after all retries:", error);
          throw error;
        }

        console.warn(
          `⚠️ Metadata attempt ${attempt + 1} failed: ${error.message}`
        );
      }
    }
  }

  /**
   * Log metadata processing for monitoring
   * @param {string} chunkId - Chunk ID
   * @param {Object} data - Processing data
   * @param {boolean} success - Success status
   * @param {string} error - Error message if failed
   */
  async logMetadataProcessing(chunkId, data, success = true, error = null) {
    try {
      await this.supabase.from("llm_processing_logs").insert({
        chunk_id: chunkId,
        document_id: data.documentId || null,
        processing_stage: "metadata_extraction",
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
      console.warn("Failed to log metadata processing:", logError.message);
    }
  }

  /**
   * Extract comprehensive metadata from a chunk using LLM
   * @param {Object} chunk - Chunk object with content and context
   * @param {Object} documentMetadata - Original document metadata
   * @returns {Promise<Object>} Extracted metadata
   */
  async extractChunkMetadata(chunk, documentMetadata) {
    console.log(`🏷️ Extracting metadata for chunk: ${chunk.id}`);

    const prompt = `
Analyze the following text chunk and extract comprehensive metadata. The chunk is part of a larger document.

DOCUMENT CONTEXT:
${JSON.stringify(documentMetadata, null, 2)}

CHUNK CONTEXT:
- Chunk ID: ${chunk.id}
- Chunk Type: ${chunk.type}
- Document Section: ${chunk.metadata?.documentSection || "Unknown"}
- Heading Context: ${JSON.stringify(chunk.headingContext || [], null, 2)}

CHUNK CONTENT:
${chunk.content}

Please analyze and return a JSON response with the following metadata structure:
{
  "topics": [
    "main topic 1",
    "main topic 2",
    "subtopic 1"
  ],
  "keywords": [
    "important keyword 1",
    "technical term 1",
    "concept 1",
    "key phrase 1"
  ],
  "heading_context": {
    "navigation_path": "Section > Subsection > Topic",
    "context_description": "Brief description of where this content fits",
    "hierarchical_level": 2
  },
  "document_section": "Introduction|Methods|Results|Discussion|Conclusion|Other",
  "audience": [
    "target audience 1",
    "skill level",
    "domain expertise required"
  ],
  "question_type": [
    "factual",
    "conceptual", 
    "procedural",
    "analytical",
    "comparative"
  ],
  "complexity_level": "beginner|intermediate|advanced",
  "content_characteristics": {
    "has_code": false,
    "has_examples": true,
    "has_definitions": false,
    "has_instructions": true,
    "has_references": false
  },
  "semantic_tags": [
    "explanation",
    "tutorial",
    "reference",
    "example"
  ],
  "prerequisites": [
    "required knowledge 1",
    "required skill 1"
  ],
  "related_concepts": [
    "related concept 1",
    "connected topic 1"
  ]
}

Guidelines:
1. Extract 3-8 topics that represent the main themes
2. Identify 5-15 important keywords and technical terms
3. Determine the target audience and required expertise level
4. Classify what types of questions this content can answer
5. Assess complexity level based on language, concepts, and prerequisites
6. Identify content characteristics and semantic tags
7. Be specific and accurate - avoid generic terms
8. Focus on actionable metadata for search and retrieval

Return only valid JSON without any additional text or formatting.
`;

    try {
      const response = await this.callGeminiAPI(prompt, {
        chunkId: chunk.id,
        documentId: documentMetadata.documentId,
      });

      // Parse JSON response
      let extractedMetadata;
      try {
        extractedMetadata = JSON.parse(response.content);
      } catch (parseError) {
        console.warn(
          `Failed to parse metadata JSON for chunk ${chunk.id}, using fallback`
        );
        extractedMetadata = this.createFallbackMetadata(chunk);
      }

      // Validate and clean metadata
      const cleanedMetadata = this.validateAndCleanMetadata(
        extractedMetadata,
        chunk
      );

      await this.logMetadataProcessing(chunk.id, {
        documentId: documentMetadata.documentId,
        processingTime: response.processingTime,
        promptTokens: response.usage.promptTokenCount,
        completionTokens: response.usage.candidatesTokenCount,
        totalTokens: response.usage.totalTokenCount,
        llmResponse: cleanedMetadata,
      });

      console.log(`✅ Metadata extracted for chunk ${chunk.id}`);
      return cleanedMetadata;
    } catch (error) {
      console.error(`Error extracting metadata for chunk ${chunk.id}:`, error);

      await this.logMetadataProcessing(
        chunk.id,
        { documentId: documentMetadata.documentId },
        false,
        error.message
      );

      // Return fallback metadata
      return this.createFallbackMetadata(chunk);
    }
  }

  /**
   * Create fallback metadata when LLM extraction fails
   * @param {Object} chunk - Chunk object
   * @returns {Object} Basic metadata
   */
  createFallbackMetadata(chunk) {
    const content = chunk.content.toLowerCase();
    const words = chunk.content.split(/\s+/);

    // Extract basic keywords using simple frequency analysis
    const wordFreq = {};
    words.forEach((word) => {
      const cleanWord = word.replace(/[^\w]/g, "").toLowerCase();
      if (cleanWord.length > 3) {
        wordFreq[cleanWord] = (wordFreq[cleanWord] || 0) + 1;
      }
    });

    const keywords = Object.entries(wordFreq)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word);

    // Basic topic extraction from headings
    const topics = [];
    if (chunk.headingContext && chunk.headingContext.length > 0) {
      topics.push(...chunk.headingContext.map((h) => h.title));
    }

    // Determine complexity based on content characteristics
    let complexityLevel = "beginner";
    if (
      content.includes("advanced") ||
      content.includes("complex") ||
      content.includes("algorithm")
    ) {
      complexityLevel = "advanced";
    } else if (
      content.includes("intermediate") ||
      content.includes("technical")
    ) {
      complexityLevel = "intermediate";
    }

    return {
      topics: topics.length > 0 ? topics : ["general"],
      keywords: keywords.length > 0 ? keywords : ["content"],
      heading_context: {
        navigation_path:
          chunk.headingContext?.map((h) => h.title).join(" > ") || "Document",
        context_description: "Content section",
        hierarchical_level: chunk.headingContext?.length || 1,
      },
      document_section: chunk.metadata?.documentSection || "Content",
      audience: ["general"],
      question_type: ["factual"],
      complexity_level: complexityLevel,
      content_characteristics: {
        has_code: content.includes("```") || content.includes("code"),
        has_examples:
          content.includes("example") || content.includes("for instance"),
        has_definitions:
          content.includes("definition") || content.includes("means"),
        has_instructions:
          content.includes("step") || content.includes("how to"),
        has_references: content.includes("see") || content.includes("refer"),
      },
      semantic_tags: ["content"],
      prerequisites: [],
      related_concepts: [],
    };
  }

  /**
   * Validate and clean extracted metadata
   * @param {Object} metadata - Raw metadata from LLM
   * @param {Object} chunk - Original chunk
   * @returns {Object} Cleaned metadata
   */
  validateAndCleanMetadata(metadata, chunk) {
    const cleaned = {
      topics: this.validateArray(metadata.topics, "string", 8),
      keywords: this.validateArray(metadata.keywords, "string", 15),
      heading_context: metadata.heading_context || {},
      document_section:
        typeof metadata.document_section === "string"
          ? metadata.document_section
          : chunk.metadata?.documentSection || "Content",
      audience: this.validateArray(metadata.audience, "string", 5),
      question_type: this.validateArray(metadata.question_type, "string", 10),
      complexity_level: ["beginner", "intermediate", "advanced"].includes(
        metadata.complexity_level
      )
        ? metadata.complexity_level
        : "beginner",
      content_characteristics: metadata.content_characteristics || {},
      semantic_tags: this.validateArray(metadata.semantic_tags, "string", 10),
      prerequisites: this.validateArray(metadata.prerequisites, "string", 10),
      related_concepts: this.validateArray(
        metadata.related_concepts,
        "string",
        10
      ),
    };

    // Ensure minimum required fields
    if (cleaned.topics.length === 0) cleaned.topics = ["general"];
    if (cleaned.keywords.length === 0) cleaned.keywords = ["content"];
    if (cleaned.audience.length === 0) cleaned.audience = ["general"];
    if (cleaned.question_type.length === 0) cleaned.question_type = ["factual"];

    return cleaned;
  }

  /**
   * Validate array fields in metadata
   * @param {any} value - Value to validate
   * @param {string} type - Expected type of array elements
   * @param {number} maxLength - Maximum array length
   * @returns {Array} Validated array
   */
  validateArray(value, type, maxLength) {
    if (!Array.isArray(value)) return [];

    return value
      .filter((item) => typeof item === type && item.length > 0)
      .slice(0, maxLength)
      .map((item) => item.trim());
  }

  /**
   * Process multiple chunks for metadata extraction
   * @param {Array} chunks - Array of chunks
   * @param {Object} documentMetadata - Document metadata
   * @returns {Promise<Array>} Chunks with extracted metadata
   */
  async processChunksMetadata(chunks, documentMetadata) {
    try {
      console.log(`🔄 Processing metadata for ${chunks.length} chunks...`);

      const chunksWithMetadata = [];

      // Process chunks in batches to manage API rate limits
      const batchSize = 5;
      for (let i = 0; i < chunks.length; i += batchSize) {
        const batch = chunks.slice(i, i + batchSize);
        console.log(
          `Processing metadata batch ${
            Math.floor(i / batchSize) + 1
          }/${Math.ceil(chunks.length / batchSize)}`
        );

        const batchPromises = batch.map(async (chunk) => {
          try {
            const extractedMetadata = await this.extractChunkMetadata(
              chunk,
              documentMetadata
            );

            return {
              ...chunk,
              metadata: {
                ...chunk.metadata,
                ...extractedMetadata,
                // Add processing metadata
                llmProcessed: true,
                processingVersion: "v1.0",
                processingMethod: "llm_based",
                extractedAt: new Date().toISOString(),
              },
            };
          } catch (error) {
            console.error(
              `Failed to extract metadata for chunk ${chunk.id}:`,
              error
            );
            return {
              ...chunk,
              metadata: {
                ...chunk.metadata,
                ...this.createFallbackMetadata(chunk),
                llmProcessed: false,
                processingError: error.message,
                processingMethod: "fallback",
              },
            };
          }
        });

        const batchResults = await Promise.all(batchPromises);
        chunksWithMetadata.push(...batchResults);

        // Small delay between batches to respect rate limits
        if (i + batchSize < chunks.length) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      }

      const successCount = chunksWithMetadata.filter(
        (c) => c.metadata.llmProcessed
      ).length;
      console.log(
        `✅ Successfully processed metadata for ${successCount}/${chunks.length} chunks`
      );

      return chunksWithMetadata;
    } catch (error) {
      console.error("Error in batch metadata processing:", error);
      throw new Error(`Failed to process chunks metadata: ${error.message}`);
    }
  }

  /**
   * Extract metadata for query analysis
   * @param {string} query - User query
   * @returns {Promise<Object>} Query metadata for search optimization
   */
  async analyzeQueryMetadata(query) {
    console.log("🔍 Analyzing query metadata...");

    const prompt = `
Analyze the following user query and extract metadata to optimize search and retrieval.

USER QUERY: "${query}"

Please return a JSON response with the following structure:
{
  "intent": "search|question|explanation|instruction|comparison",
  "topics": ["main topic 1", "topic 2"],
  "keywords": ["key term 1", "term 2"],
  "question_type": ["factual", "conceptual", "procedural"],
  "complexity_level": "beginner|intermediate|advanced",
  "audience_level": "general|technical|expert",
  "search_strategy": "content_focused|topic_focused|keyword_focused|comprehensive",
  "embedding_weights": {
    "content": 0.4,
    "topics": 0.3,
    "keywords": 0.2,
    "question_type": 0.1
  }
}

Guidelines:
1. Identify the user's intent and information need
2. Extract key topics and keywords from the query
3. Determine what type of answer the user expects
4. Assess the complexity level of the query
5. Recommend search strategy and embedding weights
6. Be specific and actionable for search optimization

Return only valid JSON.
`;

    try {
      const response = await this.callGeminiAPI(prompt);
      const queryMetadata = JSON.parse(response.content);

      console.log("✅ Query metadata analyzed");
      return queryMetadata;
    } catch (error) {
      console.error("Error analyzing query metadata:", error);

      // Return basic fallback metadata
      return {
        intent: "search",
        topics: [query],
        keywords: query.split(/\s+/).filter((w) => w.length > 2),
        question_type: ["factual"],
        complexity_level: "beginner",
        audience_level: "general",
        search_strategy: "comprehensive",
        embedding_weights: {
          content: 0.4,
          topics: 0.2,
          keywords: 0.2,
          question_type: 0.2,
        },
      };
    }
  }
}

module.exports = LLMMetadataService;
