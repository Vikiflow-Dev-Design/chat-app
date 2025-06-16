const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Chatbot = require("../models/Chatbot");
const auth = require("../middleware/auth");
const {
  extractKeyInformation,
  processDocument,
} = require("../utils/documentProcessor");

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

const fileFilter = (req, file, cb) => {
  // Accept only pdf, doc, docx, and txt files
  const allowedFileTypes = [".pdf", ".doc", ".docx", ".txt"];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedFileTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid file type. Only PDF, DOC, DOCX, and TXT files are allowed."
      ),
      false
    );
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// Get all knowledge documents (requires authentication)
router.get("/", auth, async (req, res) => {
  try {
    // Get all knowledge documents for the authenticated user
    // Find all chatbots owned by the user
    const chatbots = await Chatbot.find({ userId: req.user.id });

    if (!chatbots || chatbots.length === 0) {
      return res.json([]);
    }

    // Get the chatbot IDs
    const chatbotIds = chatbots.map((chatbot) => chatbot._id);

    // Find all knowledge documents for these chatbots
    const documents = await KnowledgeDocument.find({
      chatbotId: { $in: chatbotIds },
    }).sort({ createdAt: -1 });

    res.json(documents);
  } catch (error) {
    console.error("Error fetching knowledge documents:", error);
    res.status(500).json({ message: error.message });
  }
});

// Get all knowledge documents for a chatbot
router.get("/chatbot/:chatbotId", auth, async (req, res) => {
  try {
    const { chatbotId } = req.params;

    // Check if chatbot exists and belongs to the user
    const chatbot = await Chatbot.findOne({
      _id: chatbotId,
      userId: req.user.id,
    });

    if (!chatbot) {
      return res
        .status(404)
        .json({ message: "Chatbot not found or unauthorized" });
    }

    const documents = await KnowledgeDocument.find({ chatbotId }).sort({
      createdAt: -1,
    });

    res.json(documents);
  } catch (error) {
    console.error("Error fetching knowledge documents:", error);
    res.status(500).json({ message: error.message });
  }
});

// Get a single knowledge document
router.get("/:documentId", auth, async (req, res) => {
  try {
    const { documentId } = req.params;
    const document = await KnowledgeDocument.findById(documentId);

    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    // Check if the document belongs to a chatbot owned by the user
    const chatbot = await Chatbot.findOne({
      _id: document.chatbotId,
      userId: req.user.id,
    });

    if (!chatbot) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    res.json(document);
  } catch (error) {
    console.error("Error fetching knowledge document:", error);
    res.status(500).json({ message: error.message });
  }
});

// Create a new text knowledge document
router.post("/", auth, async (req, res) => {
  try {
    const { chatbotId, title, content, tags } = req.body;

    // Check if chatbot exists and belongs to the user
    const chatbot = await Chatbot.findOne({
      _id: chatbotId,
      userId: req.user.id,
    });

    if (!chatbot) {
      return res
        .status(404)
        .json({ message: "Chatbot not found or unauthorized" });
    }

    // Process and extract key information from the document
    const extractedInformation = await extractKeyInformation(content, "text");

    const newDocument = new KnowledgeDocument({
      chatbotId,
      title,
      sourceType: "text",
      content,
      tags: tags || [],
      extractedInformation,
      processingStatus: "completed",
      createdBy: req.user.id,
    });

    await newDocument.save();

    res.status(201).json(newDocument);
  } catch (error) {
    console.error("Error creating text knowledge document:", error);
    res.status(500).json({ message: error.message });
  }
});

// Add Q&A pairs
router.post("/qa", auth, async (req, res) => {
  try {
    const { chatbotId, title, qaItems, tags } = req.body;

    if (!chatbotId || !title || !qaItems || !qaItems.length) {
      return res
        .status(400)
        .json({ message: "Chatbot ID, title, and Q&A items are required" });
    }

    // Check if chatbot exists and belongs to the user
    const chatbot = await Chatbot.findOne({
      _id: chatbotId,
      userId: req.user.id,
    });

    if (!chatbot) {
      return res
        .status(404)
        .json({ message: "Chatbot not found or unauthorized" });
    }

    // Create a new knowledge document
    const newDocument = new KnowledgeDocument({
      chatbotId,
      title,
      sourceType: "qa",
      qaItems,
      tags: tags || [],
      processingStatus: "completed",
      createdBy: req.user.id,
    });

    await newDocument.save();

    res.status(201).json(newDocument);
  } catch (error) {
    console.error("Error adding Q&A pairs:", error);
    res.status(500).json({ message: error.message });
  }
});

