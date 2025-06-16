import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { Bot } from "lucide-react";
import { UserButton, useUser } from "@clerk/clerk-react";

// Function to convert email to team slug
export const emailToTeamSlug = (email: string): string => {
  if (!email) return "";
  // Get everything before the @ symbol
  const username = email.split("@")[0];
  // Remove any special characters and replace spaces with dashes
  return `${username.replace(/[^a-zA-Z0-9]/g, "").toLowerCase()}-team`;
};

type Props = {};

const DashboardNavBar = (props: Props) => {
  const location = useLocation();
  const { teamSlug } = useParams();
  const { user, isLoaded } = useUser();
  const [teamName, setTeamName] = useState<string>("");

  useEffect(() => {
    if (isLoaded && user) {
      const email = user.primaryEmailAddress?.emailAddress || "";
      setTeamName(emailToTeamSlug(email));
    }
  }, [isLoaded, user]);

  // Determine active tab based on the current path
  const isAgentsActive = location.pathname.includes("/chatbots");
  const isUsageActive = location.pathname.includes("/usage");
  const isSettingsActive = location.pathname.includes("/settings");

  return (
    <nav className="bg-white border-b">
      <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
        <Link to="/" className="flex items-center space-x-2">
          <Bot className="h-6 w-6 text-highlight" />
          <span className="font-bold text-xl">ChatBot Agency</span>
        </Link>
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
          <UserButton signInUrl="/" />
        </div>
      </div>

      <div className="border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex space-x-8">
            <Link
              to={`/dashboard/${teamSlug || teamName}/chatbots`}
              className={`py-4 border-b-2 text-sm font-medium ${
                isAgentsActive
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300"
              }`}
            >
              Agents
            </Link>
            <Link
              to={`/dashboard/${teamSlug || teamName}/usage`}
              className={`py-4 border-b-2 text-sm font-medium ${
                isUsageActive
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300"
              }`}
            >
              Usage
            </Link>
            <Link
              to={`/dashboard/${teamSlug || teamName}/settings/general`}
              className={`py-4 border-b-2 text-sm font-medium ${
                isSettingsActive
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
  );
};

export default DashboardNavBar;
