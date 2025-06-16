import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { Bot, LineChart, MessageCircle, ArrowLeft } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { useChatbots } from "@/context/ChatbotContext";
import type { Chatbot } from "@/types/chatbot";
import { toast } from "sonner";
import { ChatbotNavbar } from "@/components/chatbot/ChatbotNavbar";
import { ChatbotHeader } from "@/components/chatbot/ChatbotHeader";
import { ChatbotStatsCard } from "@/components/chatbot/ChatbotStatsCard";
import { ChatbotConversationsList } from "@/components/chatbot/ChatbotConversationsList";
import { ChatbotSettingsSection } from "@/components/chatbot/ChatbotSettingsSection";
import { ChatbotProductsSection } from "@/components/chatbot/ChatbotProductsSection";
import { ChatbotDetailsSkeleton } from "@/components/skeletons/ChatbotDetailsSkeleton";
import { ConversationsSkeleton } from "@/components/skeletons/ConversationsSkeleton";
import { ProductsSkeleton } from "@/components/skeletons/ProductsSkeleton";
import {
  Conversation,
  conversationService,
} from "@/services/conversationService";

const ChatbotDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getChatbot, deleteChatbot } = useChatbots();
  const [chatbot, setChatbot] = useState<Chatbot | null>(null);
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(false);

  // Load chatbot details
  useEffect(() => {
    const loadChatbot = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const fetchedBot = await getChatbot(id);
        if (fetchedBot) {
          setChatbot(fetchedBot);
        } else {
          toast.error("Chatbot not found");
          navigate("/dashboard");
        }
      } catch (error) {
        console.error("Error loading chatbot:", error);
        toast.error("Failed to load chatbot");
      } finally {
        setLoading(false);
      }
    };

    loadChatbot();
  }, [id, getChatbot, navigate]);

  // Load conversations
  useEffect(() => {
    const loadConversations = async () => {
      if (!id) return;

      try {
        setLoadingConversations(true);
        // Use the chatbot ID from the URL
        console.log("Using chatbot ID for conversations:", id);
        const fetchedConversations = await conversationService.getConversations(
          id
        );
        setConversations(fetchedConversations);
      } catch (error) {
        console.error("Error loading conversations:", error);
        toast.error("Failed to load conversations");
      } finally {
        setLoadingConversations(false);
      }
    };

    if (chatbot) {
      loadConversations();
    }
  }, [id, chatbot]);

  const handleDeleteChatbot = async () => {
    if (!id) return;

    // Show confirmation dialog
    const confirmed = window.confirm(
      "Are you sure you want to delete this chatbot? This will also delete all related data including products, conversations, and knowledge sources. This action cannot be undone."
    );

    if (!confirmed) return;

    try {
      await deleteChatbot(id);
      navigate("/dashboard");
    } catch (error) {
      console.error("Failed to delete chatbot:", error);
    }
  };

  const handleDeleteConversation = (sessionId: string) => {
    // Update the local state to remove the deleted conversation
    setConversations(
      conversations.filter((conv) => conv.sessionId !== sessionId)
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-secondary/30">
        <ChatbotNavbar />
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Link
              to="/dashboard"
              className="hover:text-foreground flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Dashboard
            </Link>
          </div>
        </div>
        <ChatbotDetailsSkeleton />
      </div>
    );
  }

  if (!chatbot) {
    return (
      <div className="min-h-screen bg-secondary/30 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-red-500 mb-4">Chatbot not found</p>
          <Link to="/dashboard" className="text-blue-500 hover:underline">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/30">
      <ChatbotNavbar />

      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Link
            to="/dashboard"
            className="hover:text-foreground flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Dashboard
          </Link>
        </div>
      </div>

      <ChatbotHeader chatbot={chatbot} onDelete={handleDeleteChatbot} />

      <main className="max-w-7xl mx-auto px-4 pb-12">
        <Tabs defaultValue="overview">
          <TabsList className="mb-8">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="conversations">Conversations</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <ChatbotStatsCard
                title="Total Messages"
                value={chatbot.stats.totalMessages.toLocaleString()}
                icon={MessageCircle}
                subtitle={`Since ${chatbot.createdAt.toLocaleDateString()}`}
              />
              <ChatbotStatsCard
                title="Active Users"
                value={chatbot.stats.activeUsers}
                icon={LineChart}
                subtitle="Last 30 days"
              />
              <ChatbotStatsCard
                title="Average Rating"
                value={
                  chatbot.stats.averageRating
                    ? `${chatbot.stats.averageRating}/5`
                    : "No ratings yet"
                }
                icon={Bot}
                subtitle="Based on user feedback"
              />
            </div>

            <Card>
              <div className="h-[300px] flex items-center justify-center bg-secondary/20 rounded-md">
                <p className="text-muted-foreground">
                  Chart visualization would go here
                </p>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="conversations">
            {loadingConversations ? (
              <ConversationsSkeleton />
            ) : (
              <ChatbotConversationsList
                conversations={conversations}
                onDelete={handleDeleteConversation}
              />
            )}
          </TabsContent>

          <TabsContent value="products">
            <ChatbotProductsSection chatbotId={chatbot.id} />
          </TabsContent>

          <TabsContent value="settings">
            <ChatbotSettingsSection chatbotId={chatbot.id} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default ChatbotDetails;
