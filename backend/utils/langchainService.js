const { ChatGoogleGenerativeAI } = require("@langchain/google-genai");
const {
  HumanMessage,
  AIMessage,
  SystemMessage,
} = require("@langchain/core/messages");
const { StringOutputParser } = require("@langchain/core/output_parsers");
const { RunnableSequence } = require("@langchain/core/runnables");
const { formatDocumentsAsString } = require("langchain/util/document");
// Legacy vector processing removed - using Advanced RAG system instead

// Initialize the Gemini model with LangChain
const initializeGeminiModel = (
  modelName = "gemini-1.5-flash",
  temperature = 0.7,
  maxOutputTokens = 1000
) => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY environment variable is not set");
  }

  // Validate and sanitize inputs and use stable model names
  let validModelName = "gemini-1.5-flash"; // Default to stable model

  if (modelName && typeof modelName === "string") {
    // Map problematic model names to stable ones
    if (
      modelName.includes("gemini-2.5-flash-preview") ||
      modelName.includes("gemini-pro")
    ) {
      validModelName = "gemini-1.5-flash";
    } else if (modelName.includes("gemini-1.5-pro")) {
      validModelName = "gemini-1.5-pro";
    } else if (modelName.includes("gemini-1.5-flash")) {
      validModelName = "gemini-1.5-flash";
    } else {
      validModelName = "gemini-1.5-flash"; // Fallback to stable model
    }
  }

  const validTemperature = typeof temperature === "number" ? temperature : 0.7;
  const validMaxTokens =
    typeof maxOutputTokens === "number" ? maxOutputTokens : 1000;

  console.log(
    `🔧 Initializing Gemini model: ${validModelName} (original: ${modelName})`
  );

  try {
    // Simplify the constructor to avoid the error
    return new ChatGoogleGenerativeAI({
      apiKey: process.env.GEMINI_API_KEY,
      modelName: validModelName,
      temperature: validTemperature,
      maxOutputTokens: validMaxTokens,
    });
  } catch (error) {
    console.error("Error initializing LangChain Gemini model:", error);
    throw new Error(`Failed to initialize Gemini model: ${error.message}`);
  }
};

// Format conversation history for LangChain
const formatConversationHistory = (messages) => {
  return messages.map((msg) => {
    if (msg.role === "user") {
      return new HumanMessage(msg.content);
    } else if (msg.role === "assistant") {
      return new AIMessage(msg.content);
    } else if (msg.role === "system") {
      return new SystemMessage(msg.content);
    }
    // Default to HumanMessage if role is unknown
    return new HumanMessage(msg.content);
  });
};

// Search knowledge base using Advanced RAG as primary method
const searchKnowledgeBase = async (query, chatbotId, conversationId = null) => {
  try {
    console.log(
      `🔍 Knowledge Search - Query: "${query}" for chatbot: ${chatbotId}`
    );

    // Try Advanced RAG Orchestrator first (sophisticated multi-embedding vector search)
    const advancedRAGResult = await tryAdvancedRAGOrchestrator(
      query,
      chatbotId,
      conversationId
    );
    if (advancedRAGResult) {
      console.log("✅ Using Advanced RAG Orchestrator results");
      return advancedRAGResult;
    }

    // Fallback to Multi-Vector Search Service
    console.log("🔄 Trying Multi-Vector Search Service...");
    const multiVectorResult = await tryMultiVectorSearch(query, chatbotId);
    if (multiVectorResult) {
      console.log("✅ Using Multi-Vector Search results");
      return multiVectorResult;
    }

    // Final fallback to traditional MongoDB search
    console.log("📚 Using traditional MongoDB search as final fallback");
    return await fallbackTextSearch(query, chatbotId);
  } catch (error) {
    console.error("Error in knowledge search, using fallback:", error);
    return await fallbackTextSearch(query, chatbotId);
  }
};

