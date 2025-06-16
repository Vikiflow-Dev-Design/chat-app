const express = require("express");
const router = express.Router();
const Chatbot = require("../models/Chatbot");
const ChatSession = require("../models/ChatSession");
const ChatMessage = require("../models/ChatMessage");
const Product = require("../models/Product");
const auth = require("../middleware/auth");
const {
  searchKnowledgeBase: searchKnowledgeBaseOld,
} = require("../utils/documentProcessor");
const {
  generateResponse,
  searchKnowledgeBase,
} = require("../utils/langchainService");
const IntelligentRAGService = require("../services/intelligentRAG/IntelligentRAGService");

// Initialize Intelligent RAG Service
const intelligentRAG = new IntelligentRAGService();

// Helper function to format products for display
const formatProductsForDisplay = (products) => {
  if (!products || products.length === 0) {
    return "There are no products available at the moment.";
  }

  return products
    .map(
      (product) =>
        `• ${product.name}: ${
          product.description
        }. Price: $${product.price.toFixed(2)}. ` +
        `${product.inStock ? "In stock" : "Out of stock"}`
    )
    .join("\n\n");
};

// Create a new chat session
router.post("/session", async (req, res) => {
  try {
    const { chatbotId, userId, userInfo, visitorId } = req.body;

    // Verify chatbot exists and is public or user owns it
    const chatbot = await Chatbot.findById(chatbotId);

    if (!chatbot) {
      return res.status(404).json({ message: "Chatbot not found" });
    }

    // Generate a title for the conversation
    const title = `Conversation ${new Date().toLocaleString()}`;

    // Create a new session with user info if provided
    const session = new ChatSession({
      chatbotId,
      userId: userId || null,
      visitorId: visitorId || null,
      userInfo: userInfo || null,
      title,
      startedAt: new Date(),
      lastMessageAt: new Date(),
    });

    const savedSession = await session.save();

    // Add initial message from chatbot
    const initialMessage = new ChatMessage({
      sessionId: savedSession._id,
      content: chatbot.initialMessage,
      role: "assistant",
      timestamp: new Date(),
    });

    await initialMessage.save();

    // Update chatbot stats
    chatbot.stats.activeUsers += 1;
    await chatbot.save();

    // Log user info for debugging
    if (userInfo) {
      console.log(
        `New session created with user info - Name: ${userInfo.name}, Email: ${userInfo.email}`
      );
    }

    res.status(201).json({
      sessionId: savedSession._id,
      messages: [initialMessage],
    });
  } catch (error) {
    console.error("Error creating chat session:", error);
    res.status(500).json({ message: error.message });
  }
});

