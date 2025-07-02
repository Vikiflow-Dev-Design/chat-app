const { GoogleGenerativeAI } = require("@google/generative-ai");
const MetadataCacheService = require("./MetadataCacheService");
const ChunkRetrievalService = require("./ChunkRetrievalService");

/**
 * Intelligent RAG Service
 * Orchestrates LLM-driven metadata analysis and chunk retrieval
 */
class IntelligentRAGService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.metadataCache = new MetadataCacheService();
    this.chunkRetrieval = new ChunkRetrievalService();

    // Function definitions for Gemini
    this.functionDeclarations = [
      {
        name: "getRelevantChunks",
        description:
          "Retrieve specific chunks by their IDs when metadata analysis shows relevance to user query",
        parameters: {
          type: "object",
          properties: {
            chunkIds: {
              type: "array",
              items: { type: "string" },
              description:
                "Array of chunk IDs that are relevant to the user query",
            },
            reasoning: {
              type: "string",
              description: "Brief explanation of why these chunks are relevant",
            },
            confidence: {
              type: "number",
              description: "Confidence score between 0 and 1 for the relevance",
            },
          },
          required: ["chunkIds", "reasoning", "confidence"],
        },
      },
    ];
  }

  /**
   * Process user query using intelligent RAG
   * @param {string} chatbotId - Chatbot ID
   * @param {string} userQuery - User's question
   * @param {string} behaviorPrompt - Chatbot's behavior prompt for fallback
   * @returns {Promise<Object>} Response with answer and metadata
   */
  async processQuery(chatbotId, userQuery, behaviorPrompt = "") {
    try {
      console.log(
        `🤖 Processing intelligent RAG query for chatbot: ${chatbotId}`
      );
      console.log(`📝 User query: "${userQuery}"`);

      const startTime = Date.now();

      // Step 1: Get cached metadata
      const metadataCache = await this.metadataCache.getMetadataCache(
        chatbotId
      );

      if (metadataCache.totalChunks === 0) {
        console.log(`📭 No chunks available for chatbot: ${chatbotId}`);
        return this.handleFallback(userQuery, behaviorPrompt, "no_chunks");
      }

      // Step 2: Analyze query with LLM
      const analysisResult = await this.analyzeQueryWithLLM(
        userQuery,
        metadataCache
      );

      // Step 3: Handle different response types
      if (analysisResult.type === "function_call") {
        return await this.handleFunctionCall(
          chatbotId,
          userQuery,
          analysisResult,
          behaviorPrompt,
          startTime
        );
      } else if (analysisResult.type === "fallback") {
        return this.handleFallback(
          userQuery,
          behaviorPrompt,
          "no_relevant_metadata"
        );
      } else if (analysisResult.type === "clarification") {
        return this.handleClarificationRequest(
          userQuery,
          analysisResult.message
        );
      }

      // Default fallback
      return this.handleFallback(
        userQuery,
        behaviorPrompt,
        "unknown_response_type"
      );
    } catch (error) {
      console.error(`❌ Error processing intelligent RAG query:`, error);
      return {
        success: false,
        answer:
          "I apologize, but I encountered an error while processing your question. Please try again.",
        error: error.message,
        fallback_used: true,
        response_type: "error",
      };
    }
  }

  /**
   * Analyze user query with LLM using cached metadata
   * @param {string} userQuery - User's question
   * @param {Object} metadataCache - Cached metadata
   * @returns {Promise<Object>} Analysis result
   */
  async analyzeQueryWithLLM(userQuery, metadataCache) {
    try {
      console.log(`🧠 Sending query to Gemini 2.0 Flash for analysis...`);

      const prompt = this.buildAnalysisPrompt(userQuery, metadataCache);

      const requestPayload = {
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          topP: 0.8,
          topK: 40,
          maxOutputTokens: 2048,
        },
        tools: [{ functionDeclarations: this.functionDeclarations }],
      };

      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`;

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-goog-api-key": process.env.GEMINI_API_KEY,
        },
        body: JSON.stringify(requestPayload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Gemini API error response:", errorText);
        throw new Error(
          `Gemini API returned status ${response.status}: ${errorText}`
        );
      }

      const result = await response.json();
      const responseData = result.candidates?.[0]?.content;

      // Check if LLM made a function call
      const functionCalls = responseData?.parts?.filter(
        (part) => part.functionCall
      );
      if (functionCalls && functionCalls.length > 0) {
        console.log(
          `🔧 LLM made function call:`,
          functionCalls[0].functionCall.name
        );
        return {
          type: "function_call",
          functionCall: functionCalls[0].functionCall,
        };
      }

      // Check response text for special keywords
      const textParts = responseData?.parts?.filter((part) => part.text);
      const responseText = textParts?.[0]?.text?.trim() || "";

      if (responseText.includes("FALLBACK_TO_BEHAVIOR")) {
        console.log(`🔄 LLM requested fallback to behavior prompt`);
        return { type: "fallback" };
      }

      if (responseText.includes("REQUEST_CLARIFICATION")) {
        console.log(`❓ LLM requested clarification`);
        return {
          type: "clarification",
          message: responseText.replace("REQUEST_CLARIFICATION", "").trim(),
        };
      }

      // If we get here, treat as fallback
      console.log(`🤔 Unexpected LLM response, falling back`);
      return { type: "fallback" };
    } catch (error) {
      console.error(`❌ Error analyzing query with LLM:`, error);
      throw new Error(`LLM analysis failed: ${error.message}`);
    }
  }

  /**
   * Build analysis prompt for LLM
   * @param {string} userQuery - User's question
   * @param {Object} metadataCache - Cached metadata
   * @returns {string} Formatted prompt
   */
  buildAnalysisPrompt(userQuery, metadataCache) {
    // Create a condensed metadata summary for the LLM
    const metadataSummary = metadataCache.chunks.map((chunk) => ({
      id: chunk.id,
      chunk_index: chunk.chunk_index,
      topics: chunk.topics,
      keywords: chunk.keywords,
      entities: chunk.entities,
      document_section: chunk.document_section,
      chunk_type: chunk.chunk_type,
      heading_context: chunk.heading_context,
      audience: chunk.audience,
      question_types: chunk.question_types,
    }));

    return `You are an intelligent knowledge retrieval system using LLM-driven metadata analysis (no embeddings). Your task is to analyze the user's query and select the most relevant chunks from the knowledge base.

User Query: "${userQuery}"

Available Knowledge Base Metadata for ${metadataCache.totalChunks} chunks:
${JSON.stringify(metadataSummary, null, 2)}

ANALYSIS INSTRUCTIONS:

1. **RELEVANT CHUNKS FOUND**: If you find chunks that can help answer the user's query:
   - Call the getRelevantChunks function with the chunk IDs
   - Provide clear reasoning for why these chunks are relevant
   - Consider: topics, keywords, entities, document sections, question types, and audience
   - Prioritize chunks that directly address the user's question
   - Include related chunks that provide context (same document_section or sequential chunks)

2. **NO RELEVANT CONTENT**: If no chunks in the knowledge base can help answer the query:
   - Respond with exactly "FALLBACK_TO_BEHAVIOR"
   - This will use the chatbot's general behavior prompt

3. **UNCLEAR QUERY**: If the query is vague, ambiguous, or just a greeting:
   - Respond with "REQUEST_CLARIFICATION: [helpful message asking for more specific information]"

ANALYSIS APPROACH:
- Match query intent with chunk topics and keywords
- Consider the user's likely information need
- Look for chunks that contain relevant entities or concepts
- Consider document sections that might contain the answer
- Think about what type of question this is (factual, how-to, conceptual, etc.)
- Look for chunks from the same document or section for comprehensive answers
- Confidence should be high (>0.7) for function calls

ENHANCED CONTEXT RETRIEVAL:
- When selecting chunks, consider their relationships to other chunks
- Sequential chunks (same document, adjacent chunk_index) often provide better context
- Chunks from the same document_section may contain related information

Analyze the user query against the available metadata and determine the best response.`;
  }

  /**
   * Handle function call from LLM
   * @param {string} chatbotId - Chatbot ID
   * @param {string} userQuery - User's question
   * @param {Object} analysisResult - LLM analysis result
   * @param {string} behaviorPrompt - Behavior prompt for context
   * @param {number} startTime - Start time for performance tracking
   * @returns {Promise<Object>} Response with answer
   */
  async handleFunctionCall(
    chatbotId,
    userQuery,
    analysisResult,
    behaviorPrompt,
    startTime
  ) {
    try {
      const functionCall = analysisResult.functionCall;
      const { chunkIds, reasoning, confidence } = functionCall.args;

      console.log(
        `📋 LLM selected ${chunkIds.length} chunks with confidence: ${confidence}`
      );
      console.log(`💭 Reasoning: ${reasoning}`);

      // Retrieve full chunk content
      let chunks = await this.chunkRetrieval.getChunksByIds(
        chatbotId,
        chunkIds
      );

      if (chunks.length === 0) {
        console.log(`⚠️ No chunks found for selected IDs, falling back`);
        return this.handleFallback(
          userQuery,
          behaviorPrompt,
          "chunks_not_found"
        );
      }

      // Enhance with related chunks for better context
      console.log(`🔗 Enhancing with related chunks for better context...`);
      chunks = await this.addRelatedChunks(chunks, chatbotId);

      // Generate answer using retrieved chunks
      const answer = await this.generateAnswerWithChunks(
        userQuery,
        chunks,
        behaviorPrompt
      );

      const responseTime = Date.now() - startTime;

      return {
        success: true,
        answer: answer,
        chunks_used: chunks.map((c) => ({
          id: c.id,
          chunk_index: c.chunk_index,
          document_section: c.document_section,
          preview: c.content.substring(0, 100) + "...",
        })),
        metadata: {
          reasoning: reasoning,
          confidence: confidence,
          total_chunks_available: await this.metadataCache.getCacheStats(
            chatbotId
          ).totalChunks,
          chunks_retrieved: chunks.length,
          response_time_ms: responseTime,
        },
        fallback_used: false,
        response_type: "intelligent_rag",
      };
    } catch (error) {
      console.error(`❌ Error handling function call:`, error);
      return this.handleFallback(
        userQuery,
        behaviorPrompt,
        "function_call_error"
      );
    }
  }

  /**
   * Generate answer using retrieved chunks
   * @param {string} userQuery - User's question
   * @param {Array} chunks - Retrieved chunks
   * @param {string} behaviorPrompt - Behavior prompt for context
   * @returns {Promise<string>} Generated answer
   */
  async generateAnswerWithChunks(userQuery, chunks, behaviorPrompt) {
    try {
      const chunksContent = chunks
        .map((chunk, index) => `[Chunk ${index + 1}]\n${chunk.content}\n`)
        .join("\n");

      const prompt = `${
        behaviorPrompt ? `Context: ${behaviorPrompt}\n\n` : ""
      }Based on the following relevant information, answer the user's question accurately and helpfully.

User Question: "${userQuery}"

Relevant Information:
${chunksContent}

Instructions:
- Answer based primarily on the provided information
- Be accurate and specific
- If the information doesn't fully answer the question, acknowledge what you can and cannot determine
- Maintain the personality and tone suggested by the context
- Keep the answer concise but complete

Answer:`;

      const requestPayload = {
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.3,
          topP: 0.8,
          topK: 40,
          maxOutputTokens: 1024,
        },
      };

      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`;

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-goog-api-key": process.env.GEMINI_API_KEY,
        },
        body: JSON.stringify(requestPayload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Gemini API error response:", errorText);
        throw new Error(
          `Gemini API returned status ${response.status}: ${errorText}`
        );
      }

      const result = await response.json();
      const responseText = result.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!responseText) {
        throw new Error("No response text received from Gemini API");
      }

      return responseText;
    } catch (error) {
      console.error(`❌ Error generating answer with chunks:`, error);
      throw new Error(`Answer generation failed: ${error.message}`);
    }
  }

  /**
   * Handle fallback to behavior prompt
   * @param {string} userQuery - User's question
   * @param {string} behaviorPrompt - Behavior prompt
   * @param {string} reason - Reason for fallback
   * @returns {Object} Fallback response
   */
  async handleFallback(userQuery, behaviorPrompt, reason) {
    try {
      console.log(`🔄 Falling back to behavior prompt. Reason: ${reason}`);

      if (!behaviorPrompt) {
        return {
          success: true,
          answer:
            "I don't have specific information about that topic in my knowledge base. Is there something else I can help you with?",
          fallback_used: true,
          response_type: "default_fallback",
          reason: reason,
        };
      }

      const prompt = `${behaviorPrompt}

User: "${userQuery}"

Respond according to your defined behavior and personality.`;

      const requestPayload = {
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          topP: 0.8,
          topK: 40,
          maxOutputTokens: 1024,
        },
      };

      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`;

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-goog-api-key": process.env.GEMINI_API_KEY,
        },
        body: JSON.stringify(requestPayload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Gemini API error response:", errorText);
        throw new Error(
          `Gemini API returned status ${response.status}: ${errorText}`
        );
      }

      const result = await response.json();
      const answer = result.candidates?.[0]?.content?.parts?.[0]?.text;

      return {
        success: true,
        answer:
          answer ||
          "I apologize, but I couldn't generate a response right now.",
        fallback_used: true,
        response_type: "behavior_prompt_fallback",
        reason: reason,
      };
    } catch (error) {
      console.error(`❌ Error in fallback handling:`, error);
      return {
        success: false,
        answer:
          "I apologize, but I'm having trouble processing your request right now. Please try again.",
        fallback_used: true,
        response_type: "error_fallback",
        reason: "fallback_error",
      };
    }
  }

  /**
   * Handle clarification request
   * @param {string} userQuery - User's question
   * @param {string} clarificationMessage - Custom clarification message
   * @returns {Object} Clarification response
   */
  handleClarificationRequest(userQuery, clarificationMessage) {
    const defaultMessage =
      "I'd be happy to help! Could you please provide more specific details about what you're looking for?";

    return {
      success: true,
      answer: clarificationMessage || defaultMessage,
      fallback_used: false,
      response_type: "clarification_request",
      original_query: userQuery,
    };
  }

  /**
   * Invalidate cache when new content is uploaded
   * @param {string} chatbotId - Chatbot ID
   */
  invalidateCache(chatbotId) {
    this.metadataCache.invalidateCache(chatbotId);
  }

  /**
   * Add related chunks for better context
   * @param {Array} chunks - Primary chunks
   * @param {string} chatbotId - Chatbot ID
   * @returns {Promise<Array>} Enhanced chunks with related content
   */
  async addRelatedChunks(chunks, chatbotId) {
    try {
      const enhancedChunks = [...chunks];
      const addedChunkIds = new Set(chunks.map((c) => c.id));

      for (const chunk of chunks) {
        // Add sequential chunks (previous and next)
        const sequentialChunks = await this.getSequentialChunks(
          chunk,
          chatbotId
        );

        for (const seqChunk of sequentialChunks) {
          if (!addedChunkIds.has(seqChunk.id)) {
            enhancedChunks.push(seqChunk);
            addedChunkIds.add(seqChunk.id);
          }
        }
      }

      console.log(
        `🔗 Enhanced from ${chunks.length} to ${enhancedChunks.length} chunks with related content`
      );

      // Sort by chunk_index to maintain document order
      return enhancedChunks.sort((a, b) => a.chunk_index - b.chunk_index);
    } catch (error) {
      console.error(`❌ Error adding related chunks:`, error);
      return chunks; // Return original chunks if enhancement fails
    }
  }

  /**
   * Get sequential chunks (previous and next) for context
   * @param {Object} chunk - Primary chunk
   * @param {string} chatbotId - Chatbot ID
   * @returns {Promise<Array>} Sequential chunks
   */
  async getSequentialChunks(chunk, chatbotId) {
    try {
      const relatedChunks = [];

      // Get previous chunk
      if (chunk.chunk_index > 0) {
        const prevChunks = await this.chunkRetrieval.getChunksByDocumentId(
          chatbotId,
          chunk.document_id,
          1
        );
        const prevChunk = prevChunks.find(
          (c) => c.chunk_index === chunk.chunk_index - 1
        );
        if (prevChunk) {
          relatedChunks.push(prevChunk);
        }
      }

      // Get next chunk
      const nextChunks = await this.chunkRetrieval.getChunksByDocumentId(
        chatbotId,
        chunk.document_id,
        10 // Get more to find the next one
      );
      const nextChunk = nextChunks.find(
        (c) => c.chunk_index === chunk.chunk_index + 1
      );
      if (nextChunk) {
        relatedChunks.push(nextChunk);
      }

      return relatedChunks;
    } catch (error) {
      console.error(`❌ Error getting sequential chunks:`, error);
      return [];
    }
  }

  /**
   * Get cache statistics
   * @param {string} chatbotId - Chatbot ID
   * @returns {Object} Cache stats
   */
  getCacheStats(chatbotId) {
    return this.metadataCache.getCacheStats(chatbotId);
  }
}

module.exports = IntelligentRAGService;
