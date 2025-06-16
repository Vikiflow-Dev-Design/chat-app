/**
 * Intelligent Query Processing Service
 * Analyzes user queries, extracts intent and metadata, handles context and ambiguity
 */

const { GoogleGenerativeAI } = require("@google/generative-ai");

class IntelligentQueryProcessor {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Conversation context storage (in production, use Redis or database)
    this.conversationContexts = new Map();
  }

  /**
   * Process user query with intelligent analysis
   * @param {string} userQuery - Raw user query
   * @param {string} chatbotId - ID of the chatbot
   * @param {string} conversationId - ID of the conversation
   * @param {Array} availableMetadata - Available metadata from chunks in the knowledge base
   * @returns {Promise<Object>} Processed query with metadata and routing info
   */
  async processQuery(
    userQuery,
    chatbotId,
    conversationId,
    availableMetadata = {}
  ) {
    try {
      console.log(`🧠 Processing query: "${userQuery}"`);

      // Step 1: Get conversation context
      const conversationContext = this.getConversationContext(conversationId);

      // Step 2: Analyze query clarity and intent
      const queryAnalysis = await this.analyzeQueryClarity(
        userQuery,
        conversationContext
      );

      // Step 3: Handle different query types
      if (queryAnalysis.clarity === "unclear") {
        return await this.handleUnclearQuery(
          userQuery,
          conversationContext,
          availableMetadata
        );
      }

      if (queryAnalysis.clarity === "contextual") {
        return await this.handleContextualQuery(
          userQuery,
          conversationContext,
          availableMetadata
        );
      }

      // Step 4: Process clear query
      const processedQuery = await this.processClearQuery(
        userQuery,
        availableMetadata
      );

      // Step 5: Update conversation context
      this.updateConversationContext(conversationId, {
        query: userQuery,
        analysis: queryAnalysis,
        processedQuery: processedQuery,
        timestamp: new Date().toISOString(),
      });

      return processedQuery;
    } catch (error) {
      console.error("Error in intelligent query processing:", error);
      throw error;
    }
  }

  /**
   * Analyze query clarity and intent
   * @param {string} userQuery - User query
   * @param {Object} conversationContext - Previous conversation context
   * @returns {Promise<Object>} Query analysis result
   */
  async analyzeQueryClarity(userQuery, conversationContext) {
    const prompt = `
Analyze this user query for clarity and intent:

Query: "${userQuery}"

Previous conversation context: ${JSON.stringify(
      conversationContext.recent || [],
      null,
      2
    )}

Classify the query as one of:
1. "clear" - Complete, specific question that can be answered directly
2. "contextual" - Refers to previous conversation (uses "this", "that", "it", etc.)
3. "unclear" - Vague, ambiguous, or incomplete

Also identify:
- Intent type (question, request, clarification, follow-up)
- Key entities mentioned
- Question type (what, how, why, when, where, comparison, etc.)

Respond in JSON format:
{
  "clarity": "clear|contextual|unclear",
  "intent": "question|request|clarification|follow-up",
  "questionType": "what|how|why|when|where|comparison|definition|procedure|troubleshooting",
  "entities": ["entity1", "entity2"],
  "reasoning": "Brief explanation of the classification",
  "confidence": 0.95
}`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = result.response.text();

      // Parse JSON response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      // Fallback if JSON parsing fails
      return {
        clarity: "clear",
        intent: "question",
        questionType: "general",
        entities: [],
        reasoning: "Fallback analysis",
        confidence: 0.5,
      };
    } catch (error) {
      console.error("Error analyzing query clarity:", error);
      return {
        clarity: "clear",
        intent: "question",
        questionType: "general",
        entities: [],
        reasoning: "Error in analysis",
        confidence: 0.3,
      };
    }
  }

  /**
   * Handle unclear queries with suggestions
   * @param {string} userQuery - Unclear user query
   * @param {Object} conversationContext - Conversation context
   * @param {Object} availableMetadata - Available metadata for suggestions
   * @returns {Promise<Object>} Response with clarification request
   */
  async handleUnclearQuery(userQuery, conversationContext, availableMetadata) {
    console.log("🤔 Handling unclear query...");

    const prompt = `
The user asked: "${userQuery}"

This query is unclear or vague. Based on the available topics and content types in our knowledge base, provide helpful suggestions.

Available topics: ${availableMetadata.topics?.join(", ") || "General topics"}
Available question types: ${
      availableMetadata.questionTypes?.join(", ") || "General questions"
    }
Available audiences: ${
      availableMetadata.audiences?.join(", ") || "General audience"
    }

Generate 3-5 specific, helpful suggestions that the user might be asking about. Make them actionable and specific.

Respond in JSON format:
{
  "type": "clarification_needed",
  "message": "I'd be happy to help! Could you be more specific? Here are some topics I can assist with:",
  "suggestions": [
    "How do I implement user authentication?",
    "What are the API security best practices?",
    "How to handle database connections?"
  ],
  "availableTopics": ["topic1", "topic2"],
  "reasoning": "Query was too vague to provide specific answer"
}`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = result.response.text();

      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          ...parsed,
          queryProcessingResult: "clarification_needed",
          originalQuery: userQuery,
        };
      }
    } catch (error) {
      console.error("Error handling unclear query:", error);
    }

    // Fallback response
    return {
      type: "clarification_needed",
      message:
        "I'd be happy to help! Could you please provide more details about what you're looking for?",
      suggestions: availableMetadata.topics?.slice(0, 5) || [
        "General information",
      ],
      queryProcessingResult: "clarification_needed",
      originalQuery: userQuery,
    };
  }

  /**
   * Handle contextual queries that refer to previous conversation
   * @param {string} userQuery - Contextual user query
   * @param {Object} conversationContext - Previous conversation context
   * @param {Object} availableMetadata - Available metadata
   * @returns {Promise<Object>} Enhanced query with context
   */
  async handleContextualQuery(
    userQuery,
    conversationContext,
    availableMetadata
  ) {
    console.log("🔗 Handling contextual query...");

    const prompt = `
The user asked: "${userQuery}"

This appears to be a follow-up question referring to previous conversation.

Previous conversation context:
${JSON.stringify(conversationContext.recent || [], null, 2)}

Based on the context, enhance the user's query to be self-contained and specific.

Respond in JSON format:
{
  "enhancedQuery": "Complete, specific version of the query",
  "contextUsed": ["previous topic 1", "previous topic 2"],
  "metadata": {
    "topics": ["topic1", "topic2"],
    "questionTypes": ["how-to"],
    "audience": ["developers"],
    "entities": ["entity1", "entity2"]
  },
  "reasoning": "How context was used to enhance the query"
}`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = result.response.text();

      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);

        return {
          type: "contextual_query",
          originalQuery: userQuery,
          enhancedQuery: parsed.enhancedQuery,
          searchMetadata: parsed.metadata,
          contextUsed: parsed.contextUsed,
          queryProcessingResult: "enhanced_with_context",
          reasoning: parsed.reasoning,
        };
      }
    } catch (error) {
      console.error("Error handling contextual query:", error);
    }

    // Fallback: treat as clear query
    return await this.processClearQuery(userQuery, availableMetadata);
  }

  /**
   * Process clear, well-formed queries
   * @param {string} userQuery - Clear user query
   * @param {Object} availableMetadata - Available metadata for matching
   * @returns {Promise<Object>} Processed query with search metadata
   */
  async processClearQuery(userQuery, availableMetadata) {
    console.log("✅ Processing clear query...");

    const prompt = `
Analyze this clear user query and extract metadata for intelligent search:

Query: "${userQuery}"

Available metadata in knowledge base:
- Topics: ${availableMetadata.topics?.join(", ") || "Various topics"}
- Question Types: ${
      availableMetadata.questionTypes?.join(", ") || "Various types"
    }
- Audiences: ${availableMetadata.audiences?.join(", ") || "Various audiences"}
- Complexity Levels: ${
      availableMetadata.complexityLevels?.join(", ") ||
      "beginner, intermediate, advanced"
    }

Extract and map the query to the most relevant metadata for search filtering:

Respond in JSON format:
{
  "searchMetadata": {
    "topics": ["most relevant topics from available list"],
    "questionTypes": ["most relevant question types"],
    "audience": ["most relevant audience"],
    "complexityLevel": "beginner|intermediate|advanced",
    "keywords": ["key terms from query"],
    "entities": ["specific entities mentioned"]
  },
  "searchStrategy": {
    "primaryFilters": ["topics", "questionTypes"],
    "secondaryFilters": ["audience", "complexityLevel"],
    "keywordBoost": ["important", "keywords"],
    "expectedChunkTypes": ["text", "code", "table", "list"]
  },
  "queryIntent": {
    "type": "information|procedure|comparison|troubleshooting|definition",
    "urgency": "low|medium|high",
    "scope": "specific|broad|comprehensive"
  },
  "confidence": 0.95
}`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = result.response.text();

      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);

        return {
          type: "clear_query",
          originalQuery: userQuery,
          searchMetadata: parsed.searchMetadata,
          searchStrategy: parsed.searchStrategy,
          queryIntent: parsed.queryIntent,
          queryProcessingResult: "ready_for_search",
          confidence: parsed.confidence || 0.8,
        };
      }
    } catch (error) {
      console.error("Error processing clear query:", error);
    }

    // Fallback processing
    return {
      type: "clear_query",
      originalQuery: userQuery,
      searchMetadata: {
        topics: this.extractTopicsFromQuery(
          userQuery,
          availableMetadata.topics
        ),
        questionTypes: this.extractQuestionTypeFromQuery(userQuery),
        keywords: this.extractKeywordsFromQuery(userQuery),
        entities: [],
      },
      searchStrategy: {
        primaryFilters: ["topics", "keywords"],
        secondaryFilters: ["questionTypes"],
        keywordBoost: [],
        expectedChunkTypes: ["text"],
      },
      queryProcessingResult: "ready_for_search",
      confidence: 0.6,
    };
  }

  /**
   * Get conversation context for a conversation ID
   * @param {string} conversationId - Conversation ID
   * @returns {Object} Conversation context
   */
  getConversationContext(conversationId) {
    if (!this.conversationContexts.has(conversationId)) {
      this.conversationContexts.set(conversationId, {
        recent: [],
        topics: [],
        entities: [],
      });
    }

    return this.conversationContexts.get(conversationId);
  }

  /**
   * Update conversation context
   * @param {string} conversationId - Conversation ID
   * @param {Object} newContext - New context to add
   */
  updateConversationContext(conversationId, newContext) {
    const context = this.getConversationContext(conversationId);

    // Add to recent conversations (keep last 5)
    context.recent.unshift(newContext);
    if (context.recent.length > 5) {
      context.recent = context.recent.slice(0, 5);
    }

    // Update topics and entities
    if (newContext.processedQuery?.searchMetadata) {
      const metadata = newContext.processedQuery.searchMetadata;
      if (metadata.topics) {
        context.topics.push(...metadata.topics);
        context.topics = [...new Set(context.topics)]; // Remove duplicates
      }
      if (metadata.entities) {
        context.entities.push(...metadata.entities);
        context.entities = [...new Set(context.entities)];
      }
    }

    this.conversationContexts.set(conversationId, context);
  }

  /**
   * Extract topics from query using simple keyword matching
   * @param {string} query - User query
   * @param {Array} availableTopics - Available topics in knowledge base
   * @returns {Array} Matched topics
   */
  extractTopicsFromQuery(query, availableTopics = []) {
    const queryLower = query.toLowerCase();
    const matchedTopics = [];

    for (const topic of availableTopics) {
      if (queryLower.includes(topic.toLowerCase())) {
        matchedTopics.push(topic);
      }
    }

    // Fallback topic detection
    if (matchedTopics.length === 0) {
      if (queryLower.includes("api") || queryLower.includes("endpoint")) {
        matchedTopics.push("API Development");
      }
      if (queryLower.includes("database") || queryLower.includes("sql")) {
        matchedTopics.push("Database");
      }
      if (queryLower.includes("auth") || queryLower.includes("security")) {
        matchedTopics.push("Security");
      }
    }

    return matchedTopics;
  }

  /**
   * Extract question type from query
   * @param {string} query - User query
   * @returns {Array} Question types
   */
  extractQuestionTypeFromQuery(query) {
    const queryLower = query.toLowerCase();
    const questionTypes = [];

    if (queryLower.startsWith("how")) {
      questionTypes.push("how-to", "procedure");
    } else if (queryLower.startsWith("what")) {
      questionTypes.push("definition", "explanation");
    } else if (queryLower.startsWith("why")) {
      questionTypes.push("explanation", "reasoning");
    } else if (
      queryLower.includes("compare") ||
      queryLower.includes("difference")
    ) {
      questionTypes.push("comparison");
    } else if (
      queryLower.includes("example") ||
      queryLower.includes("show me")
    ) {
      questionTypes.push("example", "implementation");
    }

    return questionTypes.length > 0 ? questionTypes : ["general"];
  }

  /**
   * Extract keywords from query
   * @param {string} query - User query
   * @returns {Array} Keywords
   */
  extractKeywordsFromQuery(query) {
    // Simple keyword extraction (can be enhanced)
    const words = query
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter((word) => word.length > 2)
      .filter(
        (word) =>
          ![
            "how",
            "what",
            "why",
            "when",
            "where",
            "the",
            "and",
            "for",
            "with",
          ].includes(word)
      );

    return [...new Set(words)];
  }

  /**
   * Clear conversation context (for testing or privacy)
   * @param {string} conversationId - Conversation ID to clear
   */
  clearConversationContext(conversationId) {
    this.conversationContexts.delete(conversationId);
  }
}

module.exports = IntelligentQueryProcessor;
