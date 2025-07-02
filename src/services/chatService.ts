import { getOrCreateVisitorId } from "@/utils/visitorId";
import { apiRequest } from "@/utils/api";

// Endpoint for chat API
const CHAT_ENDPOINT = "/chat";

export interface ChatMessage {
  id: string;
  sessionId: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
}

export interface ChatSession {
  id: string;
  sessionId: string;
  chatbotId: string;
  title: string;
  startedAt: Date;
  lastMessageAt: Date;
  messageCount: number;
  lastMessage: string;
}

export interface ChatSessionResponse {
  sessionId: string;
  messages: ChatMessage[];
}

export interface ChatMessageResponse {
  message: ChatMessage;
}

export const chatService = {
  // Get visitor ID
  getVisitorId: () => {
    return getOrCreateVisitorId();
  },

  // Playground chat - doesn't save messages
  sendPlaygroundMessage: async (
    chatbotId: string,
    message: string,
    conversationHistory: { role: string; content: string }[] = []
  ): Promise<ChatMessageResponse> => {
    return apiRequest<ChatMessageResponse>(`${CHAT_ENDPOINT}/playground`, {
      method: "POST",
      body: JSON.stringify({ chatbotId, message, conversationHistory }),
    });
  },

  // Get all conversations for the current visitor
  getConversations: async (chatbotId?: string): Promise<ChatSession[]> => {
    const visitorId = getOrCreateVisitorId();
    const queryParams = chatbotId
      ? `?visitorId=${visitorId}&chatbotId=${chatbotId}`
      : `?visitorId=${visitorId}`;

    return apiRequest<ChatSession[]>(
      `${CHAT_ENDPOINT}/visitor-conversations${queryParams}`
    );
  },

  // Create a new chat session
  createSession: async (chatbotId: string): Promise<ChatSessionResponse> => {
    const visitorId = getOrCreateVisitorId();

    return apiRequest<ChatSessionResponse>(`${CHAT_ENDPOINT}/session`, {
      method: "POST",
      body: JSON.stringify({ chatbotId, visitorId }),
    });
  },

  // Get messages for a session
  getSessionMessages: async (
    sessionId: string
  ): Promise<ChatSessionResponse> => {
    return apiRequest<ChatSessionResponse>(
      `${CHAT_ENDPOINT}/session/${sessionId}`
    );
  },

  // Send a message to the chatbot
  sendMessage: async (
    sessionId: string,
    content: string
  ): Promise<ChatMessageResponse> => {
    const visitorId = getOrCreateVisitorId();

    return apiRequest<ChatMessageResponse>(`${CHAT_ENDPOINT}/message`, {
      method: "POST",
      body: JSON.stringify({ sessionId, content, visitorId }),
    });
  },

  // End a chat session
  endSession: async (sessionId: string): Promise<void> => {
    return apiRequest<void>(`${CHAT_ENDPOINT}/session/${sessionId}/end`, {
      method: "POST",
    });
  },
};
