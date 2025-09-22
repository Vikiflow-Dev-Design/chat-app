/**
 * Utility functions for processing and extracting information from knowledge documents
 * Updated to include LangChain Docling integration
 */
const fs = require("fs");
const path = require("path"); // Used in processDocument function
const pdf = require("pdf-parse");
const mammoth = require("mammoth");
const DoclingIntegrationService = require("../services/doclingIntegrationService");

/**
 * Extract text from a PDF file and aggressively optimize it
 * @param {Buffer} fileBuffer - The PDF file buffer
 * @returns {Promise<string>} - The aggressively optimized text
 */
const extractTextFromPDF = async (fileBuffer) => {
  try {
    const data = await pdf(fileBuffer);

    // Apply aggressive optimization
    return aggressivelyOptimizeText(data.text);
  } catch (error) {
    console.error("Error extracting text from PDF:", error);
    throw new Error("Failed to extract text from PDF");
  }
};

/**
 * Aggressively optimize text content to significantly reduce size
 * @param {string} text - Original text content
 * @returns {string} - Highly optimized text content with minimal formatting
 */
function aggressivelyOptimizeText(text) {
  if (!text) return "";

  return (
    text
      // Remove all line breaks and replace with a single space
      .replace(/\r?\n|\r/g, " ")

      // Remove all tabs
      .replace(/\t/g, " ")

      // Remove multiple spaces (including non-breaking spaces)
      .replace(/[ \u00A0]+/g, " ")

      // Remove spaces around punctuation
      .replace(/ ([.,;:!?)])/g, "$1")
      .replace(/([({]) /g, "$1")

      // Remove spaces before and after hyphens
      .replace(/ - /g, "-")

      // Remove spaces around slashes
      .replace(/ \/ /g, "/")

      // Remove spaces around equals signs
      .replace(/ = /g, "=")

      // Remove spaces around plus signs
      .replace(/ \+ /g, "+")

      // Remove spaces around asterisks
      .replace(/ \* /g, "*")

      // Remove spaces around ampersands
      .replace(/ & /g, "&")

      // Remove spaces around dollar signs
      .replace(/\$ /g, "$")

      // Remove spaces around percentage signs
      .replace(/ %/g, "%")

      // Remove spaces around bullet points
      .replace(/● /g, "●")

      // Trim the entire text
      .trim()
  );
}

/**
 * Extract text from a DOCX file and aggressively optimize it
 * @param {Buffer} fileBuffer - The DOCX file buffer
 * @returns {Promise<string>} - The aggressively optimized text
 */
const extractTextFromDOCX = async (fileBuffer) => {
  try {
    const result = await mammoth.extractRawText({ buffer: fileBuffer });

    // Apply aggressive optimization
    return aggressivelyOptimizeText(result.value);
  } catch (error) {
    console.error("Error extracting text from DOCX:", error);
    throw new Error("Failed to extract text from DOCX");
  }
};

/**
 * Extract text from a TXT file and aggressively optimize it
 * @param {Buffer} fileBuffer - The TXT file buffer
 * @returns {string} - The aggressively optimized text
 */
const extractTextFromTXT = (fileBuffer) => {
  try {
    const text = fileBuffer.toString("utf8");

    // Apply aggressive optimization
    return aggressivelyOptimizeText(text);
  } catch (error) {
    console.error("Error extracting text from TXT:", error);
    throw new Error("Failed to extract text from TXT");
  }
};

/**
 * Process a document file using LangChain Docling and extract markdown content
 * @param {string} filePath - Path to the file
 * @param {string} fileType - Type of the file (pdf, docx, txt)
 * @param {string} exportType - Export type: "markdown" or "chunks"
 * @returns {Promise<Object>} - The processing result with markdown content and metadata
 */
const processDocumentWithDocling = async (
  filePath,
  fileType,
  exportType = "markdown"
) => {
  try {
    console.log(
      `Processing document with LangChain Docling: ${filePath}, type: ${fileType}, export: ${exportType}`
    );

    const doclingService = new DoclingIntegrationService();

    // Check if LangChain Docling service is available
    const isAvailable = await doclingService.isServiceAvailable();
    if (!isAvailable) {
      console.warn(
        "LangChain Docling service not available, falling back to legacy processing"
      );
      return await processDocumentLegacy(filePath, fileType);
    }

    // Check if file type is supported by LangChain Docling
    if (!doclingService.isFileTypeSupported(fileType)) {
      console.warn(
        `File type ${fileType} not supported by LangChain Docling, falling back to legacy processing`
      );
      return await processDocumentLegacy(filePath, fileType);
    }

    // Process with LangChain Docling
    const result = await doclingService.processDocument(
      filePath,
      fileType,
      exportType
    );

    if (!result.success || !result.markdownContent) {
      throw new Error(
        "LangChain Docling processing failed or returned empty content"
      );
    }

    console.log(
      `LangChain Docling processing successful. Markdown length: ${result.markdownContent.length}`
    );
    console.log(`Document metadata:`, result.metadata);

    return {
      content: result.markdownContent,
      metadata: result.metadata,
      chunks: result.chunks,
      processingMethod: "langchain_docling",
      exportType: result.exportType,
      processedAt: result.processedAt,
    };
  } catch (error) {
    console.error("Error processing document with LangChain Docling:", error);
    console.log("Falling back to legacy document processing");
    return await processDocumentLegacy(filePath, fileType);
  }
};

/**
 * Legacy document processing function (fallback)
 * @param {string} filePath - Path to the file
 * @param {string} fileType - Type of the file (pdf, docx, txt)
 * @returns {Promise<Object>} - The extracted text and basic metadata
 */
const processDocumentLegacy = async (filePath, fileType) => {
  try {
    console.log(
      `Processing document with legacy method: ${filePath}, type: ${fileType}`
    );

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.error(`File does not exist at path: ${filePath}`);
      throw new Error(`File not found: ${filePath}`);
    }

    // Get file stats
    const stats = fs.statSync(filePath);
    console.log(`File size: ${stats.size} bytes`);

    if (stats.size === 0) {
      console.error("File is empty");
      throw new Error("File is empty");
    }

    // Read file buffer
    const fileBuffer = fs.readFileSync(filePath);
    console.log(`File buffer read, length: ${fileBuffer.length} bytes`);

    let extractedText = "";

    // Process based on file type
    switch (fileType.toLowerCase()) {
      case "pdf":
        console.log("Extracting text from PDF");
        extractedText = await extractTextFromPDF(fileBuffer);
        break;
      case "docx":
      case "doc":
        console.log("Extracting text from DOCX/DOC");
        extractedText = await extractTextFromDOCX(fileBuffer);
        break;
      case "txt":
        console.log("Extracting text from TXT");
        extractedText = extractTextFromTXT(fileBuffer);
        break;
      default:
        console.error(`Unsupported file type: ${fileType}`);
        throw new Error(`Unsupported file type: ${fileType}`);
    }

    console.log(
      `Text extracted successfully, length: ${extractedText.length} characters`
    );

    if (!extractedText || extractedText.trim().length === 0) {
      console.error("No text extracted from document");
      throw new Error("No text could be extracted from the document");
    }

    return {
      content: extractedText,
      metadata: {
        file_type: fileType,
        file_size: stats.size,
        processing_method: "legacy",
        word_count: extractedText.split(/\s+/).length,
        character_count: extractedText.length,
      },
      processingMethod: "legacy",
      processedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error processing document:", error);
    throw new Error(`Failed to process document: ${error.message}`);
  }
};

/**
 * Process a document file and extract text (backward compatible)
 * @param {string} filePath - Path to the file
 * @param {string} fileType - Type of the file (pdf, docx, txt)
 * @returns {Promise<string>} - The extracted text
 */
const processDocument = async (filePath, fileType) => {
  try {
    console.log(`Processing document: ${filePath}, type: ${fileType}`);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.error(`File does not exist at path: ${filePath}`);
      throw new Error(`File not found: ${filePath}`);
    }

    // Get file stats
    const stats = fs.statSync(filePath);
    console.log(`File size: ${stats.size} bytes`);

    if (stats.size === 0) {
      console.error("File is empty");
      throw new Error("File is empty");
    }

    // Read file buffer
    const fileBuffer = fs.readFileSync(filePath);
    console.log(`File buffer read, length: ${fileBuffer.length} bytes`);

    let extractedText = "";

    // Process based on file type
    switch (fileType.toLowerCase()) {
      case "pdf":
        console.log("Extracting text from PDF");
        extractedText = await extractTextFromPDF(fileBuffer);
        break;
      case "docx":
      case "doc":
        console.log("Extracting text from DOCX/DOC");
        extractedText = await extractTextFromDOCX(fileBuffer);
        break;
      case "txt":
        console.log("Extracting text from TXT");
        extractedText = extractTextFromTXT(fileBuffer);
        break;
      default:
        console.error(`Unsupported file type: ${fileType}`);
        throw new Error(`Unsupported file type: ${fileType}`);
    }

    console.log(
      `Text extraction complete. Extracted ${extractedText.length} characters`
    );

    // If no text was extracted, return a message
    if (!extractedText || extractedText.trim().length === 0) {
      console.warn("No text was extracted from the document");
      return "No text could be extracted from this document.";
    }

    return extractedText;
  } catch (error) {
    console.error("Error processing document:", error);
    throw error;
  }
};

