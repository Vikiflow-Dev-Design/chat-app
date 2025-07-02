/**
 * Advanced File Upload Route with Complete RAG Integration
 * Frontend → Backend → Docling → Chunking → Supabase Storage
 */

const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const auth = require("../middleware/auth");
const CacheInvalidationMiddleware = require("../middleware/cacheInvalidationMiddleware");

// Import our enhanced LLM-based RAG services
const DoclingIntegrationService = require("../services/doclingIntegrationService");
const LLMChunkingService = require("../services/llmChunkingService");
const LLMMetadataService = require("../services/llmMetadataService");
// Import embedding service wrapper (preserves original code while allowing disconnection)
const EmbeddingServiceWrapper = require("../services/embeddingServiceWrapper");

// Import configuration for conditional processing
const {
  isDoclingEnabled,
  shouldForceLLMFallback,
  logDoclingSkip,
  getDoclingFallbackStrategy,
} = require("../config/embeddingConfig");
const SupabaseChunkStorage = require("../services/supabaseChunkStorage");

// Legacy services for fallback
const RelationshipChunkingService = require("../services/relationshipChunkingService");

// Import existing models for backward compatibility
const ChatbotKnowledge = require("../models/ChatbotKnowledge");
const Chatbot = require("../models/Chatbot");

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

const fileFilter = (req, file, cb) => {
  // Accept pdf, doc, docx, txt, html, pptx files
  const allowedFileTypes = [".pdf", ".doc", ".docx", ".txt", ".html", ".pptx"];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedFileTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid file type. Only PDF, DOC, DOCX, TXT, HTML, and PPTX files are allowed."
      ),
      false
    );
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
});

// Initialize enhanced LLM-based services
const doclingService = new DoclingIntegrationService();
const llmChunkingService = new LLMChunkingService();
const llmMetadataService = new LLMMetadataService();
const enhancedEmbeddingService = new EmbeddingServiceWrapper();
const chunkStorage = new SupabaseChunkStorage();

// Legacy services for fallback
const legacyChunkingService = new RelationshipChunkingService();

/**
 * Advanced file upload endpoint with complete RAG processing
 * POST /api/chatbot-knowledge/advanced-upload
 */
