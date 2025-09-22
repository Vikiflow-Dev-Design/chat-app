const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const fetch = require('node-fetch');

// Models
const DocumentSuggestion = require('../models/DocumentSuggestion');
const SupabaseChunkStorage = require('../services/supabaseChunkStorage');

// Initialize services
const chunkStorage = new SupabaseChunkStorage();

/**
 * Test route to verify suggestions routes are working
 * GET /api/suggestions/test
 */
router.get('/suggestions/test', (req, res) => {
  res.json({
    message: 'Suggestions routes are working!',
    timestamp: new Date().toISOString()
  });
});

/**
 * Helper function to get chunks by document ID
 */
async function getChunksByDocumentId(documentId) {
  try {
    const { data: chunks, error } = await chunkStorage.supabase
      .from('chatbot_knowledge_chunks')
      .select(`
        *,
        chunk_metadata (
          topics,
          keywords,
          entities,
          complexity_level,
          question_types,
          audience,
          prerequisites,
          related_concepts
        )
      `)
      .eq('document_id', documentId);

    if (error) {
      throw new Error(`Supabase error: ${error.message}`);
    }

    return chunks || [];
  } catch (error) {
    console.error('Error fetching chunks by document ID:', error);
    throw error;
  }
}

/**
 * Get document sections and their suggestion status
 * GET /api/documents/:documentId/sections
 */
router.get('/documents/:documentId/sections', async (req, res) => {
  try {
    const { documentId } = req.params;

    console.log(`📋 Fetching sections for document: ${documentId}`);
    console.log(`🔍 Request URL: ${req.originalUrl}`);
    console.log(`🔍 Request method: ${req.method}`);
    
    // Get all chunks for this document from Supabase
    const chunks = await getChunksByDocumentId(documentId);
    
    if (!chunks || chunks.length === 0) {
      return res.status(404).json({ 
        error: 'No chunks found for this document' 
      });
    }
    
    // Group chunks by document_section
    const sectionGroups = {};
    chunks.forEach(chunk => {
      const sectionName = chunk.document_section || 'General';
      const sectionType = chunk.chunk_type || 'content';
      
      if (!sectionGroups[sectionName]) {
        sectionGroups[sectionName] = {
          name: sectionName,
          type: sectionType,
          chunks: []
        };
      }
      sectionGroups[sectionName].chunks.push(chunk);
    });
    
    // Get existing suggestions from MongoDB
    const existingSuggestions = await DocumentSuggestion.find({ 
      document_id: documentId 
    });
    
    const suggestionsMap = {};
    existingSuggestions.forEach(suggestion => {
      suggestionsMap[suggestion.section_name] = suggestion;
    });
    
    // Build sections array with suggestion status
    const sections = Object.keys(sectionGroups).map(sectionName => {
      const sectionData = sectionGroups[sectionName];
      const suggestion = suggestionsMap[sectionName];
      
      return {
        id: `${documentId}_${sectionName.replace(/\s+/g, '_').toLowerCase()}`,
        name: sectionName,
        type: sectionData.type,
        chunkCount: sectionData.chunks.length,
        suggestions: suggestion ? suggestion.suggestions : [],
        status: suggestion ? 'generated' : 'none',
        lastGenerated: suggestion ? suggestion.generated_at : null
      };
    });
    
    // Get document info (we'll need to enhance this based on your document storage)
    const documentInfo = {
      id: documentId,
      name: `Document ${documentId}`, // TODO: Get actual document name
      uploadedAt: new Date(), // TODO: Get actual upload date
      sections: sections
    };
    
    console.log(`✅ Found ${sections.length} sections for document ${documentId}`);
    res.json(documentInfo);
    
  } catch (error) {
    console.error('❌ Error fetching document sections:', error);
    res.status(500).json({ 
      error: 'Failed to fetch document sections',
      details: error.message 
    });
  }
});

/**
 * Generate suggestions for a specific section
 * POST /api/documents/:documentId/sections/:sectionId/suggestions
 */
