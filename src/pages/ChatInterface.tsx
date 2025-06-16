import { useState, useRef, useEffect } from "react";
import { useParams, useLocation } from "react-router-dom";
import { Send, MessageSquare, History, X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChatMessage } from "@/components/ChatMessage";
import { useChatbots } from "@/context/ChatbotContext";
import { Chatbot, UserInfo } from "@/types/chatbot";
import {
  availableFunctions,
  formatProductsForDisplay,
  parseFunctionCall,
  FunctionCall,
} from "@/utils/functionCalling";
import { UserInfoForm } from "@/components/chat/UserInfoForm";
import { getOrCreateVisitorId } from "@/utils/visitorId";
import { ConversationHistory } from "@/components/chat/ConversationHistory";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Message {
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
}

const ChatInterface = () => {
  const { chatbotId } = useParams<{ chatbotId: string }>();
  const location = useLocation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [chatbot, setChatbot] = useState<Chatbot | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [showUserInfoForm, setShowUserInfoForm] = useState(false); // Default to false, we'll check for visitor ID
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { getChatbot } = useChatbots();
  const [visitorId] = useState<string>(getOrCreateVisitorId());
  const [activeTab, setActiveTab] = useState<string>("chat");

  // Get sessionId from URL query parameter if available
  const queryParams = new URLSearchParams(location.search);
  const sessionIdFromUrl = queryParams.get("sessionId");

  // Fetch chatbot data and initialize session
  useEffect(() => {
    const initializeChat = async () => {
      if (!chatbotId) return;

      try {
        // Fetch chatbot data
        const fetchedChatbot = await getChatbot(chatbotId);
        if (fetchedChatbot) {
          setChatbot(fetchedChatbot);

          // Check if we have a sessionId from URL
          if (sessionIdFromUrl) {
            try {
              // Load the specific session from URL
              const sessionResponse = await fetch(
                `${
                  import.meta.env.VITE_API_URL
                }/chat/session/${sessionIdFromUrl}`
              );
              const sessionData = await sessionResponse.json();

              setSessionId(sessionIdFromUrl);

              if (sessionData.messages) {
                setMessages(
                  sessionData.messages.map((msg: any) => ({
                    content: msg.content,
                    role: msg.role,
                    timestamp: new Date(msg.timestamp),
                  }))
                );
              }
            } catch (error) {
              console.error("Error loading session from URL:", error);
              // If there's an error loading the specific session, fall back to visitor ID logic
              handleVisitorIdInitialization();
            }
          } else if (visitorId) {
            // No sessionId in URL, use visitor ID logic
            handleVisitorIdInitialization();
          } else {
            // If no visitor ID, show the user info form
            setShowUserInfoForm(true);
          }
        }
      } catch (error) {
        console.error("Error initializing chat:", error);
      }
    };

    // Helper function to handle visitor ID initialization
    const handleVisitorIdInitialization = async () => {
      try {
        // Try to fetch existing conversations for this visitor and chatbot
        const response = await fetch(
          `${
            import.meta.env.VITE_API_URL
          }/chat/visitor-conversations?visitorId=${visitorId}&chatbotId=${chatbotId}`
        );
        const conversations = await response.json();

        if (conversations && conversations.length > 0) {
          // Use the most recent conversation
          const mostRecent = conversations[0];
          setSessionId(mostRecent.sessionId);

          // Load messages for this session
          const sessionResponse = await fetch(
            `${import.meta.env.VITE_API_URL}/chat/session/${
              mostRecent.sessionId
            }`
          );
          const sessionData = await sessionResponse.json();

          if (sessionData.messages) {
            setMessages(
              sessionData.messages.map((msg: any) => ({
                content: msg.content,
                role: msg.role,
                timestamp: new Date(msg.timestamp),
              }))
            );
          }
        } else {
          // No existing conversations, create a new session
          await createSessionWithVisitorId();
        }
      } catch (error) {
        console.error("Error fetching visitor conversations:", error);
        // If there's an error, fall back to creating a new session
        await createSessionWithVisitorId();
      }
    };

    initializeChat();
  }, [chatbotId, getChatbot, visitorId, sessionIdFromUrl]);

  // Function to create a session with visitor ID
  const createSessionWithVisitorId = async () => {
    if (!chatbotId) return;

    try {
      setIsLoading(true);

      // Create a new chat session with visitor ID
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/chat/session`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            chatbotId,
            visitorId,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to create chat session");
      }

      const data = await response.json();
      setSessionId(data.sessionId);

      // If there's an initial message from the API, add it
      if (data.messages && data.messages.length > 0) {
        setMessages(
          data.messages.map((msg: any) => ({
            content: msg.content,
            role: msg.role,
            timestamp: new Date(msg.timestamp),
          }))
        );
      }

      // Switch to chat tab
      setActiveTab("chat");
    } catch (error) {
      console.error("Error creating chat session:", error);
      // Show error message to user
      alert("Failed to start chat session. Please try again.");
      // If we can't create a session with visitor ID, show the user info form
      setShowUserInfoForm(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to handle selecting a conversation
  const handleSelectConversation = async (selectedSessionId: string) => {
    if (selectedSessionId === sessionId) {
      // If already selected, just switch to chat tab
      setActiveTab("chat");
      return;
    }

    try {
      setIsLoading(true);

      // Load the selected session
      const sessionResponse = await fetch(
        `${import.meta.env.VITE_API_URL}/chat/session/${selectedSessionId}`
      );

      if (!sessionResponse.ok) {
        throw new Error("Failed to load conversation");
      }

      const sessionData = await sessionResponse.json();

      // Update state with the selected session
      setSessionId(selectedSessionId);

      if (sessionData.messages) {
        setMessages(
          sessionData.messages.map((msg: any) => ({
            content: msg.content,
            role: msg.role,
            timestamp: new Date(msg.timestamp),
          }))
        );
      } else {
        setMessages([]);
      }

      // Switch to chat tab
      setActiveTab("chat");
    } catch (error) {
      console.error("Error loading conversation:", error);
      alert("Failed to load conversation. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Function to start a new conversation
  const handleNewConversation = async () => {
    await createSessionWithVisitorId();
  };

  useEffect(() => {
    // Initialize with chatbot's greeting message only after user info is collected
    if (
      chatbot?.initialMessage &&
      messages.length === 0 &&
      !showUserInfoForm &&
      sessionId
    ) {
      setMessages([
        {
          content: chatbot.initialMessage,
          role: "assistant",
          timestamp: new Date(),
        },
      ]);
    }
  }, [chatbot, messages.length, showUserInfoForm, sessionId]);

  useEffect(() => {
    // Scroll to bottom when new messages come in
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]"
      );
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  // Handle function calls from the LLM
  const handleFunctionCall = async (
    functionCall: FunctionCall
  ): Promise<string> => {
    const { name, arguments: args } = functionCall;

    switch (name) {
      case "getProducts":
        if (!chatbotId) {
          return "Error: Could not identify the current chatbot.";
        }
        const products = await availableFunctions.getProducts(chatbotId);
        return formatProductsForDisplay(products);

      case "getProduct":
        if (!args.productId) {
          return "Error: No product ID provided.";
        }
        const product = await availableFunctions.getProduct(args.productId);
        if (!product) {
          return "Sorry, I couldn't find that product.";
        }
        return `${product.name}: ${
          product.description
        }. Price: $${product.price.toFixed(2)}. ${
          product.inStock ? "In stock" : "Out of stock"
        }`;

      default:
        return `Sorry, I don't know how to perform the function "${name}".`;
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading || !chatbot) return;

    // If we don't have a session ID yet, we need to create one
    if (!sessionId) {
      alert("Please provide your information to start the conversation.");
      return;
    }

    const userInput = input.trim();
    setInput("");
    setIsLoading(true);

    // Add user message to UI only (don't save to backend yet)
    const tempUserMessage: Message = {
      content: userInput,
      role: "user",
      timestamp: new Date(),
    };

    // Add to UI immediately for better UX
    setMessages((prev) => [...prev, tempUserMessage]);

    try {
      // Send message to backend API - this will save both user message and AI response
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/chat/message`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sessionId,
            content: userInput,
            visitorId,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`API request failed with status: ${response.status}`);
      }

      const data = await response.json();

      // The backend already saved both messages, so we just need to update the UI
      // with the AI response (user message is already shown)
      const assistantMessage: Message = {
        content: data.message.content,
        role: "assistant",
        timestamp: new Date(data.message.timestamp),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error getting response from chatbot:", error);

      // Show error message in UI
      const errorMessage: Message = {
        content:
          "Sorry, I couldn't process your request. Please try again later.",
        role: "assistant",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Function to handle user info submission
  const handleUserInfoSubmit = async (info: UserInfo) => {
    if (!chatbotId || !chatbot) return;

    setUserInfo(info);
    setIsLoading(true);

    try {
      // Create a new chat session with user info and visitor ID
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/chat/session`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            chatbotId,
            userInfo: info,
            visitorId, // Include the visitor ID
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to create chat session");
      }

      const data = await response.json();
      setSessionId(data.sessionId);

      // If there's an initial message from the API, add it
      if (data.messages && data.messages.length > 0) {
        setMessages(
          data.messages.map((msg: any) => ({
            content: msg.content,
            role: msg.role,
            timestamp: new Date(msg.timestamp),
          }))
        );
      }

      // Hide the form and show the chat interface
      setShowUserInfoForm(false);
    } catch (error) {
      console.error("Error creating chat session:", error);
      // Show error message to user
      alert("Failed to start chat session. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 py-4 px-6">
        <h1 className="text-xl font-bold truncate">
          {chatbot ? chatbot.name : "Chat"}
        </h1>
        {chatbot?.description && (
          <p className="text-sm text-muted-foreground">{chatbot.description}</p>
        )}
      </header>

      {/* Main content area */}
      <div className="flex-grow">
        {showUserInfoForm && chatbot ? (
          <div className="flex items-center justify-center h-full p-4">
            <UserInfoForm
              onSubmit={handleUserInfoSubmit}
              chatbotName={chatbot.name}
            />
          </div>
        ) : (
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="h-full flex flex-col"
          >
            <div className="border-b px-4">
              <TabsList className="h-12">
                <TabsTrigger value="chat" className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Chat
                </TabsTrigger>
                <TabsTrigger
                  value="history"
                  className="flex items-center gap-2"
                >
                  <History className="h-4 w-4" />
                  History
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent
              value="chat"
              className="flex-1 flex flex-col p-0 m-0 data-[state=active]:flex data-[state=inactive]:hidden"
            >
              {/* Chat messages */}
              <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
                <div className="max-w-3xl mx-auto space-y-6">
                  {messages.map((message, index) => (
                    <ChatMessage
                      key={index}
                      content={message.content}
                      role={message.role}
                      timestamp={message.timestamp}
                    />
                  ))}
                  {isLoading && (
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
                </div>
              </ScrollArea>

              {/* Input area */}
              <footer className="bg-white border-t border-gray-200 p-4">
                <div className="max-w-3xl mx-auto flex gap-2">
                  <Input
                    placeholder="Type your message..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isLoading}
                    className="flex-grow"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!input.trim() || isLoading || !chatbot}
                    size="icon"
                  >
                    <Send className="h-5 w-5" />
                  </Button>
                </div>
              </footer>
            </TabsContent>

            <TabsContent
              value="history"
              className="flex-1 p-0 m-0 data-[state=active]:block data-[state=inactive]:hidden"
            >
              {chatbotId && visitorId && (
                <ConversationHistory
                  chatbotId={chatbotId}
                  visitorId={visitorId}
                  onSelectConversation={handleSelectConversation}
                  onNewConversation={handleNewConversation}
                  activeSessionId={sessionId || undefined}
                />
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
};

// Updated function to interact with Gemini API with function calling support
async function fetchGeminiResponse(
  userMessage: string,
  systemPrompt: string,
  chatbotId: string
): Promise<string> {
  try {
    // Replace with your actual API key
    const API_KEY = "AIzaSyDPgk9vy7VyILDyKUXeugJ54l_jg-z-6Vs";

    // Function definitions are defined in the prompt directly

    // Enhance system prompt with function calling instructions
    const enhancedPrompt = `${systemPrompt}

You have access to the following functions to help answer user questions about products:
- getProducts: Get all products available
- getProduct: Get details about a specific product

When a user asks about products, use the getProducts function by responding with a function call in this exact format:
<function_call name="getProducts" arguments={"chatbotId":"${chatbotId}"}>

Example user questions that should trigger the getProducts function:
- "What products do you have?"
- "Show me your products"
- "What do you sell?"
- "What items are available?"

For specific product inquiries, use the getProduct function with the product ID.

User message: ${userMessage}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-04-17:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: enhancedPrompt }],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`API request failed with status: ${response.status}`);
    }

    const data = await response.json();

    // Safely extract text from the response
    if (
      data.candidates &&
      data.candidates[0] &&
      data.candidates[0].content &&
      data.candidates[0].content.parts &&
      data.candidates[0].content.parts[0] &&
      data.candidates[0].content.parts[0].text
    ) {
      return data.candidates[0].content.parts[0].text;
    }

    return "I'm not sure how to respond to that.";
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw error;
  }
}

export default ChatInterface;
