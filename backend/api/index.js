require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const morgan = require("morgan");

// Import routes
const userRoutes = require("../routes/userRoutes");
const chatbotRoutes = require("../routes/chatbotRoutes");
const productRoutes = require("../routes/productRoutes");
const chatRoutes = require("../routes/chatRoutes");
const knowledgeRoutes = require("../routes/knowledgeRoutes");
const chatbotKnowledgeRoutes = require("../routes/chatbotKnowledgeRoutes");
const agentTemplateRoutes = require("../routes/agentTemplateRoutes");
const processFileRoute = require("../routes/processFileRoute");
const suggestionsRoutes = require("../routes/suggestionsRoutes");

// Initialize express app
const app = express();

// Import custom CORS middleware
const corsMiddleware = require("../middleware/cors");

// Middleware
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Apply CORS middleware before any routes
// app.use(corsMiddleware);

// Apply standard CORS as a fallback with specific configuration
app.use(
  cors({
    // origin: function (origin, callback) {
    //   // Allow requests with no origin (like mobile apps, curl, etc)
    //   if (!origin) return callback(null, true);

    //   const allowedOrigins =
    //     process.env.NODE_ENV === "production"
    //       ? [
    //           process.env.FRONTEND_URL,
    //           "https://chat-agency-spark.vercel.app",
    //           "https://vikiai.vikiflow.com",
    //         ]
    //       : [
    //           "http://localhost:3000",
    //           "http://localhost:5173",
    //           "http://localhost:8080",
    //         ];

    //   // In development, allow any origin
    //   if (process.env.NODE_ENV !== "production") {
    //     callback(null, origin);
    //   }
    //   // In production, check if origin is in allowed list
    //   else if (allowedOrigins.indexOf(origin) !== -1) {
    //     callback(null, origin);
    //   } else {
    //     callback(new Error("CORS policy violation"));
    //   }
    // },
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Origin",
      "X-Requested-With",
      "Content-Type",
      "Accept",
      "Authorization",
    ],
  })
);

// Only use morgan in development
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

// Connect to MongoDB
let isConnected = false;
const connectToDatabase = async () => {
  if (isConnected) {
    console.log("Using existing database connection");
    return;
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    isConnected = true;
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    throw error;
  }
};

// Connect to database on startup
connectToDatabase();

// Routes
app.use("/api/users", userRoutes);
app.use("/api/chatbots", chatbotRoutes);
app.use("/api/products", productRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/knowledge", knowledgeRoutes);
app.use("/api/chatbot-knowledge", chatbotKnowledgeRoutes);
app.use("/api/chatbot-knowledge", processFileRoute); // Add the process-file route to the chatbot-knowledge path
app.use("/api/agent-templates", agentTemplateRoutes);
app.use("/api", suggestionsRoutes); // Document suggestions management

// Root route
app.get("/", (req, res) => {
  res.send("Chatbot Agency API is running");
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok", environment: process.env.NODE_ENV });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res
    .status(500)
    .send({ message: "Something went wrong!", error: err.message });
});

// Export the app for Vercel
module.exports = app;

// Start server if not in production (for local development)
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}
