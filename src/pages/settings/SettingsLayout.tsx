import { ReactNode, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Settings as SettingsIcon, Users, CreditCard } from "lucide-react";
import { useUser } from "@clerk/clerk-react";
import { emailToTeamSlug } from "@/components/layouts/DashboardLayout";
import DashboardNavBar from "@/components/dashboard/DashboardNavBar";
import { useMediaQuery } from "@/hooks/useMediaQuery";

interface SettingsLayoutProps {
  children: ReactNode;
}

const SettingsLayout = ({ children }: SettingsLayoutProps) => {
  const { teamSlug, section = "general" } = useParams();
  const { user, isLoaded } = useUser();
  const [userTeamSlug, setUserTeamSlug] = useState<string>("");

  // Check if we're on mobile
  const isMobile = useMediaQuery("(max-width: 768px)");

  // Set the team slug based on the user's email
  useEffect(() => {
    if (isLoaded && user) {
      const email = user.primaryEmailAddress?.emailAddress || "";
      setUserTeamSlug(emailToTeamSlug(email));
    }
  }, [isLoaded, user]);

  // Use the team slug from the URL or from the user's email
  const currentTeamSlug = teamSlug || userTeamSlug;

  // Determine active section
  const isActive = (sectionName: string) => {
    const isActiveSection = section === sectionName;
    console.log(
      `Checking if ${sectionName} is active:`,
      isActiveSection,
      `Current section: ${section}`
    );
    return isActiveSection;
  };

  return (
    <div>
      <DashboardNavBar />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-muted-foreground mt-1">
              Manage your account and team settings
            </p>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobile && (
          <div className="mb-8">
            <div className="bg-secondary/50 rounded-full p-1 flex justify-between">
              <Link
                to={`/dashboard/${currentTeamSlug}/settings/general`}
                className={`flex items-center justify-center px-4 py-2 rounded-full text-sm ${
                  isActive("general")
                    ? "bg-white text-foreground shadow-sm font-medium"
                    : "text-muted-foreground"
                }`}
              >
                <SettingsIcon className="h-4 w-4 mr-1.5" />
                General
              </Link>
              <Link
                to={`/dashboard/${currentTeamSlug}/settings/members`}
                className={`flex items-center justify-center px-4 py-2 rounded-full text-sm ${
                  isActive("members")
                    ? "bg-white text-foreground shadow-sm font-medium"
                    : "text-muted-foreground"
                }`}
              >
                <Users className="h-4 w-4 mr-1.5" />
                Members
              </Link>
              <Link
                to={`/dashboard/${currentTeamSlug}/settings/plans`}
                className={`flex items-center justify-center px-4 py-2 rounded-full text-sm ${
                  isActive("plans")
                    ? "bg-white text-foreground shadow-sm font-medium"
                    : "text-muted-foreground"
                }`}
              >
                <CreditCard className="h-4 w-4 mr-1.5" />
                Plans
              </Link>
              <Link
                to={`/dashboard/${currentTeamSlug}/settings/billing`}
                className={`flex items-center justify-center px-4 py-2 rounded-full text-sm ${
                  isActive("billing")
                    ? "bg-white text-foreground shadow-sm font-medium"
                    : "text-muted-foreground"
                }`}
              >
                <CreditCard className="h-4 w-4 mr-1.5" />
                Billing
              </Link>
            </div>
          </div>
        )}

        <div className="grid grid-cols-12 gap-8">
          {/* Desktop Sidebar - hidden on mobile */}
          {!isMobile && (
            <div className="col-span-12 md:col-span-3">
              <div className="bg-white rounded-lg border overflow-hidden">
                <div className="p-4">
                  <h3 className="font-semibold text-lg">Settings</h3>
                </div>
                <div className="flex flex-col">
                  <Link
                    to={`/dashboard/${currentTeamSlug}/settings/general`}
                    className={`flex items-center px-4 py-2 border-b transition-colors ${
                      isActive("general")
                        ? "bg-primary/10 text-primary font-medium border-l-4 border-l-primary"
                        : "hover:bg-secondary/20 text-muted-foreground border-l-4 border-l-transparent"
                    }`}
                  >
                    <SettingsIcon
                      className={`h-4 w-4 mr-2 ${
                        isActive("general")
                          ? "text-primary"
                          : "text-muted-foreground"
                      }`}
                    />
                    General
                  </Link>
                  <Link
                    to={`/dashboard/${currentTeamSlug}/settings/members`}
                    className={`flex items-center px-4 py-2 border-b transition-colors ${
                      isActive("members")
                        ? "bg-primary/10 text-primary font-medium border-l-4 border-l-primary"
                        : "hover:bg-secondary/20 text-muted-foreground border-l-4 border-l-transparent"
                    }`}
                  >
                    <Users
                      className={`h-4 w-4 mr-2 ${
                        isActive("members")
                          ? "text-primary"
                          : "text-muted-foreground"
                      }`}
                    />
                    Members
                  </Link>
                  <Link
                    to={`/dashboard/${currentTeamSlug}/settings/plans`}
                    className={`flex items-center px-4 py-2 border-b transition-colors ${
                      isActive("plans")
                        ? "bg-primary/10 text-primary font-medium border-l-4 border-l-primary"
                        : "hover:bg-secondary/20 text-muted-foreground border-l-4 border-l-transparent"
                    }`}
                  >
                    <CreditCard
                      className={`h-4 w-4 mr-2 ${
                        isActive("plans")
                          ? "text-primary"
                          : "text-muted-foreground"
                      }`}
                    />
                    Plans
                  </Link>
                  <Link
                    to={`/dashboard/${currentTeamSlug}/settings/billing`}
                    className={`flex items-center px-4 py-2 transition-colors ${
                      isActive("billing")
                        ? "bg-primary/10 text-primary font-medium border-l-4 border-l-primary"
                        : "hover:bg-secondary/20 text-muted-foreground border-l-4 border-l-transparent"
                    }`}
                  >
                    <CreditCard
                      className={`h-4 w-4 mr-2 ${
                        isActive("billing")
                          ? "text-primary"
                          : "text-muted-foreground"
                      }`}
                    />
                    Billing
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Main Content */}
          <div className={`col-span-12 ${!isMobile ? "md:col-span-9" : ""}`}>
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default SettingsLayout;
