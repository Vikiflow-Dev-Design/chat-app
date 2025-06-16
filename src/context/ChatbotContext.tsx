import React, { createContext, useContext, useState } from "react";
import type { Chatbot, ChatbotConfig } from "../types/chatbot";
import { chatbotService } from "@/services/chatbotService";
import { toast } from "sonner";
import { useAuth } from "@clerk/clerk-react";

interface ChatbotContextType {
  chatbots: Chatbot[];
  loading: boolean;
  error: string | null;
  getChatbot: (id: string) => Promise<Chatbot | undefined>;
  createChatbot: (config: ChatbotConfig) => Promise<Chatbot>;
  updateChatbot: (
    id: string,
    updates: Partial<ChatbotConfig>
  ) => Promise<Chatbot>;
  deleteChatbot: (id: string) => Promise<boolean>;
  deleteChatbots: (chatbotIds: string[]) => Promise<{
    success: boolean;
    totalDeleted: number;
    totalRequested: number;
  }>;
  deleteAllChatbots: () => Promise<{
    success: boolean;
    totalDeleted: number;
    totalRequested: number;
  }>;
  refreshChatbots: () => Promise<void>;
}

const ChatbotContext = createContext<ChatbotContextType | undefined>(undefined);

export const ChatbotProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [chatbots, setChatbots] = useState<Chatbot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Function to fetch all chatbots
  const fetchChatbots = async () => {
    setLoading(true);
    try {
      const fetchedChatbots = await chatbotService.getChatbots();
      setChatbots(fetchedChatbots);
      setError(null);
    } catch (err: any) {
      console.error("Error fetching chatbots:", err);
      setError("Failed to load chatbots");
      toast.error("Failed to load chatbots");
    } finally {
      setLoading(false);
    }
  };

  // We no longer automatically fetch chatbots on context initialization
  // Instead, components will call refreshChatbots when they need the data

  // Get a single chatbot by ID
  const getChatbot = async (id: string): Promise<Chatbot | undefined> => {
    try {
      // First check if we already have it loaded
      const existingBot = chatbots.find((bot) => bot.id === id);
      if (existingBot) return existingBot;

      // Otherwise fetch from API
      return await chatbotService.getChatbot(id);
    } catch (err) {
      console.error("Error fetching chatbot:", err);
      toast.error("Failed to load chatbot details");
      return undefined;
    }
  };

  // Create a new chatbot
  const createChatbot = async (config: ChatbotConfig): Promise<Chatbot> => {
    try {
      console.log("Creating chatbot with config:", config);
      const newChatbot = await chatbotService.createChatbot(config);
      // Add to local state
      setChatbots((prev) => [...prev, newChatbot]);
      toast.success("Chatbot created successfully");
      return newChatbot;
    } catch (err) {
      console.error("Error creating chatbot:", err);
      toast.error("Failed to create chatbot");
      throw err;
    }
  };

  // Update an existing chatbot
  const updateChatbot = async (
    id: string,
    updates: Partial<ChatbotConfig>
  ): Promise<Chatbot> => {
    try {
      const updatedBot = await chatbotService.updateChatbot(id, updates);

      // Update local state
      setChatbots((prev) =>
        prev.map((bot) => (bot.id === id ? updatedBot : bot))
      );

      toast.success("Chatbot updated successfully");
      return updatedBot;
    } catch (err) {
      console.error("Error updating chatbot:", err);
      toast.error("Failed to update chatbot");
      throw err;
    }
  };

  // Delete a chatbot and all related data
  const deleteChatbot = async (id: string): Promise<boolean> => {
    try {
      const result = await chatbotService.deleteChatbot(id);

      if (result.success) {
        // Remove from local state
        setChatbots((prev) => prev.filter((bot) => bot.id !== id));

        // Show detailed success message if available
        if (result.deletedData) {
          const { products, sessions, messages } = result.deletedData;
          toast.success(
            `Chatbot deleted successfully along with ${products} products, ${sessions} conversations, and ${messages} messages.`
          );
        } else {
          toast.success("Chatbot deleted successfully");
        }
      }

      return result.success;
    } catch (err) {
      console.error("Error deleting chatbot:", err);
      toast.error("Failed to delete chatbot");
      throw err;
    }
  };

  // Delete multiple chatbots
  const deleteChatbots = async (
    chatbotIds: string[]
  ): Promise<{
    success: boolean;
    totalDeleted: number;
    totalRequested: number;
  }> => {
    try {
      const result = await chatbotService.deleteChatbots(chatbotIds);

      if (result.success) {
        // Remove deleted chatbots from local state
        const successfullyDeleted = result.results
          .filter((r) => r.success)
          .map((r) => r.chatbotId);

        setChatbots((prev) =>
          prev.filter((bot) => !successfullyDeleted.includes(bot.id))
        );

        if (result.totalDeleted === result.totalRequested) {
          toast.success(`Successfully deleted ${result.totalDeleted} chatbots`);
        } else {
          toast.warning(
            `Deleted ${result.totalDeleted} out of ${result.totalRequested} chatbots`
          );
        }

        return {
          success: true,
          totalDeleted: result.totalDeleted,
          totalRequested: result.totalRequested,
        };
      }
      return {
        success: false,
        totalDeleted: 0,
        totalRequested: chatbotIds.length,
      };
    } catch (err) {
      console.error("Error deleting chatbots:", err);
      toast.error("Failed to delete chatbots");
      return {
        success: false,
        totalDeleted: 0,
        totalRequested: chatbotIds.length,
      };
    }
  };

  // Delete all chatbots
  const deleteAllChatbots = async (): Promise<{
    success: boolean;
    totalDeleted: number;
    totalRequested: number;
  }> => {
    try {
      const result = await chatbotService.deleteAllChatbots();

      if (result.success) {
        // Clear all chatbots from local state
        setChatbots([]);
        toast.success(
          `Successfully deleted all ${result.totalDeleted} chatbots`
        );
        return result;
      }
      return {
        success: false,
        totalDeleted: 0,
        totalRequested: 0,
      };
    } catch (err) {
      console.error("Error deleting all chatbots:", err);
      toast.error("Failed to delete all chatbots");
      return {
        success: false,
        totalDeleted: 0,
        totalRequested: 0,
      };
    }
  };

  // Function to manually refresh chatbots
  const refreshChatbots = async () => {
    await fetchChatbots();
  };

  const value = {
    chatbots,
    loading,
    error,
    getChatbot,
    createChatbot,
    updateChatbot,
    deleteChatbot,
    deleteChatbots,
    deleteAllChatbots,
    refreshChatbots,
  };

  return (
    <ChatbotContext.Provider value={value}>{children}</ChatbotContext.Provider>
  );
};

// Custom hook to use the chatbot context
export const useChatbots = () => {
  const context = useContext(ChatbotContext);
  if (context === undefined) {
    throw new Error("useChatbots must be used within a ChatbotProvider");
  }
  return context;
};
