const dotenv = require('dotenv');
const mongoose = require('mongoose');
const TextChunkingService = require('./services/textChunkingService');
const { CHUNKING_CONFIGS, getOptimalConfig } = require('./config/chunkingConfig');

dotenv.config();

console.log('🔍 Testing Different Chunk Sizes for RAG Optimization\n');

async function testChunkSizes() {
  try {
    // Sample content for testing
    const sampleContent = `
    Victor Ezekiel is a highly skilled software engineer with over 8 years of experience in full-stack development. 
    He specializes in JavaScript, Python, and cloud technologies. Victor has worked on numerous projects involving 
    artificial intelligence, machine learning, and web development. He is passionate about creating innovative 
    solutions that solve real-world problems. Victor holds a Bachelor's degree in Computer Science and has 
    certifications in AWS and Google Cloud Platform. He has led development teams and mentored junior developers. 
    Victor is known for his problem-solving skills and attention to detail. He enjoys working on challenging 
    projects that push the boundaries of technology. In his free time, Victor contributes to open-source projects 
    and writes technical articles. He believes in continuous learning and staying updated with the latest 
    technology trends. Victor has experience with various databases including MongoDB, PostgreSQL, and Redis. 
    He has also worked with containerization technologies like Docker and Kubernetes. Victor is fluent in 
    multiple programming languages and frameworks including React, Node.js, Django, and Flask.
    `.trim();

    console.log(`📄 Sample content length: ${sampleContent.length} characters\n`);

    // Test different chunking configurations
    const configsToTest = [
      { name: 'Default', config: CHUNKING_CONFIGS.default },
      { name: 'Semantic', config: CHUNKING_CONFIGS.semantic },
      { name: 'Precise', config: CHUNKING_CONFIGS.precise },
      { name: 'Large', config: CHUNKING_CONFIGS.large },
      { name: 'File Optimized', config: CHUNKING_CONFIGS.file },
      { name: 'Text Optimized', config: CHUNKING_CONFIGS.text }
    ];

    console.log('🧪 Testing Different Chunking Strategies:\n');

    for (const { name, config } of configsToTest) {
      console.log(`📊 ${name} Configuration:`);
      console.log(`   Max Size: ${config.maxChunkSize}, Overlap: ${config.chunkOverlap}, Min Size: ${config.minChunkSize}`);
      
      try {
        const chunkingService = new TextChunkingService(config);
        const chunks = chunkingService.chunkText(sampleContent, { 
          title: 'Victor Ezekiel Profile',
          sourceType: 'test'
        });
        
        console.log(`   📈 Results: ${chunks.length} chunks created`);
        
        chunks.forEach((chunk, index) => {
          console.log(`      ${index + 1}. Length: ${chunk.length} chars - "${chunk.text.substring(0, 50)}..."`);
        });
        
        // Calculate efficiency metrics
        const totalChunkLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
        const overlapRatio = ((totalChunkLength - sampleContent.length) / sampleContent.length * 100).toFixed(1);
        const avgChunkSize = (totalChunkLength / chunks.length).toFixed(0);
        
        console.log(`   📊 Metrics:`);
        console.log(`      Total chunk length: ${totalChunkLength} chars`);
        console.log(`      Overlap ratio: ${overlapRatio}%`);
        console.log(`      Average chunk size: ${avgChunkSize} chars`);
        console.log('');
        
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}\n`);
      }
    }

    // Test optimal configuration selection
    console.log('🎯 Testing Optimal Configuration Selection:\n');
    
    const testCases = [
      { type: 'file', length: 15000, description: 'Large PDF document' },
      { type: 'text', length: 1500, description: 'Medium text entry' },
      { type: 'text', length: 500, description: 'Short text entry' },
      { type: 'qa', length: 200, description: 'Q&A pair' }
    ];

    for (const testCase of testCases) {
      const optimalConfig = getOptimalConfig(testCase.type, testCase.length);
      console.log(`📋 ${testCase.description} (${testCase.type}, ${testCase.length} chars):`);
      console.log(`   Optimal config: Max=${optimalConfig.maxChunkSize}, Overlap=${optimalConfig.chunkOverlap}, Min=${optimalConfig.minChunkSize}`);
      
      const estimatedChunks = Math.ceil(testCase.length / (optimalConfig.maxChunkSize - optimalConfig.chunkOverlap));
      console.log(`   Estimated chunks: ${estimatedChunks}`);
      console.log('');
    }

    // Recommendations
    console.log('💡 Chunk Size Recommendations for RAG:\n');
    console.log('1. 📄 **Files (PDFs, Documents)**: Use 1200 chars with 200 overlap');
    console.log('   - Preserves document structure and context');
    console.log('   - Good for detailed information retrieval');
    console.log('');
    console.log('2. 📝 **Text Entries**: Use 600 chars with 100 overlap');
    console.log('   - Focused retrieval for specific topics');
    console.log('   - Reduces noise in search results');
    console.log('');
    console.log('3. ❓ **Q&A Pairs**: Keep as single chunks');
    console.log('   - Maintains question-answer relationship');
    console.log('   - Perfect for FAQ-style retrieval');
    console.log('');
    console.log('4. 🎯 **Semantic Search**: Use 512 chars with 64 overlap');
    console.log('   - Optimal for most embedding models');
    console.log('   - Balances context and precision');
    console.log('');
    console.log('🔧 Current Implementation:');
    console.log('   Your project now automatically selects optimal chunk sizes');
    console.log('   based on content type and length for better RAG performance!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testChunkSizes().catch(console.error);
