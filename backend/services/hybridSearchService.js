/**
 * Hybrid Search Service
 * Combines metadata filtering with vector similarity search for optimal performance and accuracy
 */

const SupabaseChunkStorage = require('./supabaseChunkStorage');
const { GoogleGenerativeAIEmbeddings } = require('@langchain/google-genai');

class HybridSearchService {
  constructor() {
    this.chunkStorage = new SupabaseChunkStorage();
    this.embeddings = new GoogleGenerativeAIEmbeddings({
      apiKey: process.env.GEMINI_API_KEY,
      model: "text-embedding-004"
    });
  }

  /**
   * Perform hybrid search: metadata filtering + vector similarity
   * @param {Object} searchParams - Search parameters from query processing
   * @returns {Promise<Object>} Search results with context
   */
  async performHybridSearch(searchParams) {
    try {
      const {
        processedQuery,
        chatbotId,
        conversationId,
        maxResults = 10,
        includeRelated = true,
        contextWindow = 3
      } = searchParams;

      console.log('🔍 Starting hybrid search...');
      console.log(`Query: "${processedQuery.originalQuery}"`);

      // Step 1: Generate query embedding
      const queryEmbedding = await this.generateQueryEmbedding(processedQuery.originalQuery);

      // Step 2: Metadata-based pre-filtering
      const metadataResults = await this.performMetadataFiltering(
        processedQuery.searchMetadata,
        chatbotId,
        maxResults * 3 // Get more candidates for vector filtering
      );

      console.log(`📊 Metadata filtering: ${metadataResults.length} candidates`);

      if (metadataResults.length === 0) {
        return {
          results: [],
          searchStrategy: 'metadata_only',
          totalFound: 0,
          message: 'No content found matching your criteria. Try a broader search.'
        };
      }

      // Step 3: Vector similarity search on filtered candidates
      const vectorResults = await this.performVectorSearch(
        queryEmbedding,
        metadataResults,
        processedQuery.searchStrategy,
        maxResults
      );

      console.log(`🎯 Vector search: ${vectorResults.length} matches`);

      // Step 4: Get related chunks for context
      let contextualResults = vectorResults;
      if (includeRelated && vectorResults.length > 0) {
        contextualResults = await this.addRelatedChunks(
          vectorResults,
          contextWindow,
          processedQuery.searchStrategy
        );
      }

      // Step 5: Rank and organize results
      const finalResults = await this.rankAndOrganizeResults(
        contextualResults,
        processedQuery,
        queryEmbedding
      );

      return {
        results: finalResults,
        searchStrategy: 'hybrid',
        totalFound: vectorResults.length,
        metadataCandidates: metadataResults.length,
        searchMetadata: processedQuery.searchMetadata,
        queryIntent: processedQuery.queryIntent,
        processingTime: Date.now()
      };

    } catch (error) {
      console.error('Error in hybrid search:', error);
      throw error;
    }
  }

  /**
   * Generate embedding for user query
   * @param {string} query - User query text
   * @returns {Promise<Array>} Query embedding vector
   */
  async generateQueryEmbedding(query) {
    try {
      console.log('🧮 Generating query embedding...');
      const embeddings = await this.embeddings.embedQuery(query);
      return embeddings;
    } catch (error) {
      console.error('Error generating query embedding:', error);
      throw error;
    }
  }

  /**
   * Perform metadata-based filtering to reduce search space
   * @param {Object} searchMetadata - Extracted metadata from query
   * @param {string} chatbotId - Chatbot ID
   * @param {number} maxCandidates - Maximum candidates to return
   * @returns {Promise<Array>} Filtered chunks
   */
  async performMetadataFiltering(searchMetadata, chatbotId, maxCandidates) {
    try {
      console.log('🏷️ Performing metadata filtering...');

      const filters = {
        topics: searchMetadata.topics || [],
        questionTypes: searchMetadata.questionTypes || [],
        audience: searchMetadata.audience || [],
        complexityLevel: searchMetadata.complexityLevel,
        keywords: searchMetadata.keywords || [],
        limit: maxCandidates
      };

      // Remove empty filters
      Object.keys(filters).forEach(key => {
        if (Array.isArray(filters[key]) && filters[key].length === 0) {
          delete filters[key];
        }
        if (!filters[key]) {
          delete filters[key];
        }
      });

      const results = await this.chunkStorage.queryChunksByMetadata(filters, chatbotId);
      
      console.log(`📋 Metadata filters applied:`, filters);
      return results;

    } catch (error) {
      console.error('Error in metadata filtering:', error);
      // Fallback: return all chunks for this chatbot (limited)
      return await this.chunkStorage.queryChunksByMetadata({ limit: maxCandidates }, chatbotId);
    }
  }