router.post('/documents/:documentId/sections/:sectionId/suggestions', async (req, res) => {
  try {
    const { documentId, sectionId } = req.params;
    
    console.log(`🎯 Generating suggestions for section: ${sectionId}`);
    
    // Extract section name from sectionId
    const sectionName = sectionId.replace(`${documentId}_`, '').replace(/_/g, ' ');
    
    // Get chunks for this specific section
    const allChunks = await getChunksByDocumentId(documentId);
    const sectionChunks = allChunks.filter(chunk =>
      (chunk.document_section || 'General').toLowerCase() === sectionName.toLowerCase()
    );
    
    if (sectionChunks.length === 0) {
      return res.status(404).json({ 
        error: 'No chunks found for this section' 
      });
    }
    
    // Generate suggestions using AI
    const suggestions = await generateSuggestionsForSection(sectionChunks, sectionName);
    
    // Save suggestions to MongoDB
    await DocumentSuggestion.findOneAndUpdate(
      { 
        document_id: documentId,
        section_name: sectionName
      },
      {
        document_id: documentId,
        section_name: sectionName,
        section_type: sectionChunks[0].chunk_type || 'content',
        suggestions: suggestions,
        generated_at: new Date(),
        status: 'active'
      },
      { 
        upsert: true,
        new: true 
      }
    );
    
    console.log(`✅ Generated ${suggestions.length} suggestions for section: ${sectionName}`);
    res.json({ suggestions });
    
  } catch (error) {
    console.error('❌ Error generating section suggestions:', error);
    res.status(500).json({ 
      error: 'Failed to generate suggestions',
      details: error.message 
    });
  }
});

/**
 * Generate suggestions for all sections in a document
 * POST /api/documents/:documentId/suggestions/generate-all
 */
router.post('/documents/:documentId/suggestions/generate-all', async (req, res) => {
  try {
    const { documentId } = req.params;
    
    console.log(`🚀 Generating suggestions for all sections in document: ${documentId}`);
    
    // Get all chunks for this document
    const chunks = await getChunksByDocumentId(documentId);
    
    if (!chunks || chunks.length === 0) {
      return res.status(404).json({ 
        error: 'No chunks found for this document' 
      });
    }
    
    // Group chunks by section
    const sectionGroups = {};
    chunks.forEach(chunk => {
      const sectionName = chunk.document_section || 'General';
      if (!sectionGroups[sectionName]) {
        sectionGroups[sectionName] = [];
      }
      sectionGroups[sectionName].push(chunk);
    });
    
    const results = [];
    
    // Generate suggestions for each section
    for (const [sectionName, sectionChunks] of Object.entries(sectionGroups)) {
      try {
        console.log(`🎯 Processing section: ${sectionName}`);
        
        const suggestions = await generateSuggestionsForSection(sectionChunks, sectionName);
        
        // Save to MongoDB
        await DocumentSuggestion.findOneAndUpdate(
          { 
            document_id: documentId,
            section_name: sectionName
          },
          {
            document_id: documentId,
            section_name: sectionName,
            section_type: sectionChunks[0].chunk_type || 'content',
            suggestions: suggestions,
            generated_at: new Date(),
            status: 'active'
          },
          { 
            upsert: true,
            new: true 
          }
        );
        
        results.push({
          section: sectionName,
          suggestions: suggestions,
          success: true
        });
        
      } catch (sectionError) {
        console.error(`❌ Error processing section ${sectionName}:`, sectionError);
        results.push({
          section: sectionName,
          error: sectionError.message,
          success: false
        });
      }
    }
    
    const successful = results.filter(r => r.success).length;
    console.log(`✅ Generated suggestions for ${successful}/${results.length} sections`);
    
    res.json({ 
      results,
      summary: {
        total: results.length,
        successful,
        failed: results.length - successful
      }
    });
    
  } catch (error) {
    console.error('❌ Error generating all suggestions:', error);
    res.status(500).json({ 
      error: 'Failed to generate suggestions for all sections',
      details: error.message 
    });
  }
});