// Function to extract key information from document content
async function extractKeyInformation(content, sourceType, fileType = null) {
  try {
    console.log(`Extracting key information from ${sourceType} source`);
    if (fileType) {
      console.log(`File type: ${fileType}`);
    }

    // For simple text documents, just return the content as is
    if (sourceType === "text") {
      console.log("Processing as text source");
      return content;
    }

    // For Q&A documents, parse and format as Q&A pairs
    if (sourceType === "qa") {
      console.log("Processing as Q&A source");
      return processFAQDocument(content);
    }

    // For file documents, we would use AI to extract key information
    if (sourceType === "file") {
      console.log("Processing as file source");
      const result = await processDocumentWithAI(content);
      console.log(
        `Processed document with AI, result length: ${result.length} characters`
      );
      return result;
    }

    // Default fallback
    console.log("Using default processing");
    return content;
  } catch (error) {
    console.error("Error extracting information from document:", error);
    return content; // Fallback to original content if processing fails
  }
}

// Process FAQ document (assumes format with Q: and A: prefixes)
function processFAQDocument(content) {
  try {
    const lines = content.split("\n");
    let formattedFAQ = "";
    let currentQuestion = "";

    for (const line of lines) {
      const trimmedLine = line.trim();

      if (trimmedLine.startsWith("Q:") || trimmedLine.startsWith("Question:")) {
        // If we already have a question, add a separator before the new one
        if (currentQuestion) {
          formattedFAQ += "\n---\n";
        }

        currentQuestion = trimmedLine;
        formattedFAQ += currentQuestion + "\n";
      } else if (
        trimmedLine.startsWith("A:") ||
        trimmedLine.startsWith("Answer:")
      ) {
        formattedFAQ += trimmedLine + "\n";
      } else if (trimmedLine) {
        // Add non-empty lines to the formatted content
        formattedFAQ += trimmedLine + "\n";
      }
    }

    return formattedFAQ;
  } catch (error) {
    console.error("Error processing FAQ document:", error);
    return content;
  }
}

