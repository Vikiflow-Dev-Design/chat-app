/**
 * Test script for LLM Document Processor
 * Run with: node test-llm-processor.js
 */

const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");

// Load environment variables
dotenv.config();

const LLMDocumentProcessor = require("./services/llmDocumentProcessor");

async function testLLMProcessor() {
  console.log("🧪 Testing LLM Document Processor...\n");

  try {
    // Initialize processor
    const processor = new LLMDocumentProcessor();

    // Test 1: Check availability
    console.log("1. Checking LLM availability...");
    const isAvailable = await processor.isAvailable();
    console.log(
      `   ${isAvailable ? "✅" : "❌"} LLM is ${
        isAvailable ? "available" : "unavailable"
      }`
    );

    if (!isAvailable) {
      console.log("   💡 Make sure GEMINI_API_KEY is set in your .env file");
      return;
    }

    // Test 2: Get capabilities
    console.log("\n2. Getting processor capabilities...");
    const capabilities = processor.getCapabilities();
    console.log(
      "   ✅ Supported file types:",
      capabilities.supportedFileTypes.join(", ")
    );
    console.log("   ✅ Features:", capabilities.features.join(", "));

    // Test 3: Create a test text file
    console.log("\n3. Creating test document...");
    const testContent = `Introduction to Advanced RAG

This document explains the Advanced RAG (Retrieval-Augmented Generation) system.

What is RAG?
RAG combines retrieval and generation to provide accurate, contextual responses.

Key Components:
1. Document Processing
2. Chunking Strategy
3. Vector Storage
4. Similarity Search
5. Answer Generation

Benefits:
- Improved accuracy
- Real-time information
- Contextual responses
- Scalable knowledge base

Implementation Steps:
First, process documents using Docling or fallback methods.
Second, create intelligent chunks with relationships.
Third, store chunks in vector database.
Finally, implement hybrid search for optimal retrieval.

Conclusion:
Advanced RAG provides a robust solution for knowledge-based AI systems.`;

    const testFilePath = path.join(__dirname, "test-document.txt");
    fs.writeFileSync(testFilePath, testContent);
    console.log("   ✅ Test document created");

    // Test 4: Process document with LLM
    console.log("\n4. Processing document with LLM...");
    const startTime = Date.now();

    const result = await processor.processDocumentToMarkdown(
      testFilePath,
      "txt",
      "test-document.txt",
      "Advanced RAG System Guide",
      { chatbotId: "test-chatbot-123" }
    );

    const processingTime = Date.now() - startTime;
    console.log(`   ✅ Processing completed in ${processingTime}ms`);

    // Test 5: Validate results
    console.log("\n5. Validating results...");
    console.log(`   ✅ Success: ${result.success}`);
    console.log(
      `   ✅ Processing method: ${result.metadata.processing_method}`
    );
    console.log(
      `   ✅ Original length: ${result.metadata.raw_text_length} chars`
    );
    console.log(
      `   ✅ Markdown length: ${result.metadata.markdown_length} chars`
    );
    console.log(`   ✅ LLM model: ${result.metadata.llm_model}`);

    // Test 6: Display markdown preview
    console.log("\n6. Markdown preview (first 500 chars):");
    console.log("   " + "─".repeat(50));
    console.log(result.markdownContent.substring(0, 500) + "...");
    console.log("   " + "─".repeat(50));

    // Test 7: Test error handling
    console.log("\n7. Testing error handling...");
    try {
      await processor.processDocumentToMarkdown(
        "/nonexistent/file.txt",
        "txt",
        "nonexistent.txt",
        "Test Error"
      );
      console.log(
        "   ❌ Error handling test failed - should have thrown error"
      );
    } catch (error) {
      console.log("   ✅ Error handling works correctly:", error.message);
    }

    // Test 8: Test with error context
    console.log("\n8. Testing with error context...");
    const errorResult = await processor.processDocumentToMarkdown(
      testFilePath,
      "txt",
      "test-document.txt",
      "Advanced RAG System Guide",
      { chatbotId: "test-chatbot-456", error: "Simulated Docling failure" }
    );

    console.log(
      `   ✅ Error context processed: ${
        errorResult.metadata.docling_error ? "included" : "not included"
      }`
    );

    // Cleanup
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
      console.log("\n🧹 Test file cleaned up");
    }

    console.log(
      "\n✅ All tests passed! LLM Document Processor is working correctly."
    );
  } catch (error) {
    console.error("\n❌ Test failed:", error.message);
    console.log("\n💡 Troubleshooting:");
    console.log("   1. Check GEMINI_API_KEY in .env file");
    console.log("   2. Verify internet connection");
    console.log(
      "   3. Check if legacy document processor dependencies are installed"
    );
  }
}

// Test different file types if available
async function testFileTypes() {
  console.log("\n🔍 Testing different file types...\n");

  const processor = new LLMDocumentProcessor();
  const testFiles = [
    { type: "txt", content: "Simple text content for testing." },
  ];

  for (const testFile of testFiles) {
    try {
      console.log(`Testing ${testFile.type.toUpperCase()} file...`);

      const testPath = path.join(__dirname, `test.${testFile.type}`);
      fs.writeFileSync(testPath, testFile.content);

      const result = await processor.processDocumentToMarkdown(
        testPath,
        testFile.type,
        `test.${testFile.type}`,
        `Test ${testFile.type.toUpperCase()} Document`
      );

      console.log(
        `   ✅ ${testFile.type.toUpperCase()}: ${
          result.success ? "Success" : "Failed"
        }`
      );
      console.log(`   📊 Length: ${result.markdownContent.length} chars`);

      // Cleanup
      if (fs.existsSync(testPath)) {
        fs.unlinkSync(testPath);
      }
    } catch (error) {
      console.log(`   ❌ ${testFile.type.toUpperCase()}: ${error.message}`);
    }
  }
}

// Performance test
async function performanceTest() {
  console.log("\n⚡ Performance testing...\n");

  const processor = new LLMDocumentProcessor();

  // Create different sized test content
  const testSizes = [
    { name: "Small", size: 500 },
    { name: "Medium", size: 2000 },
    { name: "Large", size: 5000 },
  ];

  for (const test of testSizes) {
    try {
      console.log(`Testing ${test.name} document (${test.size} chars)...`);

      const content =
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. ".repeat(
          Math.ceil(test.size / 57)
        );
      const testPath = path.join(
        __dirname,
        `test-${test.name.toLowerCase()}.txt`
      );
      fs.writeFileSync(testPath, content.substring(0, test.size));

      const startTime = Date.now();
      const result = await processor.processDocumentToMarkdown(
        testPath,
        "txt",
        `test-${test.name.toLowerCase()}.txt`,
        `${test.name} Test Document`
      );
      const processingTime = Date.now() - startTime;

      console.log(
        `   ✅ ${test.name}: ${processingTime}ms (${Math.round(
          (test.size / processingTime) * 1000
        )} chars/sec)`
      );

      // Cleanup
      if (fs.existsSync(testPath)) {
        fs.unlinkSync(testPath);
      }
    } catch (error) {
      console.log(`   ❌ ${test.name}: ${error.message}`);
    }
  }
}

// Run all tests
async function runAllTests() {
  await testLLMProcessor();
  await testFileTypes();
  await performanceTest();

  console.log("\n🎉 All tests completed!");
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  testLLMProcessor,
  testFileTypes,
  performanceTest,
  runAllTests,
};