// Try Advanced RAG Orchestrator (Primary Method)
const tryAdvancedRAGOrchestrator = async (query, chatbotId, conversationId) => {
  try {
    console.log("🚀 Attempting Advanced RAG Orchestrator...");

    // Import Advanced RAG Orchestrator
    const AdvancedRAGOrchestrator = require("../services/advancedRAGOrchestrator");
    const ragOrchestrator = new AdvancedRAGOrchestrator();

    // Check if Advanced RAG chunks exist for this chatbot
    const SupabaseChunkStorage = require("../services/supabaseChunkStorage");
    const chunkStorage = new SupabaseChunkStorage();

    const { data: chunks, error } = await chunkStorage.supabase
      .from("chatbot_knowledge_chunks")
      .select("id")
      .eq("chatbot_id", chatbotId)
      .limit(1);

    if (error || !chunks || chunks.length === 0) {
      console.log("⚠️ No Advanced RAG chunks found for this chatbot");
      return null;
    }

    // Generate conversation ID if not provided
    const effectiveConversationId =
      conversationId || `search_${chatbotId}_${Date.now()}`;

    // Process with Advanced RAG Orchestrator
    const response = await ragOrchestrator.processRAGWorkflow({
      userQuery: query,
      chatbotId: chatbotId,
      conversationId: effectiveConversationId,
      userProfile: { experienceLevel: "general", role: "user" },
      chatbotConfig: { name: "Assistant", personality: "helpful" },
      options: {
        maxResults: 5,
        includeRelated: true,
        contextWindow: 2,
      },
    });

    // Handle different response types
    if (response.type === "success" && response.answer) {
      console.log(`✅ Advanced RAG Orchestrator found relevant content`);

      // Format the response for LangChain compatibility
      const formattedContent = formatAdvancedRAGResponse(response);
      return formattedContent;
    }

    if (response.type === "clarification_needed") {
      console.log("❓ Advanced RAG suggests clarification needed");
      // For now, treat as no results and continue to fallback
      return null;
    }

    if (response.type === "no_results") {
      console.log("❌ Advanced RAG found no relevant content");
      return null;
    }

    console.log(
      `⚠️ Advanced RAG returned unexpected response type: ${response.type}`
    );
    return null;
  } catch (error) {
    console.error("Error in Advanced RAG Orchestrator:", error);
    return null;
  }
};

// Try Multi-Vector Search Service (Secondary Method)
const tryMultiVectorSearch = async (query, chatbotId) => {
  try {
    console.log("🎯 Attempting Multi-Vector Search...");

    // Import Multi-Vector Search Service
    const MultiVectorSearchService = require("../services/multiVectorSearchService");
    const multiVectorSearch = new MultiVectorSearchService();

    // Perform intelligent search
    const searchResults = await multiVectorSearch.intelligentSearch(
      query,
      chatbotId,
      {
        maxResults: 5,
        similarityThreshold: 0.7,
        includeRelated: true,
        contextWindow: 2,
        useMetadataFiltering: true,
        searchStrategy: "auto",
      }
    );

    if (searchResults.results && searchResults.results.length > 0) {
      console.log(
        `✅ Multi-Vector Search found ${searchResults.results.length} relevant chunks`
      );

      // Format results for LangChain compatibility
      const formattedDocs = searchResults.results.map((chunk, index) => ({
        pageContent: chunk.content || chunk.text || "",
        metadata: {
          title:
            chunk.metadata?.title ||
            chunk.heading_context?.[0]?.title ||
            "Knowledge Chunk",
          sourceType: "multi_vector_search",
          chunkId: chunk.id,
          similarity: chunk.similarity || chunk.compositeScore || 0,
          topics: chunk.metadata?.topics || [],
          keywords: chunk.metadata?.keywords || [],
          index: index + 1,
        },
      }));

      return formatDocumentsAsString(formattedDocs);
    }

    console.log("❌ Multi-Vector Search found no relevant content");
    return null;
  } catch (error) {
    console.error("Error in Multi-Vector Search:", error);
    return null;
  }
};

// Format Advanced RAG response for LangChain compatibility
const formatAdvancedRAGResponse = (response) => {
  try {
    // Extract relevant information from Advanced RAG response
    const sources = response.sources || [];

    // Create formatted documents from sources
    const formattedDocs = sources.map((source, index) => ({
      pageContent: source.content || source.text || "",
      metadata: {
        title: source.title || source.metadata?.title || `Source ${index + 1}`,
        sourceType: "advanced_rag",
        chunkId: source.id || source.chunkId,
        similarity: source.similarity || source.score || 0,
        topics: source.metadata?.topics || [],
        keywords: source.metadata?.keywords || [],
        section: source.section || source.metadata?.documentSection || "",
        relevanceReason: source.relevanceReason || "",
        index: index + 1,
      },
    }));

    // If we have sources, format them as documents
    if (formattedDocs.length > 0) {
      return formatDocumentsAsString(formattedDocs);
    }

    // If no sources but we have an answer, create a single document from the answer
    if (response.answer) {
      const answerDoc = [
        {
          pageContent: response.answer,
          metadata: {
            title: "Advanced RAG Answer",
            sourceType: "advanced_rag_answer",
            answerType: response.answerMetadata?.type || "generated",
            confidence: response.answerMetadata?.confidence || 0.8,
            processingTime: response.performance?.totalProcessingTime || 0,
          },
        },
      ];

      return formatDocumentsAsString(answerDoc);
    }

    // Fallback: return empty string if no usable content
    return "";
  } catch (error) {
    console.error("Error formatting Advanced RAG response:", error);
    return "";
  }
};

