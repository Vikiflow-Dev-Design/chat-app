// Enhanced Fallback System Example
// This shows how to add legacy document processing as a fallback

const { processDocument } = require('../utils/documentProcessor');

// Enhanced Docling fallback with legacy processing
async function enhancedDoclingFallback(tempFilePath, fileType, fileName, title) {
  try {
    // Try Docling first
    const doclingResult = await doclingService.processDocument(tempFilePath, fileType, 'markdown');
    if (doclingResult.success) {
      return doclingResult;
    }
  } catch (doclingError) {
    console.log('⚠️ Docling failed, trying legacy document processor...');
  }

  try {
    // Fallback to legacy document processor
    const extractedText = await processDocument(tempFilePath, fileType);
    
    if (extractedText && extractedText.trim().length > 0) {
      console.log('✅ Legacy document processing successful');
      
      return {
        success: true,
        markdownContent: `# ${title}

${extractedText}

---
*Processed with legacy document processor*`,
        metadata: {
          processing_method: 'legacy_fallback',
          original_filename: fileName,
          file_type: fileType,
          content_length: extractedText.length,
          processed_at: new Date().toISOString()
        }
      };
    }
  } catch (legacyError) {
    console.log('⚠️ Legacy processing also failed, using placeholder...');
  }

  // Final fallback - placeholder content
  const placeholderContent = `# ${title}

This document could not be processed automatically.
File: ${fileName}
Type: ${fileType}

## Manual Processing Required
Please consider:
1. Converting the file to a supported format (PDF, DOCX, TXT)
2. Extracting the text manually and uploading as text content
3. Checking if the file is corrupted or password-protected

---
*Placeholder content generated at ${new Date().toISOString()}*`;

  return {
    success: true,
    markdownContent: placeholderContent,
    metadata: {
      processing_method: 'placeholder',
      original_filename: fileName,
      file_type: fileType,
      requires_manual_processing: true,
      processed_at: new Date().toISOString()
    }
  };
}

// Enhanced search fallback with multiple strategies
async function enhancedSearchFallback(query, chatbotId) {
  console.log(`🔍 Enhanced search fallback for: "${query}"`);

  // Strategy 1: Try Advanced RAG
  try {
    const advancedResult = await tryAdvancedRAGSearch(query, chatbotId);
    if (advancedResult) {
      console.log('✅ Advanced RAG search successful');
      return advancedResult;
    }
  } catch (error) {
    console.log('⚠️ Advanced RAG search failed:', error.message);
  }

  // Strategy 2: Try MongoDB text search
  try {
    const mongoResult = await fallbackTextSearch(query, chatbotId);
    if (mongoResult) {
      console.log('✅ MongoDB text search successful');
      return mongoResult;
    }
  } catch (error) {
    console.log('⚠️ MongoDB search failed:', error.message);
  }

  // Strategy 3: Try fuzzy matching
  try {
    const fuzzyResult = await fuzzyMatchSearch(query, chatbotId);
    if (fuzzyResult) {
      console.log('✅ Fuzzy matching successful');
      return fuzzyResult;
    }
  } catch (error) {
    console.log('⚠️ Fuzzy matching failed:', error.message);
  }

  // Strategy 4: Return helpful message
  console.log('📭 No results found with any search strategy');
  return null;
}

// Fuzzy matching fallback
async function fuzzyMatchSearch(query, chatbotId) {
  const ChatbotKnowledge = require('../models/ChatbotKnowledge');
  
  const knowledge = await ChatbotKnowledge.findOne({ chatbotId });
  if (!knowledge) return null;

  const queryWords = query.toLowerCase().split(' ').filter(word => word.length > 2);
  const searchableContent = [];

  // Search with partial word matching
  knowledge.files.forEach(file => {
    if (file.isActive && file.content) {
      const content = file.content.toLowerCase();
      const matchCount = queryWords.filter(word => content.includes(word)).length;
      
      if (matchCount > 0) {
        searchableContent.push({
          pageContent: file.content,
          metadata: {
            title: file.title,
            sourceType: 'file',
            matchScore: matchCount / queryWords.length
          }
        });
      }
    }
  });

  // Sort by match score and return top results
  searchableContent.sort((a, b) => b.metadata.matchScore - a.metadata.matchScore);
  
  return searchableContent.length > 0 ? 
    formatDocumentsAsString(searchableContent.slice(0, 2)) : null;
}

// Error handling with graceful degradation
async function gracefulErrorHandling(error, context) {
  console.error(`Error in ${context}:`, error);

  // Log error details for debugging
  const errorDetails = {
    context: context,
    error: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString()
  };

  // You could save this to a log file or database
  console.log('Error details:', JSON.stringify(errorDetails, null, 2));

  // Return appropriate fallback response based on context
  switch (context) {
    case 'document_processing':
      return {
        success: false,
        message: 'Document processing failed. Please try uploading a different format.',
        suggestions: ['Convert to PDF or TXT', 'Check file size', 'Verify file is not corrupted']
      };

    case 'search':
      return {
        success: false,
        message: 'Search temporarily unavailable. Please try again later.',
        suggestions: ['Rephrase your question', 'Try simpler keywords', 'Contact support']
      };

    case 'embedding_generation':
      return {
        success: false,
        message: 'AI processing temporarily unavailable.',
        suggestions: ['Content saved but search may be limited', 'Try again later']
      };

    default:
      return {
        success: false,
        message: 'An unexpected error occurred. Please try again.',
        suggestions: ['Refresh the page', 'Contact support if problem persists']
      };
  }
}

module.exports = {
  enhancedDoclingFallback,
  enhancedSearchFallback,
  fuzzyMatchSearch,
  gracefulErrorHandling
};
