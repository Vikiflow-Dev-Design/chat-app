const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const ChatbotKnowledge = require("../models/ChatbotKnowledge");
const Chatbot = require("../models/Chatbot");
const auth = require("../middleware/auth");
const {
  extractKeyInformation,
  processDocument,
} = require("../utils/documentProcessor");
const { optimizeFile } = require("../utils/fileOptimizer");
// Legacy vector processing removed - using Advanced RAG system instead

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

// Get knowledge for a chatbot
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

    // Find or create knowledge document for this chatbot
    let knowledge = await ChatbotKnowledge.findOne({ chatbotId });

    if (!knowledge) {
      // Create a new empty knowledge document if none exists
      knowledge = new ChatbotKnowledge({
        chatbotId,
        files: [],
        texts: [],
        qaItems: [],
        createdBy: req.user.id,
      });
      await knowledge.save();
    }

    res.json(knowledge);
  } catch (error) {
    console.error("Error fetching chatbot knowledge:", error);
    res.status(500).json({ message: error.message });
  }
});

// Add a text entry
router.post("/text", auth, async (req, res) => {
  try {
    const { chatbotId, title, description, content, tags } = req.body;

    if (!chatbotId || !title || !content) {
      return res
        .status(400)
        .json({ message: "Chatbot ID, title, and content are required" });
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

    // Process and extract key information from the text
    const extractedInformation = await extractKeyInformation(content, "text");

    // Find or create knowledge document for this chatbot
    let knowledge = await ChatbotKnowledge.findOne({ chatbotId });

    if (!knowledge) {
      knowledge = new ChatbotKnowledge({
        chatbotId,
        files: [],
        texts: [],
        qaItems: [],
        createdBy: req.user.id,
      });
    }

    // Add the new text entry
    knowledge.texts.push({
      title,
      description: description || "",
      content,
      extractedInformation,
      tags: tags || [],
      isActive: true,
    });

    await knowledge.save();

    // Vector processing now handled by Advanced RAG system

    res.status(201).json(knowledge);
  } catch (error) {
    console.error("Error adding text entry:", error);
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

    // Find or create knowledge document for this chatbot
    let knowledge = await ChatbotKnowledge.findOne({ chatbotId });

    if (!knowledge) {
      knowledge = new ChatbotKnowledge({
        chatbotId,
        files: [],
        texts: [],
        qaItems: [],
        createdBy: req.user.id,
      });
    }

    // Add the new Q&A entry
    knowledge.qaItems.push({
      title,
      qaItems,
      tags: tags || [],
      isActive: true,
    });

    await knowledge.save();

    // Vector processing now handled by Advanced RAG system

    res.status(201).json(knowledge);
  } catch (error) {
    console.error("Error adding Q&A pairs:", error);
    res.status(500).json({ message: error.message });
  }
});

// Upload a file
router.post("/file", auth, upload.single("file"), async (req, res) => {
  try {
    console.log("File upload request received");
    console.log("Request body:", req.body);
    console.log("Request file:", req.file);

    if (!req.file) {
      console.error("No file in request");
      return res.status(400).json({ message: "No file uploaded" });
    }

    const { chatbotId, title, tags } = req.body;

    if (!chatbotId || !title) {
      console.error("Missing required fields:", { chatbotId, title });
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
      console.error("Chatbot not found or unauthorized:", chatbotId);
      return res
        .status(404)
        .json({ message: "Chatbot not found or unauthorized" });
    }

    const filePath = req.file.path;
    const fileName = req.file.originalname;
    const fileSize = req.file.size;
    const fileType = path.extname(fileName).substring(1); // Remove the dot

    console.log("File details:", {
      path: filePath,
      name: fileName,
      size: fileSize,
      type: fileType,
    });

    // Check if the file exists
    if (!fs.existsSync(filePath)) {
      console.error("File does not exist at path:", filePath);
      return res
        .status(500)
        .json({ message: "File upload failed - file not found on server" });
    }

    console.log("Optimizing file...");

    // First, optimize the file
    try {
      // Update file status to optimizing
      let knowledge = await ChatbotKnowledge.findOne({ chatbotId });
      if (!knowledge) {
        console.log("Creating new knowledge document for chatbot:", chatbotId);
        knowledge = new ChatbotKnowledge({
          chatbotId,
          files: [],
          texts: [],
          qaItems: [],
          createdBy: req.user.id,
        });

        // Add a placeholder file entry with optimizing status
        const placeholderFile = {
          title,
          fileType,
          fileName,
          fileSize,
          originalSize: fileSize,
          content: "",
          tags: tags ? JSON.parse(tags) : [],
          processingStatus: "optimizing",
          isActive: true,
        };

        knowledge.files.push(placeholderFile);
        await knowledge.save();
      } else {
        // Add a placeholder file entry with optimizing status
        const placeholderFile = {
          title,
          fileType,
          fileName,
          fileSize,
          originalSize: fileSize,
          content: "",
          tags: tags ? JSON.parse(tags) : [],
          processingStatus: "optimizing",
          isActive: true,
        };

        knowledge.files.push(placeholderFile);
        await knowledge.save();
      }

      // Get the file ID for updates
      const fileId = knowledge.files[knowledge.files.length - 1]._id;

      // Extract text from the original file first
      console.log("Extracting text from original document...");
      let extractedText;

      try {
        // For PDF files, we'll extract text directly to avoid issues with optimized PDFs
        if (fileType.toLowerCase() === "pdf") {
          const fileBuffer = fs.readFileSync(filePath);
          const pdfParse = require("pdf-parse");
          const data = await pdfParse(fileBuffer);
          extractedText = data.text || "";

          // Apply our aggressive text optimization
          const { optimizeTextContent } = require("../utils/fileOptimizer");
          extractedText = optimizeTextContent(extractedText);

          console.log(
            "Text extracted directly from PDF, length:",
            extractedText.length
          );
        } else {
          // For non-PDF files, use the regular document processor
          extractedText = await processDocument(filePath, fileType);
          console.log(
            "Text extracted successfully, length:",
            extractedText.length
          );
        }
      } catch (extractError) {
        console.error(
          "Error extracting text from original file:",
          extractError
        );
        extractedText = "Error extracting text from file.";
      }

      // Now optimize the file (this will create a smaller version)
      const optimizationResult = await optimizeFile(filePath);
      console.log("File optimized:", optimizationResult);

      // Update the file entry with optimization metrics and extracted text
      await ChatbotKnowledge.updateOne(
        { chatbotId, "files._id": fileId },
        {
          $set: {
            "files.$.originalSize": optimizationResult.originalSize,
            "files.$.optimizedSize": optimizationResult.optimizedSize,
            "files.$.sizeReduction": optimizationResult.reductionPercent,
            "files.$.processingStatus": "processing",
            "files.$.content": extractedText, // Store the extracted text directly
          },
        }
      );

      // Refresh knowledge document
      knowledge = await ChatbotKnowledge.findOne({ chatbotId });

      console.log("File content updated in knowledge document, ID:", fileId);

      // Process the extracted text to get key information (async)
      console.log("Starting key information extraction (async)...");
      extractKeyInformation(extractedText, "file")
        .then(async (extractedInfo) => {
          console.log("Key information extracted successfully");
          // Update the file entry with extracted information
          await ChatbotKnowledge.updateOne(
            { chatbotId, "files._id": fileId },
            {
              $set: {
                "files.$.extractedInformation": extractedInfo,
                "files.$.processingStatus": "completed",
              },
            }
          );
          console.log("File processing completed");

          // Vector processing now handled by Advanced RAG system
        })
        .catch(async (error) => {
          console.error("Error extracting key information:", error);
          await ChatbotKnowledge.updateOne(
            { chatbotId, "files._id": fileId },
            {
              $set: {
                "files.$.processingStatus": "failed",
                "files.$.processingError": error.message,
              },
            }
          );
          console.log("File processing failed");
        });

      res.status(201).json(knowledge);
    } catch (processingError) {
      console.error("Error processing document:", processingError);
      res.status(500).json({
        message: "Error processing document",
        error: processingError.message,
        stack: processingError.stack,
      });
    }
  } catch (error) {
    console.error("Error uploading file:", error);
    res.status(500).json({
      message: error.message,
      stack: error.stack,
    });
  }
});

// Delete a file entry
router.delete("/file/:chatbotId/:fileId", auth, async (req, res) => {
  try {
    const { chatbotId, fileId } = req.params;

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

    // Find the knowledge document
    const knowledge = await ChatbotKnowledge.findOne({ chatbotId });

    if (!knowledge) {
      return res.status(404).json({ message: "Knowledge document not found" });
    }

    // Remove the file entry
    await ChatbotKnowledge.updateOne(
      { chatbotId },
      { $pull: { files: { _id: fileId } } }
    );

    // Vector cleanup now handled by Advanced RAG system

    res.json({ message: "File deleted successfully" });
  } catch (error) {
    console.error("Error deleting file:", error);
    res.status(500).json({ message: error.message });
  }
});

// Delete a text entry
router.delete("/text/:chatbotId/:textId", auth, async (req, res) => {
  try {
    const { chatbotId, textId } = req.params;

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

    // Find the knowledge document
    const knowledge = await ChatbotKnowledge.findOne({ chatbotId });

    if (!knowledge) {
      return res.status(404).json({ message: "Knowledge document not found" });
    }

    // Remove the text entry
    await ChatbotKnowledge.updateOne(
      { chatbotId },
      { $pull: { texts: { _id: textId } } }
    );

    // Vector cleanup now handled by Advanced RAG system

    res.json({ message: "Text entry deleted successfully" });
  } catch (error) {
    console.error("Error deleting text entry:", error);
    res.status(500).json({ message: error.message });
  }
});

// Delete a Q&A entry
router.delete("/qa/:chatbotId/:qaId", auth, async (req, res) => {
  try {
    const { chatbotId, qaId } = req.params;

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

    // Find the knowledge document
    const knowledge = await ChatbotKnowledge.findOne({ chatbotId });

    if (!knowledge) {
      return res.status(404).json({ message: "Knowledge document not found" });
    }

    // Remove the Q&A entry
    await ChatbotKnowledge.updateOne(
      { chatbotId },
      { $pull: { qaItems: { _id: qaId } } }
    );

    // Vector cleanup now handled by Advanced RAG system

    res.json({ message: "Q&A entry deleted successfully" });
  } catch (error) {
    console.error("Error deleting Q&A entry:", error);
    res.status(500).json({ message: error.message });
  }
});

// Update a file entry
router.put("/file/:chatbotId/:fileId", auth, async (req, res) => {
  try {
    const { chatbotId, fileId } = req.params;
    const { title, tags, isActive } = req.body;

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

    // Find the knowledge document
    const knowledge = await ChatbotKnowledge.findOne({ chatbotId });

    if (!knowledge) {
      return res.status(404).json({ message: "Knowledge document not found" });
    }

    // Update the file entry
    const updateData = {};
    if (title) updateData["files.$.title"] = title;
    if (tags) updateData["files.$.tags"] = tags;
    if (isActive !== undefined) updateData["files.$.isActive"] = isActive;

    await ChatbotKnowledge.updateOne(
      { chatbotId, "files._id": fileId },
      { $set: updateData }
    );

    // Get the updated knowledge document
    const updatedKnowledge = await ChatbotKnowledge.findOne({ chatbotId });
    res.json(updatedKnowledge);
  } catch (error) {
    console.error("Error updating file entry:", error);
    res.status(500).json({ message: error.message });
  }
});

// Update a text entry
router.put("/text/:chatbotId/:textId", auth, async (req, res) => {
  try {
    const { chatbotId, textId } = req.params;
    const { title, description, content, tags, isActive } = req.body;

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

    // Find the knowledge document
    const knowledge = await ChatbotKnowledge.findOne({ chatbotId });

    if (!knowledge) {
      return res.status(404).json({ message: "Knowledge document not found" });
    }

    // Update the text entry
    const updateData = {};
    if (title) updateData["texts.$.title"] = title;
    if (description !== undefined)
      updateData["texts.$.description"] = description;
    if (tags) updateData["texts.$.tags"] = tags;
    if (isActive !== undefined) updateData["texts.$.isActive"] = isActive;

    // If content is updated, re-process it
    if (content) {
      updateData["texts.$.content"] = content;
      const extractedInformation = await extractKeyInformation(content, "text");
      updateData["texts.$.extractedInformation"] = extractedInformation;
    }

    await ChatbotKnowledge.updateOne(
      { chatbotId, "texts._id": textId },
      { $set: updateData }
    );

    // Get the updated knowledge document
    const updatedKnowledge = await ChatbotKnowledge.findOne({ chatbotId });
    res.json(updatedKnowledge);
  } catch (error) {
    console.error("Error updating text entry:", error);
    res.status(500).json({ message: error.message });
  }
});

// Update a Q&A entry
router.put("/qa/:chatbotId/:qaId", auth, async (req, res) => {
  try {
    const { chatbotId, qaId } = req.params;
    const { title, qaItems, tags, isActive } = req.body;

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

    // Find the knowledge document
    const knowledge = await ChatbotKnowledge.findOne({ chatbotId });

    if (!knowledge) {
      return res.status(404).json({ message: "Knowledge document not found" });
    }

    // Update the Q&A entry
    const updateData = {};
    if (title) updateData["qaItems.$.title"] = title;
    if (qaItems) updateData["qaItems.$.qaItems"] = qaItems;
    if (tags) updateData["qaItems.$.tags"] = tags;
    if (isActive !== undefined) updateData["qaItems.$.isActive"] = isActive;

    await ChatbotKnowledge.updateOne(
      { chatbotId, "qaItems._id": qaId },
      { $set: updateData }
    );

    // Get the updated knowledge document
    const updatedKnowledge = await ChatbotKnowledge.findOne({ chatbotId });
    res.json(updatedKnowledge);
  } catch (error) {
    console.error("Error updating Q&A entry:", error);
    res.status(500).json({ message: error.message });
  }
});

// Search knowledge
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

    // Search the knowledge document
    const knowledge = await ChatbotKnowledge.findOne(
      {
        chatbotId,
        $text: { $search: query },
      },
      {
        score: { $meta: "textScore" },
      }
    ).sort({ score: { $meta: "textScore" } });

    res.json(knowledge || { chatbotId, files: [], texts: [], qaItems: [] });
  } catch (error) {
    console.error("Error searching knowledge:", error);
    res.status(500).json({ message: error.message });
  }
});

// Legacy vector processing functions removed - using Advanced RAG system instead

module.exports = router;
