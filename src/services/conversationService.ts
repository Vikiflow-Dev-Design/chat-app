import { apiRequest } from "@/utils/api";

export interface UserInfo {
  name: string;
  email: string;
  phone?: string;
}

export interface Conversation {
  _id: string;
  sessionId: string;
  chatbotId: string;
  userId?: string;
  userInfo?: UserInfo;
  startedAt: Date;
  endedAt?: Date;
  messageCount: number;
  lastMessage?: string;
}

export interface ConversationDetails {
  _id: string;
  sessionId: string;
  chatbotId: string;
  userId?: string;
  userInfo?: UserInfo;
  startedAt: Date;
  endedAt?: Date;
  messages: {
    _id: string;
    content: string;
    role: "user" | "assistant";
    timestamp: Date;
  }[];
}

const API_URL = `${import.meta.env.VITE_API_URL}/chat`;

export const conversationService = {
  /**
   * Get all conversations for a specific chatbot
   */
  getConversations: async (chatbotId: string): Promise<Conversation[]> => {
    console.log("Fetching conversations for chatbot ID:", chatbotId);

    try {
      const conversations = await apiRequest<Conversation[]>(
        `${API_URL}/conversations/${chatbotId}`
      );

      console.log("Received conversations:", conversations);

      return conversations.map((conversation) => ({
        ...conversation,
        startedAt: new Date(conversation.startedAt),
        endedAt: conversation.endedAt
          ? new Date(conversation.endedAt)
          : undefined,
      }));
    } catch (error) {
      console.error("Error fetching conversations:", error);
      throw error;
    }
  },

  /**
   * Get details of a specific conversation including all messages
   */
  getConversationDetails: async (
    sessionId: string
  ): Promise<ConversationDetails> => {
    const conversation = await apiRequest<ConversationDetails>(
      `${API_URL}/session/${sessionId}`
    );

    return {
      ...conversation,
      startedAt: new Date(conversation.startedAt),
      endedAt: conversation.endedAt
        ? new Date(conversation.endedAt)
        : undefined,
      messages: conversation.messages.map((message) => ({
        ...message,
        timestamp: new Date(message.timestamp),
      })),
    };
  },

  /**
   * Delete a conversation
   */
  deleteConversation: async (sessionId: string): Promise<boolean> => {
    await apiRequest<any>(`${API_URL}/session/${sessionId}`, {
      method: "DELETE",
    });

    return true;
  },
};
