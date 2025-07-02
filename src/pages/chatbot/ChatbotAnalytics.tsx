import { useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useChatbots } from "@/context/ChatbotContext";
import { useEffect, useState } from "react";
import { Chatbot } from "@/types/chatbot";
import { BarChart, LineChart, PieChart } from "lucide-react";

const ChatbotAnalytics = () => {
  const { id } = useParams();
  const { getChatbot } = useChatbots();
  const [chatbot, setChatbot] = useState<Chatbot | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadChatbot = async () => {
      if (id) {
        try {
          setLoading(true);
          const fetchedBot = await getChatbot(id);
          if (fetchedBot) {
            setChatbot(fetchedBot);
          }
        } catch (error) {
          console.error("Error loading chatbot:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    loadChatbot();
  }, [id, getChatbot]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="inline-block animate-spin h-8 w-8 border-4 border-primary/20 border-l-primary rounded-full"></div>
      </div>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Messages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{chatbot?.stats?.totalMessages || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-green-500">↑ 12%</span> from last month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{chatbot?.stats?.activeUsers || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-green-500">↑ 8%</span> from last month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Response Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">1.2s</div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-green-500">↓ 0.3s</span> from last month
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Message Volume</CardTitle>
            <CardDescription>
              Messages over time
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center">
            <div className="flex flex-col items-center text-muted-foreground">
              <LineChart className="h-16 w-16 mb-2" />
              <p>Message volume chart would appear here</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>User Engagement</CardTitle>
            <CardDescription>
              User activity distribution
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center">
            <div className="flex flex-col items-center text-muted-foreground">
              <PieChart className="h-16 w-16 mb-2" />
              <p>User engagement chart would appear here</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Popular Topics</CardTitle>
            <CardDescription>
              Most discussed topics
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center">
            <div className="flex flex-col items-center text-muted-foreground">
              <BarChart className="h-16 w-16 mb-2" />
              <p>Popular topics chart would appear here</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>User Satisfaction</CardTitle>
            <CardDescription>
              User ratings and feedback
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center">
            <div className="flex flex-col items-center text-muted-foreground">
              <BarChart className="h-16 w-16 mb-2" />
              <p>User satisfaction chart would appear here</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
};

export default ChatbotAnalytics;
