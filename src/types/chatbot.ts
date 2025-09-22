/**
 * Chatbot Types
 * These interfaces define the structure of our chatbot data
 */

export interface Chatbot {
  id: string;
  name: string;
  description?: string;
  initialMessage: string;
  behaviorPrompt: string;
  model: AIModel;
  temperature: number;
  maxTokens: number;
  createdAt: Date;
  updatedAt: Date;
  userId: string; // Owner of the chatbot
  publicId?: string; // Used for public sharing
  isPublic: boolean;
  stats: ChatbotStats;
}

export interface ChatbotStats {
  totalMessages: number;
  activeUsers: number;
  averageRating?: number;
}

export interface UserInfo {
  name: string;
  email: string;
  phone?: string;
}

export interface ChatSession {
  id: string;
  chatbotId: string;
  userId?: string; // Optional for anonymous users
  userInfo?: UserInfo; // User information for guest users
  startedAt: Date;
  endedAt?: Date;
  messages: ChatMessage[];
  metadata?: Record<string, any>; // Additional session data
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
  metadata?: Record<string, any>; // Additional message data like ratings
}

// AI model types (frontend representation)
export type AIModel =
  | "gemini-2.5-flash-preview-04-17"
  | "gemini-2.5-pro-preview-05-06"
  | "gemini-2.0-flash"
  | "gemini-2.0-flash-lite"
  | "gemini-1.5-pro"
  | "gemini-1.5-flash"
  | "gemini-1.5-flash-8b"
  | "gemma-3-1b-it";

// Configuration for creating a new chatbot
export interface ChatbotConfig {
  name: string;
  description?: string;
  initialMessage: string;
  behaviorPrompt: string;
  model: AIModel;
  temperature: number;
  maxTokens: number;
  isPublic: boolean;
}
