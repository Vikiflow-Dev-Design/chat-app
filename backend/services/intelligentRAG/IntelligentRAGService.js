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
      console.log(`🔍 DEBUG: Starting query analysis flow`);

      const startTime = Date.now();

      // Step 1: Get cached metadata
      const metadataCache = await this.metadataCache.getMetadataCache(
        chatbotId
      );
      console.log(`✅ Metadata cache: ${metadataCache.totalChunks} chunks available`);

      if (metadataCache.totalChunks === 0) {
        console.log(`📭 No chunks available for chatbot: ${chatbotId}`);
        console.log(`🔍 DEBUG: Going to handleFallback with reason: no_chunks`);
        return this.handleFallback(userQuery, behaviorPrompt, "no_chunks", chatbotId);
      }

      // Step 2: Analyze query with LLM
      console.log(`🔍 DEBUG: Sending query to LLM for analysis`);
      const analysisResult = await this.analyzeQueryWithLLM(
        userQuery,
        metadataCache
      );

      console.log(`🔍 DEBUG: LLM analysis result type: ${analysisResult.type}`);

      // Step 3: Handle different response types
      if (analysisResult.type === "function_call") {
        console.log(`🔍 DEBUG: Going to handleFunctionCall`);
        return await this.handleFunctionCall(
          chatbotId,
          userQuery,
          analysisResult,
          behaviorPrompt,
          startTime
        );
      } else if (analysisResult.type === "fallback") {
        console.log(`🔍 DEBUG: Going to handleFallback with reason: no_relevant_metadata`);
        return this.handleFallback(
          userQuery,
          behaviorPrompt,
          "no_relevant_metadata",
          chatbotId
        );
      } else if (analysisResult.type === "clarification") {
        console.log(`🔍 DEBUG: Going to handleClarificationRequest`);
        return this.handleClarificationRequest(
          userQuery,
          analysisResult.message
        );
      }

      // Default fallback
      console.log(`🔍 DEBUG: Going to default handleFallback with reason: unknown_response_type`);
      return this.handleFallback(
        userQuery,
        behaviorPrompt,
        "unknown_response_type",
        chatbotId
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

      console.log(`🔍 DEBUG: LLM Analysis Response Text: "${responseText}"`);

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
      console.log(`🤔 Unexpected LLM response, falling back. Response was: "${responseText}"`);
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
   - IMPORTANT: NEVER use this for identity questions about the AI itself

2. **NO RELEVANT CONTENT OR GENERIC QUERIES**: If no chunks can help answer the query, OR if it's a greeting, casual conversation, identity question, or general question:
   - Respond with exactly "FALLBACK_TO_BEHAVIOR"
   - This includes:
     * Greetings: "hello", "hi", "good morning"
     * Identity questions: "who are you", "what are you", "who created you" - ALWAYS use fallback for these, NEVER search knowledge base
     * Casual conversation: "how are you", "thank you"
     * Help questions: "what can you help with", "what do you do"
     * Role reversal: "what can i do for you", "how can i help you"
     * Topics completely outside the knowledge base: TV, animals, weather, cooking, etc.
   - This will use the chatbot's general behavior prompt for natural, conversational responses

3. **TRULY UNCLEAR QUERY**: Only if the query is completely incomprehensible or garbled:
   - Respond with "REQUEST_CLARIFICATION: [helpful message asking for more specific information]"
   - Use this sparingly - most queries should either find relevant chunks or use behavior fallback

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
          "chunks_not_found",
          chatbotId
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
        "function_call_error",
        chatbotId
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
   * Generate behavior prompt response for generic queries
   * @param {string} userQuery - User's question
   * @param {string} behaviorPrompt - Behavior prompt
   * @returns {Promise<string>} Generated response
   */
  async generateBehaviorPromptResponse(userQuery, behaviorPrompt) {
    try {
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

      return answer || "I apologize, but I couldn't generate a response right now.";
    } catch (error) {
      console.error(`❌ Error generating behavior prompt response:`, error);
      throw error;
    }
  }

  /**
   * Enhanced fallback with dynamic responses
   * @param {string} userQuery - User's question
   * @param {string} behaviorPrompt - Behavior prompt
   * @param {string} reason - Reason for fallback
   * @param {string} chatbotId - Chatbot ID for analysis
   * @returns {Object} Fallback response
   */
  async handleFallback(userQuery, behaviorPrompt, reason, chatbotId = null) {
    try {
      console.log(`🔄 Enhanced fallback processing. Reason: ${reason}`);
      console.log(`🔍 DEBUG: User query: "${userQuery}"`);
      console.log(`🔍 DEBUG: Chatbot ID: ${chatbotId}`);
      console.log(`🔍 DEBUG: Behavior prompt length: ${behaviorPrompt?.length || 0}`);

      // Get fresh analysis each time (no caching)
      const knowledgeAnalysis = chatbotId ?
        await this.analyzeKnowledgeBaseFromMetadata(chatbotId) :
        { topics: [], keywords: [], totalChunks: 0 };

      console.log(`🔍 DEBUG: Knowledge analysis - Topics: ${knowledgeAnalysis.topics.length}, Keywords: ${knowledgeAnalysis.keywords.length}, Chunks: ${knowledgeAnalysis.totalChunks}`);

      let dynamicResponse = '';
      const queryLower = userQuery.toLowerCase().trim();

      // Check for identity questions
      if (queryLower.includes('who are you') ||
          queryLower.includes('what are you') ||
          queryLower.includes('who created you') ||
          queryLower.includes('what is your name')) {
        console.log('🤖 TRIGGERED: Dynamic identity response');
        dynamicResponse = this.generateDynamicIdentity(knowledgeAnalysis);

      // Check for help/capability questions
      } else if (queryLower.includes('what can you help') ||
                 queryLower.includes('what do you do') ||
                 queryLower.includes('what can you assist') ||
                 queryLower.includes('what should i ask') ||
                 queryLower.includes('what can you do') ||
                 queryLower.includes('what are you capable') ||
                 queryLower.includes('what can you help with') ||
                 queryLower.includes('what can you help me with') ||
                 queryLower.includes('what topics can you') ||
                 queryLower.includes('what subjects can you') ||
                 queryLower.includes('what can i ask you') ||
                 queryLower.includes('what can i ask about') ||
                 queryLower.includes('what can i do for you')) {
        console.log('🎯 TRIGGERED: Dynamic help suggestions');
        const suggestions = this.generateHelpSuggestions(knowledgeAnalysis);
        dynamicResponse = `I can help you with several things:\n\n${suggestions.join('\n')}\n\nWhat would you like to know about?`;

      // Check for role reversal questions (when user offers to help the AI)
      } else if (queryLower.includes('how can i help you') ||
                 queryLower.includes('how may i help you') ||
                 queryLower.includes('can i help you') ||
                 queryLower.includes('is there anything i can do for you')) {
        console.log('🔄 TRIGGERED: Role reversal handling');
        dynamicResponse = "That's very kind of you to ask! As an AI, I don't need help, but I appreciate the thoughtfulness. Is there anything I can help you with instead?";

      // Check for out-of-domain questions that should be handled with boundaries
      } else if (this.isOutOfDomainQuery(queryLower)) {
        console.log('🚫 TRIGGERED: Out-of-domain boundary response');
        dynamicResponse = "I don't have specific information about that topic. I'm designed to help with questions related to the topics I've been trained on. Is there something else I can help you with?";

      } else {
        console.log('🔄 TRIGGERED: Behavior prompt for generic query');
        console.log(`🔍 DEBUG: Query doesn't match any dynamic patterns, using behavior prompt`);
        // Use behavior prompt for other generic queries, but override for out-of-domain
        if (behaviorPrompt) {
          dynamicResponse = await this.generateBehaviorPromptResponse(userQuery, behaviorPrompt);

          // Override if behavior prompt tries to answer out-of-domain questions
          if (this.isOutOfDomainQuery(queryLower) && this.responseAttemptsToAnswer(dynamicResponse)) {
            console.log('🚫 OVERRIDE: Behavior prompt tried to answer out-of-domain query, setting boundaries');
            dynamicResponse = "I don't have specific information about that topic. I'm designed to help with questions related to the topics I've been trained on. Is there something else I can help you with?";
          }
        } else {
          dynamicResponse = "I'm here to help! Feel free to ask me any questions you have.";
        }
      }

      console.log(`🔍 DEBUG: Generated response length: ${dynamicResponse.length}`);
      console.log(`🔍 DEBUG: Response preview: "${dynamicResponse.substring(0, 100)}..."`)

      return {
        success: true,
        answer: dynamicResponse,
        fallback_used: true,
        response_type: "dynamic_fallback",
        reason: reason,
      };

    } catch (error) {
      console.error(`❌ Error in enhanced fallback handling:`, error);
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
   * Analyze knowledge base from cached metadata (simplified)
   * @param {string} chatbotId - Chatbot ID
   * @returns {Promise<Object>} Analysis of available content
   */
  async analyzeKnowledgeBaseFromMetadata(chatbotId) {
    try {
      const metadataCache = await this.metadataCache.getMetadataCache(chatbotId);

      const analysis = {
        topics: new Set(),
        keywords: new Set(),
        totalChunks: metadataCache.totalChunks
      };

      metadataCache.chunks.forEach(chunk => {
        // Simply collect all topics and keywords - no filtering/detection
        chunk.topics?.forEach(topic => analysis.topics.add(topic));
        chunk.keywords?.forEach(keyword => analysis.keywords.add(keyword));
      });

      return {
        topics: Array.from(analysis.topics),
        keywords: Array.from(analysis.keywords),
        totalChunks: analysis.totalChunks
      };
    } catch (error) {
      console.error('❌ Error analyzing knowledge base from metadata:', error);
      return {
        topics: [],
        keywords: [],
        totalChunks: 0
      };
    }
  }

  /**
   * Generate dynamic identity response (natural language)
   * @param {Object} knowledgeAnalysis - Analysis of knowledge base
   * @returns {string} Dynamic identity response
   */
  generateDynamicIdentity(knowledgeAnalysis) {
    const { topics, totalChunks } = knowledgeAnalysis;

    if (topics.length > 0) {
      // Natural, no mention of "knowledge base"
      return `I'm an AI assistant here to help you with information and questions. I can assist with various topics and provide helpful answers.`;
    } else {
      return `I'm an AI assistant ready to help you with your questions and provide information on various topics.`;
    }
  }

  /**
   * Check if query is clearly out-of-domain
   * @param {string} queryLower - Lowercase user query
   * @returns {boolean} True if query is out-of-domain
   */
  isOutOfDomainQuery(queryLower) {
    const outOfDomainKeywords = [
      // Electronics/Technology (not in knowledge base)
      'television', 'tv', 'turn on', 'turn off', 'remote control',
      'computer', 'laptop', 'phone', 'smartphone', 'tablet',

      // Animals/Biology
      'animal', 'animals', 'dog', 'cat', 'bird', 'fish', 'pet',
      'biology', 'species', 'mammal', 'reptile',

      // Weather/Environment
      'weather', 'temperature', 'rain', 'snow', 'sunny', 'cloudy',
      'climate', 'forecast',

      // Cooking/Food
      'recipe', 'cooking', 'food', 'restaurant', 'meal', 'dinner',
      'breakfast', 'lunch', 'kitchen',

      // Sports/Entertainment
      'sports', 'football', 'basketball', 'movie', 'film', 'music',
      'game', 'play', 'entertainment',

      // General knowledge that's clearly outside domain
      'fastest man alive', 'president', 'country', 'capital city',
      'history', 'geography', 'mathematics', 'physics', 'chemistry'
    ];

    return outOfDomainKeywords.some(keyword => queryLower.includes(keyword));
  }

  /**
   * Check if response attempts to answer instead of setting boundaries
   * @param {string} response - Generated response
   * @returns {boolean} True if response attempts to answer
   */
  responseAttemptsToAnswer(response) {
    const responseLower = response.toLowerCase();

    // Signs that it's trying to answer instead of setting boundaries
    const answerIndicators = [
      'i can certainly help',
      'the process is usually',
      'you can',
      'try',
      'generally',
      'usually',
      'typically',
      'here\'s how',
      'first',
      'step',
      'instructions'
    ];

    // Signs that it's properly setting boundaries
    const boundaryIndicators = [
      'i don\'t have',
      'outside my',
      'not in my',
      'designed to help with',
      'training data',
      'specific topics'
    ];

    const hasAnswerIndicators = answerIndicators.some(indicator => responseLower.includes(indicator));
    const hasBoundaryIndicators = boundaryIndicators.some(indicator => responseLower.includes(indicator));

    // If it has answer indicators but no boundary indicators, it's trying to answer
    return hasAnswerIndicators && !hasBoundaryIndicators;
  }

  /**
   * Generate auto-generated help suggestions (5 max, general but helpful)
   * @param {Object} knowledgeAnalysis - Analysis of knowledge base
   * @returns {Array<string>} Array of help suggestions
   */
  generateHelpSuggestions(knowledgeAnalysis) {
    const { topics, keywords } = knowledgeAnalysis;

    console.log(`🔍 DEBUG: Generating help suggestions - Topics: ${topics.length}, Keywords: ${keywords.length}`);
    console.log(`🔍 DEBUG: Sample topics: ${topics.slice(0, 3).join(', ')}`);
    console.log(`🔍 DEBUG: Sample keywords: ${keywords.slice(0, 3).join(', ')}`);

    // Auto-generate from actual content, keep general
    const suggestions = [];
    const allContent = [...topics, ...keywords];

    if (allContent.length === 0) {
      console.log(`🔍 DEBUG: No content available, using default suggestions`);
      return [
        '• Ask me questions about various topics',
        '• Get information and helpful answers',
        '• Explore different subjects I can help with',
        '• Request assistance with your inquiries',
        '• Discover what I can help you learn'
      ];
    }

    // Randomly select and generalize content into helpful suggestions
    const shuffled = allContent.sort(() => 0.5 - Math.random());

    for (let i = 0; i < Math.min(5, shuffled.length); i++) {
      const item = shuffled[i];
      // Convert specific items into general helpful suggestions
      suggestions.push(`• Ask about ${item} related topics`);
    }

    // If we have less than 5, add some general ones
    while (suggestions.length < 5 && suggestions.length < allContent.length) {
      const remaining = allContent.filter(item =>
        !suggestions.some(s => s.includes(item))
      );
      if (remaining.length > 0) {
        const randomItem = remaining[Math.floor(Math.random() * remaining.length)];
        suggestions.push(`• Learn more about ${randomItem}`);
      } else {
        break;
      }
    }

    // Ensure we have exactly 5 or less
    const finalSuggestions = suggestions.slice(0, 5);
    console.log(`🔍 DEBUG: Generated ${finalSuggestions.length} suggestions: ${finalSuggestions.join(', ')}`);
    return finalSuggestions;
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