router.post(
  "/advanced-upload",
  auth,
  upload.single("file"),
  CacheInvalidationMiddleware.warmCacheAfterUpload,
  async (req, res) => {
    const startTime = Date.now();
    let tempFilePath = null;

    try {
      console.log("🚀 Starting Advanced RAG File Upload Process");
      console.log("Request body:", req.body);
      console.log("Request file:", req.file);

      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: "No file uploaded",
        });
      }

      const {
        chatbotId,
        title,
        tags,
        useAdvancedRAG = "true",
        useLLMChunking = "true",
        chunkingMethod = "llm_based", // "llm_based" or "rule_based"
      } = req.body;

      if (!chatbotId || !title) {
        return res.status(400).json({
          success: false,
          error: "Chatbot ID and title are required",
        });
      }

      // Verify chatbot ownership
      const chatbot = await Chatbot.findOne({
        _id: chatbotId,
        userId: req.user.id,
      });

      if (!chatbot) {
        return res.status(404).json({
          success: false,
          error: "Chatbot not found or unauthorized",
        });
      }

      tempFilePath = req.file.path;
      const fileName = req.file.originalname;
      const fileSize = req.file.size;
      const fileType = path.extname(fileName).substring(1).toLowerCase();

      console.log(
        `📄 Processing file: ${fileName} (${fileSize} bytes, type: ${fileType})`
      );

      // Step 1: Create initial MongoDB record for backward compatibility
      let knowledge = await ChatbotKnowledge.findOne({ chatbotId });
      if (!knowledge) {
        knowledge = new ChatbotKnowledge({
          chatbotId,
          files: [],
          texts: [],
          qaItems: [],
          createdBy: req.user.id,
        });
      }

      // Add initial file entry
      const fileEntry = {
        title,
        fileType,
        fileName,
        fileSize,
        originalSize: fileSize,
        content: "",
        tags: tags ? JSON.parse(tags) : [],
        processingStatus: "processing",
        processingMethod: "advanced_rag",
        isActive: true,
      };

      knowledge.files.push(fileEntry);
      await knowledge.save();
      const fileId = knowledge.files[knowledge.files.length - 1]._id;

      console.log(`📝 Created MongoDB record with file ID: ${fileId}`);

      // Step 2: Process with LangChain Docling (conditional with fallback)
      console.log("🔧 Step 1: Processing document...");

      let doclingResult;
      let processingMethod = "unknown";
      let processingReason = "";

      // Check if Docling should be forced to fallback
      if (shouldForceLLMFallback()) {
        logDoclingSkip("Docling processing", "forced LLM fallback enabled");
        console.log("⏭️ Docling disabled - using LLM-based processing...");

        // Import LLM-based fallback processor
        const LLMDocumentProcessor = require("../services/llmDocumentProcessor");
        const llmProcessor = new LLMDocumentProcessor();

        doclingResult = await llmProcessor.processDocumentToMarkdown(
          tempFilePath,
          fileType,
          fileName,
          title,
          { chatbotId, reason: "Docling disabled" }
        );

        processingMethod = "llm_forced";
        processingReason = "Docling processing disabled";
        console.log(
          `✅ LLM processing complete: ${doclingResult.markdownContent.length} characters`
        );
      } else {
        // Try Docling processing (original logic preserved)
        try {
          console.log("🔄 Attempting Docling processing...");

          // Check if Docling service is available
          const isDoclingAvailable = await doclingService.isServiceAvailable();

          if (isDoclingAvailable) {
            doclingResult = await doclingService.processDocument(
              tempFilePath,
              fileType,
              "markdown"
            );

            if (!doclingResult.success) {
              throw new Error(
                `Docling processing failed: ${doclingResult.error}`
              );
            }

            processingMethod = "docling";
            processingReason = "Docling processing successful";
            console.log(
              `✅ Docling processing complete: ${doclingResult.markdownContent.length} characters`
            );
          } else {
            console.log(
              "⚠️ Docling service not available, using LLM-based fallback..."
            );

            // Import LLM-based fallback processor
            const LLMDocumentProcessor = require("../services/llmDocumentProcessor");
            const llmProcessor = new LLMDocumentProcessor();

            doclingResult = await llmProcessor.processDocumentToMarkdown(
              tempFilePath,
              fileType,
              fileName,
              title,
              { chatbotId, reason: "Docling service unavailable" }
            );

            processingMethod = "llm_service_unavailable";
            processingReason = "Docling service not available";
            console.log(
              `✅ LLM fallback processing complete: ${doclingResult.markdownContent.length} characters`
            );
          }
        } catch (doclingError) {
          console.log("⚠️ Docling processing failed, using LLM fallback...");

          try {
            // Import LLM-based fallback processor
            const LLMDocumentProcessor = require("../services/llmDocumentProcessor");
            const llmProcessor = new LLMDocumentProcessor();

            doclingResult = await llmProcessor.processDocumentToMarkdown(
              tempFilePath,
              fileType,
              fileName,
              title,
              { chatbotId, error: doclingError.message }
            );

            processingMethod = "llm_error_fallback";
            processingReason = `Docling failed: ${doclingError.message}`;
            console.log(
              `✅ LLM error fallback processing complete: ${doclingResult.markdownContent.length} characters`
            );
          } catch (llmError) {
            console.error("❌ Both Docling and LLM fallback failed:", llmError);
            throw new Error(
              `Document processing failed: Docling error: ${doclingError.message}, LLM fallback error: ${llmError.message}`
            );
          }
        }
      }

      // Update MongoDB with initial content
      await ChatbotKnowledge.updateOne(
        { chatbotId, "files._id": fileId },
        {
          $set: {
            "files.$.content": doclingResult.markdownContent.substring(
              0,
              10000
            ), // Store preview
            "files.$.processingStatus": "chunking",
            "files.$.doclingMetadata": doclingResult.metadata,
          },
        }
      );

      // Step 3: Create intelligent chunks using LLM or fallback to rule-based
      console.log(
        `🧩 Step 2: Creating chunks using ${chunkingMethod} method...`
      );

      let chunks;
      let chunkingMetadata = {};

      try {
        if (chunkingMethod === "llm_based" && useLLMChunking === "true") {
          // Use LLM-based intelligent chunking
          console.log("🤖 Using LLM-based intelligent chunking...");

          chunks = await llmChunkingService.processMarkdownToChunks(
            doclingResult.markdownContent,
            {
              ...doclingResult.metadata,
              documentId: `doc_${fileId}_${Date.now()}`,
              fileName,
              title,
            },
            {
              maxChunkSize: 800,
              minChunkSize: 100,
              overlapSize: 100,
              preserveStructure: true,
            }
          );

          chunkingMetadata = {
            method: "llm_based",
            llmModel: "gemini-1.5-pro",
            intelligentAnalysis: true,
          };

          console.log(
            `✅ Created ${chunks.length} LLM-based intelligent chunks`
          );
        } else {
          throw new Error("Fallback to rule-based chunking");
        }
      } catch (llmError) {
        console.warn(
          "⚠️ LLM chunking failed, falling back to rule-based:",
          llmError.message
        );

        // Fallback to rule-based chunking
        chunks = await legacyChunkingService.processMarkdownToChunks(
          doclingResult.markdownContent,
          doclingResult.metadata,
          {
            maxChunkSize: 800,
            minChunkSize: 100,
            overlapSize: 100,
            preserveStructure: true,
          }
        );

        chunkingMetadata = {
          method: "rule_based_fallback",
          llmError: llmError.message,
          fallbackReason: "LLM chunking failed",
        };

        console.log(`✅ Created ${chunks.length} rule-based chunks (fallback)`);
      }

      // Step 4: Extract metadata using LLM (if LLM chunking was used)
      let chunksWithMetadata = chunks;
      let metadataExtractionResult = {};

      if (chunkingMetadata.method === "llm_based") {
        try {
          console.log("🏷️ Step 3: Extracting metadata with LLM...");

          chunksWithMetadata = await llmMetadataService.processChunksMetadata(
            chunks,
            {
              ...doclingResult.metadata,
              documentId: `doc_${fileId}_${Date.now()}`,
              fileName,
              title,
            }
          );

          const successCount = chunksWithMetadata.filter(
            (c) => c.metadata?.llmProcessed
          ).length;
          metadataExtractionResult = {
            method: "llm_based",
            totalChunks: chunks.length,
            successfulExtractions: successCount,
            failedExtractions: chunks.length - successCount,
          };

          console.log(
            `✅ Extracted metadata for ${successCount}/${chunks.length} chunks`
          );
        } catch (metadataError) {
          console.warn(
            "⚠️ LLM metadata extraction failed:",
            metadataError.message
          );
          metadataExtractionResult = {
            method: "failed",
            error: metadataError.message,
          };
        }
      }

      // Step 5: Generate multi-embeddings for chunks (conditional)
      console.log("🎯 Step 4: Processing embeddings...");

      let chunksWithEmbeddings;
      let embeddingStatus = "skipped";
      let embeddingSuccessCount = 0;

      if (enhancedEmbeddingService.isEnabled()) {
        console.log("🔄 Generating multi-embeddings...");
        try {
          chunksWithEmbeddings =
            await enhancedEmbeddingService.generateBatchChunkEmbeddings(
              chunksWithMetadata
            );

          embeddingSuccessCount = chunksWithEmbeddings.filter(
            (c) => c.embeddingGenerated
          ).length;
          embeddingStatus = "completed";
          console.log(
            `✅ Generated embeddings for ${embeddingSuccessCount}/${chunksWithEmbeddings.length} chunks`
          );
        } catch (embeddingError) {
          console.warn(
            "⚠️ Multi-embedding generation failed, using chunks without embeddings:",
            embeddingError.message
          );
          chunksWithEmbeddings = chunksWithMetadata.map((chunk) => ({
            ...chunk,
            embeddingGenerated: false,
            embeddingSkipped: false,
            embeddingError: embeddingError.message,
          }));
          embeddingStatus = "failed";
        }
      } else {
        console.log("⏭️ Embeddings disabled - skipping embedding generation");
        chunksWithEmbeddings = chunksWithMetadata.map((chunk) => ({
          ...chunk,
          embeddingGenerated: false,
          embeddingSkipped: true,
          embeddingSkipReason: "embeddings disabled",
        }));
        embeddingStatus = "disabled";
      }

      // Update MongoDB status
      await ChatbotKnowledge.updateOne(
        { chatbotId, "files._id": fileId },
        {
          $set: {
            "files.$.processingStatus": "storing",
            "files.$.chunkCount": chunksWithEmbeddings.length,
            "files.$.chunkingMetadata": chunkingMetadata,
            "files.$.metadataExtraction": metadataExtractionResult,
          },
        }
      );

      // Step 6: Store enhanced chunks in Supabase
      console.log("🗄️ Step 5: Storing enhanced chunks in Supabase...");

      const documentId = `doc_${fileId}_${Date.now()}`;
      const storageResult = await chunkStorage.storeChunks(
        chunksWithEmbeddings,
        chatbotId,
        documentId
      );

      console.log(
        `✅ Stored ${storageResult.stored} chunks with ${storageResult.relationships} relationships`
      );
      console.log(
        `📊 Embeddings: ${storageResult.embeddings?.stored || 0} stored, ${
          storageResult.embeddings?.failed || 0
        } failed`
      );

      // Step 7: Update final status with enhanced metadata
      await ChatbotKnowledge.updateOne(
        { chatbotId, "files._id": fileId },
        {
          $set: {
            "files.$.processingStatus": "completed",
            "files.$.supabaseDocumentId": documentId,
            "files.$.chunksStored": storageResult.stored,
            "files.$.relationshipsCreated": storageResult.relationships,
            "files.$.embeddingsStored": storageResult.embeddings?.stored || 0,
            "files.$.embeddingsFailed": storageResult.embeddings?.failed || 0,
            "files.$.processingTime": Date.now() - startTime,
            "files.$.advancedRAGEnabled": true,
            "files.$.llmProcessingEnabled":
              chunkingMetadata.method === "llm_based",
            "files.$.embeddingStatus": embeddingStatus,
            "files.$.documentProcessingMethod": processingMethod,
            "files.$.documentProcessingReason": processingReason,
            "files.$.doclingEnabled": isDoclingEnabled(),
          },
        }
      );

      // Clean up temp file
      if (tempFilePath && fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }

      // Get updated knowledge for response
      const updatedKnowledge = await ChatbotKnowledge.findOne({ chatbotId });

      const processingTime = Date.now() - startTime;
      console.log(`🎉 Advanced RAG upload completed in ${processingTime}ms`);

      res.status(201).json({
        success: true,
        message: "File processed with Enhanced LLM-based RAG successfully",
        knowledge: updatedKnowledge,
        processingDetails: {
          method: "enhanced_llm_rag",
          doclingProcessing: {
            success: doclingResult.success,
            method: processingMethod,
            reason: processingReason,
            contentLength: doclingResult.markdownContent.length,
            metadata: doclingResult.metadata,
            doclingEnabled: isDoclingEnabled(),
            forcedLLMFallback: shouldForceLLMFallback(),
          },
          chunking: {
            chunksCreated: chunksWithEmbeddings.length,
            chunkingMethod: chunkingMetadata.method,
            llmModel: chunkingMetadata.llmModel,
            intelligentAnalysis: chunkingMetadata.intelligentAnalysis,
          },
          metadataExtraction: metadataExtractionResult,
          embeddings: {
            status: embeddingStatus,
            method:
              embeddingStatus === "disabled" ? "disabled" : "multi_embedding",
            totalGenerated: storageResult.embeddings?.stored || 0,
            failed: storageResult.embeddings?.failed || 0,
            skipped:
              embeddingStatus === "disabled" ? chunksWithEmbeddings.length : 0,
            types:
              embeddingStatus === "disabled"
                ? []
                : [
                    "content",
                    "topics",
                    "keywords",
                    "heading_context",
                    "document_section",
                    "audience",
                    "question_type",
                  ],
          },
          storage: {
            chunksStored: storageResult.stored,
            relationshipsCreated: storageResult.relationships,
            supabaseDocumentId: documentId,
          },
          processingTime: processingTime,
          embeddingStatus: embeddingStatus,
          llmProcessingEnabled: chunkingMetadata.method === "llm_based",
        },
      });
    } catch (error) {
      console.error("❌ Error in advanced file upload:", error);

      // Clean up temp file
      if (tempFilePath && fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }

      // Update MongoDB with error status if we have a file ID
      if (req.body.chatbotId) {
        try {
          await ChatbotKnowledge.updateOne(
            {
              chatbotId: req.body.chatbotId,
              "files.processingStatus": "processing",
            },
            {
              $set: {
                "files.$.processingStatus": "failed",
                "files.$.processingError": error.message,
                "files.$.processingTime": Date.now() - startTime,
              },
            }
          );
        } catch (updateError) {
          console.error("Error updating failure status:", updateError);
        }
      }

      res.status(500).json({
        success: false,
        error: "Advanced RAG processing failed",
        message: error.message,
        processingTime: Date.now() - startTime,
      });
    }
  }
);