/**
 * Update suggestions for a specific section
 * PUT /api/documents/:documentId/sections/:sectionId/suggestions
 */
router.put('/documents/:documentId/sections/:sectionId/suggestions', async (req, res) => {
  try {
    const { documentId, sectionId } = req.params;
    const { suggestions } = req.body;
    
    if (!Array.isArray(suggestions)) {
      return res.status(400).json({ 
        error: 'Suggestions must be an array' 
      });
    }
    
    // Extract section name from sectionId
    const sectionName = sectionId.replace(`${documentId}_`, '').replace(/_/g, ' ');
    
    console.log(`📝 Updating suggestions for section: ${sectionName}`);
    
    // Update suggestions in MongoDB
    const updated = await DocumentSuggestion.findOneAndUpdate(
      { 
        document_id: documentId,
        section_name: sectionName
      },
      {
        suggestions: suggestions.filter(s => s.trim().length > 0), // Remove empty suggestions
        updated_at: new Date()
      },
      { 
        new: true 
      }
    );
    
    if (!updated) {
      return res.status(404).json({ 
        error: 'Section suggestions not found' 
      });
    }
    
    console.log(`✅ Updated suggestions for section: ${sectionName}`);
    res.json({ 
      success: true,
      suggestions: updated.suggestions 
    });
    
  } catch (error) {
    console.error('❌ Error updating suggestions:', error);
    res.status(500).json({ 
      error: 'Failed to update suggestions',
      details: error.message 
    });
  }
});

/**
 * AI function to generate suggestions for a section
 */
async function generateSuggestionsForSection(chunks, sectionName) {
  try {
    // Combine chunk content for context
    const sectionContent = chunks.map(chunk => chunk.content).join('\n\n');
    const sectionTopics = [...new Set(chunks.flatMap(chunk => chunk.topics || []))];
    const sectionKeywords = [...new Set(chunks.flatMap(chunk => chunk.keywords || []))];
    
    const prompt = `You are generating helpful question suggestions for a document section. Based on the content and context, generate 3-5 specific, actionable questions that users might want to ask about this section.

Section Name: ${sectionName}
Section Topics: ${sectionTopics.join(', ')}
Section Keywords: ${sectionKeywords.join(', ')}

Section Content Preview:
${sectionContent.substring(0, 1000)}...

Generate 3-5 questions that:
1. Are specific to this section's content
2. Use natural language a user would actually ask
3. Focus on what's most valuable/interesting in this section
4. Are actionable and clear
5. Don't mention "the document" or "this section" - ask directly about the content

Examples for different section types:
- Skills: "What programming languages does he specialize in?"
- Experience: "What was his role at [Company Name]?"
- Projects: "What technologies were used in [Project Name]?"
- Education: "What degree did he earn and from which university?"

Return only the questions, one per line, without numbers or bullets:`;

    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-goog-api-key': process.env.GEMINI_API_KEY
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.7,
          topP: 0.8,
          topK: 40,
          maxOutputTokens: 512
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const result = await response.json();
    const generatedText = result.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!generatedText) {
      throw new Error('No suggestions generated by AI');
    }

    // Parse suggestions from response
    const suggestions = generatedText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0 && !line.match(/^\d+\./) && line.includes('?'))
      .slice(0, 5); // Limit to 5 suggestions

    return suggestions.length > 0 ? suggestions : [
      `What information is available about ${sectionName.toLowerCase()}?`,
      `Can you tell me more about the ${sectionName.toLowerCase()} details?`,
      `What are the key points in the ${sectionName.toLowerCase()} section?`
    ];

  } catch (error) {
    console.error('❌ Error generating AI suggestions:', error);
    
    // Fallback suggestions based on section name
    return [
      `What information is available about ${sectionName.toLowerCase()}?`,
      `Can you tell me more about the ${sectionName.toLowerCase()} details?`,
      `What are the key points in the ${sectionName.toLowerCase()} section?`
    ];
  }
}

module.exports = router;
