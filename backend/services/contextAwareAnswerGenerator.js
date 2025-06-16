/**
 * Context-Aware Answer Generation Service
 * Generates intelligent, comprehensive answers using relationship-aware chunks and metadata
 */

const { GoogleGenerativeAI } = require("@google/generative-ai");

class ContextAwareAnswerGenerator {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  }

  /**
   * Generate context-aware answer from search results
   * @param {Object} params - Answer generation parameters
   * @returns {Promise<Object>} Generated answer with metadata
   */
  async generateAnswer(params) {
    try {
      const {
        userQuery,
        processedQuery,
        searchResults,
        conversationContext = {},
        userProfile = {},
        chatbotConfig = {},
      } = params;

      console.log(`🤖 Generating context-aware answer for: "${userQuery}"`);

      // Step 1: Analyze search results and build context
      const contextAnalysis = this.analyzeSearchResults(
        searchResults,
        processedQuery
      );

      // Step 2: Determine answer strategy based on query type and results
      const answerStrategy = this.determineAnswerStrategy(
        processedQuery,
        contextAnalysis,
        userProfile
      );

      // Step 3: Assemble contextual information
      const contextualInfo = await this.assembleContextualInformation(
        searchResults,
        answerStrategy,
        conversationContext
      );

      // Step 4: Generate the main answer
      const mainAnswer = await this.generateMainAnswer(
        userQuery,
        processedQuery,
        contextualInfo,
        answerStrategy,
        chatbotConfig
      );

      // Step 5: Add supplementary information
      const supplementaryInfo = this.generateSupplementaryInfo(
        searchResults,
        contextualInfo,
        answerStrategy
      );

      // Step 6: Format final response
      const finalResponse = this.formatFinalResponse(
        mainAnswer,
        supplementaryInfo,
        contextualInfo,
        answerStrategy
      );

      return finalResponse;
    } catch (error) {
      console.error("Error generating context-aware answer:", error);
      throw error;
    }
  }

  /**
   * Analyze search results to understand available context
   * @param {Array} searchResults - Results from hybrid search
   * @param {Object} processedQuery - Processed query information
   * @returns {Object} Context analysis
   */
  analyzeSearchResults(searchResults, processedQuery) {
    console.log("📊 Analyzing search results for context...");

    const analysis = {
      totalResults: searchResults.length,
      resultTypes: {},
      topicCoverage: new Set(),
      complexityLevels: new Set(),
      documentSections: new Set(),
      relationshipTypes: new Set(),
      confidenceScores: [],
      hasCodeExamples: false,
      hasProcedures: false,
      hasDefinitions: false,
      hasComparisons: false,
    };

    searchResults.forEach((result) => {
      // Analyze result types
      const chunkType = result.chunk_type || result.type;
      analysis.resultTypes[chunkType] =
        (analysis.resultTypes[chunkType] || 0) + 1;

      // Collect metadata
      if (result.chunk_metadata || result.metadata) {
        const metadata = result.chunk_metadata || result.metadata;

        // Topics
        const topics = JSON.parse(metadata.topics || "[]");
        topics.forEach((topic) => analysis.topicCoverage.add(topic));

        // Complexity
        if (metadata.complexity_level) {
          analysis.complexityLevels.add(metadata.complexity_level);
        }

        // Question types
        const questionTypes = JSON.parse(metadata.question_types || "[]");
        if (questionTypes.includes("procedure")) analysis.hasProcedures = true;
        if (questionTypes.includes("definition"))
          analysis.hasDefinitions = true;
        if (questionTypes.includes("comparison"))
          analysis.hasComparisons = true;
      }

      // Document sections
      if (result.document_section) {
        analysis.documentSections.add(result.document_section);
      }

      // Code examples
      if (chunkType === "code" || result.content?.includes("```")) {
        analysis.hasCodeExamples = true;
      }

      // Relationships
      if (result.relatedChunks) {
        result.relatedChunks.forEach((related) => {
          analysis.relationshipTypes.add(related.relationship_type);
        });
      }

      // Confidence scores
      if (result.compositeScore || result.similarity) {
        analysis.confidenceScores.push(
          result.compositeScore || result.similarity
        );
      }
    });

    // Calculate average confidence
    analysis.avgConfidence =
      analysis.confidenceScores.length > 0
        ? analysis.confidenceScores.reduce((sum, score) => sum + score, 0) /
          analysis.confidenceScores.length
        : 0.5;

    console.log(
      `📈 Context analysis: ${analysis.totalResults} results, ${
        analysis.topicCoverage.size
      } topics, avg confidence: ${analysis.avgConfidence.toFixed(2)}`
    );

    return analysis;
  }

  /**
   * Determine the best strategy for answering based on query and results
   * @param {Object} processedQuery - Processed query information
   * @param {Object} contextAnalysis - Analysis of search results
   * @param {Object} userProfile - User profile information
   * @returns {Object} Answer strategy
   */
  determineAnswerStrategy(processedQuery, contextAnalysis, userProfile) {
    console.log("🎯 Determining answer strategy...");

    const strategy = {
      answerType: "comprehensive", // comprehensive, focused, step-by-step, comparison
      includeExamples: contextAnalysis.hasCodeExamples,
      includeProcedures: contextAnalysis.hasProcedures,
      includeDefinitions: contextAnalysis.hasDefinitions,
      complexityLevel: this.determineTargetComplexity(
        contextAnalysis,
        userProfile
      ),
      structureType: "structured", // structured, narrative, list, table
      contextDepth: "deep", // shallow, medium, deep
      includeRelatedTopics: true,
      includeNextSteps: true,
      includeSourceAttribution: true,
    };

    // Adjust strategy based on query intent
    if (processedQuery.queryIntent) {
      const intent = processedQuery.queryIntent;

      if (intent.type === "procedure" || intent.type === "how-to") {
        strategy.answerType = "step-by-step";
        strategy.structureType = "list";
        strategy.includeProcedures = true;
      } else if (intent.type === "definition") {
        strategy.answerType = "focused";
        strategy.includeDefinitions = true;
        strategy.contextDepth = "medium";
      } else if (intent.type === "comparison") {
        strategy.answerType = "comparison";
        strategy.structureType = "table";
        strategy.includeComparisons = true;
      } else if (intent.type === "troubleshooting") {
        strategy.answerType = "step-by-step";
        strategy.includeProcedures = true;
        strategy.includeExamples = true;
      }

      // Adjust for urgency
      if (intent.urgency === "high") {
        strategy.answerType = "focused";
        strategy.contextDepth = "shallow";
      }

      // Adjust for scope
      if (intent.scope === "comprehensive") {
        strategy.contextDepth = "deep";
        strategy.includeRelatedTopics = true;
      }
    }

    // Adjust for user experience level
    if (userProfile.experienceLevel === "beginner") {
      strategy.includeDefinitions = true;
      strategy.includeExamples = true;
      strategy.complexityLevel = "beginner";
    } else if (userProfile.experienceLevel === "advanced") {
      strategy.contextDepth = "medium";
      strategy.includeDefinitions = false;
    }

    console.log(
      `🎯 Strategy: ${strategy.answerType} answer with ${strategy.complexityLevel} complexity`
    );

    return strategy;
  }

  /**
   * Determine target complexity level
   * @param {Object} contextAnalysis - Context analysis
   * @param {Object} userProfile - User profile
   * @returns {string} Target complexity level
   */
  determineTargetComplexity(contextAnalysis, userProfile) {
    // User profile takes precedence
    if (userProfile.experienceLevel) {
      return userProfile.experienceLevel;
    }

    // Use most common complexity from results
    const complexityArray = Array.from(contextAnalysis.complexityLevels);
    if (complexityArray.length > 0) {
      return complexityArray[0]; // First available complexity
    }

    return "intermediate"; // Default
  }

  /**
   * Assemble contextual information from search results
   * @param {Array} searchResults - Search results
   * @param {Object} answerStrategy - Answer strategy
   * @param {Object} conversationContext - Conversation context
   * @returns {Promise<Object>} Assembled contextual information
   */
  async assembleContextualInformation(
    searchResults,
    answerStrategy,
    conversationContext
  ) {
    console.log("🔗 Assembling contextual information...");

    const contextualInfo = {
      primaryContent: [],
      supportingContent: [],
      examples: [],
      procedures: [],
      definitions: [],
      relatedConcepts: [],
      prerequisites: [],
      nextSteps: [],
      sourceAttribution: [],
    };

    // Process each search result
    searchResults.forEach((result, index) => {
      const content = {
        text: result.content,
        section: result.document_section,
        type: result.chunk_type || result.type,
        confidence: result.compositeScore || result.similarity || 0.5,
        metadata: result.chunk_metadata || result.metadata,
      };

      // Categorize content based on type and metadata
      if (index < 3) {
        // Top 3 results are primary
        contextualInfo.primaryContent.push(content);
      } else {
        contextualInfo.supportingContent.push(content);
      }

      // Extract specific content types
      if (content.type === "code" || content.text.includes("```")) {
        contextualInfo.examples.push(content);
      }

      if (content.metadata) {
        const metadata =
          typeof content.metadata === "string"
            ? JSON.parse(content.metadata)
            : content.metadata;

        // Procedures
        const questionTypes = metadata.question_types || [];
        if (
          questionTypes.includes("procedure") ||
          questionTypes.includes("how-to")
        ) {
          contextualInfo.procedures.push(content);
        }

        // Definitions
        if (
          questionTypes.includes("definition") ||
          questionTypes.includes("explanation")
        ) {
          contextualInfo.definitions.push(content);
        }

        // Prerequisites
        if (metadata.prerequisites) {
          const prereqs = Array.isArray(metadata.prerequisites)
            ? metadata.prerequisites
            : JSON.parse(metadata.prerequisites || "[]");
          contextualInfo.prerequisites.push(...prereqs);
        }

        // Related concepts
        if (metadata.related_concepts) {
          const concepts = Array.isArray(metadata.related_concepts)
            ? metadata.related_concepts
            : JSON.parse(metadata.related_concepts || "[]");
          contextualInfo.relatedConcepts.push(...concepts);
        }
      }

      // Source attribution
      contextualInfo.sourceAttribution.push({
        section: content.section,
        confidence: content.confidence,
        type: content.type,
      });

      // Process related chunks for additional context
      if (result.relatedChunks && answerStrategy.contextDepth === "deep") {
        result.relatedChunks.forEach((related) => {
          if (related.relationship_type === "sequential") {
            // Add sequential content for procedures
            contextualInfo.procedures.push({
              text: related.related_chunk?.content || "",
              section: related.related_chunk?.document_section || "",
              type: "related_sequential",
              confidence: related.strength || 0.5,
            });
          }
        });
      }
    });

    // Remove duplicates and sort by confidence
    contextualInfo.prerequisites = [...new Set(contextualInfo.prerequisites)];
    contextualInfo.relatedConcepts = [
      ...new Set(contextualInfo.relatedConcepts),
    ];

    console.log(
      `🔗 Assembled: ${contextualInfo.primaryContent.length} primary, ${contextualInfo.examples.length} examples, ${contextualInfo.procedures.length} procedures`
    );

    return contextualInfo;
  }

  /**
   * Generate the main answer using LLM
   * @param {string} userQuery - Original user query
   * @param {Object} processedQuery - Processed query information
   * @param {Object} contextualInfo - Assembled contextual information
   * @param {Object} answerStrategy - Answer strategy
   * @param {Object} chatbotConfig - Chatbot configuration
   * @returns {Promise<string>} Generated main answer
   */
  async generateMainAnswer(
    userQuery,
    processedQuery,
    contextualInfo,
    answerStrategy,
    chatbotConfig
  ) {
    console.log("✍️ Generating main answer...");

    // Build context for LLM
    const primaryContext = contextualInfo.primaryContent
      .map((content) => `[${content.section}]\n${content.text}`)
      .join("\n\n");

    const examples = contextualInfo.examples
      .map((example) => example.text)
      .join("\n\n");

    const procedures = contextualInfo.procedures
      .map((proc) => proc.text)
      .join("\n\n");

    const definitions = contextualInfo.definitions
      .map((def) => def.text)
      .join("\n\n");

    // Build prompt based on answer strategy
    const prompt = this.buildAnswerPrompt(
      userQuery,
      processedQuery,
      {
        primaryContext,
        examples,
        procedures,
        definitions,
        prerequisites: contextualInfo.prerequisites,
        relatedConcepts: contextualInfo.relatedConcepts,
      },
      answerStrategy,
      chatbotConfig
    );

    try {
      const result = await this.model.generateContent(prompt);
      const answer = result.response.text();

      console.log(`✅ Generated answer (${answer.length} characters)`);
      return answer;
    } catch (error) {
      console.error("Error generating main answer:", error);

      // Fallback: create structured answer from context
      return this.createFallbackAnswer(
        userQuery,
        contextualInfo,
        answerStrategy
      );
    }
  }

  /**
   * Build prompt for answer generation
   * @param {string} userQuery - User query
   * @param {Object} processedQuery - Processed query
   * @param {Object} context - Context information
   * @param {Object} strategy - Answer strategy
   * @param {Object} config - Chatbot config
   * @returns {string} Generated prompt
   */
  buildAnswerPrompt(userQuery, processedQuery, context, strategy, config) {
    const botPersonality = config.personality || "helpful and professional";
    const botName = config.name || "Assistant";

    let prompt = `You are ${botName}, a ${botPersonality} AI assistant. Answer the user's question using the provided context.

User Question: "${userQuery}"

Query Analysis:
- Intent: ${processedQuery.queryIntent?.type || "information"}
- Topics: ${processedQuery.searchMetadata?.topics?.join(", ") || "general"}
- Audience: ${processedQuery.searchMetadata?.audience?.join(", ") || "general"}
- Complexity Level: ${strategy.complexityLevel}

Context Information:
${context.primaryContext}

${context.examples ? `\nCode Examples:\n${context.examples}` : ""}

${context.procedures ? `\nProcedures:\n${context.procedures}` : ""}

${context.definitions ? `\nDefinitions:\n${context.definitions}` : ""}

${
  context.prerequisites.length > 0
    ? `\nPrerequisites: ${context.prerequisites.join(", ")}`
    : ""
}

${
  context.relatedConcepts.length > 0
    ? `\nRelated Concepts: ${context.relatedConcepts.join(", ")}`
    : ""
}

Answer Guidelines:
- Answer Type: ${strategy.answerType}
- Structure: ${strategy.structureType}
- Complexity: ${strategy.complexityLevel}
- Include Examples: ${strategy.includeExamples}
- Include Procedures: ${strategy.includeProcedures}
- Include Definitions: ${strategy.includeDefinitions}

`;

    // Add specific instructions based on answer type
    if (strategy.answerType === "step-by-step") {
      prompt += `
Provide a clear, step-by-step answer with numbered steps. Include any necessary prerequisites and examples.`;
    } else if (strategy.answerType === "comparison") {
      prompt += `
Provide a detailed comparison highlighting key differences, advantages, and use cases.`;
    } else if (strategy.answerType === "focused") {
      prompt += `
Provide a focused, direct answer that addresses the specific question without unnecessary detail.`;
    } else {
      prompt += `
Provide a comprehensive answer that covers all relevant aspects of the question.`;
    }

    prompt += `

Format your response in clear, well-structured markdown. Use headings, bullet points, and code blocks as appropriate.`;

    return prompt;
  }

  /**
   * Create fallback answer when LLM fails
   * @param {string} userQuery - User query
   * @param {Object} contextualInfo - Contextual information
   * @param {Object} answerStrategy - Answer strategy
   * @returns {string} Fallback answer
   */
  createFallbackAnswer(userQuery, contextualInfo, answerStrategy) {
    console.log("🔄 Creating fallback answer...");

    let answer = `# Answer to: ${userQuery}\n\n`;

    // Add primary content
    if (contextualInfo.primaryContent.length > 0) {
      answer += `## Information\n\n`;
      contextualInfo.primaryContent.forEach((content, index) => {
        answer += `### ${content.section}\n\n${content.text}\n\n`;
      });
    }

    // Add examples if available
    if (contextualInfo.examples.length > 0 && answerStrategy.includeExamples) {
      answer += `## Examples\n\n`;
      contextualInfo.examples.forEach((example) => {
        answer += `${example.text}\n\n`;
      });
    }

    // Add procedures if available
    if (
      contextualInfo.procedures.length > 0 &&
      answerStrategy.includeProcedures
    ) {
      answer += `## Steps\n\n`;
      contextualInfo.procedures.forEach((proc) => {
        answer += `${proc.text}\n\n`;
      });
    }

    return answer;
  }

  /**
   * Generate supplementary information (related topics, next steps, etc.)
   * @param {Array} searchResults - Search results
   * @param {Object} contextualInfo - Contextual information
   * @param {Object} answerStrategy - Answer strategy
   * @returns {Object} Supplementary information
   */
  generateSupplementaryInfo(searchResults, contextualInfo, answerStrategy) {
    console.log("📚 Generating supplementary information...");

    const supplementary = {
      relatedTopics: [],
      nextSteps: [],
      additionalResources: [],
      prerequisites: contextualInfo.prerequisites,
      followUpQuestions: [],
      sourceInfo: {
        totalSources: searchResults.length,
        sections: [
          ...new Set(
            searchResults.map((r) => r.document_section).filter(Boolean)
          ),
        ],
        confidence: this.calculateOverallConfidence(searchResults),
      },
    };

    // Extract related topics from search results
    const allTopics = new Set();
    searchResults.forEach((result) => {
      if (result.chunk_metadata || result.metadata) {
        const metadata = result.chunk_metadata || result.metadata;
        const topics = JSON.parse(metadata.topics || "[]");
        topics.forEach((topic) => allTopics.add(topic));
      }
    });

    supplementary.relatedTopics = Array.from(allTopics).slice(0, 5);

    // Generate next steps based on content type and relationships
    if (answerStrategy.includeNextSteps) {
      supplementary.nextSteps = this.generateNextSteps(
        searchResults,
        contextualInfo
      );
    }

    // Generate follow-up questions
    supplementary.followUpQuestions = this.generateFollowUpQuestions(
      searchResults,
      contextualInfo,
      answerStrategy
    );

    // Additional resources from related chunks
    searchResults.forEach((result) => {
      if (result.relatedChunks) {
        result.relatedChunks.forEach((related) => {
          if (
            related.relationship_type === "topical" &&
            related.strength > 0.6
          ) {
            supplementary.additionalResources.push({
              title:
                related.related_chunk?.document_section ||
                "Related Information",
              relevance: related.strength,
              type: related.relationship_type,
            });
          }
        });
      }
    });

    // Remove duplicates and limit results
    supplementary.additionalResources = supplementary.additionalResources
      .slice(0, 3)
      .filter(
        (resource, index, self) =>
          index === self.findIndex((r) => r.title === resource.title)
      );

    console.log(
      `📚 Generated: ${supplementary.relatedTopics.length} topics, ${supplementary.nextSteps.length} next steps`
    );

    return supplementary;
  }

  /**
   * Generate next steps based on content analysis
   * @param {Array} searchResults - Search results
   * @param {Object} contextualInfo - Contextual information
   * @returns {Array} Next steps
   */
  generateNextSteps(searchResults, contextualInfo) {
    const nextSteps = [];

    // Analyze content to suggest logical next steps
    const hasImplementation = contextualInfo.examples.length > 0;
    const hasProcedures = contextualInfo.procedures.length > 0;
    const hasDefinitions = contextualInfo.definitions.length > 0;

    if (hasDefinitions && !hasImplementation) {
      nextSteps.push("Look for implementation examples and code samples");
    }

    if (hasImplementation && !hasProcedures) {
      nextSteps.push("Review step-by-step implementation procedures");
    }

    if (hasProcedures) {
      nextSteps.push("Test the implementation in a development environment");
      nextSteps.push("Review error handling and edge cases");
    }

    // Add steps based on related content
    const relatedTopics = new Set();
    searchResults.forEach((result) => {
      if (result.relatedChunks) {
        result.relatedChunks.forEach((related) => {
          if (related.relationship_type === "sequential") {
            relatedTopics.add(related.related_chunk?.document_section);
          }
        });
      }
    });

    relatedTopics.forEach((topic) => {
      if (topic && !nextSteps.some((step) => step.includes(topic))) {
        nextSteps.push(`Explore ${topic} for additional context`);
      }
    });

    return nextSteps.slice(0, 4); // Limit to 4 next steps
  }

  /**
   * Generate follow-up questions
   * @param {Array} searchResults - Search results
   * @param {Object} contextualInfo - Contextual information
   * @param {Object} answerStrategy - Answer strategy
   * @returns {Array} Follow-up questions
   */
  generateFollowUpQuestions(searchResults, contextualInfo, answerStrategy) {
    const questions = [];

    // Generate questions based on content type
    if (contextualInfo.examples.length > 0) {
      questions.push("Can you show me more examples?");
      questions.push("How do I customize this for my specific use case?");
    }

    if (contextualInfo.procedures.length > 0) {
      questions.push("What are common errors in this process?");
      questions.push("How do I troubleshoot if this doesn't work?");
    }

    // Generate questions based on related topics
    const topics = new Set();
    searchResults.forEach((result) => {
      if (result.chunk_metadata || result.metadata) {
        const metadata = result.chunk_metadata || result.metadata;
        const resultTopics = JSON.parse(metadata.topics || "[]");
        resultTopics.forEach((topic) => topics.add(topic));
      }
    });

    topics.forEach((topic) => {
      if (topic !== "General" && questions.length < 5) {
        questions.push(`Tell me more about ${topic}`);
      }
    });

    // Add complexity-based questions
    if (answerStrategy.complexityLevel === "beginner") {
      questions.push("What are the prerequisites for this?");
      questions.push("Are there any simpler alternatives?");
    } else if (answerStrategy.complexityLevel === "advanced") {
      questions.push("What are the performance implications?");
      questions.push("How does this scale in production?");
    }

    return questions.slice(0, 4); // Limit to 4 questions
  }

  /**
   * Calculate overall confidence from search results
   * @param {Array} searchResults - Search results
   * @returns {number} Overall confidence score
   */
  calculateOverallConfidence(searchResults) {
    if (searchResults.length === 0) return 0;

    const scores = searchResults.map(
      (result) => result.compositeScore || result.similarity || 0.5
    );

    const avgScore =
      scores.reduce((sum, score) => sum + score, 0) / scores.length;

    // Boost confidence if we have multiple high-quality results
    const highQualityResults = scores.filter((score) => score > 0.7).length;
    const confidenceBoost = Math.min(0.2, highQualityResults * 0.05);

    return Math.min(1.0, avgScore + confidenceBoost);
  }

  /**
   * Format final response with all components
   * @param {string} mainAnswer - Generated main answer
   * @param {Object} supplementaryInfo - Supplementary information
   * @param {Object} contextualInfo - Contextual information
   * @param {Object} answerStrategy - Answer strategy
   * @returns {Object} Final formatted response
   */
  formatFinalResponse(
    mainAnswer,
    supplementaryInfo,
    contextualInfo,
    answerStrategy
  ) {
    console.log("📝 Formatting final response...");

    const response = {
      // Main answer content
      answer: mainAnswer,

      // Answer metadata
      answerMetadata: {
        type: answerStrategy.answerType,
        complexity: answerStrategy.complexityLevel,
        confidence: supplementaryInfo.sourceInfo.confidence,
        processingTime: Date.now(),
        sourceCount: supplementaryInfo.sourceInfo.totalSources,
      },

      // Contextual information
      context: {
        primarySources: contextualInfo.primaryContent.length,
        examplesIncluded: contextualInfo.examples.length,
        proceduresIncluded: contextualInfo.procedures.length,
        definitionsIncluded: contextualInfo.definitions.length,
      },

      // Supplementary information
      supplementary: {
        relatedTopics: supplementaryInfo.relatedTopics,
        nextSteps: supplementaryInfo.nextSteps,
        followUpQuestions: supplementaryInfo.followUpQuestions,
        additionalResources: supplementaryInfo.additionalResources,
        prerequisites: supplementaryInfo.prerequisites,
      },

      // Source attribution
      sources: {
        sections: supplementaryInfo.sourceInfo.sections,
        totalSources: supplementaryInfo.sourceInfo.totalSources,
        confidence: supplementaryInfo.sourceInfo.confidence,
        attribution: contextualInfo.sourceAttribution,
      },

      // Response formatting
      formatting: {
        hasCodeExamples:
          answerStrategy.includeExamples && contextualInfo.examples.length > 0,
        hasProcedures:
          answerStrategy.includeProcedures &&
          contextualInfo.procedures.length > 0,
        hasDefinitions:
          answerStrategy.includeDefinitions &&
          contextualInfo.definitions.length > 0,
        structureType: answerStrategy.structureType,
      },
    };

    console.log(
      `✅ Final response formatted: ${mainAnswer.length} chars, ${
        response.sources.totalSources
      } sources, ${response.answerMetadata.confidence.toFixed(2)} confidence`
    );

    return response;
  }

  /**
   * Generate a quick answer for simple queries
   * @param {string} userQuery - User query
   * @param {Array} searchResults - Search results (limited)
   * @returns {Promise<Object>} Quick answer response
   */
  async generateQuickAnswer(userQuery, searchResults) {
    console.log("⚡ Generating quick answer...");

    if (searchResults.length === 0) {
      return {
        answer:
          "I don't have specific information about that topic in my knowledge base. Could you try rephrasing your question or asking about a related topic?",
        answerMetadata: {
          type: "no_results",
          confidence: 0,
          sourceCount: 0,
        },
      };
    }

    // Use the top result for quick answer
    const topResult = searchResults[0];
    const content = topResult.content || "";

    const quickPrompt = `
Answer this question briefly using the provided context:

Question: "${userQuery}"

Context:
${content}

Provide a concise, direct answer in 2-3 sentences. If the context doesn't contain enough information, say so.`;

    try {
      const result = await this.model.generateContent(quickPrompt);
      const answer = result.response.text();

      return {
        answer: answer,
        answerMetadata: {
          type: "quick",
          confidence: topResult.compositeScore || topResult.similarity || 0.5,
          sourceCount: 1,
        },
        sources: {
          sections: [topResult.document_section],
          totalSources: 1,
        },
      };
    } catch (error) {
      console.error("Error generating quick answer:", error);

      return {
        answer: content.substring(0, 300) + "...",
        answerMetadata: {
          type: "fallback",
          confidence: 0.3,
          sourceCount: 1,
        },
      };
    }
  }
}

module.exports = ContextAwareAnswerGenerator;
