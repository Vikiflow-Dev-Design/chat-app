/**
 * Test script for Document Suggestions API
 */

const fetch = require('node-fetch');

// Configuration
const API_BASE_URL = 'http://localhost:5000';
const TEST_DOCUMENT_ID = 'doc_684fdbbdda7d27fe893e608a_1750064127435'; // Use actual document ID from your system

/**
 * Test getting document sections
 */
async function testGetDocumentSections() {
  try {
    console.log('\n🧪 Testing: GET /api/documents/:documentId/sections');
    console.log('─'.repeat(60));
    
    const response = await fetch(`${API_BASE_URL}/api/documents/${TEST_DOCUMENT_ID}/sections`);
    
    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log(`❌ Error Response: ${errorText}`);
      return false;
    }
    
    const data = await response.json();
    console.log(`✅ Success! Found ${data.sections.length} sections:`);
    
    data.sections.forEach((section, index) => {
      console.log(`   ${index + 1}. ${section.name} (${section.type}) - ${section.chunkCount} chunks - Status: ${section.status}`);
    });
    
    return data;
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

/**
 * Test generating suggestions for a section
 */
async function testGenerateSectionSuggestions(documentData) {
  try {
    if (!documentData || !documentData.sections || documentData.sections.length === 0) {
      console.log('⚠️ No sections available for testing suggestion generation');
      return false;
    }
    
    const firstSection = documentData.sections[0];
    console.log(`\n🧪 Testing: POST /api/documents/:documentId/sections/:sectionId/suggestions`);
    console.log(`📝 Section: ${firstSection.name} (${firstSection.id})`);
    console.log('─'.repeat(60));
    
    const response = await fetch(`${API_BASE_URL}/api/documents/${TEST_DOCUMENT_ID}/sections/${firstSection.id}/suggestions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log(`❌ Error Response: ${errorText}`);
      return false;
    }
    
    const data = await response.json();
    console.log(`✅ Success! Generated ${data.suggestions.length} suggestions:`);
    
    data.suggestions.forEach((suggestion, index) => {
      console.log(`   ${index + 1}. ${suggestion}`);
    });
    
    return data;
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

/**
 * Test updating suggestions
 */
async function testUpdateSuggestions(documentData) {
  try {
    if (!documentData || !documentData.sections || documentData.sections.length === 0) {
      console.log('⚠️ No sections available for testing suggestion updates');
      return false;
    }
    
    const firstSection = documentData.sections[0];
    const testSuggestions = [
      "What are the main skills mentioned?",
      "Can you tell me about the experience level?",
      "What technologies are highlighted?"
    ];
    
    console.log(`\n🧪 Testing: PUT /api/documents/:documentId/sections/:sectionId/suggestions`);
    console.log(`📝 Section: ${firstSection.name} (${firstSection.id})`);
    console.log('─'.repeat(60));
    
    const response = await fetch(`${API_BASE_URL}/api/documents/${TEST_DOCUMENT_ID}/sections/${firstSection.id}/suggestions`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        suggestions: testSuggestions
      })
    });
    
    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log(`❌ Error Response: ${errorText}`);
      return false;
    }
    
    const data = await response.json();
    console.log(`✅ Success! Updated suggestions:`);
    
    data.suggestions.forEach((suggestion, index) => {
      console.log(`   ${index + 1}. ${suggestion}`);
    });
    
    return data;
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

/**
 * Test generating all suggestions
 */
async function testGenerateAllSuggestions() {
  try {
    console.log(`\n🧪 Testing: POST /api/documents/:documentId/suggestions/generate-all`);
    console.log('─'.repeat(60));
    
    const response = await fetch(`${API_BASE_URL}/api/documents/${TEST_DOCUMENT_ID}/suggestions/generate-all`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log(`❌ Error Response: ${errorText}`);
      return false;
    }
    
    const data = await response.json();
    console.log(`✅ Success! Generated suggestions for ${data.summary.successful}/${data.summary.total} sections:`);
    
    data.results.forEach((result, index) => {
      if (result.success) {
        console.log(`   ✅ ${result.section}: ${result.suggestions.length} suggestions`);
      } else {
        console.log(`   ❌ ${result.section}: ${result.error}`);
      }
    });
    
    return data;
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('🚀 DOCUMENT SUGGESTIONS API TESTS');
  console.log('═'.repeat(60));
  console.log(`📋 Testing with document ID: ${TEST_DOCUMENT_ID}`);
  console.log('Make sure your server is running on http://localhost:5000');
  
  // Test 1: Get document sections
  const documentData = await testGetDocumentSections();
  if (!documentData) {
    console.log('\n❌ Cannot continue tests - failed to get document sections');
    return;
  }
  
  // Wait between tests
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Test 2: Generate suggestions for first section
  const suggestionData = await testGenerateSectionSuggestions(documentData);
  
  // Wait between tests
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Test 3: Update suggestions
  const updateData = await testUpdateSuggestions(documentData);
  
  // Wait between tests
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Test 4: Generate all suggestions
  const allSuggestionsData = await testGenerateAllSuggestions();
  
  // Summary
  console.log('\n🎯 TEST SUMMARY');
  console.log('═'.repeat(60));
  console.log(`✅ Get Sections: ${documentData ? 'PASSED' : 'FAILED'}`);
  console.log(`✅ Generate Section Suggestions: ${suggestionData ? 'PASSED' : 'FAILED'}`);
  console.log(`✅ Update Suggestions: ${updateData ? 'PASSED' : 'FAILED'}`);
  console.log(`✅ Generate All Suggestions: ${allSuggestionsData ? 'PASSED' : 'FAILED'}`);
  
  if (documentData && suggestionData && updateData && allSuggestionsData) {
    console.log('\n🎉 ALL TESTS PASSED! The Document Suggestions API is working correctly.');
    console.log('\n💡 Next Steps:');
    console.log('1. Test the frontend by navigating to the suggestions page');
    console.log('2. Try generating suggestions for different document sections');
    console.log('3. Test the edit functionality in the UI');
  } else {
    console.log('\n⚠️ Some tests failed. Check the error messages above.');
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  runAllTests,
  testGetDocumentSections,
  testGenerateSectionSuggestions,
  testUpdateSuggestions,
  testGenerateAllSuggestions
};
