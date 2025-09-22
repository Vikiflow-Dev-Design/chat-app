/**
 * Script to check and update chatbot behavior prompt for more conversational responses
 */

const mongoose = require('mongoose');
const Chatbot = require('./models/Chatbot');

// Configuration
const CHATBOT_ID = '68397df155fa8d7c57e07e2d'; // Your chatbot ID

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/chat-app');
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

// Check current chatbot configuration
async function checkChatbotConfig() {
  try {
    console.log('🔍 Checking chatbot configuration...');
    console.log('─'.repeat(50));
    
    const chatbot = await Chatbot.findById(CHATBOT_ID);
    
    if (!chatbot) {
      console.error('❌ Chatbot not found with ID:', CHATBOT_ID);
      return null;
    }
    
    console.log('✅ Chatbot found:');
    console.log(`📝 Name: ${chatbot.name}`);
    console.log(`📄 Description: ${chatbot.description || 'Not set'}`);
    console.log(`💬 Initial Message: ${chatbot.initialMessage}`);
    console.log(`🤖 Model: ${chatbot.model}`);
    console.log(`🌡️  Temperature: ${chatbot.temperature}`);
    console.log(`🔢 Max Tokens: ${chatbot.maxTokens}`);
    console.log('\n📋 Current Behavior Prompt:');
    console.log('─'.repeat(30));
    console.log(chatbot.behaviorPrompt);
    console.log('─'.repeat(30));
    
    return chatbot;
  } catch (error) {
    console.error('❌ Error checking chatbot:', error);
    return null;
  }
}

// Suggested conversational behavior prompt
const CONVERSATIONAL_BEHAVIOR_PROMPT = `You are a friendly and helpful AI assistant. Your personality is warm, approachable, and conversational.

## Your Communication Style:
- Be natural and conversational in your responses
- Use a warm, friendly tone that makes users feel comfortable
- Respond to greetings and casual conversation naturally
- Show enthusiasm when appropriate
- Be helpful and informative while maintaining a personal touch

## How to Handle Different Types of Queries:

### Greetings & Casual Conversation:
- Respond warmly to "hello", "hi", "how are you", etc.
- Engage in brief friendly conversation
- Naturally transition to offering help

### Knowledge-Based Questions:
- Provide detailed, accurate answers based on your knowledge base
- Be thorough but easy to understand
- Cite relevant information when available

### General Questions (Outside Knowledge Base):
- Be honest about your limitations
- Offer to help with what you can assist with
- Maintain a helpful and positive attitude

### Examples of Good Responses:
- "Hello! It's great to meet you! I'm here and ready to help with any questions you might have. How can I assist you today?"
- "I'm doing well, thank you for asking! I'm excited to help you with whatever you need. What can I do for you?"
- "That's a great question! While I don't have specific information about that topic in my knowledge base, I'd be happy to help you with questions about [your domain]. What would you like to know?"

Remember: Always be helpful, friendly, and conversational while providing accurate information when available.`;

// Update chatbot behavior prompt
async function updateBehaviorPrompt(chatbot) {
  try {
    console.log('\n🔄 Would you like to update the behavior prompt to be more conversational?');
    console.log('This will make your chatbot respond more naturally to greetings and casual conversation.');
    
    // For now, let's just show what the new prompt would be
    console.log('\n📝 Suggested New Behavior Prompt:');
    console.log('═'.repeat(50));
    console.log(CONVERSATIONAL_BEHAVIOR_PROMPT);
    console.log('═'.repeat(50));
    
    console.log('\n💡 To apply this update, uncomment the update code in this script and run it again.');
    
    // Uncomment the lines below to actually update the chatbot
    /*
    chatbot.behaviorPrompt = CONVERSATIONAL_BEHAVIOR_PROMPT;
    await chatbot.save();
    console.log('✅ Chatbot behavior prompt updated successfully!');
    console.log('🎉 Your chatbot should now be more conversational!');
    */
    
  } catch (error) {
    console.error('❌ Error updating chatbot:', error);
  }
}

// Main function
async function main() {
  console.log('🤖 Chatbot Behavior Checker & Updater');
  console.log('═'.repeat(50));
  
  await connectDB();
  
  const chatbot = await checkChatbotConfig();
  
  if (chatbot) {
    await updateBehaviorPrompt(chatbot);
  }
  
  console.log('\n🏁 Done! Closing database connection...');
  await mongoose.connection.close();
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { checkChatbotConfig, CONVERSATIONAL_BEHAVIOR_PROMPT };
