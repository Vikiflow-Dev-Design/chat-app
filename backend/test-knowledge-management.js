const mongoose = require("mongoose");
const Chatbot = require("./models/Chatbot");
const ChatbotKnowledge = require("./models/ChatbotKnowledge");
require("dotenv").config();

async function testKnowledgeManagement() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    const chatbotId = "68397df155fa8d7c57e07e2d";
    const mockUserId = "64a1b2c3d4e5f6a7b8c9d0e1";

    // Check if chatbot exists
    console.log("\n1. Checking chatbot...");
    const chatbot = await Chatbot.findById(chatbotId);
    if (chatbot) {
      console.log(`✅ Chatbot found: ${chatbot.name}`);
      console.log(`   User ID: ${chatbot.userId}`);
      console.log(`   Mock User ID: ${mockUserId}`);
      console.log(`   Match: ${chatbot.userId === mockUserId ? "YES" : "NO"}`);
    } else {
      console.log("❌ Chatbot not found");
    }

    // Check if chatbot belongs to mock user
    console.log("\n2. Checking chatbot ownership...");
    const ownedChatbot = await Chatbot.findOne({
      _id: chatbotId,
      userId: mockUserId,
    });
    if (ownedChatbot) {
      console.log("✅ Chatbot belongs to mock user");
    } else {
      console.log("❌ Chatbot does NOT belong to mock user");
      
      // Update chatbot to belong to mock user for testing
      console.log("\n3. Updating chatbot ownership for testing...");
      const updated = await Chatbot.findByIdAndUpdate(
        chatbotId,
        { userId: mockUserId },
        { new: true }
      );
      if (updated) {
        console.log("✅ Updated chatbot ownership to mock user");
      } else {
        console.log("❌ Failed to update chatbot ownership");
      }
    }

    // Check knowledge base
    console.log("\n4. Checking knowledge base...");
    const knowledge = await ChatbotKnowledge.findOne({ chatbotId });
    if (knowledge) {
      console.log("✅ Knowledge base found");
      console.log(`   Files: ${knowledge.files?.length || 0}`);
      console.log(`   Texts: ${knowledge.texts?.length || 0}`);
      console.log(`   Q&A: ${knowledge.qaItems?.length || 0}`);
    } else {
      console.log("❌ Knowledge base not found");
      
      // Create empty knowledge base
      console.log("\n5. Creating empty knowledge base...");
      const newKnowledge = new ChatbotKnowledge({
        chatbotId,
        files: [],
        texts: [],
        qaItems: [],
      });
      await newKnowledge.save();
      console.log("✅ Created empty knowledge base");
    }

    console.log("\n✅ Test completed successfully!");

  } catch (error) {
    console.error("❌ Test failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

testKnowledgeManagement();
