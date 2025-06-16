const mongoose = require("mongoose");

// Define schemas for each type of knowledge source
const fileSourceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    fileType: {
      type: String,
      enum: ["pdf", "doc", "docx", "txt"],
      required: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    content: {
      type: String,
      default: "",
    },
    extractedInformation: {
      type: String,
      default: "",
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    processingStatus: {
      type: String,
      enum: ["pending", "optimizing", "processing", "completed", "failed"],
      default: "pending",
    },
    processingError: {
      type: String,
      default: "",
    },
    originalSize: {
      type: Number,
      default: 0,
    },
    optimizedSize: {
      type: Number,
      default: 0,
    },
    sizeReduction: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const textSourceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    extractedInformation: {
      type: String,
      default: "",
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const qaItemSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
  },
  answer: {
    type: String,
    required: true,
  },
});

const qaSourceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    qaItems: [qaItemSchema],
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Main ChatbotKnowledge schema
const chatbotKnowledgeSchema = new mongoose.Schema(
  {
    chatbotId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chatbot",
      required: true,
      unique: true, // Ensure one knowledge document per chatbot
      index: true,
    },
    files: [fileSourceSchema],
    texts: [textSourceSchema],
    qaItems: [qaSourceSchema],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// Create text index for search functionality
chatbotKnowledgeSchema.index(
  {
    "files.title": "text",
    "files.content": "text",
    "files.extractedInformation": "text",
    "texts.title": "text",
    "texts.content": "text",
    "texts.extractedInformation": "text",
    "qaItems.title": "text",
    "qaItems.qaItems.question": "text",
    "qaItems.qaItems.answer": "text",
  },
  {
    weights: {
      "files.title": 10,
      "texts.title": 10,
      "qaItems.title": 10,
      "qaItems.qaItems.question": 8,
      "qaItems.qaItems.answer": 6,
      "files.extractedInformation": 4,
      "texts.extractedInformation": 4,
      "files.content": 2,
      "texts.content": 2,
    },
  }
);

const ChatbotKnowledge = mongoose.model(
  "ChatbotKnowledge",
  chatbotKnowledgeSchema
);

module.exports = ChatbotKnowledge;