// Get chat session history
router.get("/session/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await ChatSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ message: "Chat session not found" });
    }

    const messages = await ChatMessage.find({ sessionId }).sort("timestamp");

    res.json({
      sessionId,
      chatbotId: session.chatbotId,
      userId: session.userId,
      userInfo: session.userInfo,
      startedAt: session.startedAt,
      endedAt: session.endedAt,
      messages,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all conversations for a visitor
router.get("/visitor-conversations", async (req, res) => {
  try {
    const { visitorId, chatbotId } = req.query;

    if (!visitorId) {
      return res.status(400).json({ message: "Visitor ID is required" });
    }

    // Find all chat sessions for this visitor and chatbot
    const query = { visitorId };
    if (chatbotId) {
      query.chatbotId = chatbotId;
    }

    const sessions = await ChatSession.find(query).sort({
      lastMessageAt: -1,
    });

    // For each session, get the message count and last message
    const conversationsWithDetails = await Promise.all(
      sessions.map(async (session) => {
        const messageCount = await ChatMessage.countDocuments({
          sessionId: session._id,
        });

        // Get the last message for this session
        const lastMessage = await ChatMessage.findOne({
          sessionId: session._id,
        })
          .sort({ timestamp: -1 })
          .limit(1);

        // Get the first message to use as title if needed
        const firstMessage = await ChatMessage.findOne({
          sessionId: session._id,
          role: "user",
        })
          .sort({ timestamp: 1 })
          .limit(1);

        // Use the session title, or generate one from the first user message
        let title = session.title;
        if (!title && firstMessage) {
          // Truncate first message if it's too long
          title =
            firstMessage.content.length > 30
              ? firstMessage.content.substring(0, 30) + "..."
              : firstMessage.content;
        }

        return {
          id: session._id,
          sessionId: session._id,
          chatbotId: session.chatbotId,
          title: title || "New Conversation",
          startedAt: session.startedAt,
          lastMessageAt: session.lastMessageAt || session.startedAt,
          messageCount,
          lastMessage: lastMessage ? lastMessage.content : "",
        };
      })
    );

    res.json(conversationsWithDetails);
  } catch (error) {
    console.error("Error fetching visitor conversations:", error);
    res.status(500).json({ message: error.message });
  }
});

// Send a message to the chatbot
router.post("/message", async (req, res) => {
  try {
    const { sessionId, content, visitorId } = req.body;

    const session = await ChatSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ message: "Chat session not found" });
    }

    // Save user message
    const userMessage = new ChatMessage({
      sessionId,
      content,
      role: "user",
      timestamp: new Date(),
    });
    await userMessage.save();

    // Get chatbot details
    const chatbot = await Chatbot.findById(session.chatbotId);
    if (!chatbot) {
      return res.status(404).json({ message: "Chatbot not found" });
    }

    // Get previous messages for context
    const previousMessages = await ChatMessage.find({ sessionId })
      .sort({ timestamp: -1 })
      .limit(10)
      .sort({ timestamp: 1 });

    // Get associated products for context
    const products = await Product.find({ chatbotId: chatbot._id });

    // Format conversation history for the AI request
    const conversationHistory = previousMessages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    // Format product information for the AI
    const productInfo =
      products.length > 0
        ? "\n\nAvailable products:\n" +
          products
            .map(
              (p) =>
                `- ${p.name}: ${p.description}. Price: $${p.price}. ${
                  p.inStock ? "In stock" : "Out of stock"
                }`
            )
            .join("\n")
        : "";

    // Define available functions for the AI
    const functionDefinitions = [
      {
        name: "getProducts",
        description: "Get all products available for the current chatbot",
        parameters: {
          type: "object",
          properties: {
            chatbotId: {
              type: "string",
              description: "The ID of the chatbot",
            },
          },
          required: ["chatbotId"],
        },
      },
      {
        name: "getProduct",
        description: "Get details about a specific product",
        parameters: {
          type: "object",
          properties: {
            productId: {
              type: "string",
              description: "The ID of the product",
            },
          },
          required: ["productId"],
        },
      },
    ];

    // 🧠 INTELLIGENT RAG PROCESSING - START
    console.log("🚀 ===== INTELLIGENT RAG FLOW START =====");
    console.log(`📝 User Query: "${content}"`);
    console.log(`🤖 Chatbot ID: ${chatbot._id}`);
    console.log(`💬 Session ID: ${sessionId}`);

    let knowledgeInfo = "";
    let ragResponse = null;
    let useIntelligentRAG = true;

    try {
      console.log("🔍 Step 1: Attempting Intelligent RAG System...");

      // Try our new Intelligent RAG system first
      ragResponse = await intelligentRAG.processQuery(
        chatbot._id.toString(),
        content,
        chatbot.agentTemplate?.behaviorPrompt || chatbot.behaviorPrompt || ""
      );

      console.log("✅ Step 2: Intelligent RAG Response Received");
      console.log(`📊 Response Type: ${ragResponse.response_type}`);
      console.log(`🔄 Fallback Used: ${ragResponse.fallback_used}`);

      if (
        ragResponse.success &&
        !ragResponse.fallback_used &&
        ragResponse.chunks_used
      ) {
        console.log(
          `📦 Step 3: Using Intelligent RAG - ${ragResponse.chunks_used.length} chunks found`
        );
        ragResponse.chunks_used.forEach((chunk, idx) => {
          console.log(
            `   📄 Chunk ${idx + 1}: ${chunk.id} (Index: ${chunk.chunk_index})`
          );
          console.log(`   📝 Preview: "${chunk.preview}"`);
        });

        // Use the intelligent RAG answer directly
        knowledgeInfo = `Relevant Information:\n${ragResponse.answer}`;
        useIntelligentRAG = true;

        console.log("🎯 Step 4: Will use Intelligent RAG answer directly");
      } else {
        console.log(
          "🔄 Step 3: Intelligent RAG fallback detected, trying legacy system..."
        );
        useIntelligentRAG = false;
      }
    } catch (intelligentRAGError) {
      console.error("❌ Intelligent RAG Error:", intelligentRAGError.message);
      console.log("🔄 Falling back to legacy knowledge search...");
      useIntelligentRAG = false;
    }

    // Fallback to legacy system if intelligent RAG didn't work
    if (!useIntelligentRAG) {
      try {
        console.log("🔍 Step 5: Using Legacy Knowledge Search...");
        const relevantKnowledge = await searchKnowledgeBase(
          content,
          chatbot._id,
          sessionId
        );
        if (relevantKnowledge) {
          knowledgeInfo = relevantKnowledge;
          console.log("✅ Legacy knowledge search found relevant content");
          console.log(
            `📄 Content length: ${relevantKnowledge.length} characters`
          );
        } else {
          console.log("❌ Legacy knowledge search found no relevant content");
        }
      } catch (error) {
        console.error("❌ Error in legacy knowledge search:", error);
        console.log("⚠️ Continuing without knowledge base info");
      }
    }

    console.log("🏁 ===== INTELLIGENT RAG FLOW END =====");
    // 🧠 INTELLIGENT RAG PROCESSING - END

    // 🎯 RESPONSE GENERATION - START
    console.log("🎯 ===== RESPONSE GENERATION START =====");

    let replyText;

    // If we have a successful intelligent RAG response, use it directly
    if (
      useIntelligentRAG &&
      ragResponse &&
      ragResponse.success &&
      !ragResponse.fallback_used
    ) {
      console.log("🚀 Using Intelligent RAG answer directly");
      replyText = ragResponse.answer;
      console.log(`📝 Direct RAG Answer: "${replyText.substring(0, 100)}..."`);
    } else {
      // Generate response using LangChain with knowledge info
      try {
        console.log("🔄 Generating response with LangChain");
        console.log(`🤖 Model: ${chatbot.model}`);
        console.log(`🌡️ Temperature: ${chatbot.temperature}`);
        console.log(`🔢 Max tokens: ${chatbot.maxTokens}`);
        console.log(
          `📚 Knowledge info length: ${knowledgeInfo.length} characters`
        );

        replyText = await generateResponse(
          content,
          conversationHistory,
          chatbot,
          knowledgeInfo,
          productInfo
        );

        console.log("✅ LangChain response generated successfully");
      } catch (langchainError) {
        console.error(
          "❌ LangChain error, falling back to direct API call:",
          langchainError.message
        );
        console.log("🔄 Attempting direct Gemini API call...");

        // Fallback to direct API call if LangChain fails
        const requestPayload = {
          contents: [
            {
              role: "user",
              parts: [
                {
                  text:
                    chatbot.behaviorPrompt +
                    (knowledgeInfo ? `\n\n${knowledgeInfo}` : "") +
                    productInfo,
                },
              ],
            },
            ...conversationHistory.map((msg) => ({
              role: msg.role === "assistant" ? "model" : "user",
              parts: [{ text: msg.content }],
            })),
            {
              role: "user",
              parts: [{ text: content }],
            },
          ],
          generationConfig: {
            temperature: chatbot.temperature,
            maxOutputTokens: chatbot.maxTokens,
            topP: 0.8,
            topK: 40,
          },
        };

        console.log(
          "Falling back to direct API call with model:",
          chatbot.model
        );

        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${chatbot.model}:generateContent?key=${process.env.GEMINI_API_KEY}`;
        console.log("API URL:", apiUrl);

        let response;
        try {
          response = await fetch(apiUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
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
        } catch (fetchError) {
          console.error("Fetch error:", fetchError);
          throw fetchError;
        }

        const responseData = await response.json();
        replyText = responseData.candidates[0].content.parts[0].text;
      }

      // Ensure replyText is a string
      if (replyText === null || replyText === undefined) {
        replyText = "I'm sorry, I couldn't generate a response at this time.";
      }

      // Convert to string if it's not already
      if (typeof replyText !== "string") {
        replyText = String(replyText);
      }

      // Check if the response contains a function call
      const functionCallMatch = replyText.match(
        /<function_call name="([^"]+)" arguments=({[^>]+})>/
      );

      if (functionCallMatch) {
        const functionName = functionCallMatch[1];
        const args = JSON.parse(functionCallMatch[2]);

        // Handle different function calls
        if (functionName === "getProducts") {
          const products = await Product.find({ chatbotId: chatbot._id });

          if (products.length === 0) {
            replyText = replyText.replace(
              /<function_call.*>/,
              "I don't have any products available at the moment."
            );
          } else {
            const productList = products
              .map(
                (p) =>
                  `• ${p.name}: ${p.description}. Price: $${p.price}. ${
                    p.inStock ? "In stock" : "Out of stock"
                  }`
              )
              .join("\n\n");

            replyText = replyText.replace(/<function_call.*>/, productList);
          }
        } else if (functionName === "getProduct" && args.productId) {
          const product = await Product.findById(args.productId);

          if (!product) {
            replyText = replyText.replace(
              /<function_call.*>/,
              "Sorry, I couldn't find that product."
            );
          } else {
            const productDetails = `${product.name}: ${
              product.description
            }. Price: $${product.price}. ${
              product.inStock ? "In stock" : "Out of stock"
            }`;

            replyText = replyText.replace(/<function_call.*>/, productDetails);
          }
        }
      }
    }

    // Final response validation and logging
    if (replyText === null || replyText === undefined) {
      replyText = "I'm sorry, I couldn't generate a response at this time.";
    }
    if (typeof replyText !== "string") {
      replyText = String(replyText);
    }

    console.log("✅ Final response generated");
    console.log(`📝 Response length: ${replyText.length} characters`);
    console.log(`📄 Response preview: "${replyText.substring(0, 150)}..."`);
    console.log("🏁 ===== RESPONSE GENERATION END =====");
    // 🎯 RESPONSE GENERATION - END

    // Save the assistant's response
    const assistantMessage = new ChatMessage({
      sessionId,
      content: replyText,
      role: "assistant",
      timestamp: new Date(),
    });
    await assistantMessage.save();

    // Update chatbot stats
    chatbot.stats.totalMessages += 2; // +1 for user, +1 for assistant
    await chatbot.save();

    // Update session's lastMessageAt
    session.lastMessageAt = new Date();
    await session.save();

    res.json({
      message: assistantMessage,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// End a chat session
router.post("/session/:sessionId/end", async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await ChatSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ message: "Chat session not found" });
    }

    // Update session end time
    session.endedAt = new Date();
    await session.save();

    res.json({ message: "Chat session ended" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Playground route - generate response without saving messages
router.post("/playground", async (req, res) => {
  try {
    const { chatbotId, message, conversationHistory } = req.body;

    // Get chatbot details
    const chatbot = await Chatbot.findById(chatbotId);
    if (!chatbot) {
      return res.status(404).json({ message: "Chatbot not found" });
    }

    // 🧠 PLAYGROUND INTELLIGENT RAG PROCESSING - START
    console.log("🎮 ===== PLAYGROUND INTELLIGENT RAG FLOW START =====");
    console.log(`📝 Playground Query: "${message}"`);
    console.log(`🤖 Chatbot ID: ${chatbot._id}`);

    let knowledgeInfo = "";
    let ragResponse = null;
    let useIntelligentRAG = true;

    try {
      console.log("🔍 Playground Step 1: Attempting Intelligent RAG System...");

      // Try our new Intelligent RAG system first
      ragResponse = await intelligentRAG.processQuery(
        chatbot._id.toString(),
        message,
        chatbot.agentTemplate?.behaviorPrompt || chatbot.behaviorPrompt || ""
      );

      console.log("✅ Playground Step 2: Intelligent RAG Response Received");
      console.log(`📊 Response Type: ${ragResponse.response_type}`);
      console.log(`🔄 Fallback Used: ${ragResponse.fallback_used}`);

      if (
        ragResponse.success &&
        !ragResponse.fallback_used &&
        ragResponse.chunks_used
      ) {
        console.log(
          `📦 Playground Step 3: Using Intelligent RAG - ${ragResponse.chunks_used.length} chunks found`
        );
        useIntelligentRAG = true;
      } else {
        console.log(
          "🔄 Playground Step 3: Intelligent RAG fallback detected, trying legacy system..."
        );
        useIntelligentRAG = false;
      }
    } catch (intelligentRAGError) {
      console.error(
        "❌ Playground Intelligent RAG Error:",
        intelligentRAGError.message
      );
      console.log("🔄 Falling back to legacy knowledge search...");
      useIntelligentRAG = false;
    }

    // Fallback to legacy system if intelligent RAG didn't work
    if (!useIntelligentRAG) {
      try {
        console.log("🔍 Playground Step 4: Using Legacy Knowledge Search...");
        const playgroundConversationId = `playground_${chatbotId}_${Date.now()}`;
        const relevantKnowledge = await searchKnowledgeBase(
          message,
          chatbot._id,
          playgroundConversationId
        );
        if (relevantKnowledge) {
          knowledgeInfo = relevantKnowledge;
          console.log("✅ Legacy knowledge search found relevant content");
        } else {
          console.log("❌ Legacy knowledge search found no relevant content");
        }
      } catch (error) {
        console.error("❌ Error in legacy knowledge search:", error);
        console.log("⚠️ Continuing without knowledge base info");
      }
    }

    console.log("🏁 ===== PLAYGROUND INTELLIGENT RAG FLOW END =====");
    // 🧠 PLAYGROUND INTELLIGENT RAG PROCESSING - END

    // Get product information if available
    let productInfo = "";
    try {
      const products = await Product.find({ chatbotId: chatbot._id });
      if (products && products.length > 0) {
        productInfo = formatProductsForDisplay(products);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      // Continue without product info if there's an error
    }

    // 🎯 PLAYGROUND RESPONSE GENERATION - START
    console.log("🎯 ===== PLAYGROUND RESPONSE GENERATION START =====");

    let replyText;

    // If we have a successful intelligent RAG response, use it directly
    if (
      useIntelligentRAG &&
      ragResponse &&
      ragResponse.success &&
      !ragResponse.fallback_used
    ) {
      console.log("🚀 Playground: Using Intelligent RAG answer directly");
      replyText = ragResponse.answer;
      console.log(
        `📝 Playground Direct RAG Answer: "${replyText.substring(0, 100)}..."`
      );
    } else {
      // Generate response using LangChain with knowledge info
      try {
        console.log("🔄 Playground: Generating response with LangChain");
        console.log(`🤖 Model: ${chatbot.model}`);

        replyText = await generateResponse(
          message,
          conversationHistory || [],
          chatbot,
          knowledgeInfo,
          productInfo
        );

        console.log("✅ Playground LangChain response generated successfully");
      } catch (langchainError) {
        console.error(
          "LangChain error, falling back to direct API call:",
          langchainError
        );

        // Fallback to direct API call if LangChain fails
        const requestPayload = {
          contents: [
            {
              role: "user",
              parts: [
                {
                  text:
                    chatbot.behaviorPrompt +
                    (knowledgeInfo ? `\n\n${knowledgeInfo}` : "") +
                    productInfo,
                },
              ],
            },
            ...(conversationHistory || []).map((msg) => ({
              role: msg.role === "assistant" ? "model" : "user",
              parts: [{ text: msg.content }],
            })),
            {
              role: "user",
              parts: [{ text: message }],
            },
          ],
          generationConfig: {
            temperature: chatbot.temperature,
            maxOutputTokens: chatbot.maxTokens,
            topP: 0.8,
            topK: 40,
          },
        };

        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${chatbot.model}:generateContent?key=${process.env.GEMINI_API_KEY}`;

        let response;
        try {
          response = await fetch(apiUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
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
        } catch (fetchError) {
          console.error("Fetch error:", fetchError);
          throw fetchError;
        }

        const responseData = await response.json();
        replyText = responseData.candidates[0].content.parts[0].text;
      }
    }

    // Final playground response validation and logging
    if (replyText === null || replyText === undefined) {
      replyText = "I'm sorry, I couldn't generate a response at this time.";
    }
    if (typeof replyText !== "string") {
      replyText = String(replyText);
    }

    console.log("✅ Playground final response generated");
    console.log(
      `📝 Playground response length: ${replyText.length} characters`
    );
    console.log(
      `📄 Playground response preview: "${replyText.substring(0, 150)}..."`
    );
    console.log("🏁 ===== PLAYGROUND RESPONSE GENERATION END =====");

    // Return the response without saving anything
    res.json({
      message: {
        content: replyText,
        role: "assistant",
        timestamp: new Date(),
      },
    });
  } catch (error) {
    console.error("Error generating playground response:", error);

    // Create a more informative error message for debugging
    let errorMessage =
      "I'm sorry, I'm having trouble connecting to my brain right now. Please try again in a moment.";

    // In development, include more details about the error
    if (process.env.NODE_ENV !== "production") {
      errorMessage = `Error: ${error.message}. Please check the server logs for more details.`;
    }

    res.status(500).json({
      message: {
        content: errorMessage,
        role: "assistant",
        timestamp: new Date(),
      },
    });
  }
});