  /**
   * Perform vector similarity search on metadata-filtered candidates
   * @param {Array} queryEmbedding - Query embedding vector
   * @param {Array} candidates - Metadata-filtered candidate chunks
   * @param {Object} searchStrategy - Search strategy from query processing
   * @param {number} maxResults - Maximum results to return
   * @returns {Promise<Array>} Vector search results
   */
  async performVectorSearch(queryEmbedding, candidates, searchStrategy, maxResults) {
    try {
      console.log('🎯 Performing vector similarity search...');

      if (candidates.length === 0) {
        return [];
      }

      // Extract chunk IDs for targeted vector search
      const candidateIds = candidates.map(chunk => chunk.id);

      // Determine similarity threshold based on search strategy
      const similarityThreshold = this.determineSimilarityThreshold(searchStrategy);

      // Perform vector search using Supabase function
      const vectorResults = await this.chunkStorage.hybridSearch({
        chatbotId: candidates[0].chatbot_id,
        queryEmbedding: queryEmbedding,
        metadataFilters: {}, // Already filtered
        similarityThreshold: similarityThreshold,
        limit: maxResults,
        candidateIds: candidateIds
      });

      return vectorResults;

    } catch (error) {
      console.error('Error in vector search:', error);
      // Fallback: return top metadata candidates
      return candidates.slice(0, maxResults).map(chunk => ({
        ...chunk,
        similarity: 0.5 // Default similarity
      }));
    }
  }

  /**
   * Add related chunks for better context
   * @param {Array} primaryResults - Primary search results
   * @param {number} contextWindow - Number of related chunks per result
   * @param {Object} searchStrategy - Search strategy
   * @returns {Promise<Array>} Results with related chunks
   */
  async addRelatedChunks(primaryResults, contextWindow, searchStrategy) {
    try {
      console.log('🔗 Adding related chunks for context...');

      const enhancedResults = [];

      for (const result of primaryResults) {
        // Get related chunks
        const relationshipTypes = this.determineRelationshipTypes(searchStrategy);
        const relatedChunks = await this.chunkStorage.getRelatedChunks(
          result.id,
          relationshipTypes,
          contextWindow
        );

        enhancedResults.push({
          ...result,
          relatedChunks: relatedChunks,
          contextScore: this.calculateContextScore(result, relatedChunks)
        });
      }

      return enhancedResults;

    } catch (error) {
      console.error('Error adding related chunks:', error);
      return primaryResults; // Return without related chunks
    }
  }

  /**
   * Rank and organize final results
   * @param {Array} results - Search results with context
   * @param {Object} processedQuery - Processed query information
   * @param {Array} queryEmbedding - Query embedding for additional scoring
   * @returns {Promise<Array>} Ranked and organized results
   */
  async rankAndOrganizeResults(results, processedQuery, queryEmbedding) {
    try {
      console.log('📊 Ranking and organizing results...');

      // Calculate composite scores
      const scoredResults = results.map(result => {
        const scores = {
          vectorSimilarity: result.similarity || 0.5,
          metadataRelevance: this.calculateMetadataRelevance(result, processedQuery.searchMetadata),
          contextQuality: result.contextScore || 0.5,
          queryTypeMatch: this.calculateQueryTypeMatch(result, processedQuery.queryIntent)
        };

        // Weighted composite score
        const compositeScore = (
          scores.vectorSimilarity * 0.4 +
          scores.metadataRelevance * 0.3 +
          scores.contextQuality * 0.2 +
          scores.queryTypeMatch * 0.1
        );

        return {
          ...result,
          scores: scores,
          compositeScore: compositeScore,
          relevanceReason: this.generateRelevanceReason(scores, processedQuery)
        };
      });

      // Sort by composite score
      scoredResults.sort((a, b) => b.compositeScore - a.compositeScore);

      // Group by document section for better organization
      const organizedResults = this.organizeByDocumentStructure(scoredResults);

      return organizedResults;

    } catch (error) {
      console.error('Error ranking results:', error);
      return results; // Return unranked results
    }
  }

  /**
   * Determine similarity threshold based on search strategy
   * @param {Object} searchStrategy - Search strategy from query processing
   * @returns {number} Similarity threshold
   */
  determineSimilarityThreshold(searchStrategy) {
    if (searchStrategy?.queryIntent?.scope === 'specific') {
      return 0.8; // High threshold for specific queries
    } else if (searchStrategy?.queryIntent?.scope === 'broad') {
      return 0.6; // Lower threshold for broad queries
    }
    return 0.7; // Default threshold
  }

  /**
   * Determine which relationship types to include
   * @param {Object} searchStrategy - Search strategy
   * @returns {Array} Relationship types to include
   */
  determineRelationshipTypes(searchStrategy) {
    const types = ['sequential']; // Always include sequential

    if (searchStrategy?.queryIntent?.type === 'procedure') {
      types.push('hierarchical'); // Include parent/child for procedures
    }

    if (searchStrategy?.queryIntent?.scope === 'comprehensive') {
      types.push('topical'); // Include related topics for comprehensive answers
    }

    return types;
  }

