const mongoose = require("mongoose");

const chatSessionSchema = new mongoose.Schema({
  chatbotId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Chatbot",
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  // Visitor ID for non-authenticated users
  visitorId: {
    type: String,
    index: true,
  },
  // User information for guest users
  userInfo: {
    name: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
  },
  title: {
    type: String,
    trim: true,
  },
  startedAt: {
    type: Date,
    default: Date.now,
  },
  endedAt: {
    type: Date,
  },
  lastMessageAt: {
    type: Date,
    default: Date.now,
  },
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
  },
});

const ChatSession = mongoose.model("ChatSession", chatSessionSchema);

module.exports = ChatSession;
