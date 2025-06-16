const mongoose = require("mongoose");
const Chatbot = require("../models/Chatbot");
require("dotenv").config();

async function updateChatbotModels() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    // Find all chatbots with the old model names
    const chatbots = await Chatbot.find({
      model: { $in: ["gemini-2.0-flash"] },
    });

    console.log(`Found ${chatbots.length} chatbots with outdated model names`);

    // Update each chatbot
    for (const chatbot of chatbots) {
      // Map old model names to new ones
      if (chatbot.model === "gemini-2.0-flash") {
        chatbot.model = "gemini-1.5-flash";
      }

      // Save the updated chatbot
      await chatbot.save();
      console.log(
        `Updated chatbot ${chatbot._id} to use model ${chatbot.model}`
      );
    }

    console.log("All chatbots updated successfully");
  } catch (error) {
    console.error("Error updating chatbots:", error);
  } finally {
    // Close the MongoDB connection
    await mongoose.connection.close();
    console.log("MongoDB connection closed");
  }
}

// Run the update function
updateChatbotModels();