// Get all conversations for a chatbot
router.get("/conversations/:chatbotId", auth, async (req, res) => {
  try {
    const { chatbotId } = req.params;

    // Find all chat sessions for this chatbot
    const sessions = await ChatSession.find({ chatbotId }).sort({
      startedAt: -1,
    });

    // For each session, get the message count
    const conversationsWithDetails = await Promise.all(
      sessions.map(async (session) => {
        const messageCount = await ChatMessage.countDocuments({
          sessionId: session._id,
        });

        // Get the last message for this session
        const lastMessage = await ChatMessage.findOne({
          sessionId: session._id,
        })
          .sort({ timestamp: -1 })
          .limit(1);

        return {
          _id: session._id,
          sessionId: session._id,
          chatbotId: session.chatbotId,
          userId: session.userId,
          userInfo: session.userInfo,
          startedAt: session.startedAt,
          endedAt: session.endedAt,
          messageCount,
          lastMessage: lastMessage ? lastMessage.content : undefined,
        };
      })
    );

    res.json(conversationsWithDetails);
  } catch (error) {
    console.error("Error fetching conversations:", error);
    res.status(500).json({ message: error.message });
  }
});

// Delete a chat session
router.delete("/session/:sessionId", auth, async (req, res) => {
  try {
    const { sessionId } = req.params;

    // Delete the session
    const session = await ChatSession.findByIdAndDelete(sessionId);
    if (!session) {
      return res.status(404).json({ message: "Chat session not found" });
    }

    // Delete all messages for this session
    await ChatMessage.deleteMany({ sessionId });

    res.json({ message: "Chat session and messages deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
