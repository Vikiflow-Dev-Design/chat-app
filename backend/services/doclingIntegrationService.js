/**
 * LangChain Docling Integration Service
 * Interfaces with the Python LangChain Docling service for document processing
 */

const fs = require('fs');
const FormData = require('form-data');
const fetch = require('node-fetch');

class DoclingIntegrationService {
  constructor() {
    this.doclingServiceUrl = process.env.DOCLING_SERVICE_URL || 'http://localhost:8001';
    this.timeout = 60000; // 60 seconds timeout for document processing
  }

  /**
   * Process a document file using LangChain Docling service
   * @param {string} filePath - Path to the document file
   * @param {string} fileType - Type of the document (pdf, docx, etc.)
   * @param {string} exportType - Export type: "markdown" or "chunks"
   * @returns {Promise<Object>} Processing result with markdown content and metadata
   */
  async processDocument(filePath, fileType, exportType = 'markdown') {
    try {
      console.log(`Processing document with LangChain Docling: ${filePath} (type: ${fileType}, export: ${exportType})`);

      // Check if file exists
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }

      // Create form data for file upload
      const formData = new FormData();
      const fileStream = fs.createReadStream(filePath);
      formData.append('file', fileStream);
      formData.append('export_type', exportType);

      // Make request to LangChain Docling service
      const response = await fetch(`${this.doclingServiceUrl}/process-document`, {
        method: 'POST',
        body: formData,
        timeout: this.timeout,
        headers: {
          ...formData.getHeaders(),
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`LangChain Docling service error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(`Document processing failed: ${result.error}`);
      }

      console.log(`Document processed successfully. Markdown length: ${result.markdown_content.length}`);
      console.log(`Processing method: ${result.metadata.processing_method}`);
      console.log(`Export type: ${result.metadata.export_type}`);

      return {
        success: true,
        markdownContent: result.markdown_content,
        metadata: result.metadata,
        chunks: result.chunks || null,
        originalFileType: fileType,
        exportType: exportType,
        processedAt: new Date().toISOString(),
      };

    } catch (error) {
      console.error('Error in LangChain Docling document processing:', error);
      throw new Error(`Failed to process document with LangChain Docling: ${error.message}`);
    }
  }

  /**
   * Process document by file path (alternative method)
   * @param {string} filePath - Path to the document file
   * @param {string} fileType - Type of the document
   * @param {string} exportType - Export type: "markdown" or "chunks"
   * @returns {Promise<Object>} Processing result
   */
  async processDocumentByPath(filePath, fileType, exportType = 'markdown') {
    try {
      const response = await fetch(`${this.doclingServiceUrl}/process-document-path`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          file_path: filePath,
          export_type: exportType,
        }),
        timeout: this.timeout,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`LangChain Docling service error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(`Document processing failed: ${result.error}`);
      }

      return {
        success: true,
        markdownContent: result.markdown_content,
        metadata: result.metadata,
        chunks: result.chunks || null,
        originalFileType: fileType,
        exportType: exportType,
        processedAt: new Date().toISOString(),
      };

    } catch (error) {
      console.error('Error in LangChain Docling document processing by path:', error);
      throw new Error(`Failed to process document with LangChain Docling: ${error.message}`);
    }
  }

  /**
   * Process document and return chunks for advanced RAG workflow
   * @param {string} filePath - Path to the document file
   * @param {string} fileType - Type of the document
   * @returns {Promise<Object>} Processing result with chunks
   */
  async processDocumentForRAG(filePath, fileType) {
    return await this.processDocument(filePath, fileType, 'chunks');
  }

  /**
   * Check if LangChain Docling service is available
   * @returns {Promise<boolean>} Service availability status
   */
  async isServiceAvailable() {
    try {
      const response = await fetch(`${this.doclingServiceUrl}/health`, {
        method: 'GET',
        timeout: 5000, // 5 second timeout for health check
      });

      return response.ok;
    } catch (error) {
      console.warn('LangChain Docling service is not available:', error.message);
      return false;
    }
  }

  /**
   * Get supported file formats from LangChain Docling service
   * @returns {Promise<Object>} Supported formats and export types
   */
  async getSupportedFormats() {
    try {
      const response = await fetch(`${this.doclingServiceUrl}/supported-formats`, {
        method: 'GET',
        timeout: 5000,
      });

      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.warn('Could not fetch supported formats:', error.message);
    }

    // Fallback to default supported formats
    return {
      supported_formats: ['.pdf', '.docx', '.doc', '.pptx', '.html', '.txt'],
      export_types: ['markdown', 'chunks'],
      description: 'LangChain Docling integration supports various document formats'
    };
  }

  /**
   * Validate if file type is supported
   * @param {string} fileType - File type to validate
   * @returns {boolean} Whether the file type is supported
   */
  isFileTypeSupported(fileType) {
    const normalizedType = fileType.toLowerCase();
    const supportedFormats = ['.pdf', '.docx', '.doc', '.pptx', '.html', '.txt'];
    
    // Add dot if not present
    const typeWithDot = normalizedType.startsWith('.') ? normalizedType : `.${normalizedType}`;
    
    return supportedFormats.includes(typeWithDot);
  }

  /**
   * Extract document statistics from markdown content
   * @param {string} markdownContent - Markdown content to analyze
   * @returns {Object} Document statistics
   */
  extractDocumentStats(markdownContent) {
    try {
      const lines = markdownContent.split('\n');
      const headings = lines.filter(line => line.trim().startsWith('#'));
      const tables = (markdownContent.match(/\|.*\|/g) || []).length;
      const codeBlocks = (markdownContent.match(/```/g) || []).length / 2;
      const links = (markdownContent.match(/\[.*\]\(.*\)/g) || []).length;
      
      return {
        totalLines: lines.length,
        headingCount: headings.length,
        tableCount: Math.floor(tables / 3), // Rough estimate
        codeBlockCount: Math.floor(codeBlocks),
        linkCount: links,
        wordCount: markdownContent.split(/\s+/).length,
        characterCount: markdownContent.length,
      };
    } catch (error) {
      console.warn('Error extracting document stats:', error);
      return {};
    }
  }

  /**
   * Get service information
   * @returns {Object} Service information
   */
  getServiceInfo() {
    return {
      serviceName: 'LangChain Docling Integration Service',
      serviceUrl: this.doclingServiceUrl,
      timeout: this.timeout,
      integration: 'langchain-docling',
      supportedExportTypes: ['markdown', 'chunks']
    };
  }
}

module.exports = DoclingIntegrationService;