// Fallback text search using MongoDB
const fallbackTextSearch = async (query, chatbotId) => {
  try {
    const ChatbotKnowledge = require("../models/ChatbotKnowledge");

    // Search in chatbot knowledge using MongoDB text search
    const knowledge = await ChatbotKnowledge.findOne({ chatbotId });

    if (!knowledge) {
      return null;
    }

    // Collect all searchable content
    const searchableContent = [];

    // Search in files
    knowledge.files.forEach((file) => {
      if (file.isActive && (file.content || file.extractedInformation)) {
        const content = file.extractedInformation || file.content;
        if (content.toLowerCase().includes(query.toLowerCase())) {
          searchableContent.push({
            pageContent: content,
            metadata: {
              title: file.title,
              sourceType: "file",
              fileName: file.fileName,
            },
          });
        }
      }
    });

    // Search in texts
    knowledge.texts.forEach((text) => {
      if (text.isActive && (text.content || text.extractedInformation)) {
        const content = text.extractedInformation || text.content;
        if (content.toLowerCase().includes(query.toLowerCase())) {
          searchableContent.push({
            pageContent: content,
            metadata: {
              title: text.title,
              sourceType: "text",
              description: text.description,
            },
          });
        }
      }
    });

    // Search in Q&A
    knowledge.qaItems.forEach((qaGroup) => {
      if (qaGroup.isActive) {
        qaGroup.qaItems.forEach((qa) => {
          if (
            qa.question.toLowerCase().includes(query.toLowerCase()) ||
            qa.answer.toLowerCase().includes(query.toLowerCase())
          ) {
            searchableContent.push({
              pageContent: `Question: ${qa.question}\nAnswer: ${qa.answer}`,
              metadata: {
                title: qaGroup.title,
                sourceType: "qa",
                question: qa.question,
              },
            });
          }
        });
      }
    });

    if (searchableContent.length === 0) {
      return null;
    }

    // Limit results and format
    const limitedResults = searchableContent.slice(0, 3);
    console.log(
      `Found ${limitedResults.length} relevant knowledge items via fallback search`
    );

    return formatDocumentsAsString(limitedResults);
  } catch (error) {
    console.error("Error in fallback text search:", error);
    return null;
  }
};

// Create a chain for generating responses with knowledge retrieval
const createChatChain = async (
  model,
  systemPrompt,
  knowledgeInfo = "",
  productInfo = ""
) => {
  // Combine system prompt with knowledge and product info
  let fullSystemPrompt = systemPrompt;

  if (knowledgeInfo) {
    fullSystemPrompt += `\n\nInformation from knowledge base:\n${knowledgeInfo}`;
  }

  if (productInfo) {
    fullSystemPrompt += `\n\n${productInfo}`;
  }

  // Add function calling instructions
  fullSystemPrompt += `\n\nYou have access to functions to help answer user:
- getProducts: Get all products available
- getProduct: Get details about a specific product

When a user asks about products, use the getProducts function by responding with a function call in this exact format:
<function_call name="getProducts" arguments={"chatbotId":"CHATBOT_ID"}>

For specific product inquiries, use the getProduct function with the product ID.

If the user asks a question that might be answered using the knowledge base information provided above, use that information to give a more accurate and detailed response.`;

  // Create the chain
  const chain = RunnableSequence.from([
    {
      system: () => new SystemMessage(fullSystemPrompt),
      messages: (input) => input.messages,
    },
    model,
    new StringOutputParser(),
  ]);

  return chain;
};

// Generate a response using LangChain
const generateResponse = async (
  userMessage,
  conversationHistory,
  chatbot,
  knowledgeInfo = "",
  productInfo = ""
) => {
  try {
    // Initialize the model
    const model = initializeGeminiModel(
      chatbot.model,
      chatbot.temperature,
      chatbot.maxTokens
    );

    // Format conversation history
    const formattedHistory = formatConversationHistory(conversationHistory);

    // Create the chat chain
    const chain = await createChatChain(
      model,
      chatbot.behaviorPrompt,
      knowledgeInfo,
      productInfo
    );

    // Generate response
    const response = await chain.invoke({
      messages: [...formattedHistory, new HumanMessage(userMessage)],
    });

    return response;
  } catch (error) {
    console.error("Error generating response with LangChain:", error);
    throw error;
  }
};

module.exports = {
  initializeGeminiModel,
  formatConversationHistory,
  searchKnowledgeBase,
  tryAdvancedRAGOrchestrator,
  tryMultiVectorSearch,
  formatAdvancedRAGResponse,
  fallbackTextSearch,
  createChatChain,
  generateResponse,
};
