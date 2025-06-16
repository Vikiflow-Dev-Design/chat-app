/**
 * Test script for LangChain Docling integration
 * Tests the connection between Node.js backend and Python LangChain Docling service
 */

require('dotenv').config();
const DoclingIntegrationService = require('./services/doclingIntegrationService');
const { processDocumentWithDocling } = require('./utils/documentProcessor');
const fs = require('fs');
const path = require('path');

async function testLangChainDoclingIntegration() {
  console.log('🧪 Testing LangChain Docling Integration\n');

  const doclingService = new DoclingIntegrationService();

  // Test 1: Check service availability
  console.log('1. Testing LangChain Docling service availability...');
  try {
    const isAvailable = await doclingService.isServiceAvailable();
    if (isAvailable) {
      console.log('✅ LangChain Docling service is available\n');
    } else {
      console.log('❌ LangChain Docling service is not available');
      console.log('Please start the LangChain Docling service first:');
      console.log('cd python-services && python docling_service.py\n');
      return;
    }
  } catch (error) {
    console.log('❌ Error checking service availability:', error.message);
    return;
  }

  // Test 2: Check supported formats
  console.log('2. Testing supported file formats...');
  try {
    const supportedInfo = await doclingService.getSupportedFormats();
    console.log('✅ Supported formats:', supportedInfo.supported_formats.join(', '));
    console.log('✅ Export types:', supportedInfo.export_types.join(', '));
    console.log('✅ Description:', supportedInfo.description);
    
    // Test format validation
    console.log('✅ PDF supported:', doclingService.isFileTypeSupported('pdf'));
    console.log('✅ DOCX supported:', doclingService.isFileTypeSupported('docx'));
    console.log('✅ TXT supported:', doclingService.isFileTypeSupported('txt'));
    console.log('❌ XYZ supported:', doclingService.isFileTypeSupported('xyz'));
    console.log();
  } catch (error) {
    console.log('❌ Error checking supported formats:', error.message);
    console.log();
  }

  // Test 3: Create a test document
  console.log('3. Creating test document...');
  const testDir = path.join(__dirname, 'test-files');
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }

  const testFilePath = path.join(testDir, 'test-document.txt');
  const testContent = `# Test Document for LangChain Docling

This is a test document for LangChain Docling integration.

## Features

- Advanced document parsing with LangChain integration
- Markdown conversion with structure preservation
- Chunk-based processing for RAG workflows
- Rich metadata extraction

## Table Example

| Feature | Status | Integration |
|---------|--------|-------------|
| PDF Support | ✅ | LangChain Docling |
| DOCX Support | ✅ | LangChain Docling |
| Markdown Output | ✅ | Native |
| Chunk Processing | ✅ | Advanced |

## Code Example

\`\`\`javascript
const loader = new DoclingLoader({
  file_path: "document.pdf",
  export_type: ExportType.MARKDOWN
});
const docs = loader.load();
\`\`\`

## Conclusion

This document tests the LangChain Docling integration functionality with enhanced capabilities.`;

  fs.writeFileSync(testFilePath, testContent);
  console.log('✅ Test document created:', testFilePath);
  console.log();

  // Test 4: Process document with markdown export
  console.log('4. Testing document processing (Markdown export)...');
  try {
    const result = await doclingService.processDocument(testFilePath, 'txt', 'markdown');
    
    console.log('✅ Document processed successfully!');
    console.log('📄 Processing method:', result.metadata.processing_method);
    console.log('📄 Export type:', result.exportType);
    console.log('📊 Content length:', result.markdownContent.length);
    console.log('🏷️  Metadata keys:', Object.keys(result.metadata).join(', '));
    console.log();
    
    // Show first 200 characters of content
    console.log('📝 Content preview (Markdown):');
    console.log(result.markdownContent.substring(0, 200) + '...');
    console.log();

  } catch (error) {
    console.log('❌ Error processing document (Markdown):', error.message);
    console.log();
  }

  // Test 5: Process document with chunks export
  console.log('5. Testing document processing (Chunks export)...');
  try {
    const result = await doclingService.processDocumentForRAG(testFilePath, 'txt');
    
    console.log('✅ Document processed successfully with chunks!');
    console.log('📄 Processing method:', result.metadata.processing_method);
    console.log('📄 Export type:', result.exportType);
    console.log('📊 Total chunks:', result.chunks ? result.chunks.length : 0);
    console.log('📊 Content length:', result.markdownContent.length);
    console.log();
    
    // Show chunk information
    if (result.chunks && result.chunks.length > 0) {
      console.log('📦 Chunk information:');
      result.chunks.slice(0, 3).forEach((chunk, index) => {
        console.log(`  Chunk ${index + 1}:`);
        console.log(`    Content length: ${chunk.content.length}`);
        console.log(`    Preview: ${chunk.content.substring(0, 100)}...`);
        console.log(`    Metadata keys: ${Object.keys(chunk.metadata).join(', ')}`);
      });
      if (result.chunks.length > 3) {
        console.log(`  ... and ${result.chunks.length - 3} more chunks`);
      }
    }
    console.log();

  } catch (error) {
    console.log('❌ Error processing document (Chunks):', error.message);
    console.log();
  }

  // Test 6: Test document statistics
  console.log('6. Testing document statistics...');
  try {
    const testMarkdown = `# Sample Document\n\nThis is a test.\n\n## Section\n\n| Col1 | Col2 |\n|------|------|\n| A | B |\n\n[Link](http://example.com)\n\n\`\`\`javascript\nconst test = "code";\n\`\`\``;
    const stats = doclingService.extractDocumentStats(testMarkdown);
    
    console.log('✅ Document statistics extracted:');
    console.log('📊 Stats:', JSON.stringify(stats, null, 2));
    console.log();

  } catch (error) {
    console.log('❌ Error extracting stats:', error.message);
    console.log();
  }

  // Test 7: Test service information
  console.log('7. Testing service information...');
  try {
    const serviceInfo = doclingService.getServiceInfo();
    console.log('✅ Service information:');
    console.log('📋 Info:', JSON.stringify(serviceInfo, null, 2));
    console.log();
  } catch (error) {
    console.log('❌ Error getting service info:', error.message);
    console.log();
  }

  // Test 8: Test integration with document processor
  console.log('8. Testing integration with document processor...');
  try {
    const result = await processDocumentWithDocling(testFilePath, 'txt');
    
    console.log('✅ Document processor integration successful!');
    console.log('📄 Processing method:', result.processingMethod);
    console.log('📊 Content length:', result.content.length);
    console.log('🏷️  Metadata processing method:', result.metadata.processing_method);
    console.log();

  } catch (error) {
    console.log('❌ Error in document processor integration:', error.message);
    console.log();
  }

  // Cleanup
  console.log('9. Cleaning up...');
  try {
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
      console.log('✅ Test file cleaned up');
    }
    if (fs.existsSync(testDir) && fs.readdirSync(testDir).length === 0) {
      fs.rmdirSync(testDir);
      console.log('✅ Test directory cleaned up');
    }
  } catch (error) {
    console.log('⚠️  Cleanup warning:', error.message);
  }

  console.log('\n🎉 LangChain Docling integration test completed!');
  console.log('🔗 Integration: LangChain Docling');
  console.log('📦 Export modes: Markdown & Chunks');
  console.log('🚀 Ready for advanced RAG workflows!');
}

// Run the test
if (require.main === module) {
  testLangChainDoclingIntegration().catch(console.error);
}

module.exports = { testLangChainDoclingIntegration };
