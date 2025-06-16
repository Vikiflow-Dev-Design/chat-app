// Import embedding service wrapper (preserves original code while allowing disconnection)
const EmbeddingServiceWrapper = require("./embeddingServiceWrapper");
const LLMMetadataService = require("./llmMetadataService");
const SupabaseChunkStorage = require("./supabaseChunkStorage");

/**
 * Multi-Vector Search Service
 * Orchestrates advanced search across multiple embedding types with LLM-powered query analysis
 */
class MultiVectorSearchService {
  constructor() {
    this.embeddingService = new EmbeddingServiceWrapper();
    this.metadataService = new LLMMetadataService();
    this.chunkStorage = new SupabaseChunkStorage();

    // Default search strategies
    this.searchStrategies = {
      content_focused: {
        weights: {
          content: 0.7,
          topics: 0.15,
          keywords: 0.1,
          question_type: 0.05,
        },
        description: "Prioritizes content similarity for general queries",
      },
      topic_focused: {
        weights: {
          topics: 0.5,
          content: 0.3,
          keywords: 0.15,
          question_type: 0.05,
        },
        description: "Emphasizes topical relevance for thematic searches",
      },
      keyword_focused: {
        weights: {
          keywords: 0.4,
          content: 0.3,
          topics: 0.2,
          question_type: 0.1,
        },
        description: "Targets specific terms and technical vocabulary",
      },
      question_oriented: {
        weights: {
          question_type: 0.4,
          content: 0.3,
          topics: 0.2,
          keywords: 0.1,
        },
        description: "Optimized for Q&A scenarios and specific question types",
      },
      comprehensive: {
        weights: {
          content: 0.3,
          topics: 0.25,
          keywords: 0.2,
          question_type: 0.15,
          audience: 0.05,
          heading_context: 0.05,
        },
        description: "Balanced approach using all embedding types",
      },
    };
  }

  /**
   * Perform intelligent search with LLM-powered query analysis
   * @param {string} query - User query
   * @param {string} chatbotId - Chatbot ID
   * @param {Object} options - Search options
   * @returns {Promise<Object>} Search results with metadata
   */
  async intelligentSearch(query, chatbotId, options = {}) {
    try {
      console.log(`🧠 Starting intelligent search for: "${query}"`);

      const {
        maxResults = 10,
        similarityThreshold = 0.7,
        includeRelated = true,
        contextWindow = 3,
        useMetadataFiltering = true,
        searchStrategy = "auto",
      } = options;

      // Step 1: Analyze query with LLM to understand intent and extract metadata
      console.log("🔍 Analyzing query with LLM...");
      const queryAnalysis = await this.metadataService.analyzeQueryMetadata(
        query
      );

      // Step 2: Determine optimal search strategy
      const selectedStrategy =
        searchStrategy === "auto"
          ? this.selectSearchStrategy(queryAnalysis)
          : this.searchStrategies[searchStrategy] ||
            this.searchStrategies.comprehensive;

      console.log(
        `📊 Selected search strategy: ${
          searchStrategy === "auto"
            ? queryAnalysis.search_strategy
            : searchStrategy
        }`
      );

      // Step 3: Generate query embeddings for different types
      console.log("🎯 Generating query embeddings...");
      const queryEmbeddings = await this.generateQueryEmbeddings(
        query,
        queryAnalysis
      );

      // Step 4: Prepare metadata filters if enabled
      let metadataFilters = {};
      if (useMetadataFiltering && queryAnalysis.topics?.length > 0) {
        metadataFilters = {
          topics: queryAnalysis.topics,
          questionTypes: queryAnalysis.question_type,
          complexityLevel:
            queryAnalysis.complexity_level !== "beginner"
              ? queryAnalysis.complexity_level
              : undefined,
          limit: maxResults * 3, // Get more candidates for vector filtering
        };
      }

      // Step 5: Perform multi-embedding search
      console.log("🔍 Performing multi-embedding search...");
      const searchResults = await this.chunkStorage.hybridSearch({
        chatbotId,
        queryEmbeddings,
        embeddingWeights:
          queryAnalysis.embedding_weights || selectedStrategy.weights,
        metadataFilters,
        similarityThreshold,
        limit: maxResults,
        useMultiEmbedding: true,
      });

      // Step 6: Add related chunks if requested
      let enhancedResults = searchResults;
      if (includeRelated && searchResults.length > 0) {
        enhancedResults = await this.addRelatedChunks(
          searchResults,
          contextWindow
        );
      }

      // Step 7: Post-process and rank results
      const finalResults = await this.postProcessResults(
        enhancedResults,
        query,
        queryAnalysis,
        selectedStrategy
      );

      console.log(
        `✅ Intelligent search completed: ${finalResults.length} results`
      );

      return {
        results: finalResults,
        searchMetadata: {
          query,
          queryAnalysis,
          strategy: selectedStrategy,
          totalFound: searchResults.length,
          withRelated: enhancedResults.length,
          processingTime: Date.now(),
        },
      };
    } catch (error) {
      console.error("Error in intelligent search:", error);
      throw new Error(`Intelligent search failed: ${error.message}`);
    }
  }