// Process document using AI (simplified version)
async function processDocumentWithAI(content) {
  // In a production environment, this would call an AI API like Gemini
  // to extract key information, summarize, and structure the content
  console.log("Processing document with AI (simplified version)");
  console.log(`Input content length: ${content.length} characters`);

  // For now, we'll just do some aggressive processing
  try {
    // Apply aggressive optimization
    const result = aggressivelyOptimizeText(content);

    console.log(`Final processed content length: ${result.length} characters`);

    return result;
  } catch (error) {
    console.error("Error in AI document processing:", error);
    return content;
  }
}

// Function to search knowledge base for relevant information
async function searchKnowledgeBase(query, chatbotId, KnowledgeDocument) {
  try {
    // Search for documents matching the query
    const documents = await KnowledgeDocument.find({
      chatbotId,
      isActive: true,
      $text: { $search: query },
    })
      .sort({ score: { $meta: "textScore" } })
      .limit(3);

    if (documents.length === 0) {
      return null;
    }

    // Format the results
    let knowledgeContext = "Information from knowledge base:\n\n";

    documents.forEach((doc, index) => {
      knowledgeContext += `[Source ${index + 1}: ${doc.title}]\n`;

      if (doc.sourceType === "qa") {
        // For Q&A documents, include relevant Q&A pairs
        const relevantQAs =
          doc.qaItems &&
          doc.qaItems
            .filter(
              (qa) =>
                qa.question.toLowerCase().includes(query.toLowerCase()) ||
                qa.answer.toLowerCase().includes(query.toLowerCase())
            )
            .slice(0, 2);

        if (relevantQAs && relevantQAs.length > 0) {
          relevantQAs.forEach((qa) => {
            knowledgeContext += `Q: ${qa.question}\nA: ${qa.answer}\n\n`;
          });
        } else if (doc.content) {
          knowledgeContext += `${doc.content.substring(0, 300)}${
            doc.content.length > 300 ? "..." : ""
          }\n\n`;
        }
      } else {
        // For text and file documents, include the extracted information or content
        const content = doc.extractedInformation || doc.content;
        if (content) {
          knowledgeContext += `${content.substring(0, 300)}${
            content.length > 300 ? "..." : ""
          }\n\n`;
        }
      }
    });

    return knowledgeContext;
  } catch (error) {
    console.error("Error searching knowledge base:", error);
    return null;
  }
}

module.exports = {
  extractKeyInformation,
  searchKnowledgeBase,
  processDocument,
  processDocumentWithDocling,
  processDocumentLegacy,
  extractTextFromPDF,
  extractTextFromDOCX,
  extractTextFromTXT,
};
