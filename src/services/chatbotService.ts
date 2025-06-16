import type { Chatbot, ChatbotConfig } from "@/types/chatbot";
import { apiRequest } from "@/utils/api";

// Endpoint for chatbot API
const CHATBOTS_ENDPOINT = "/chatbots";

/**
 * Service for interacting with chatbot API
 */
export const chatbotService = {
  /**
   * Get all chatbots for the current user
   */
  async getChatbots(): Promise<Chatbot[]> {
    try {
      const chatbots = await apiRequest<any[]>(CHATBOTS_ENDPOINT);

      // Transform MongoDB date strings to Date objects
      return chatbots.map((bot: any) => ({
        ...bot,
        id: bot._id || bot.id,
        createdAt: new Date(bot.createdAt),
        updatedAt: new Date(bot.updatedAt),
        stats: {
          totalMessages: bot.stats?.totalMessages || 0,
          activeUsers: bot.stats?.activeUsers || 0,
          averageRating: bot.stats?.averageRating || 0,
        },
      }));
    } catch (error) {
      console.error("Failed to fetch chatbots:", error);
      throw error;
    }
  },

  /**
   * Get a single chatbot by ID
   */
  async getChatbot(id: string): Promise<Chatbot> {
    try {
      const chatbot = await apiRequest<any>(`${CHATBOTS_ENDPOINT}/${id}`);

      return {
        ...chatbot,
        id: chatbot._id || chatbot.id,
        createdAt: new Date(chatbot.createdAt),
        updatedAt: new Date(chatbot.updatedAt),
        stats: {
          totalMessages: chatbot.stats?.totalMessages || 0,
          activeUsers: chatbot.stats?.activeUsers || 0,
          averageRating: chatbot.stats?.averageRating || 0,
        },
      };
    } catch (error) {
      console.error(`Failed to fetch chatbot with id ${id}:`, error);
      throw error;
    }
  },

  /**
   * Create a new chatbot
   */
  async createChatbot(config: ChatbotConfig): Promise<Chatbot> {
    try {
      // Map frontend model types to match backend model types
      const payload = {
        name: config.name,
        description: config.description || "",
        initialMessage: config.initialMessage,
        behaviorPrompt: config.behaviorPrompt,
        model: config.model, // Use the model directly as we now have matching names
        temperature: config.temperature,
        maxTokens: config.maxTokens,
        isPublic: config.isPublic,
      };

      const chatbot = await apiRequest<any>(CHATBOTS_ENDPOINT, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      return {
        ...chatbot,
        id: chatbot._id || chatbot.id,
        createdAt: new Date(chatbot.createdAt),
        updatedAt: new Date(chatbot.updatedAt),
        stats: {
          totalMessages: chatbot.stats?.totalMessages || 0,
          activeUsers: chatbot.stats?.activeUsers || 0,
          averageRating: chatbot.stats?.averageRating || 0,
        },
      };
    } catch (error) {
      console.error("Failed to create chatbot:", error);
      throw error;
    }
  },

  /**
   * Update an existing chatbot
   */
  async updateChatbot(
    id: string,
    updates: Partial<ChatbotConfig>
  ): Promise<Chatbot> {
    try {
      // Map frontend model types to match backend model types
      const payload: any = {};

      if (updates.name) payload.name = updates.name;
      if (updates.description !== undefined)
        payload.description = updates.description;
      if (updates.initialMessage)
        payload.initialMessage = updates.initialMessage;
      if (updates.behaviorPrompt)
        payload.behaviorPrompt = updates.behaviorPrompt;
      if (updates.model) {
        payload.model = updates.model; // Use the model directly as we now have matching names
      }
      if (updates.temperature !== undefined)
        payload.temperature = updates.temperature;
      if (updates.maxTokens !== undefined)
        payload.maxTokens = updates.maxTokens;
      if (updates.isPublic !== undefined) payload.isPublic = updates.isPublic;

      const chatbot = await apiRequest<any>(`${CHATBOTS_ENDPOINT}/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      return {
        ...chatbot,
        id: chatbot._id || chatbot.id,
        createdAt: new Date(chatbot.createdAt),
        updatedAt: new Date(chatbot.updatedAt),
        stats: {
          totalMessages: chatbot.stats?.totalMessages || 0,
          activeUsers: chatbot.stats?.activeUsers || 0,
          averageRating: chatbot.stats?.averageRating || 0,
        },
      };
    } catch (error) {
      console.error(`Failed to update chatbot with id ${id}:`, error);
      throw error;
    }
  },

  /**
   * Delete a chatbot and all related data
   */
  async deleteChatbot(id: string): Promise<{
    success: boolean;
    deletedData?: {
      chatbot: number;
      knowledge: number;
      products: number;
      sessions: number;
      messages: number;
    };
  }> {
    try {
      const response = await apiRequest<{
        message: string;
        deletedData: {
          chatbot: number;
          knowledge: number;
          products: number;
          sessions: number;
          messages: number;
        };
      }>(`${CHATBOTS_ENDPOINT}/${id}`, {
        method: "DELETE",
      });

      return {
        success: true,
        deletedData: response.deletedData,
      };
    } catch (error) {
      console.error(`Failed to delete chatbot with id ${id}:`, error);
      throw error;
    }
  },

  /**
   * Delete multiple chatbots
   */
  async deleteChatbots(chatbotIds: string[]): Promise<{
    success: boolean;
    totalDeleted: number;
    totalRequested: number;
    results: Array<{
      chatbotId: string;
      success: boolean;
      error?: string;
      deletedData?: {
        products: number;
        sessions: number;
        messages: number;
      };
    }>;
  }> {
    try {
      const response = await apiRequest<{
        message: string;
        totalDeleted: number;
        totalRequested: number;
        results: Array<{
          chatbotId: string;
          success: boolean;
          error?: string;
          deletedData?: {
            products: number;
            sessions: number;
            messages: number;
          };
        }>;
      }>(`${CHATBOTS_ENDPOINT}/bulk`, {
        method: "DELETE",
        body: JSON.stringify({ chatbotIds }),
      });

      return {
        success: true,
        totalDeleted: response.totalDeleted,
        totalRequested: response.totalRequested,
        results: response.results,
      };
    } catch (error) {
      console.error("Failed to delete chatbots:", error);
      throw error;
    }
  },

  /**
   * Delete all chatbots for the current user
   */
  async deleteAllChatbots(): Promise<{
    success: boolean;
    totalDeleted: number;
    totalRequested: number;
  }> {
    try {
      const response = await apiRequest<{
        message: string;
        totalDeleted: number;
        totalRequested: number;
      }>(`${CHATBOTS_ENDPOINT}/all`, {
        method: "DELETE",
      });

      return {
        success: true,
        totalDeleted: response.totalDeleted,
        totalRequested: response.totalRequested,
      };
    } catch (error) {
      console.error("Failed to delete all chatbots:", error);
      throw error;
    }
  },
};
