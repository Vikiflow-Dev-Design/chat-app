import { useState, useRef, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, X, MessageSquare, History } from 'lucide-react';
import { ChatMessage, ChatSession, chatService } from '@/services/chatService';
import { ConversationsList } from './ConversationsList';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface ChatPanelProps {
  chatbotId: string;
  onClose: () => void;
}

export function ChatPanel({ chatbotId, onClose }: ChatPanelProps) {
  const [activeTab, setActiveTab] = useState('chat');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Initialize chat session or load most recent one
  useEffect(() => {
    const initializeChat = async () => {
      try {
        setInitializing(true);
        // Get conversations for this chatbot
        const conversations = await chatService.getConversations(chatbotId);
        
        if (conversations && conversations.length > 0) {
          // Use the most recent conversation
          const mostRecent = conversations[0];
          setSessionId(mostRecent.sessionId);
          
          // Load messages for this session
          const sessionData = await chatService.getSessionMessages(mostRecent.sessionId);
          setMessages(sessionData.messages);
        } else {
          // Create a new session if no conversations exist
          await createNewSession();
        }
      } catch (error) {
        console.error('Failed to initialize chat:', error);
        toast.error('Failed to start chat. Please try again.');
        // Create a new session as fallback
        await createNewSession();
      } finally {
        setInitializing(false);
      }
    };

    initializeChat();
  }, [chatbotId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus input when session is initialized
  useEffect(() => {
    if (!initializing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [initializing]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const createNewSession = async () => {
    try {
      setLoading(true);
      const response = await chatService.createSession(chatbotId);
      setSessionId(response.sessionId);
      setMessages(response.messages);
      setActiveTab('chat'); // Switch to chat tab
      return response.sessionId;
    } catch (error) {
      console.error('Failed to create new session:', error);
      toast.error('Failed to start a new conversation');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleSelectConversation = async (selectedSessionId: string) => {
    if (selectedSessionId === sessionId) return;
    
    try {
      setLoading(true);
      const response = await chatService.getSessionMessages(selectedSessionId);
      setSessionId(selectedSessionId);
      setMessages(response.messages);
      setActiveTab('chat'); // Switch to chat tab
    } catch (error) {
      console.error('Failed to load conversation:', error);
      toast.error('Failed to load conversation');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!sessionId || !input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    
    // Optimistically add user message to UI
    const tempUserMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      sessionId,
      content: userMessage,
      role: 'user',
      timestamp: new Date(),
    };
    
    setMessages((prev) => [...prev, tempUserMessage]);
    
    try {
      setLoading(true);
      const response = await chatService.sendMessage(sessionId, userMessage);
      
      // Replace temp message with actual message and add bot response
      setMessages((prev) => [
        ...prev.filter(m => m.id !== tempUserMessage.id),
        {
          ...tempUserMessage,
          id: `user-${Date.now()}`, // Use a real ID if the API returns one
        },
        response.message,
      ]);
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message');
      
      // Remove the temp message if there was an error
      setMessages((prev) => prev.filter(m => m.id !== tempUserMessage.id));
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full bg-background border-l shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="font-semibold">Chat Assistant</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="grid grid-cols-2 mx-4 my-2">
          <TabsTrigger value="chat">
            <MessageSquare className="h-4 w-4 mr-2" />
            Chat
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="h-4 w-4 mr-2" />
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="flex-1 flex flex-col p-0 m-0">
          {initializing ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="animate-spin h-8 w-8 border-4 border-primary/20 border-l-primary rounded-full" />
            </div>
          ) : (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{message.content}</div>
                      <div className="text-xs mt-1 opacity-70">
                        {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t">
                <div className="flex space-x-2">
                  <Textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type your message..."
                    className="min-h-[60px] resize-none"
                    disabled={loading || !sessionId}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!input.trim() || loading || !sessionId}
                    className="shrink-0"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="history" className="flex-1 p-0 m-0">
          <ConversationsList
            chatbotId={chatbotId}
            onSelectConversation={handleSelectConversation}
            onNewConversation={createNewSession}
            activeSessionId={sessionId || undefined}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
