const express = require("express");
const router = express.Router();
const ChatbotKnowledge = require("../models/ChatbotKnowledge");
const Chatbot = require("../models/Chatbot");
const auth = require("../middleware/auth");
const { extractKeyInformation } = require("../utils/documentProcessor");

/**
 * Process a file that has already been uploaded
 * This endpoint is used to manually trigger processing of a file
 * that was previously uploaded but not fully processed
 */
router.post("/process-file", auth, async (req, res) => {
  try {
    const { chatbotId, fileId } = req.body;

    if (!chatbotId || !fileId) {
      return res
        .status(400)
        .json({ message: "Chatbot ID and file ID are required" });
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

    // Find the knowledge document
    const knowledge = await ChatbotKnowledge.findOne({ chatbotId });

    if (!knowledge) {
      return res.status(404).json({ message: "Knowledge document not found" });
    }

    // Find the file in the knowledge document
    const fileIndex = knowledge.files.findIndex(
      (file) => file._id.toString() === fileId
    );

    if (fileIndex === -1) {
      return res.status(404).json({ message: "File not found" });
    }

    const file = knowledge.files[fileIndex];

    // Check if the file is already processed
    if (file.processingStatus === "completed") {
      return res.json({
        message: "File already processed",
        file,
      });
    }

    // Update the file status to processing
    await ChatbotKnowledge.updateOne(
      { chatbotId, "files._id": fileId },
      {
        $set: {
          "files.$.processingStatus": "processing",
        },
      }
    );

    // Process the file content to extract key information (async)
    extractKeyInformation(file.content, "file")
      .then(async (extractedInfo) => {
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
        console.log(`File ${fileId} processed successfully`);
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
      });

    res.json({
      message: "File processing initiated",
      fileId,
      chatbotId,
    });
  } catch (error) {
    console.error("Error processing file:", error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
