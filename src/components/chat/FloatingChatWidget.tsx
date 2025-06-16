import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  MessageSquare,
  X,
  MessageSquarePlus,
  Send,
  ArrowLeft,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChatSession,
  ChatMessage as ChatMessageType,
  chatService,
} from "@/services/chatService";
import { formatDistanceToNow } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { ChatMessage } from "@/components/ChatMessage";
import { getOrCreateVisitorId } from "@/utils/visitorId";

interface FloatingChatWidgetProps {
  chatbotId: string;
}

export function FloatingChatWidget({ chatbotId }: FloatingChatWidgetProps) {
  // Panel state
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<"history" | "chat">("history");

  // Conversations list state
  const [conversations, setConversations] = useState<ChatSession[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [conversationsError, setConversationsError] = useState<string | null>(
    null
  );

  // Active chat state
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [input, setInput] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [chatbotName, setChatbotName] = useState("Chat Assistant");
  const [chatbotDescription, setChatbotDescription] = useState("");

  // Visitor ID for tracking conversations
  const [visitorId] = useState<string>(getOrCreateVisitorId());

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load conversations when the panel is opened
  useEffect(() => {
    if (isOpen) {
      // On initial open, we want to show history if available
      loadConversations(true);

      // Fetch chatbot info
      fetchChatbotInfo();
    }
  }, [isOpen, chatbotId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus input when chat view is active
  useEffect(() => {
    if (view === "chat" && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [view, activeSessionId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadConversations = async (switchToHistory = false) => {
    try {
      setLoadingConversations(true);
      const data = await chatService.getConversations(chatbotId);
      setConversations(data);
      setConversationsError(null);

      // Only switch to history view if explicitly requested or if it's the initial load with no active chat
      if (switchToHistory) {
        setView("history");
      } else if (isOpen && !activeSessionId && data.length > 0) {
        // If opening the panel for the first time and there are conversations
        setView("history");
      } else if (data.length === 0 && !activeSessionId) {
        // If no conversations and no active session, start a new one automatically
        await startNewConversation();
      }
    } catch (err) {
      console.error("Failed to load conversations:", err);
      setConversationsError("Failed to load conversation history");
    } finally {
      setLoadingConversations(false);
    }
  };

  const fetchChatbotInfo = async () => {
    try {
      // Fetch chatbot info from API
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/chatbots/${chatbotId}`
      );
      if (response.ok) {
        const data = await response.json();
        setChatbotName(data.name || "Chat Assistant");
        setChatbotDescription(data.description || "");
      }
    } catch (error) {
      console.error("Failed to fetch chatbot info:", error);
    }
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);

    // If closing the panel, reset to history view for next open
    if (isOpen) {
      // Small delay to allow animation to complete
      setTimeout(() => {
        setView("history");
      }, 300);
    }
  };

  const startNewConversation = async () => {
    try {
      setSendingMessage(true);

      // Create a new session
      const response = await chatService.createSession(chatbotId);
      setActiveSessionId(response.sessionId);

      // Set initial messages if any
      if (response.messages && response.messages.length > 0) {
        setMessages(response.messages);
      } else {
        setMessages([]);
      }

      // Switch to chat view
      setView("chat");

      return response.sessionId;
    } catch (error) {
      console.error("Failed to create new conversation:", error);
      alert("Failed to start a new conversation. Please try again.");
      return null;
    } finally {
      setSendingMessage(false);
    }
  };

  const openConversation = async (sessionId: string) => {
    try {
      setSendingMessage(true);

      // Load messages for this session
      const response = await chatService.getSessionMessages(sessionId);
      setActiveSessionId(sessionId);
      setMessages(response.messages);

      // Switch to chat view
      setView("chat");
    } catch (error) {
      console.error("Failed to load conversation:", error);
      alert("Failed to load conversation. Please try again.");
    } finally {
      setSendingMessage(false);
    }
  };

  const sendMessage = async () => {
    if (!activeSessionId || !input.trim() || sendingMessage) return;

    const userMessage = input.trim();
    setInput("");

    // Add user message to UI immediately
    const tempUserMessage: ChatMessageType = {
      id: `temp-${Date.now()}`,
      sessionId: activeSessionId,
      content: userMessage,
      role: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, tempUserMessage]);

    try {
      setSendingMessage(true);

      // Send message to API
      const response = await chatService.sendMessage(
        activeSessionId,
        userMessage
      );

      // Update messages with the response
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== tempUserMessage.id),
        {
          ...tempUserMessage,
          id: `user-${Date.now()}`,
        },
        response.message,
      ]);

      // Refresh conversations list in the background without switching views
      loadConversations(false);
    } catch (error) {
      console.error("Failed to send message:", error);

      // Remove temp message and show error
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== tempUserMessage.id),
        {
          id: `error-${Date.now()}`,
          sessionId: activeSessionId,
          content: "Sorry, I couldn't process your message. Please try again.",
          role: "assistant",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const backToHistory = () => {
    setView("history");
    loadConversations(true); // Refresh the list and explicitly switch to history view
  };

  return (
    <>
      {/* Floating button */}
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={toggleChat}
          size="lg"
          className="rounded-full h-14 w-14 shadow-lg"
        >
          {isOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <MessageSquare className="h-6 w-6" />
          )}
        </Button>
      </div>

      {/* Chat panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed bottom-20 right-4 z-40 w-96 h-[600px] max-h-[80vh] bg-white rounded-lg shadow-xl border overflow-hidden"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            {view === "history" ? (
              // Conversation History View
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="p-4 border-b bg-primary text-primary-foreground">
                  <h2 className="font-semibold">My conversations</h2>
                </div>

                {/* Conversation list */}
                <div className="flex-1 overflow-y-auto">
                  {loadingConversations ? (
                    <div className="space-y-4 p-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex flex-col space-y-2">
                          <Skeleton className="h-5 w-3/4" />
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-3 w-1/2" />
                        </div>
                      ))}
                    </div>
                  ) : conversationsError ? (
                    <div className="p-4 text-center">
                      <p className="text-destructive">{conversationsError}</p>
                      <Button
                        variant="outline"
                        className="mt-2"
                        onClick={startNewConversation}
                      >
                        Start New Conversation
                      </Button>
                    </div>
                  ) : conversations.length === 0 ? (
                    <div className="p-4 text-center">
                      <p className="text-muted-foreground">
                        No conversation history found.
                      </p>
                      <Button
                        variant="outline"
                        className="mt-2"
                        onClick={startNewConversation}
                      >
                        Start New Conversation
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2 p-4">
                      {conversations.map((conversation) => (
                        <div
                          key={conversation.id}
                          className="p-3 rounded-md cursor-pointer transition-colors hover:bg-muted"
                          onClick={() =>
                            openConversation(conversation.sessionId)
                          }
                        >
                          <div className="flex justify-between items-start">
                            <h3 className="font-medium truncate">
                              {conversation.title}
                            </h3>
                            <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                              {formatDistanceToNow(
                                new Date(conversation.lastMessageAt),
                                { addSuffix: true }
                              )}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground truncate mt-1">
                            {conversation.lastMessage}
                          </p>
                          <div className="text-xs text-muted-foreground mt-1">
                            {conversation.messageCount} messages
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer with new conversation button */}
                <div className="p-4 border-t">
                  <Button className="w-full" onClick={startNewConversation}>
                    <MessageSquarePlus className="h-4 w-4 mr-2" />
                    New conversation
                  </Button>
                </div>
              </div>
            ) : (
              // Chat View
              <div className="flex flex-col h-full">
                {/* Chat Header */}
                <div className="p-4 border-b bg-primary text-primary-foreground flex items-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={backToHistory}
                    className="mr-2 text-primary-foreground hover:text-primary-foreground/80 hover:bg-primary-foreground/10"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                  <div>
                    <h2 className="font-semibold">{chatbotName}</h2>
                    {chatbotDescription && (
                      <p className="text-xs text-primary-foreground/80">
                        {chatbotDescription}
                      </p>
                    )}
                  </div>
                </div>

                {/* Chat Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((message) => (
                    <ChatMessage
                      key={message.id}
                      content={message.content}
                      role={message.role}
                      timestamp={new Date(message.timestamp)}
                    />
                  ))}
                  {sendingMessage && (
                    <div className="flex justify-start">
                      <div className="bg-secondary text-foreground px-4 py-2 rounded-lg">
                        <div className="flex space-x-2">
                          <div className="w-2 h-2 rounded-full bg-foreground/60 animate-bounce" />
                          <div
                            className="w-2 h-2 rounded-full bg-foreground/60 animate-bounce"
                            style={{ animationDelay: "0.2s" }}
                          />
                          <div
                            className="w-2 h-2 rounded-full bg-foreground/60 animate-bounce"
                            style={{ animationDelay: "0.4s" }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Chat Input */}
                <div className="p-4 border-t">
                  <div className="flex space-x-2">
                    <Input
                      ref={inputRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Type your message..."
                      className="flex-grow"
                      disabled={sendingMessage}
                    />
                    <Button
                      onClick={sendMessage}
                      disabled={!input.trim() || sendingMessage}
                      size="icon"
                    >
                      <Send className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
