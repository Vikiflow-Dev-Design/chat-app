import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { emailToTeamSlug } from "./layouts/DashboardLayout";

const RedirectToDashboard = () => {
  const navigate = useNavigate();
  const { user, isLoaded } = useUser();

  useEffect(() => {
    if (isLoaded && user) {
      const email = user.primaryEmailAddress?.emailAddress || "";
      const teamSlug = emailToTeamSlug(email);
      
      // Redirect to the team's dashboard
      navigate(`/dashboard/${teamSlug}/chatbots`, { replace: true });
    }
  }, [isLoaded, user, navigate]);

  return (
    <div className="min-h-screen bg-secondary/30 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin h-8 w-8 border-4 border-primary/20 border-l-primary rounded-full mb-4"></div>
        <p>Redirecting to your dashboard...</p>
      </div>
    </div>
  );
};

export default RedirectToDashboard;
