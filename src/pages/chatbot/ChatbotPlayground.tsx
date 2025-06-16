import { useParams } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useChatbots } from "@/context/ChatbotContext";
import { useEffect, useState, useRef } from "react";
import { Chatbot } from "@/types/chatbot";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, RefreshCw, Bot, User } from "lucide-react";
import { chatService } from "@/services/chatService";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IntelligentRAGTest } from "@/components/test/IntelligentRAGTest";

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
}

const ChatbotPlayground = () => {
  const { id } = useParams();
  const { getChatbot } = useChatbots();
  const [chatbot, setChatbot] = useState<Chatbot | null>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadChatbot = async () => {
      if (id) {
        try {
          setLoading(true);
          const fetchedBot = await getChatbot(id);
          if (fetchedBot) {
            setChatbot(fetchedBot);
            // Add initial message
            setMessages([
              {
                id: "initial-message",
                content: fetchedBot.initialMessage,
                role: "assistant",
                timestamp: new Date(),
              },
            ]);
          }
        } catch (error) {
          console.error("Error loading chatbot:", error);
          toast.error("Failed to load chatbot");
        } finally {
          setLoading(false);
        }
      }
    };

    loadChatbot();
  }, [id, getChatbot]);

  // Scroll to bottom when messages change
  useEffect(() => {
    // Find the parent ScrollArea's scrollable container
    if (messagesEndRef.current) {
      const scrollContainer = messagesEndRef.current.closest(
        "[data-radix-scroll-area-viewport]"
      );
      if (scrollContainer) {
        // Scroll the container to its maximum scroll height
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!userInput.trim() || !chatbot || isProcessing) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      content: userInput,
      role: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setUserInput("");
    setIsProcessing(true);

    try {
      // Convert messages to the format expected by the API
      const conversationHistory = messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      // Send message to playground endpoint
      const response = await chatService.sendPlaygroundMessage(
        chatbot.id,
        userInput,
        conversationHistory
      );

      // Add bot response
      const botMessage: Message = {
        id: `assistant-${Date.now()}`,
        content: response.message.content,
        role: "assistant",
        timestamp: new Date(response.message.timestamp),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Error getting response:", error);
      toast.error("Failed to get response from chatbot");

      // Add error message
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        content: "Sorry, I couldn't process your request. Please try again.",
        role: "assistant",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
      // Focus the input field after sending
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearChat = () => {
    if (!chatbot) return;

    setMessages([
      {
        id: "initial-message",
        content: chatbot.initialMessage,
        role: "assistant",
        timestamp: new Date(),
      },
    ]);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="inline-block animate-spin h-8 w-8 border-4 border-primary/20 border-l-primary rounded-full"></div>
      </div>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <Card className="h-full flex flex-col">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Chatbot Playground</CardTitle>
                  <CardDescription className="flex items-center">
                    <Badge
                      variant="outline"
                      className="mr-2 bg-green-100 text-green-800"
                    >
                      No messages saved
                    </Badge>
                    Test your chatbot in a sandbox environment
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearChat}
                  disabled={messages.length <= 1}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reset Chat
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col">
              <div className="bg-secondary/20 rounded-md p-4 h-[500px] flex flex-col">
                <ScrollArea className="flex-grow pr-4">
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${
                          message.role === "assistant"
                            ? "justify-start"
                            : "justify-end"
                        }`}
                      >
                        <div
                          className={`flex items-start gap-2 max-w-[80%] ${
                            message.role === "assistant"
                              ? "bg-secondary text-secondary-foreground"
                              : "bg-primary text-primary-foreground"
                          } p-3 rounded-lg`}
                        >
                          {message.role === "assistant" && (
                            <Bot className="h-5 w-5 mt-1 flex-shrink-0" />
                          )}
                          <div className="break-words">
                            <div className="whitespace-pre-wrap">
                              {message.content}
                            </div>
                            <div className="text-xs opacity-70 mt-1">
                              {message.timestamp.toLocaleTimeString()}
                            </div>
                          </div>
                          {message.role === "user" && (
                            <User className="h-5 w-5 mt-1 flex-shrink-0" />
                          )}
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
                <div className="mt-4 space-y-2">
                  <div className="flex gap-2">
                    <Input
                      ref={inputRef}
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Type your message..."
                      disabled={isProcessing}
                      className="flex-grow"
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!userInput.trim() || isProcessing}
                    >
                      {isProcessing ? (
                        <div className="animate-spin h-5 w-5 border-2 border-current border-t-transparent rounded-full" />
                      ) : (
                        <Send className="h-5 w-5" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    <span className="inline-flex items-center">
                      <svg
                        className="h-3 w-3 mr-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      Messages in the playground are not saved to the database
                    </span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Tabs defaultValue="config">
            <TabsList className="w-full mb-4">
              <TabsTrigger value="config" className="flex-1">
                Configuration
              </TabsTrigger>
              <TabsTrigger value="prompt" className="flex-1">
                Prompt
              </TabsTrigger>
              <TabsTrigger value="rag-test" className="flex-1">
                RAG Test
              </TabsTrigger>
            </TabsList>

            <TabsContent value="config">
              <Card>
                <CardHeader>
                  <CardTitle>Configuration</CardTitle>
                  <CardDescription>Current chatbot settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium">Model</h3>
                    <div className="flex items-center mt-1">
                      <Badge variant="outline" className="bg-primary/10">
                        {chatbot?.model || "Not set"}
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium">Temperature</h3>
                    <p className="text-sm text-muted-foreground">
                      {chatbot?.temperature || "Not set"}
                      {chatbot?.temperature && (
                        <span className="ml-2">
                          (
                          {chatbot.temperature <= 0.3
                            ? "More focused"
                            : chatbot.temperature >= 0.7
                            ? "More creative"
                            : "Balanced"}
                          )
                        </span>
                      )}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium">Max Tokens</h3>
                    <p className="text-sm text-muted-foreground">
                      {chatbot?.maxTokens || "Not set"}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium">Public Access</h3>
                    <p className="text-sm text-muted-foreground">
                      {chatbot?.isPublic ? "Enabled" : "Disabled"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="prompt">
              <Card>
                <CardHeader>
                  <CardTitle>Behavior Prompt</CardTitle>
                  <CardDescription>
                    Instructions that define the chatbot's behavior
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={chatbot?.behaviorPrompt || ""}
                    readOnly
                    className="min-h-[300px] bg-secondary/10"
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="rag-test">
              {chatbot && <IntelligentRAGTest chatbotId={chatbot.id} />}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </main>
  );
};

export default ChatbotPlayground;
