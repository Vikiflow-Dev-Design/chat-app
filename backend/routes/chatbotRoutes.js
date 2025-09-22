const express = require("express");
const mongoose = require("mongoose");
const Chatbot = require("../models/Chatbot");
const ChatbotKnowledge = require("../models/ChatbotKnowledge");
const Product = require("../models/Product");
const ChatSession = require("../models/ChatSession");
const ChatMessage = require("../models/ChatMessage");
const auth = require("../middleware/auth");
// Legacy vector processing removed - using Advanced RAG system instead
const router = express.Router();

// Get all chatbots for authenticated user
router.get("/", auth, async (req, res) => {
  try {
    const chatbots = await Chatbot.find({ userId: req.user.id });
    res.json(chatbots);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get a single chatbot by ID
router.get("/:id", auth, async (req, res) => {
  try {
    const chatbot = await Chatbot.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!chatbot) {
      return res.status(404).json({ message: "Chatbot not found" });
    }

    res.json(chatbot);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get a public chatbot by publicId (no auth required)
router.get("/public/:publicId", async (req, res) => {
  try {
    const chatbot = await Chatbot.findOne({
      publicId: req.params.publicId,
      isPublic: true,
    });

    if (!chatbot) {
      return res.status(404).json({ message: "Chatbot not found" });
    }

    res.json({
      id: chatbot._id,
      name: chatbot.name,
      description: chatbot.description,
      initialMessage: chatbot.initialMessage,
      model: chatbot.model,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new chatbot
router.post("/", auth, async (req, res) => {
  try {
    const {
      name,
      description,
      initialMessage,
      behaviorPrompt,
      model,
      temperature,
      maxTokens,
      isPublic,
    } = req.body;

    const chatbot = new Chatbot({
      name,
      description,
      initialMessage,
      behaviorPrompt,
      model,
      temperature,
      maxTokens,
      isPublic,
      userId: req.user.id,
      stats: {
        totalMessages: 0,
        activeUsers: 0,
      },
    });

    const savedChatbot = await chatbot.save();
    res.status(201).json(savedChatbot);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update a chatbot
router.put("/:id", auth, async (req, res) => {
  try {
    const updates = req.body;
    const chatbot = await Chatbot.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!chatbot) {
      return res.status(404).json({ message: "Chatbot not found" });
    }

    // Apply updates
    Object.keys(updates).forEach((key) => {
      // Don't allow updating userId
      if (key !== "userId" && key !== "_id") {
        chatbot[key] = updates[key];
      }
    });

    await chatbot.save();
    res.json(chatbot);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Bulk delete chatbots (must come before /:id route)
router.delete("/bulk", auth, async (req, res) => {
  try {
    const { chatbotIds } = req.body;

    if (!Array.isArray(chatbotIds) || chatbotIds.length === 0) {
      return res.status(400).json({ message: "chatbotIds array is required" });
    }

    // Verify all chatbots belong to the user
    const chatbots = await Chatbot.find({
      _id: { $in: chatbotIds },
      userId: req.user.id,
    });

    if (chatbots.length !== chatbotIds.length) {
      return res.status(404).json({
        message: "Some chatbots not found or unauthorized",
      });
    }

    const deletionResults = [];
    let totalDeleted = 0;

    // Process each chatbot deletion
    for (const chatbotId of chatbotIds) {
      try {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
          // 1. Delete ChatbotKnowledge
          await ChatbotKnowledge.findOneAndDelete({
            chatbotId: chatbotId,
          }).session(session);

          // 2. Delete Products
          const deletedProducts = await Product.deleteMany({
            chatbotId: chatbotId,
          }).session(session);

          // 3. Find and delete chat sessions and messages
          const chatSessions = await ChatSession.find({
            chatbotId: chatbotId,
          }).session(session);
          const sessionIds = chatSessions.map((s) => s._id);

          let deletedMessages = 0;
          if (sessionIds.length > 0) {
            const messageResult = await ChatMessage.deleteMany({
              sessionId: { $in: sessionIds },
            }).session(session);
            deletedMessages = messageResult.deletedCount;
          }

          await ChatSession.deleteMany({
            chatbotId: chatbotId,
          }).session(session);

          // 4. Legacy cleanup - KnowledgeDocument model no longer exists
          // This step is kept for reference but no action needed

          // Vector cleanup now handled by Advanced RAG system

          // 6. Delete the chatbot
          await Chatbot.findByIdAndDelete(chatbotId).session(session);

          await session.commitTransaction();
          session.endSession();

          deletionResults.push({
            chatbotId,
            success: true,
            deletedData: {
              products: deletedProducts.deletedCount,
              sessions: chatSessions.length,
              messages: deletedMessages,
            },
          });

          totalDeleted++;
        } catch (error) {
          await session.abortTransaction();
          session.endSession();

          deletionResults.push({
            chatbotId,
            success: false,
            error: error.message,
          });
        }
      } catch (error) {
        deletionResults.push({
          chatbotId,
          success: false,
          error: error.message,
        });
      }
    }

    res.json({
      message: `Successfully deleted ${totalDeleted} out of ${chatbotIds.length} chatbots`,
      totalDeleted,
      totalRequested: chatbotIds.length,
      results: deletionResults,
    });
  } catch (error) {
    console.error("Error in bulk delete:", error);
    res.status(500).json({ message: error.message });
  }
});

// Delete all chatbots for a user (must come before /:id route)
router.delete("/all", auth, async (req, res) => {
  try {
    // Get all chatbot IDs for the user
    const userChatbots = await Chatbot.find({ userId: req.user.id }).select(
      "_id"
    );
    const chatbotIds = userChatbots.map((bot) => bot._id.toString());

    if (chatbotIds.length === 0) {
      return res.json({
        message: "No chatbots found to delete",
        totalDeleted: 0,
      });
    }

    let totalDeleted = 0;

    for (const chatbotId of chatbotIds) {
      try {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
          // Delete all related data
          await ChatbotKnowledge.findOneAndDelete({
            chatbotId: chatbotId,
          }).session(session);

          await Product.deleteMany({
            chatbotId: chatbotId,
          }).session(session);

          const chatSessions = await ChatSession.find({
            chatbotId: chatbotId,
          }).session(session);
          const sessionIds = chatSessions.map((s) => s._id);

          if (sessionIds.length > 0) {
            await ChatMessage.deleteMany({
              sessionId: { $in: sessionIds },
            }).session(session);
          }

          await ChatSession.deleteMany({
            chatbotId: chatbotId,
          }).session(session);

          // Legacy cleanup - KnowledgeDocument model no longer exists
          // This step is kept for reference but no action needed

          // Vector cleanup now handled by Advanced RAG system

          await Chatbot.findByIdAndDelete(chatbotId).session(session);

          await session.commitTransaction();
          session.endSession();

          totalDeleted++;
        } catch (error) {
          await session.abortTransaction();
          session.endSession();
          throw error;
        }
      } catch (error) {
        console.error(`Error deleting chatbot ${chatbotId}:`, error);
      }
    }

    res.json({
      message: `Successfully deleted all ${totalDeleted} chatbots`,
      totalDeleted,
      totalRequested: chatbotIds.length,
    });
  } catch (error) {
    console.error("Error deleting all chatbots:", error);
    res.status(500).json({ message: error.message });
  }
});

// Delete a chatbot and all related data
router.delete("/:id", auth, async (req, res) => {
  try {
    // Start a session for transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Find the chatbot and verify ownership
      const chatbot = await Chatbot.findOne({
        _id: req.params.id,
        userId: req.user.id,
      }).session(session);

      if (!chatbot) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({ message: "Chatbot not found" });
      }

      // 1. Delete all ChatbotKnowledge documents
      await ChatbotKnowledge.findOneAndDelete({
        chatbotId: req.params.id,
      }).session(session);

      // 2. Delete all Products
      await Product.deleteMany({ chatbotId: req.params.id }).session(session);

      // 3. Find all chat sessions for this chatbot
      const chatSessions = await ChatSession.find({
        chatbotId: req.params.id,
      }).session(session);
      const sessionIds = chatSessions.map((session) => session._id);

      // 4. Delete all chat messages for these sessions
      if (sessionIds.length > 0) {
        await ChatMessage.deleteMany({
          sessionId: { $in: sessionIds },
        }).session(session);
      }

      // 5. Delete all chat sessions
      await ChatSession.deleteMany({ chatbotId: req.params.id }).session(
        session
      );

      // 6. Legacy cleanup - KnowledgeDocument model no longer exists
      // This step is kept for reference but no action needed

      // Vector cleanup now handled by Advanced RAG system

      // 8. Finally, delete the chatbot itself
      await Chatbot.findByIdAndDelete(req.params.id).session(session);

      // Commit the transaction
      await session.commitTransaction();
      session.endSession();

      res.json({
        message: "Chatbot and all related data deleted successfully",
        deletedData: {
          chatbot: 1,
          knowledge: 1,
          products: await Product.countDocuments({ chatbotId: req.params.id }),
          sessions: chatSessions.length,
          messages:
            sessionIds.length > 0
              ? await ChatMessage.countDocuments({
                  sessionId: { $in: sessionIds },
                })
              : 0,
        },
      });
    } catch (error) {
      // If an error occurs, abort the transaction
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  } catch (error) {
    console.error("Error deleting chatbot and related data:", error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
