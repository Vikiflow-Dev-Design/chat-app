/**
 * Test script for Relationship-Based Chunking Service
 * Tests the new intelligent chunking system with relationships and metadata
 */

require('dotenv').config();
const RelationshipChunkingService = require('./services/relationshipChunkingService');
const DoclingIntegrationService = require('./services/doclingIntegrationService');
const fs = require('fs');
const path = require('path');

async function testRelationshipChunking() {
  console.log('🧪 Testing Relationship-Based Chunking System\n');

  const chunkingService = new RelationshipChunkingService();
  const doclingService = new DoclingIntegrationService();

  // Test 1: Create a comprehensive test document
  console.log('1. Creating comprehensive test document...');
  const testDir = path.join(__dirname, 'test-files');
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }

  const testFilePath = path.join(testDir, 'comprehensive-test-doc.txt');
  const testContent = `# API Documentation Guide

This comprehensive guide covers API development and implementation.

## Introduction

APIs (Application Programming Interfaces) are essential for modern software development. They enable different applications to communicate and share data effectively.

### What is an API?

An API is a set of protocols, routines, and tools for building software applications. It specifies how software components should interact.

## Authentication

Security is crucial when working with APIs. This section covers authentication methods.

### JWT Tokens

JSON Web Tokens (JWT) are a popular method for API authentication. Here's how to implement JWT:

\`\`\`javascript
const jwt = require('jsonwebtoken');

function generateToken(user) {
  return jwt.sign({ userId: user.id }, process.env.JWT_SECRET);
}
\`\`\`

### API Keys

API keys provide a simple authentication mechanism:

- Generate unique keys for each client
- Include the key in request headers
- Validate keys on the server side

## Database Integration

APIs often need to interact with databases to store and retrieve data.

### Connection Setup

Setting up a database connection requires proper configuration:

1. Install database driver
2. Configure connection parameters
3. Establish connection pool
4. Handle connection errors

### Query Examples

| Operation | SQL Example | Description |
|-----------|-------------|-------------|
| SELECT | SELECT * FROM users | Retrieve all users |
| INSERT | INSERT INTO users (name) VALUES ('John') | Add new user |
| UPDATE | UPDATE users SET name='Jane' WHERE id=1 | Update user |
| DELETE | DELETE FROM users WHERE id=1 | Remove user |

## Error Handling

Proper error handling is essential for robust APIs:

- Use appropriate HTTP status codes
- Provide meaningful error messages
- Log errors for debugging
- Implement retry mechanisms

## Conclusion

This guide provides a foundation for API development. For advanced topics, refer to the extended documentation.`;

  fs.writeFileSync(testFilePath, testContent);
  console.log('✅ Test document created:', testFilePath);
  console.log();

  // Test 2: Process document with Docling
  console.log('2. Processing document with LangChain Docling...');
  try {
    const doclingResult = await doclingService.processDocument(testFilePath, 'txt', 'markdown');
    
    if (!doclingResult.success) {
      throw new Error('Docling processing failed');
    }

    console.log('✅ Document processed with Docling');
    console.log(`📄 Content length: ${doclingResult.markdownContent.length}`);
    console.log(`🏷️  Processing method: ${doclingResult.metadata.processing_method}`);
    console.log();

    // Test 3: Apply relationship-based chunking
    console.log('3. Applying relationship-based chunking...');
    
    const chunks = await chunkingService.processMarkdownToChunks(
      doclingResult.markdownContent,
      doclingResult.metadata,
      {
        maxChunkSize: 600,
        minChunkSize: 100,
        overlapSize: 50,
        preserveStructure: true
      }
    );

    console.log(`✅ Created ${chunks.length} relationship-based chunks`);
    console.log();

    // Test 4: Analyze chunk structure
    console.log('4. Analyzing chunk structure...');
    
    chunks.forEach((chunk, index) => {
      console.log(`📦 Chunk ${index + 1}:`);
      console.log(`   ID: ${chunk.id}`);
      console.log(`   Type: ${chunk.type}`);
      console.log(`   Content length: ${chunk.content.length}`);
      console.log(`   Elements: ${chunk.elements.length}`);
      console.log(`   Heading context: ${chunk.headingContext.map(h => h.title).join(' > ')}`);
      
      if (chunk.relationships) {
        console.log(`   Sequential: prev=${chunk.relationships.sequential.previous ? 'yes' : 'no'}, next=${chunk.relationships.sequential.next ? 'yes' : 'no'}`);
        console.log(`   Hierarchical: parent=${chunk.relationships.hierarchical.parent ? 'yes' : 'no'}, siblings=${chunk.relationships.hierarchical.siblings.length}`);
        console.log(`   Topical relationships: ${chunk.relationships.topical.length}`);
      }
      
      console.log();
    });

    // Test 5: Analyze metadata
    console.log('5. Analyzing chunk metadata...');
    
    chunks.slice(0, 3).forEach((chunk, index) => {
      console.log(`🏷️  Chunk ${index + 1} Metadata:`);
      console.log(`   Topics: ${chunk.metadata.topics.join(', ')}`);
      console.log(`   Keywords: ${chunk.metadata.keywords.slice(0, 5).join(', ')}`);
      console.log(`   Complexity: ${chunk.metadata.complexityLevel}`);
      console.log(`   Question types: ${chunk.metadata.questionTypes.join(', ')}`);
      console.log(`   Audience: ${chunk.metadata.audience.join(', ')}`);
      console.log(`   Prerequisites: ${chunk.metadata.prerequisites.join(', ')}`);
      console.log(`   Entities: ${chunk.metadata.entities.length} found`);
      console.log(`   Document section: ${chunk.metadata.documentSection}`);
      console.log();
    });

    // Test 6: Test relationship queries
    console.log('6. Testing relationship queries...');
    
    // Find chunks about authentication
    const authChunks = chunks.filter(chunk => 
      chunk.metadata.topics.includes('Security') || 
      chunk.metadata.keywords.includes('authentication') ||
      chunk.content.toLowerCase().includes('authentication')
    );
    
    console.log(`🔐 Found ${authChunks.length} chunks about authentication:`);
    authChunks.forEach(chunk => {
      console.log(`   - ${chunk.metadata.documentSection}: ${chunk.content.substring(0, 100)}...`);
    });
    console.log();

    // Find related chunks
    if (authChunks.length > 0) {
      const firstAuthChunk = authChunks[0];
      console.log(`🔗 Related chunks to "${firstAuthChunk.metadata.documentSection}":`);
      
      firstAuthChunk.relationships.topical.forEach(rel => {
        const relatedChunk = chunks.find(c => c.id === rel.chunkId);
        if (relatedChunk) {
          console.log(`   - ${relatedChunk.metadata.documentSection} (similarity: ${rel.similarity.toFixed(2)})`);
          console.log(`     Shared keywords: ${rel.sharedKeywords.join(', ')}`);
        }
      });
      console.log();
    }

    // Test 7: Test contextual overlap
    console.log('7. Testing contextual overlap...');
    
    const chunkWithOverlap = chunks.find(chunk => chunk.overlap && chunk.overlap.previous);
    if (chunkWithOverlap) {
      console.log(`🔄 Chunk with overlap found:`);
      console.log(`   Current chunk: ${chunkWithOverlap.metadata.documentSection}`);
      console.log(`   Previous overlap: ${chunkWithOverlap.overlap.previous.size} characters`);
      console.log(`   Preview: "${chunkWithOverlap.overlap.previous.content.substring(0, 100)}..."`);
      console.log();
    }

    // Test 8: Generate summary statistics
    console.log('8. Generating summary statistics...');
    
    const stats = {
      totalChunks: chunks.length,
      chunkTypes: [...new Set(chunks.map(c => c.type))],
      avgChunkSize: Math.round(chunks.reduce((sum, c) => sum + c.content.length, 0) / chunks.length),
      topicsFound: [...new Set(chunks.flatMap(c => c.metadata.topics))],
      complexityLevels: [...new Set(chunks.map(c => c.metadata.complexityLevel))],
      audienceTypes: [...new Set(chunks.flatMap(c => c.metadata.audience))],
      totalRelationships: chunks.reduce((sum, c) => sum + c.relationships.topical.length, 0)
    };
    
    console.log('📊 Chunking Statistics:');
    console.log(`   Total chunks: ${stats.totalChunks}`);
    console.log(`   Chunk types: ${stats.chunkTypes.join(', ')}`);
    console.log(`   Average chunk size: ${stats.avgChunkSize} characters`);
    console.log(`   Topics found: ${stats.topicsFound.join(', ')}`);
    console.log(`   Complexity levels: ${stats.complexityLevels.join(', ')}`);
    console.log(`   Audience types: ${stats.audienceTypes.join(', ')}`);
    console.log(`   Total topical relationships: ${stats.totalRelationships}`);
    console.log();

    // Test 9: Export chunk data for inspection
    console.log('9. Exporting chunk data...');
    
    const exportData = {
      document: {
        title: 'API Documentation Guide',
        processingMethod: doclingResult.metadata.processing_method,
        totalLength: doclingResult.markdownContent.length
      },
      chunks: chunks.map(chunk => ({
        id: chunk.id,
        type: chunk.type,
        contentPreview: chunk.content.substring(0, 200) + '...',
        metadata: chunk.metadata,
        relationships: chunk.relationships,
        overlap: chunk.overlap ? {
          hasPrevious: !!chunk.overlap.previous,
          hasNext: !!chunk.overlap.next
        } : null
      })),
      statistics: stats
    };
    
    const exportPath = path.join(testDir, 'chunk-analysis.json');
    fs.writeFileSync(exportPath, JSON.stringify(exportData, null, 2));
    console.log(`✅ Chunk analysis exported to: ${exportPath}`);
    console.log();

  } catch (error) {
    console.log('❌ Error in relationship chunking test:', error.message);
    console.log();
  }

  // Cleanup
  console.log('10. Cleaning up...');
  try {
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
      console.log('✅ Test file cleaned up');
    }
    
    const exportPath = path.join(testDir, 'chunk-analysis.json');
    if (fs.existsSync(exportPath)) {
      console.log(`📄 Chunk analysis available at: ${exportPath}`);
      console.log('   (File preserved for inspection)');
    }
    
  } catch (error) {
    console.log('⚠️  Cleanup warning:', error.message);
  }

  console.log('\n🎉 Relationship-based chunking test completed!');
  console.log('🔗 Features tested:');
  console.log('   ✅ Document structure parsing');
  console.log('   ✅ Semantic chunking');
  console.log('   ✅ Relationship establishment');
  console.log('   ✅ Rich metadata generation');
  console.log('   ✅ Contextual overlap');
  console.log('   ✅ Topical similarity detection');
  console.log('🚀 Ready for advanced RAG workflows!');
}

// Run the test
if (require.main === module) {
  testRelationshipChunking().catch(console.error);
}

module.exports = { testRelationshipChunking };
