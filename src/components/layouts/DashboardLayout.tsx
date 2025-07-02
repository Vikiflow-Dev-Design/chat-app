import { useEffect, useState } from "react";
import { Link, Outlet, useLocation, useParams } from "react-router-dom";
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

const DashboardLayout = () => {
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
    <div className="min-h-screen bg-secondary/30">
      {/* Main Content */}
      <Outlet />
    </div>
  );
};

export default DashboardLayout;
