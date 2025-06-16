const mongoose = require("mongoose");
const ChatSession = require("./models/ChatSession");
const ChatMessage = require("./models/ChatMessage");
require("dotenv").config();

async function createTestData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    const chatbotId = "680cef107640794a082542b1";

    // Create session 2 (yesterday)
    const session2 = new ChatSession({
      chatbotId,
      startedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      userId: "64a1b2c3d4e5f6a7b8c9d0e1",
    });
    const savedSession2 = await session2.save();
    console.log("Created session 2");

    const msg1 = new ChatMessage({
      sessionId: savedSession2._id,
      content: "Do you have any pricing information?",
      role: "user",
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
    });
    await msg1.save();

    const msg2 = new ChatMessage({
      sessionId: savedSession2._id,
      content:
        "Yes, our basic plan starts at $29/month and includes up to 1000 messages.",
      role: "assistant",
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000 + 1000),
    });
    await msg2.save();
    console.log("Created messages for session 2");

    // Create session 3 (3 days ago)
    const session3 = new ChatSession({
      chatbotId,
      startedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      endedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 10 * 60 * 1000),
    });
    const savedSession3 = await session3.save();
    console.log("Created session 3");

    const msg5 = new ChatMessage({
      sessionId: savedSession3._id,
      content: "How do I integrate this with my website?",
      role: "user",
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    });
    await msg5.save();

    const msg6 = new ChatMessage({
      sessionId: savedSession3._id,
      content:
        "Integration is simple. You just need to add a small JavaScript snippet to your website.",
      role: "assistant",
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 1000),
    });
    await msg6.save();
    console.log("Created messages for session 3");

    console.log("Created all test sessions and messages");
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

createTestData();
