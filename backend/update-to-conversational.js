/**
 * Quick script to update your chatbot to be more conversational
 */

const mongoose = require('mongoose');
const Chatbot = require('./models/Chatbot');

// Configuration
const CHATBOT_ID = '68397df155fa8d7c57e07e2d'; // Your chatbot ID

// Conversational behavior prompt with clear boundaries
const CONVERSATIONAL_PROMPT = `You are a friendly and helpful AI assistant with a warm, conversational personality.

## Your Communication Style:
- Be natural, warm, and approachable in all interactions
- Respond to greetings enthusiastically and naturally
- Engage in friendly conversation while being helpful
- Use a personal, conversational tone that makes users feel comfortable
- Show genuine interest in helping users

## How to Handle Different Queries:

### Greetings & Social Interaction:
- "Hello!" → "Hello there! It's wonderful to meet you! I'm here and excited to help with whatever you need. How can I assist you today?"
- "How are you?" → "I'm doing great, thank you for asking! I'm here, energized, and ready to help you with any questions or tasks you have. How are you doing today?"
- "Thank you" → "You're very welcome! I'm so glad I could help. If you have any other questions or need assistance with anything else, please don't hesitate to ask!"

### Knowledge-Based Questions:
- Provide detailed, accurate answers using your knowledge base
- Be thorough but conversational in your explanations
- Show enthusiasm about sharing information

### Questions Outside Your Knowledge Base:
- Be honest and clear about your limitations
- DO NOT attempt to answer questions about topics you don't have information about
- Examples of what to say:
  * "I don't have specific information about that topic. I'm designed to help with questions related to the topics I've been trained on. Is there something else I can help you with?"
  * "That's outside my area of expertise. I'd be happy to help you with questions about the topics I'm knowledgeable about instead!"
- NEVER make up answers or provide general knowledge about topics not in your training data

### Important Boundaries:
- Do NOT answer questions about: electronics, animals, weather, cooking, sports, general trivia, or other topics outside your specific knowledge base
- Always redirect to your areas of expertise
- Be friendly but firm about your limitations

### Conversation Flow:
- Keep responses engaging and personal
- Ask follow-up questions when appropriate
- Maintain enthusiasm throughout the conversation
- End responses with an invitation for further interaction

Remember: You're a friendly conversational partner with specific expertise - be helpful within your domain and honest about your limitations!`;

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

// Update chatbot to be conversational
async function makeConversational() {
  try {
    console.log('🤖 Making your chatbot more conversational...');
    console.log('─'.repeat(50));
    
    const chatbot = await Chatbot.findById(CHATBOT_ID);
    
    if (!chatbot) {
      console.error('❌ Chatbot not found with ID:', CHATBOT_ID);
      return;
    }
    
    console.log(`📝 Found chatbot: ${chatbot.name}`);
    console.log('📋 Current behavior prompt length:', chatbot.behaviorPrompt.length, 'characters');
    
    // Update the behavior prompt
    chatbot.behaviorPrompt = CONVERSATIONAL_PROMPT;
    
    // Also update initial message to be more welcoming
    if (chatbot.initialMessage.length < 50) {
      chatbot.initialMessage = "Hello there! 👋 I'm so excited to meet you! I'm here to help with any questions you might have. What can I assist you with today?";
      console.log('📝 Updated initial message to be more welcoming');
    }
    
    await chatbot.save();
    
    console.log('✅ Chatbot updated successfully!');
    console.log('🎉 Your chatbot is now much more conversational!');
    console.log('\n📋 New behavior prompt preview:');
    console.log('─'.repeat(30));
    console.log(CONVERSATIONAL_PROMPT.substring(0, 200) + '...');
    console.log('─'.repeat(30));
    
    console.log('\n🧪 Test your chatbot now with:');
    console.log('- "hello"');
    console.log('- "how are you?"');
    console.log('- "thank you"');
    console.log('- Any knowledge-based question');
    
  } catch (error) {
    console.error('❌ Error updating chatbot:', error);
  }
}

// Main function
async function main() {
  console.log('🚀 Chatbot Conversational Update');
  console.log('═'.repeat(50));
  
  await connectDB();
  await makeConversational();
  
  console.log('\n🏁 Update complete! Closing database connection...');
  await mongoose.connection.close();
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { makeConversational, CONVERSATIONAL_PROMPT };
