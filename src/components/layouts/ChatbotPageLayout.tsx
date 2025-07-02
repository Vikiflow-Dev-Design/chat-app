import { useEffect, useState } from "react";
import { Link, Outlet, useLocation, useParams } from "react-router-dom";
import { Bot } from "lucide-react";
import { UserButton, useUser } from "@clerk/clerk-react";
import { useChatbots } from "@/context/ChatbotContext";
import { emailToTeamSlug } from "./DashboardLayout";
import { Badge } from "@/components/ui/badge";

const ChatbotPageLayout = () => {
  const location = useLocation();
  const { teamSlug, id } = useParams();
  const { user, isLoaded } = useUser();
  const [userTeamSlug, setUserTeamSlug] = useState<string>("");
  const { getChatbot } = useChatbots();
  const [chatbotName, setChatbotName] = useState<string>("");

  useEffect(() => {
    if (isLoaded && user) {
      const email = user.primaryEmailAddress?.emailAddress || "";
      setUserTeamSlug(emailToTeamSlug(email));
    }
  }, [isLoaded, user]);

  useEffect(() => {
    const loadChatbot = async () => {
      if (id) {
        try {
          const chatbot = await getChatbot(id);
          if (chatbot) {
            setChatbotName(chatbot.name);
          }
        } catch (error) {
          console.error("Error loading chatbot:", error);
        }
      }
    };

    loadChatbot();
  }, [id, getChatbot]);

  // Determine active tab based on the current path
  const currentPath = location.pathname;
  const currentTab = currentPath.split("/").pop() || "playground";

  // Use the team slug from the URL or from the user's email
  const currentTeamSlug = teamSlug || userTeamSlug;

  return (
    <div className="min-h-screen bg-secondary/30">
      {/* Navbar */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Link to="/" className="flex items-center space-x-2">
              <Bot className="h-6 w-6 text-highlight" />
            </Link>
            <div className="flex items-center space-x-2 text-sm">
              <Link
                to={`/dashboard/${currentTeamSlug}/chatbots`}
                className="text-muted-foreground hover:text-foreground"
              >
                {currentTeamSlug?.replace("-team", "")}
              </Link>
              <span className="text-muted-foreground">/</span>
              <span className="font-medium">
                {chatbotName || `Agent ${id?.substring(0, 6)}`}
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Link
              to="/docs"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Docs
            </Link>
            <Link
              to="/help"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Help
            </Link>
            <Link
              to="/changelog"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Changelog
            </Link>
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>

        {/* Secondary Navigation */}
        <div className="border-b">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex space-x-6">
              <Link
                to={`/dashboard/${currentTeamSlug}/chatbot/${id}/playground`}
                className={`py-4 border-b-2 text-sm font-medium ${
                  currentTab === "playground"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300"
                }`}
              >
                Playground
              </Link>
              <Link
                to={`/dashboard/${currentTeamSlug}/chatbot/${id}/activity`}
                className={`py-4 border-b-2 text-sm font-medium ${
                  currentTab === "activity"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300"
                }`}
              >
                Activity
              </Link>
              <Link
                to={`/dashboard/${currentTeamSlug}/chatbot/${id}/analytics`}
                className={`py-4 border-b-2 text-sm font-medium ${
                  currentTab === "analytics"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300"
                }`}
              >
                Analytics
              </Link>
              <Link
                to={`/dashboard/${currentTeamSlug}/chatbot/${id}/sources/file`}
                className={`py-4 border-b-2 text-sm font-medium ${
                  currentTab === "sources"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300"
                }`}
              >
                Sources
              </Link>
              <Link
                to={`/dashboard/${currentTeamSlug}/chatbot/${id}/actions`}
                className={`py-4 border-b-2 text-sm font-medium ${
                  currentTab === "actions"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300"
                }`}
              >
                Actions
                <Badge
                  className="ml-2 bg-primary/10 text-primary hover:bg-primary/20 border-none"
                  variant="outline"
                >
                  New
                </Badge>
              </Link>
              <Link
                to={`/dashboard/${currentTeamSlug}/chatbot/${id}/contacts`}
                className={`py-4 border-b-2 text-sm font-medium ${
                  currentTab === "contacts"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300"
                }`}
              >
                Contacts
                <Badge
                  className="ml-2 bg-primary/10 text-primary hover:bg-primary/20 border-none"
                  variant="outline"
                >
                  New
                </Badge>
              </Link>
              <Link
                to={`/dashboard/${currentTeamSlug}/chatbot/${id}/connect`}
                className={`py-4 border-b-2 text-sm font-medium ${
                  currentTab === "connect"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300"
                }`}
              >
                Connect
              </Link>

              <Link
                to={`/dashboard/${currentTeamSlug}/chatbot/${id}/settings`}
                className={`py-4 border-b-2 text-sm font-medium ${
                  currentTab === "settings"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300"
                }`}
              >
                Settings
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <Outlet />
    </div>
  );
};

export default ChatbotPageLayout;