  /**
   * Select optimal search strategy based on query analysis
   * @param {Object} queryAnalysis - LLM query analysis
   * @returns {Object} Selected search strategy
   */
  selectSearchStrategy(queryAnalysis) {
    const { intent, question_type, complexity_level, search_strategy } =
      queryAnalysis;

    // Use LLM recommendation if available
    if (search_strategy && this.searchStrategies[search_strategy]) {
      return this.searchStrategies[search_strategy];
    }

    // Fallback to rule-based selection
    if (intent === "question" || question_type?.includes("factual")) {
      return this.searchStrategies.question_oriented;
    }

    if (intent === "explanation" || question_type?.includes("conceptual")) {
      return this.searchStrategies.topic_focused;
    }

    if (intent === "instruction" || question_type?.includes("procedural")) {
      return this.searchStrategies.content_focused;
    }

    if (complexity_level === "advanced") {
      return this.searchStrategies.keyword_focused;
    }

    return this.searchStrategies.comprehensive;
  }

  /**
   * Generate embeddings for different query aspects
   * @param {string} query - Original query
   * @param {Object} queryAnalysis - LLM analysis of query
   * @returns {Promise<Object>} Query embeddings for different types
   */
  async generateQueryEmbeddings(query, queryAnalysis) {
    try {
      const embeddings = {};

      // Check if embeddings are enabled
      if (!this.embeddingService.isEnabled()) {
        console.log(
          "⏭️ Embeddings disabled - skipping query embedding generation"
        );
        return {};
      }

      // Generate content embedding (main query)
      const contentEmbedding =
        await this.embeddingService.generateEmbeddingWithCache(
          query,
          "content"
        );
      if (contentEmbedding) {
        embeddings.content = contentEmbedding;
      }

      // Generate topic-focused embedding
      if (queryAnalysis.topics?.length > 0) {
        const topicsText = this.embeddingService.convertMetadataToText(
          queryAnalysis.topics,
          "topics"
        );
        const topicsEmbedding =
          await this.embeddingService.generateEmbeddingWithCache(
            topicsText,
            "topics"
          );
        if (topicsEmbedding) {
          embeddings.topics = topicsEmbedding;
        }
      }

      // Generate keyword-focused embedding
      if (queryAnalysis.keywords?.length > 0) {
        const keywordsText = this.embeddingService.convertMetadataToText(
          queryAnalysis.keywords,
          "keywords"
        );
        const keywordsEmbedding =
          await this.embeddingService.generateEmbeddingWithCache(
            keywordsText,
            "keywords"
          );
        if (keywordsEmbedding) {
          embeddings.keywords = keywordsEmbedding;
        }
      }

      // Generate question-type embedding
      if (queryAnalysis.question_type?.length > 0) {
        const questionTypeText = this.embeddingService.convertMetadataToText(
          queryAnalysis.question_type,
          "question_type"
        );
        const questionTypeEmbedding =
          await this.embeddingService.generateEmbeddingWithCache(
            questionTypeText,
            "question_type"
          );
        if (questionTypeEmbedding) {
          embeddings.question_type = questionTypeEmbedding;
        }
      }

      // Generate audience-focused embedding if specified
      if (queryAnalysis.audience_level) {
        const audienceText = this.embeddingService.convertMetadataToText(
          [queryAnalysis.audience_level],
          "audience"
        );
        const audienceEmbedding =
          await this.embeddingService.generateEmbeddingWithCache(
            audienceText,
            "audience"
          );
        if (audienceEmbedding) {
          embeddings.audience = audienceEmbedding;
        }
      }

      console.log(
        `✅ Generated ${Object.keys(embeddings).length} query embeddings`
      );
      return embeddings;
    } catch (error) {
      console.error("Error generating query embeddings:", error);

      // Try to return at least content embedding if possible
      if (this.embeddingService.isEnabled()) {
        try {
          const contentEmbedding =
            await this.embeddingService.generateEmbeddingWithCache(
              query,
              "content"
            );
          return contentEmbedding ? { content: contentEmbedding } : {};
        } catch (fallbackError) {
          console.error(
            "Fallback content embedding also failed:",
            fallbackError
          );
        }
      }

      return {};
    }
  }

