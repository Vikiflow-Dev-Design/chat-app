const express = require("express");
const router = express.Router();
const ChatbotKnowledge = require("../models/ChatbotKnowledge");
const Chatbot = require("../models/Chatbot");
const SupabaseChunkStorage = require("../services/supabaseChunkStorage");
const auth = require("../middleware/auth");
const CacheInvalidationMiddleware = require("../middleware/cacheInvalidationMiddleware");

/**
 * Enhanced Knowledge Management Routes
 * Provides CRUD operations with proper organization and chunk metadata
 */

// Initialize services
const chunkStorage = new SupabaseChunkStorage();

// Test route to check if the API is working
router.get("/test", (req, res) => {
  res.json({
    message: "Knowledge Management API is working!",
    timestamp: new Date().toISOString(),
  });
});

// Get knowledge overview with statistics (temporarily without auth for testing)
router.get("/overview/:chatbotId", async (req, res) => {
  try {
    const { chatbotId } = req.params;

    // Get chatbot (temporarily without ownership check for testing)
    const chatbot = await Chatbot.findById(chatbotId);

    if (!chatbot) {
      return res.status(404).json({ message: "Chatbot not found" });
    }

    // Get MongoDB knowledge
    const knowledge = await ChatbotKnowledge.findOne({ chatbotId });

    // Get Supabase chunks statistics
    let chunkStats = { total: 0, byType: {} };
    try {
      const { data: chunks } = await chunkStorage.supabase
        .from("chatbot_knowledge_chunks")
        .select("id, metadata")
        .eq("chatbot_id", chatbotId);

      if (chunks) {
        chunkStats.total = chunks.length;
        chunkStats.byType = chunks.reduce((acc, chunk) => {
          const sourceType = chunk.metadata?.sourceType || "unknown";
          acc[sourceType] = (acc[sourceType] || 0) + 1;
          return acc;
        }, {});
      }
    } catch (error) {
      console.error("Error fetching chunk statistics:", error);
    }

    const overview = {
      chatbotId,
      chatbotName: chatbot.name,
      mongodb: {
        files: knowledge?.files?.length || 0,
        texts: knowledge?.texts?.length || 0,
        qaItems: knowledge?.qaItems?.length || 0,
        totalSources:
          (knowledge?.files?.length || 0) +
          (knowledge?.texts?.length || 0) +
          (knowledge?.qaItems?.length || 0),
      },
      supabase: {
        totalChunks: chunkStats.total,
        chunksByType: chunkStats.byType,
      },
      lastUpdated: knowledge?.updatedAt || null,
    };

    res.json(overview);
  } catch (error) {
    console.error("Error fetching knowledge overview:", error);
    res.status(500).json({ message: error.message });
  }
});

