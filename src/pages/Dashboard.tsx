import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { ChatbotCard } from "@/components/ChatbotCard";
import { useChatbots } from "@/context/ChatbotContext";
import { useState, useEffect } from "react";
import { ChatbotCardSkeleton } from "@/components/skeletons/ChatbotCardSkeleton";
import { emailToTeamSlug } from "@/components/layouts/DashboardLayout";
import { useUser } from "@clerk/clerk-react";
import DashboardNavBar from "@/components/dashboard/DashboardNavBar";

const Dashboard = () => {
  const { chatbots, loading, refreshChatbots } = useChatbots();
  const [searchQuery, setSearchQuery] = useState("");
  const { teamSlug } = useParams();
  const { user, isLoaded } = useUser();
  const [userTeamSlug, setUserTeamSlug] = useState("");

  // Set the team slug based on the user's email
  useEffect(() => {
    if (isLoaded && user) {
      const email = user.primaryEmailAddress?.emailAddress || "";
      setUserTeamSlug(emailToTeamSlug(email));
    }
  }, [isLoaded, user]);

  // Fetch chatbots when the component mounts
  useEffect(() => {
    refreshChatbots();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filter chatbots based on search query
  const filteredChatbots = chatbots.filter(
    (bot) =>
      bot.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (bot.description &&
        bot.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Use the team slug from the URL or from the user's email
  const currentTeamSlug = teamSlug || userTeamSlug;

  return (
    <div>
      <DashboardNavBar />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">My Chatbots</h1>
            <p className="text-muted-foreground mt-1">
              Manage and create your AI-powered chatbots
            </p>
          </div>
          <Button asChild>
            <Link to={`/dashboard/${currentTeamSlug}/chatbot/new`}>
              <Plus className="h-4 w-4 mr-2" />
              Create New Chatbot
            </Link>
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg p-4 mb-8 border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search chatbots..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Chatbots Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Create New Card */}
          <Card className="border-dashed bg-white/50 hover:bg-white transition-colors">
            <CardContent className="p-0">
              <Link
                to={`/dashboard/${currentTeamSlug}/chatbot/new`}
                className="flex flex-col items-center justify-center h-full p-6 text-muted-foreground hover:text-foreground"
              >
                <div className="bg-secondary/50 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                  <Plus className="h-8 w-8" />
                </div>
                <p className="font-medium">Create New Chatbot</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Start building your custom AI assistant
                </p>
              </Link>
            </CardContent>
          </Card>

          {/* Loading State - Skeleton */}
          {loading && (
            <>
              {[1, 2, 3, 4, 5].map((i) => (
                <ChatbotCardSkeleton key={i} />
              ))}
            </>
          )}

          {/* Chatbot Cards */}
          {!loading && filteredChatbots.length === 0 && !searchQuery && (
            <div className="col-span-3 text-center py-12">
              <p className="text-muted-foreground">
                You haven't created any chatbots yet.
              </p>
              <p className="text-muted-foreground mt-1">
                Get started by creating your first chatbot!
              </p>
            </div>
          )}

          {!loading && filteredChatbots.length === 0 && searchQuery && (
            <div className="col-span-3 text-center py-12">
              <p className="text-muted-foreground">
                No chatbots match your search criteria.
              </p>
            </div>
          )}

          {!loading &&
            filteredChatbots.map((bot) => (
              <ChatbotCard
                key={bot.id}
                chatbot={bot}
                teamSlug={currentTeamSlug}
              />
            ))}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