  /**
   * Add related chunks to search results for better context
   * @param {Array} searchResults - Initial search results
   * @param {number} contextWindow - Number of related chunks per result
   * @returns {Promise<Array>} Enhanced results with related chunks
   */
  async addRelatedChunks(searchResults, contextWindow) {
    try {
      console.log(`🔗 Adding related chunks (window: ${contextWindow})...`);

      const enhancedResults = [];

      for (const result of searchResults) {
        const relatedChunks = await this.chunkStorage.getRelatedChunks(
          result.id,
          ["sequential", "hierarchical", "topical"],
          contextWindow
        );

        enhancedResults.push({
          ...result,
          relatedChunks: relatedChunks.map((rel) => ({
            ...rel.related_chunk,
            relationshipType: rel.relationship_type,
            relationshipStrength: rel.strength,
          })),
        });
      }

      console.log(
        `✅ Enhanced ${enhancedResults.length} results with related chunks`
      );
      return enhancedResults;
    } catch (error) {
      console.error("Error adding related chunks:", error);
      return searchResults; // Return original results if enhancement fails
    }
  }

  /**
   * Post-process and rank search results
   * @param {Array} results - Search results
   * @param {string} query - Original query
   * @param {Object} queryAnalysis - Query analysis
   * @param {Object} strategy - Search strategy used
   * @returns {Promise<Array>} Post-processed results
   */
  async postProcessResults(results, query, queryAnalysis, strategy) {
    try {
      console.log("📊 Post-processing search results...");

      // Add relevance scores and metadata
      const processedResults = results.map((result, index) => ({
        ...result,
        relevanceScore: this.calculateRelevanceScore(
          result,
          queryAnalysis,
          strategy
        ),
        rank: index + 1,
        searchMetadata: {
          combinedSimilarity: result.combined_similarity,
          contentSimilarity: result.content_similarity,
          topicsSimilarity: result.topics_similarity,
          keywordsSimilarity: result.keywords_similarity,
          strategy: strategy.description,
        },
      }));

      // Re-rank by relevance score
      processedResults.sort((a, b) => b.relevanceScore - a.relevanceScore);

      // Update ranks after re-sorting
      processedResults.forEach((result, index) => {
        result.rank = index + 1;
      });

      console.log("✅ Results post-processed and re-ranked");
      return processedResults;
    } catch (error) {
      console.error("Error post-processing results:", error);
      return results; // Return original results if post-processing fails
    }
  }

  /**
   * Calculate relevance score for a search result
   * @param {Object} result - Search result
   * @param {Object} queryAnalysis - Query analysis
   * @param {Object} strategy - Search strategy
   * @returns {number} Relevance score
   */
  calculateRelevanceScore(result, queryAnalysis, strategy) {
    let score = result.combined_similarity || 0;

    // Boost score based on metadata matches
    if (result.metadata) {
      const metadata = result.metadata;

      // Topic relevance boost
      if (queryAnalysis.topics && metadata.topics) {
        const topicMatches = queryAnalysis.topics.filter((topic) =>
          metadata.topics.includes(topic)
        ).length;
        score += topicMatches * 0.1;
      }

      // Question type relevance boost
      if (queryAnalysis.question_type && metadata.question_types) {
        const questionMatches = queryAnalysis.question_type.filter((type) =>
          metadata.question_types.includes(type)
        ).length;
        score += questionMatches * 0.05;
      }

      // Complexity level match boost
      if (queryAnalysis.complexity_level === metadata.complexity_level) {
        score += 0.05;
      }

      // LLM processing quality boost
      if (metadata.llm_processed) {
        score += 0.02;
      }
    }

    return Math.min(score, 1.0); // Cap at 1.0
  }

  /**
   * Get search analytics and performance metrics
   * @param {string} chatbotId - Chatbot ID
   * @returns {Promise<Object>} Search analytics
   */
  async getSearchAnalytics(chatbotId) {
    try {
      const [chunkStats, cacheStats] = await Promise.all([
        this.chunkStorage.getChunkStatistics(chatbotId),
        this.chunkStorage.getCacheStatistics(),
      ]);

      return {
        chunks: chunkStats,
        cache: cacheStats,
        searchStrategies: Object.keys(this.searchStrategies),
        embeddingTypes: this.embeddingService.embeddingTypes,
      };
    } catch (error) {
      console.error("Error getting search analytics:", error);
      throw error;
    }
  }
}

module.exports = MultiVectorSearchService;