  /**
   * Calculate context score based on related chunks
   * @param {Object} primaryChunk - Primary search result
   * @param {Array} relatedChunks - Related chunks
   * @returns {number} Context score (0-1)
   */
  calculateContextScore(primaryChunk, relatedChunks) {
    if (!relatedChunks || relatedChunks.length === 0) {
      return 0.3; // Low score for isolated chunks
    }

    // Score based on relationship strength and diversity
    const avgStrength = relatedChunks.reduce((sum, chunk) => sum + (chunk.strength || 0.5), 0) / relatedChunks.length;
    const relationshipDiversity = new Set(relatedChunks.map(chunk => chunk.relationship_type)).size;

    return Math.min(1.0, avgStrength + (relationshipDiversity * 0.1));
  }

  /**
   * Calculate metadata relevance score
   * @param {Object} result - Search result
   * @param {Object} searchMetadata - Query metadata
   * @returns {number} Metadata relevance score (0-1)
   */
  calculateMetadataRelevance(result, searchMetadata) {
    let score = 0;
    let factors = 0;

    // Check topic match
    if (searchMetadata.topics && result.chunk_metadata?.topics) {
      const resultTopics = JSON.parse(result.chunk_metadata.topics || '[]');
      const topicMatch = searchMetadata.topics.some(topic => resultTopics.includes(topic));
      if (topicMatch) score += 0.4;
      factors++;
    }

    // Check question type match
    if (searchMetadata.questionTypes && result.chunk_metadata?.question_types) {
      const resultQuestionTypes = JSON.parse(result.chunk_metadata.question_types || '[]');
      const questionTypeMatch = searchMetadata.questionTypes.some(type => resultQuestionTypes.includes(type));
      if (questionTypeMatch) score += 0.3;
      factors++;
    }

    // Check audience match
    if (searchMetadata.audience && result.chunk_metadata?.audience) {
      const resultAudience = JSON.parse(result.chunk_metadata.audience || '[]');
      const audienceMatch = searchMetadata.audience.some(aud => resultAudience.includes(aud));
      if (audienceMatch) score += 0.2;
      factors++;
    }

    // Check keyword match
    if (searchMetadata.keywords && result.chunk_metadata?.keywords) {
      const resultKeywords = JSON.parse(result.chunk_metadata.keywords || '[]');
      const keywordMatches = searchMetadata.keywords.filter(keyword => 
        resultKeywords.some(rk => rk.toLowerCase().includes(keyword.toLowerCase()))
      ).length;
      if (keywordMatches > 0) {
        score += Math.min(0.3, keywordMatches * 0.1);
      }
      factors++;
    }

    return factors > 0 ? score / factors : 0.5;
  }

  /**
   * Calculate query type match score
   * @param {Object} result - Search result
   * @param {Object} queryIntent - Query intent
   * @returns {number} Query type match score (0-1)
   */
  calculateQueryTypeMatch(result, queryIntent) {
    if (!queryIntent || !result.chunk_metadata) {
      return 0.5;
    }

    // Match based on chunk type and query intent
    const chunkType = result.chunk_type;
    const intentType = queryIntent.type;

    const typeMatches = {
      'procedure': ['code', 'list'],
      'definition': ['text', 'heading'],
      'comparison': ['table'],
      'example': ['code'],
      'information': ['text']
    };

    if (typeMatches[intentType]?.includes(chunkType)) {
      return 0.9;
    }

    return 0.5; // Default score
  }

  /**
   * Generate relevance reason for result
   * @param {Object} scores - Calculated scores
   * @param {Object} processedQuery - Processed query
   * @returns {string} Relevance reason
   */
  generateRelevanceReason(scores, processedQuery) {
    const reasons = [];

    if (scores.vectorSimilarity > 0.8) {
      reasons.push('high content similarity');
    }
    if (scores.metadataRelevance > 0.7) {
      reasons.push('strong metadata match');
    }
    if (scores.contextQuality > 0.7) {
      reasons.push('rich contextual information');
    }

    return reasons.length > 0 ? reasons.join(', ') : 'general relevance';
  }

  /**
   * Organize results by document structure
   * @param {Array} results - Scored results
   * @returns {Array} Organized results
   */
  organizeByDocumentStructure(results) {
    // Group by document section
    const sections = {};
    
    results.forEach(result => {
      const section = result.document_section || 'General';
      if (!sections[section]) {
        sections[section] = [];
      }
      sections[section].push(result);
    });

    // Flatten back to array with section headers
    const organized = [];
    Object.keys(sections).forEach(sectionName => {
      organized.push({
        type: 'section_header',
        sectionName: sectionName,
        chunkCount: sections[sectionName].length
      });
      organized.push(...sections[sectionName]);
    });

    return organized;
  }
}

module.exports = HybridSearchService;
