# Chatbot Agency Backend

Backend API for the Chatbot Agency platform.

## Deployment to Vercel

### Prerequisites

- A [Vercel](https://vercel.com) account
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) database
- Required API keys (OpenAI, Google, etc.)

### Deployment Steps

1. **Install Vercel CLI** (optional, for local testing)
   ```
   npm install -g vercel
   ```

2. **Login to Vercel** (optional, for local testing)
   ```
   vercel login
   ```

3. **Set up environment variables**
   
   Make sure to set up the following environment variables in your Vercel project settings:
   - `MONGODB_URI`: Your MongoDB connection string
   - `JWT_SECRET`: Secret key for JWT token generation
   - `FRONTEND_URL`: URL of your frontend application (for CORS)
   - `OPENAI_API_KEY`: Your OpenAI API key (if using OpenAI)
   - `GOOGLE_API_KEY`: Your Google API key (if using Google AI)
   - `NODE_ENV`: Set to "production"

4. **Deploy to Vercel**
   
   Option 1: Using Vercel CLI
   ```
   cd backend
   vercel
   ```
   
   Option 2: Connect your GitHub repository to Vercel and deploy from the Vercel dashboard.

5. **Initialize Templates** (after first deployment)
   
   After deploying, you need to initialize the agent templates. You can do this by:
   
   - Creating a one-time deployment hook in Vercel
   - Running the initialization script locally against your production database
   ```
   MONGODB_URI=your_production_mongodb_uri node scripts/initAgentTemplates.js
   ```

## Local Development

1. **Install dependencies**
   ```
   npm install
   ```

2. **Set up environment variables**
   
   Create a `.env` file based on `.env.example`

3. **Run the development server**
   ```
   npm run dev
   ```

4. **Initialize templates** (first time setup)
   ```
   npm run init-templates
   ```

## API Routes

- `/api/users` - User management
- `/api/chatbots` - Chatbot management
- `/api/products` - Product management
- `/api/chat` - Chat functionality
- `/api/knowledge` - Knowledge base management
- `/api/chatbot-knowledge` - Chatbot knowledge association
- `/api/agent-templates` - Agent templates management

## Health Check

- `/api/health` - Check if the API is running correctly