// Get files with their chunks and metadata
router.get("/files/:chatbotId", auth, async (req, res) => {
  try {
    const { chatbotId } = req.params;
    const { page = 1, limit = 10, search = "" } = req.query;

    // Verify chatbot ownership
    const chatbot = await Chatbot.findOne({
      _id: chatbotId,
      userId: req.user.id,
    });

    if (!chatbot) {
      return res
        .status(404)
        .json({ message: "Chatbot not found or unauthorized" });
    }

    // Get MongoDB files
    const knowledge = await ChatbotKnowledge.findOne({ chatbotId });
    let files = knowledge?.files || [];

    // Apply search filter
    if (search) {
      files = files.filter(
        (file) =>
          file.title.toLowerCase().includes(search.toLowerCase()) ||
          file.fileName.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedFiles = files.slice(startIndex, endIndex);

    // Enhance files with chunk information
    const enhancedFiles = await Promise.all(
      paginatedFiles.map(async (file) => {
        try {
          // Get chunks for this file from Supabase
          const { data: chunks } = await chunkStorage.supabase
            .from("chatbot_knowledge_chunks")
            .select("*")
            .eq("chatbot_id", chatbotId)
            .eq("document_id", `doc_${file._id}_*`);

          return {
            ...file.toObject(),
            chunks: chunks || [],
            chunkCount: chunks?.length || 0,
            hasAdvancedProcessing: (chunks?.length || 0) > 0,
          };
        } catch (error) {
          console.error(`Error fetching chunks for file ${file._id}:`, error);
          return {
            ...file.toObject(),
            chunks: [],
            chunkCount: 0,
            hasAdvancedProcessing: false,
          };
        }
      })
    );

    res.json({
      files: enhancedFiles,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(files.length / limit),
        totalItems: files.length,
        itemsPerPage: parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Error fetching files:", error);
    res.status(500).json({ message: error.message });
  }
});

// Get texts with their chunks and metadata
router.get("/texts/:chatbotId", auth, async (req, res) => {
  try {
    const { chatbotId } = req.params;
    const { page = 1, limit = 10, search = "" } = req.query;

    // Verify chatbot ownership
    const chatbot = await Chatbot.findOne({
      _id: chatbotId,
      userId: req.user.id,
    });

    if (!chatbot) {
      return res
        .status(404)
        .json({ message: "Chatbot not found or unauthorized" });
    }

    // Get MongoDB texts
    const knowledge = await ChatbotKnowledge.findOne({ chatbotId });
    let texts = knowledge?.texts || [];

    // Apply search filter
    if (search) {
      texts = texts.filter(
        (text) =>
          text.title.toLowerCase().includes(search.toLowerCase()) ||
          text.description.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedTexts = texts.slice(startIndex, endIndex);

    // Enhance texts with chunk information
    const enhancedTexts = await Promise.all(
      paginatedTexts.map(async (text) => {
        try {
          // Get chunks for this text from Supabase
          const { data: chunks } = await chunkStorage.supabase
            .from("chatbot_knowledge_chunks")
            .select("*")
            .eq("chatbot_id", chatbotId)
            .eq("document_id", `text_${text._id}_*`);

          return {
            ...text.toObject(),
            chunks: chunks || [],
            chunkCount: chunks?.length || 0,
            hasAdvancedProcessing: (chunks?.length || 0) > 0,
          };
        } catch (error) {
          console.error(`Error fetching chunks for text ${text._id}:`, error);
          return {
            ...text.toObject(),
            chunks: [],
            chunkCount: 0,
            hasAdvancedProcessing: false,
          };
        }
      })
    );

    res.json({
      texts: enhancedTexts,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(texts.length / limit),
        totalItems: texts.length,
        itemsPerPage: parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Error fetching texts:", error);
    res.status(500).json({ message: error.message });
  }
});

// Get Q&A items with their chunks and metadata
router.get("/qa/:chatbotId", auth, async (req, res) => {
  try {
    const { chatbotId } = req.params;
    const { page = 1, limit = 10, search = "" } = req.query;

    // Verify chatbot ownership
    const chatbot = await Chatbot.findOne({
      _id: chatbotId,
      userId: req.user.id,
    });

    if (!chatbot) {
      return res
        .status(404)
        .json({ message: "Chatbot not found or unauthorized" });
    }

    // Get MongoDB Q&A items
    const knowledge = await ChatbotKnowledge.findOne({ chatbotId });
    let qaItems = knowledge?.qaItems || [];

    // Apply search filter
    if (search) {
      qaItems = qaItems.filter(
        (qa) =>
          qa.title.toLowerCase().includes(search.toLowerCase()) ||
          qa.qaItems.some(
            (item) =>
              item.question.toLowerCase().includes(search.toLowerCase()) ||
              item.answer.toLowerCase().includes(search.toLowerCase())
          )
      );
    }

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedQAItems = qaItems.slice(startIndex, endIndex);

    // Enhance Q&A items with chunk information
    const enhancedQAItems = await Promise.all(
      paginatedQAItems.map(async (qa) => {
        try {
          // Get chunks for this Q&A from Supabase
          const { data: chunks } = await chunkStorage.supabase
            .from("chatbot_knowledge_chunks")
            .select("*")
            .eq("chatbot_id", chatbotId)
            .eq("document_id", `qa_${qa._id}_*`);

          return {
            ...qa.toObject(),
            chunks: chunks || [],
            chunkCount: chunks?.length || 0,
            hasAdvancedProcessing: (chunks?.length || 0) > 0,
          };
        } catch (error) {
          console.error(`Error fetching chunks for Q&A ${qa._id}:`, error);
          return {
            ...qa.toObject(),
            chunks: [],
            chunkCount: 0,
            hasAdvancedProcessing: false,
          };
        }
      })
    );

    res.json({
      qaItems: enhancedQAItems,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(qaItems.length / limit),
        totalItems: qaItems.length,
        itemsPerPage: parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Error fetching Q&A items:", error);
    res.status(500).json({ message: error.message });
  }
});

// Get specific file with detailed chunk information
router.get("/files/:chatbotId/:fileId", auth, async (req, res) => {
  try {
    const { chatbotId, fileId } = req.params;

    // Verify chatbot ownership
    const chatbot = await Chatbot.findOne({
      _id: chatbotId,
      userId: req.user.id,
    });

    if (!chatbot) {
      return res
        .status(404)
        .json({ message: "Chatbot not found or unauthorized" });
    }

    // Get specific file from MongoDB
    const knowledge = await ChatbotKnowledge.findOne({ chatbotId });
    const file = knowledge?.files?.id(fileId);

    if (!file) {
      return res.status(404).json({ message: "File not found" });
    }

    // Get detailed chunks for this file from Supabase with metadata
    const { data: chunks } = await chunkStorage.supabase
      .from("chatbot_knowledge_chunks")
      .select(
        `
        *,
        chunk_metadata (
          topics,
          keywords,
          entities,
          complexity_level,
          question_types,
          audience
        )
      `
      )
      .eq("chatbot_id", chatbotId)
      .like("document_id", `%${fileId}%`)
      .order("chunk_index", { ascending: true });

    // Transform chunks to include parsed metadata
    const transformedChunks = (chunks || []).map((chunk) => ({
      ...chunk,
      metadata: {
        ...chunk.metadata,
        topics: chunk.chunk_metadata?.[0]?.topics
          ? JSON.parse(chunk.chunk_metadata[0].topics)
          : [],
        keywords: chunk.chunk_metadata?.[0]?.keywords
          ? JSON.parse(chunk.chunk_metadata[0].keywords)
          : [],
        entities: chunk.chunk_metadata?.[0]?.entities
          ? JSON.parse(chunk.chunk_metadata[0].entities)
          : [],
        complexity_level: chunk.chunk_metadata?.[0]?.complexity_level || null,
        question_types: chunk.chunk_metadata?.[0]?.question_types
          ? JSON.parse(chunk.chunk_metadata[0].question_types)
          : [],
        audience: chunk.chunk_metadata?.[0]?.audience
          ? JSON.parse(chunk.chunk_metadata[0].audience)
          : [],
      },
      heading_context: chunk.heading_context
        ? typeof chunk.heading_context === "string"
          ? JSON.parse(chunk.heading_context)
          : chunk.heading_context
        : [],
      chunk_metadata: undefined,
    }));

    res.json({
      file: file.toObject(),
      chunks: transformedChunks,
      chunkCount: transformedChunks.length,
    });
  } catch (error) {
    console.error("Error fetching file details:", error);
    res.status(500).json({ message: error.message });
  }
});

// Get specific text with detailed chunk information
router.get("/texts/:chatbotId/:textId", auth, async (req, res) => {
  try {
    const { chatbotId, textId } = req.params;

    // Verify chatbot ownership
    const chatbot = await Chatbot.findOne({
      _id: chatbotId,
      userId: req.user.id,
    });

    if (!chatbot) {
      return res
        .status(404)
        .json({ message: "Chatbot not found or unauthorized" });
    }

    // Get specific text from MongoDB
    const knowledge = await ChatbotKnowledge.findOne({ chatbotId });
    const text = knowledge?.texts?.id(textId);

    if (!text) {
      return res.status(404).json({ message: "Text not found" });
    }

    // Get detailed chunks for this text from Supabase with metadata
    const { data: chunks } = await chunkStorage.supabase
      .from("chatbot_knowledge_chunks")
      .select(
        `
        *,
        chunk_metadata (
          topics,
          keywords,
          entities,
          complexity_level,
          question_types,
          audience
        )
      `
      )
      .eq("chatbot_id", chatbotId)
      .like("document_id", `%${textId}%`)
      .order("chunk_index", { ascending: true });

    // Transform chunks to include parsed metadata
    const transformedChunks = (chunks || []).map((chunk) => ({
      ...chunk,
      metadata: {
        ...chunk.metadata,
        topics: chunk.chunk_metadata?.[0]?.topics
          ? JSON.parse(chunk.chunk_metadata[0].topics)
          : [],
        keywords: chunk.chunk_metadata?.[0]?.keywords
          ? JSON.parse(chunk.chunk_metadata[0].keywords)
          : [],
        entities: chunk.chunk_metadata?.[0]?.entities
          ? JSON.parse(chunk.chunk_metadata[0].entities)
          : [],
        complexity_level: chunk.chunk_metadata?.[0]?.complexity_level || null,
        question_types: chunk.chunk_metadata?.[0]?.question_types
          ? JSON.parse(chunk.chunk_metadata[0].question_types)
          : [],
        audience: chunk.chunk_metadata?.[0]?.audience
          ? JSON.parse(chunk.chunk_metadata[0].audience)
          : [],
      },
      heading_context: chunk.heading_context
        ? typeof chunk.heading_context === "string"
          ? JSON.parse(chunk.heading_context)
          : chunk.heading_context
        : [],
      chunk_metadata: undefined,
    }));

    res.json({
      text: text.toObject(),
      chunks: transformedChunks,
      chunkCount: transformedChunks.length,
    });
  } catch (error) {
    console.error("Error fetching text details:", error);
    res.status(500).json({ message: error.message });
  }
});

// Get specific Q&A with detailed chunk information
router.get("/qa/:chatbotId/:qaId", auth, async (req, res) => {
  try {
    const { chatbotId, qaId } = req.params;

    // Verify chatbot ownership
    const chatbot = await Chatbot.findOne({
      _id: chatbotId,
      userId: req.user.id,
    });

    if (!chatbot) {
      return res
        .status(404)
        .json({ message: "Chatbot not found or unauthorized" });
    }

    // Get specific Q&A from MongoDB
    const knowledge = await ChatbotKnowledge.findOne({ chatbotId });
    const qa = knowledge?.qaItems?.id(qaId);

    if (!qa) {
      return res.status(404).json({ message: "Q&A not found" });
    }

    // Get detailed chunks for this Q&A from Supabase with metadata
    const { data: chunks } = await chunkStorage.supabase
      .from("chatbot_knowledge_chunks")
      .select(
        `
        *,
        chunk_metadata (
          topics,
          keywords,
          entities,
          complexity_level,
          question_types,
          audience
        )
      `
      )
      .eq("chatbot_id", chatbotId)
      .like("document_id", `%${qaId}%`)
      .order("chunk_index", { ascending: true });

    // Transform chunks to include parsed metadata
    const transformedChunks = (chunks || []).map((chunk) => ({
      ...chunk,
      metadata: {
        ...chunk.metadata,
        topics: chunk.chunk_metadata?.[0]?.topics
          ? JSON.parse(chunk.chunk_metadata[0].topics)
          : [],
        keywords: chunk.chunk_metadata?.[0]?.keywords
          ? JSON.parse(chunk.chunk_metadata[0].keywords)
          : [],
        entities: chunk.chunk_metadata?.[0]?.entities
          ? JSON.parse(chunk.chunk_metadata[0].entities)
          : [],
        complexity_level: chunk.chunk_metadata?.[0]?.complexity_level || null,
        question_types: chunk.chunk_metadata?.[0]?.question_types
          ? JSON.parse(chunk.chunk_metadata[0].question_types)
          : [],
        audience: chunk.chunk_metadata?.[0]?.audience
          ? JSON.parse(chunk.chunk_metadata[0].audience)
          : [],
      },
      heading_context: chunk.heading_context
        ? typeof chunk.heading_context === "string"
          ? JSON.parse(chunk.heading_context)
          : chunk.heading_context
        : [],
      chunk_metadata: undefined,
    }));

    res.json({
      qa: qa.toObject(),
      chunks: transformedChunks,
      chunkCount: transformedChunks.length,
    });
  } catch (error) {
    console.error("Error fetching Q&A details:", error);
    res.status(500).json({ message: error.message });
  }
});

// Update file
router.put("/files/:chatbotId/:fileId", auth, async (req, res) => {
  try {
    const { chatbotId, fileId } = req.params;
    const { title, tags, isActive } = req.body;

    // Verify chatbot ownership
    const chatbot = await Chatbot.findOne({
      _id: chatbotId,
      userId: req.user.id,
    });

    if (!chatbot) {
      return res
        .status(404)
        .json({ message: "Chatbot not found or unauthorized" });
    }

    // Update file in MongoDB
    const knowledge = await ChatbotKnowledge.findOne({ chatbotId });
    const file = knowledge?.files?.id(fileId);

    if (!file) {
      return res.status(404).json({ message: "File not found" });
    }

    // Update file properties
    if (title !== undefined) file.title = title;
    if (tags !== undefined) file.tags = tags;
    if (isActive !== undefined) file.isActive = isActive;

    await knowledge.save();

    res.json({
      message: "File updated successfully",
      file: file.toObject(),
    });
  } catch (error) {
    console.error("Error updating file:", error);
    res.status(500).json({ message: error.message });
  }
});

// Update text
router.put("/texts/:chatbotId/:textId", auth, async (req, res) => {
  try {
    const { chatbotId, textId } = req.params;
    const { title, description, content, tags, isActive } = req.body;

    // Verify chatbot ownership
    const chatbot = await Chatbot.findOne({
      _id: chatbotId,
      userId: req.user.id,
    });

    if (!chatbot) {
      return res
        .status(404)
        .json({ message: "Chatbot not found or unauthorized" });
    }

    // Update text in MongoDB
    const knowledge = await ChatbotKnowledge.findOne({ chatbotId });
    const text = knowledge?.texts?.id(textId);

    if (!text) {
      return res.status(404).json({ message: "Text not found" });
    }

    // Update text properties
    if (title !== undefined) text.title = title;
    if (description !== undefined) text.description = description;
    if (content !== undefined) text.content = content;
    if (tags !== undefined) text.tags = tags;
    if (isActive !== undefined) text.isActive = isActive;

    await knowledge.save();

    res.json({
      message: "Text updated successfully",
      text: text.toObject(),
    });
  } catch (error) {
    console.error("Error updating text:", error);
    res.status(500).json({ message: error.message });
  }
});

// Update Q&A
router.put("/qa/:chatbotId/:qaId", auth, async (req, res) => {
  try {
    const { chatbotId, qaId } = req.params;
    const { title, qaItems, tags, isActive } = req.body;

    // Verify chatbot ownership
    const chatbot = await Chatbot.findOne({
      _id: chatbotId,
      userId: req.user.id,
    });

    if (!chatbot) {
      return res
        .status(404)
        .json({ message: "Chatbot not found or unauthorized" });
    }

    // Update Q&A in MongoDB
    const knowledge = await ChatbotKnowledge.findOne({ chatbotId });
    const qa = knowledge?.qaItems?.id(qaId);

    if (!qa) {
      return res.status(404).json({ message: "Q&A not found" });
    }

    // Update Q&A properties
    if (title !== undefined) qa.title = title;
    if (qaItems !== undefined) qa.qaItems = qaItems;
    if (tags !== undefined) qa.tags = tags;
    if (isActive !== undefined) qa.isActive = isActive;

    await knowledge.save();

    res.json({
      message: "Q&A updated successfully",
      qa: qa.toObject(),
    });
  } catch (error) {
    console.error("Error updating Q&A:", error);
    res.status(500).json({ message: error.message });
  }
});

// Delete file (and its chunks)
router.delete(
  "/files/:chatbotId/:fileId",
  auth,
  CacheInvalidationMiddleware.invalidateAfterDeletion,
  async (req, res) => {
    try {
      const { chatbotId, fileId } = req.params;

      // Verify chatbot ownership
      const chatbot = await Chatbot.findOne({
        _id: chatbotId,
        userId: req.user.id,
      });

      if (!chatbot) {
        return res
          .status(404)
          .json({ message: "Chatbot not found or unauthorized" });
      }

      // Delete file from MongoDB
      const knowledge = await ChatbotKnowledge.findOne({ chatbotId });
      const file = knowledge?.files?.id(fileId);

      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }

      // Delete associated chunks from Supabase
      try {
        await chunkStorage.supabase
          .from("chatbot_knowledge_chunks")
          .delete()
          .eq("chatbot_id", chatbotId)
          .like("document_id", `%${fileId}%`);
      } catch (error) {
        console.error("Error deleting chunks from Supabase:", error);
      }

      // Remove file from MongoDB
      knowledge.files.pull(fileId);
      await knowledge.save();

      res.json({
        message: "File and associated chunks deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting file:", error);
      res.status(500).json({ message: error.message });
    }
  }
);

// Delete text (and its chunks)
router.delete(
  "/texts/:chatbotId/:textId",
  auth,
  CacheInvalidationMiddleware.invalidateAfterDeletion,
  async (req, res) => {
    try {
      const { chatbotId, textId } = req.params;

      // Verify chatbot ownership
      const chatbot = await Chatbot.findOne({
        _id: chatbotId,
        userId: req.user.id,
      });

      if (!chatbot) {
        return res
          .status(404)
          .json({ message: "Chatbot not found or unauthorized" });
      }

      // Delete text from MongoDB
      const knowledge = await ChatbotKnowledge.findOne({ chatbotId });
      const text = knowledge?.texts?.id(textId);

      if (!text) {
        return res.status(404).json({ message: "Text not found" });
      }

      // Delete associated chunks from Supabase
      try {
        await chunkStorage.supabase
          .from("chatbot_knowledge_chunks")
          .delete()
          .eq("chatbot_id", chatbotId)
          .like("document_id", `%${textId}%`);
      } catch (error) {
        console.error("Error deleting chunks from Supabase:", error);
      }

      // Remove text from MongoDB
      knowledge.texts.pull(textId);
      await knowledge.save();

      res.json({
        message: "Text and associated chunks deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting text:", error);
      res.status(500).json({ message: error.message });
    }
  }
);

// Delete Q&A (and its chunks)
router.delete(
  "/qa/:chatbotId/:qaId",
  auth,
  CacheInvalidationMiddleware.invalidateAfterDeletion,
  async (req, res) => {
    try {
      const { chatbotId, qaId } = req.params;

      // Verify chatbot ownership
      const chatbot = await Chatbot.findOne({
        _id: chatbotId,
        userId: req.user.id,
      });

      if (!chatbot) {
        return res
          .status(404)
          .json({ message: "Chatbot not found or unauthorized" });
      }

      // Delete Q&A from MongoDB
      const knowledge = await ChatbotKnowledge.findOne({ chatbotId });
      const qa = knowledge?.qaItems?.id(qaId);

      if (!qa) {
        return res.status(404).json({ message: "Q&A not found" });
      }

      // Delete associated chunks from Supabase
      try {
        await chunkStorage.supabase
          .from("chatbot_knowledge_chunks")
          .delete()
          .eq("chatbot_id", chatbotId)
          .like("document_id", `%${qaId}%`);
      } catch (error) {
        console.error("Error deleting chunks from Supabase:", error);
      }

      // Remove Q&A from MongoDB
      knowledge.qaItems.pull(qaId);
      await knowledge.save();

      res.json({
        message: "Q&A and associated chunks deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting Q&A:", error);
      res.status(500).json({ message: error.message });
    }
  }
);

// Get chunks for a specific knowledge item
router.get("/chunks/:chatbotId/:documentId", auth, async (req, res) => {
  try {
    const { chatbotId, documentId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    // Verify chatbot ownership
    const chatbot = await Chatbot.findOne({
      _id: chatbotId,
      userId: req.user.id,
    });

    if (!chatbot) {
      return res
        .status(404)
        .json({ message: "Chatbot not found or unauthorized" });
    }

    // Get chunks from Supabase with pagination and metadata
    const offset = (page - 1) * limit;

    const { data: chunks, count } = await chunkStorage.supabase
      .from("chatbot_knowledge_chunks")
      .select(
        `
        *,
        chunk_metadata (
          topics,
          keywords,
          entities,
          complexity_level,
          question_types,
          audience
        )
      `,
        { count: "exact" }
      )
      .eq("chatbot_id", chatbotId)
      .like("document_id", `%${documentId}%`)
      .order("chunk_index", { ascending: true })
      .range(offset, offset + limit - 1);

    // Transform chunks to include parsed metadata
    const transformedChunks = (chunks || []).map((chunk) => ({
      ...chunk,
      metadata: {
        ...chunk.metadata,
        topics: chunk.chunk_metadata?.[0]?.topics
          ? JSON.parse(chunk.chunk_metadata[0].topics)
          : [],
        keywords: chunk.chunk_metadata?.[0]?.keywords
          ? JSON.parse(chunk.chunk_metadata[0].keywords)
          : [],
        entities: chunk.chunk_metadata?.[0]?.entities
          ? JSON.parse(chunk.chunk_metadata[0].entities)
          : [],
        complexity_level: chunk.chunk_metadata?.[0]?.complexity_level || null,
        question_types: chunk.chunk_metadata?.[0]?.question_types
          ? JSON.parse(chunk.chunk_metadata[0].question_types)
          : [],
        audience: chunk.chunk_metadata?.[0]?.audience
          ? JSON.parse(chunk.chunk_metadata[0].audience)
          : [],
      },
      heading_context: chunk.heading_context
        ? typeof chunk.heading_context === "string"
          ? JSON.parse(chunk.heading_context)
          : chunk.heading_context
        : [],
      // Remove the joined metadata to avoid duplication
      chunk_metadata: undefined,
    }));

    res.json({
      chunks: transformedChunks,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil((count || 0) / limit),
        totalItems: count || 0,
        itemsPerPage: parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Error fetching chunks:", error);
    res.status(500).json({ message: error.message });
  }
});

// Get single chunk details
router.get("/chunks/:chatbotId/chunk/:chunkId", async (req, res) => {
  try {
    const { chatbotId, chunkId } = req.params;

    // Get chunk from Supabase with metadata join
    const { data: chunk, error } = await chunkStorage.supabase
      .from("chatbot_knowledge_chunks")
      .select(
        `
        *,
        chunk_metadata (
          topics,
          keywords,
          entities,
          complexity_level,
          question_types,
          audience,
          prerequisites,
          related_concepts,
          source_document,
          processing_version
        )
      `
      )
      .eq("chatbot_id", chatbotId)
      .eq("id", chunkId)
      .single();

    if (error || !chunk) {
      console.error("Error fetching chunk:", error);
      return res.status(404).json({ message: "Chunk not found" });
    }

    // Transform the data to match frontend expectations
    const transformedChunk = {
      ...chunk,
      // Merge metadata from the joined table into the main metadata object
      metadata: {
        ...chunk.metadata,
        topics: chunk.chunk_metadata?.[0]?.topics
          ? JSON.parse(chunk.chunk_metadata[0].topics)
          : [],
        keywords: chunk.chunk_metadata?.[0]?.keywords
          ? JSON.parse(chunk.chunk_metadata[0].keywords)
          : [],
        entities: chunk.chunk_metadata?.[0]?.entities
          ? JSON.parse(chunk.chunk_metadata[0].entities)
          : [],
        complexity_level: chunk.chunk_metadata?.[0]?.complexity_level || null,
        question_types: chunk.chunk_metadata?.[0]?.question_types
          ? JSON.parse(chunk.chunk_metadata[0].question_types)
          : [],
        audience: chunk.chunk_metadata?.[0]?.audience
          ? JSON.parse(chunk.chunk_metadata[0].audience)
          : [],
        prerequisites: chunk.chunk_metadata?.[0]?.prerequisites
          ? JSON.parse(chunk.chunk_metadata[0].prerequisites)
          : [],
        related_concepts: chunk.chunk_metadata?.[0]?.related_concepts
          ? JSON.parse(chunk.chunk_metadata[0].related_concepts)
          : [],
        source_document: chunk.chunk_metadata?.[0]?.source_document
          ? JSON.parse(chunk.chunk_metadata[0].source_document)
          : null,
        processing_version:
          chunk.chunk_metadata?.[0]?.processing_version || null,
      },
      // Parse heading_context if it's a string
      heading_context: chunk.heading_context
        ? typeof chunk.heading_context === "string"
          ? JSON.parse(chunk.heading_context)
          : chunk.heading_context
        : [],
    };

    // Remove the joined metadata to avoid duplication
    delete transformedChunk.chunk_metadata;

    res.json(transformedChunk);
  } catch (error) {
    console.error("Error fetching chunk details:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Update chunk metadata (only metadata fields, not content)
router.put(
  "/chunks/:chatbotId/chunk/:chunkId/metadata",
  CacheInvalidationMiddleware.invalidateAfterModification,
  async (req, res) => {
    try {
      const { chatbotId, chunkId } = req.params;
      const {
        topics,
        keywords,
        heading_context,
        document_section,
        chunk_type,
      } = req.body;

      // Prepare update data for main chunks table
      const chunkUpdateData = {
        updated_at: new Date().toISOString(),
      };

      // Update core metadata fields in main table
      if (heading_context !== undefined)
        chunkUpdateData.heading_context = JSON.stringify(heading_context);
      if (document_section !== undefined)
        chunkUpdateData.document_section = document_section;
      if (chunk_type !== undefined) chunkUpdateData.chunk_type = chunk_type;

      // Update main metadata object in chunks table
      if (topics !== undefined || keywords !== undefined) {
        const { data: currentChunk } = await chunkStorage.supabase
          .from("chatbot_knowledge_chunks")
          .select("metadata")
          .eq("id", chunkId)
          .single();

        const currentMetadata = currentChunk?.metadata || {};
        chunkUpdateData.metadata = {
          ...currentMetadata,
          ...(topics !== undefined && { topics }),
          ...(keywords !== undefined && { keywords }),
        };
      }

      // Update chunk in main table
      const { data: updatedChunk, error: chunkError } =
        await chunkStorage.supabase
          .from("chatbot_knowledge_chunks")
          .update(chunkUpdateData)
          .eq("chatbot_id", chatbotId)
          .eq("id", chunkId)
          .select()
          .single();

      if (chunkError) {
        console.error("Error updating chunk:", chunkError);
        return res
          .status(500)
          .json({ message: "Failed to update chunk metadata" });
      }

      // Update or create metadata in separate metadata table
      if (topics !== undefined || keywords !== undefined) {
        const metadataUpdateData = {};
        if (topics !== undefined)
          metadataUpdateData.topics = JSON.stringify(topics);
        if (keywords !== undefined)
          metadataUpdateData.keywords = JSON.stringify(keywords);

        // Try to update existing metadata record
        const { data: existingMetadata } = await chunkStorage.supabase
          .from("chunk_metadata")
          .select("id")
          .eq("chunk_id", chunkId)
          .single();

        if (existingMetadata) {
          // Update existing metadata
          const { error: metadataError } = await chunkStorage.supabase
            .from("chunk_metadata")
            .update(metadataUpdateData)
            .eq("chunk_id", chunkId);

          if (metadataError) {
            console.error(
              "Error updating chunk metadata table:",
              metadataError
            );
          }
        } else {
          // Create new metadata record
          const { error: metadataError } = await chunkStorage.supabase
            .from("chunk_metadata")
            .insert({
              chunk_id: chunkId,
              topics: JSON.stringify(topics || []),
              keywords: JSON.stringify(keywords || []),
            });

          if (metadataError) {
            console.error(
              "Error creating chunk metadata record:",
              metadataError
            );
          }
        }
      }

      res.json({
        message: "Chunk metadata updated successfully",
        chunk: updatedChunk,
      });
    } catch (error) {
      console.error("Error updating chunk metadata:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

// Delete chunk
router.delete(
  "/chunks/:chatbotId/chunk/:chunkId",
  CacheInvalidationMiddleware.invalidateAfterDeletion,
  async (req, res) => {
    try {
      const { chatbotId, chunkId } = req.params;

      // Delete chunk from Supabase
      const { error } = await chunkStorage.supabase
        .from("chatbot_knowledge_chunks")
        .delete()
        .eq("chatbot_id", chatbotId)
        .eq("id", chunkId);

      if (error) {
        console.error("Error deleting chunk:", error);
        return res.status(500).json({ message: "Failed to delete chunk" });
      }

      res.json({ message: "Chunk deleted successfully" });
    } catch (error) {
      console.error("Error deleting chunk:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

module.exports = router;
