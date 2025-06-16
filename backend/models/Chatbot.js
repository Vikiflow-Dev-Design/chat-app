const mongoose = require("mongoose");

const chatbotStatsSchema = new mongoose.Schema(
  {
    totalMessages: {
      type: Number,
      default: 0,
    },
    activeUsers: {
      type: Number,
      default: 0,
    },
    averageRating: {
      type: Number,
    },
  },
  { _id: false }
);

const chatbotSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    initialMessage: {
      type: String,
      required: true,
    },
    behaviorPrompt: {
      type: String,
      required: true,
    },
    model: {
      type: String,
      enum: [
        "gemini-2.5-flash-preview-04-17",
        "gemini-2.5-pro-preview-05-06",
        "gemini-2.0-flash",
        "gemini-2.0-flash-lite",
        "gemini-1.5-pro",
        "gemini-1.5-flash",
        "gemini-1.5-flash-8b",
        "gemma-3-1b-it",
      ],
      default: "gemini-2.5-flash-preview-04-17",
    },
    temperature: {
      type: Number,
      default: 0.7,
      min: 0,
      max: 1,
    },
    maxTokens: {
      type: Number,
      default: 1000,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    publicId: {
      type: String,
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
    stats: {
      type: chatbotStatsSchema,
      default: () => ({}),
    },
  },
  {
    timestamps: true,
  }
);

// Generate a random public ID before saving if isPublic is true
chatbotSchema.pre("save", function (next) {
  if (this.isPublic && !this.publicId) {
    this.publicId =
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15);
  }
  next();
});

const Chatbot = mongoose.model("Chatbot", chatbotSchema);

module.exports = Chatbot;