// Upload a file document
router.post("/upload", auth, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const { chatbotId, title, tags } = req.body;

    if (!chatbotId || !title) {
      return res
        .status(400)
        .json({ message: "Chatbot ID and title are required" });
    }

    // Check if chatbot exists and belongs to the user
    const chatbot = await Chatbot.findOne({
      _id: chatbotId,
      userId: req.user.id,
    });

    if (!chatbot) {
      return res
        .status(404)
        .json({ message: "Chatbot not found or unauthorized" });
    }

    const filePath = req.file.path;
    const fileName = req.file.originalname;
    const fileSize = req.file.size;
    const fileType = path.extname(fileName).substring(1); // Remove the dot

    // Process the file to extract text
    const extractedText = await processDocument(filePath, fileType);

    // Create a new knowledge document
    const newDocument = new KnowledgeDocument({
      chatbotId,
      title,
      sourceType: "file",
      fileType,
      fileName,
      fileSize,
      content: extractedText,
      tags: tags ? JSON.parse(tags) : [],
      processingStatus: "processing",
      createdBy: req.user.id,
    });

    await newDocument.save();

    // Process the extracted text to get key information (async)
    extractKeyInformation(extractedText, "file")
      .then(async (extractedInfo) => {
        await KnowledgeDocument.findByIdAndUpdate(newDocument._id, {
          extractedInformation: extractedInfo,
          processingStatus: "completed",
        });
      })
      .catch(async (error) => {
        console.error("Error extracting key information:", error);
        await KnowledgeDocument.findByIdAndUpdate(newDocument._id, {
          processingStatus: "failed",
          processingError: error.message,
        });
      });

    res.status(201).json(newDocument);
  } catch (error) {
    console.error("Error uploading file:", error);
    res.status(500).json({ message: error.message });
  }
});

// Update a knowledge document
router.put("/:documentId", auth, async (req, res) => {
  try {
    const { documentId } = req.params;
    const { title, content, qaItems, tags, isActive } = req.body;

    // Find the document
    const document = await KnowledgeDocument.findById(documentId);

    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    // Check if the document belongs to a chatbot owned by the user
    const chatbot = await Chatbot.findOne({
      _id: document.chatbotId,
      userId: req.user.id,
    });

    if (!chatbot) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Update fields if provided
    if (title) document.title = title;

    // Update content based on source type
    if (document.sourceType === "text" && content) {
      document.content = content;
      // Re-process the content if it changed
      document.extractedInformation = await extractKeyInformation(
        content,
        "text"
      );
      document.processingStatus = "completed";
    } else if (document.sourceType === "qa" && qaItems) {
      document.qaItems = qaItems;
      document.processingStatus = "completed";
    }

    if (tags) document.tags = tags;
    if (isActive !== undefined) document.isActive = isActive;

    await document.save();

    res.json(document);
  } catch (error) {
    console.error("Error updating knowledge document:", error);
    res.status(500).json({ message: error.message });
  }
});

// Delete a knowledge document
router.delete("/:documentId", auth, async (req, res) => {
  try {
    const { documentId } = req.params;

    // Find the document
    const document = await KnowledgeDocument.findById(documentId);

    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    // Check if the document belongs to a chatbot owned by the user
    const chatbot = await Chatbot.findOne({
      _id: document.chatbotId,
      userId: req.user.id,
    });

    if (!chatbot) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    await KnowledgeDocument.findByIdAndDelete(documentId);

    res.json({ message: "Document deleted successfully" });
  } catch (error) {
    console.error("Error deleting knowledge document:", error);
    res.status(500).json({ message: error.message });
  }
});

// Search knowledge documents
router.get("/search/:chatbotId", auth, async (req, res) => {
  try {
    const { chatbotId } = req.params;
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({ message: "Search query is required" });
    }

    // Check if chatbot exists and belongs to the user
    const chatbot = await Chatbot.findOne({
      _id: chatbotId,
      userId: req.user.id,
    });

    if (!chatbot) {
      return res
        .status(404)
        .json({ message: "Chatbot not found or unauthorized" });
    }

    const documents = await KnowledgeDocument.find({
      chatbotId,
      $text: { $search: query },
    }).sort({ score: { $meta: "textScore" } });

    res.json(documents);
  } catch (error) {
    console.error("Error searching knowledge documents:", error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