/**
 * Get cache statistics for monitoring
 * GET /api/chatbot-knowledge/cache-stats/:chatbotId
 */
router.get("/cache-stats/:chatbotId", auth, async (req, res) => {
  try {
    const { chatbotId } = req.params;

    // Verify chatbot ownership
    const chatbot = await Chatbot.findOne({
      _id: chatbotId,
      userId: req.user.id,
    });

    if (!chatbot) {
      return res.status(404).json({
        success: false,
        error: "Chatbot not found or unauthorized",
      });
    }

    // Get cache statistics
    const cacheStats = await chunkStorage.getCacheStatistics();
    const chunkStats = await chunkStorage.getChunkStatistics(chatbotId);

    res.json({
      success: true,
      chatbotId,
      cacheStatistics: cacheStats,
      chunkStatistics: chunkStats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error getting cache statistics:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get cache statistics",
    });
  }
});

/**
 * Get processing status for a file
 * GET /api/chatbot-knowledge/processing-status/:chatbotId/:fileId
 */
router.get("/processing-status/:chatbotId/:fileId", auth, async (req, res) => {
  try {
    const { chatbotId, fileId } = req.params;

    // Verify chatbot ownership
    const chatbot = await Chatbot.findOne({
      _id: chatbotId,
      userId: req.user.id,
    });

    if (!chatbot) {
      return res.status(404).json({
        success: false,
        error: "Chatbot not found or unauthorized",
      });
    }

    // Get knowledge document
    const knowledge = await ChatbotKnowledge.findOne({ chatbotId });
    if (!knowledge) {
      return res.status(404).json({
        success: false,
        error: "Knowledge document not found",
      });
    }

    // Find the file
    const file = knowledge.files.id(fileId);
    if (!file) {
      return res.status(404).json({
        success: false,
        error: "File not found",
      });
    }

    res.json({
      success: true,
      fileId: fileId,
      status: {
        processingStatus: file.processingStatus,
        embeddingStatus: file.embeddingStatus,
        advancedRAGEnabled: file.advancedRAGEnabled,
        chunkCount: file.chunkCount,
        chunksStored: file.chunksStored,
        relationshipsCreated: file.relationshipsCreated,
        processingTime: file.processingTime,
        processingError: file.processingError,
        embeddingError: file.embeddingError,
      },
    });
  } catch (error) {
    console.error("Error getting processing status:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get processing status",
    });
  }
});

module.exports = router;
