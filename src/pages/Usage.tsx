import { Link, useParams } from "react-router-dom";
import { BarChart, LineChart, PieChart } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUser } from "@clerk/clerk-react";
import { useState, useEffect } from "react";
import { emailToTeamSlug } from "@/components/layouts/DashboardLayout";
import DashboardNavBar from "@/components/dashboard/DashboardNavBar";

const Usage = () => {
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

  // Use the team slug from the URL or from the user's email
  const currentTeamSlug = teamSlug || userTeamSlug;

  return (
    <div>
      <DashboardNavBar />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Usage & Analytics</h1>
            <p className="text-muted-foreground mt-1">
              Monitor your chatbot usage and performance metrics
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Messages
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">1,248</div>
              <p className="text-xs text-muted-foreground mt-1">
                <span className="text-green-500">↑ 12%</span> from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Chatbots
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">3</div>
              <p className="text-xs text-muted-foreground mt-1">
                <span className="text-green-500">↑ 1</span> from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Unique Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">156</div>
              <p className="text-xs text-muted-foreground mt-1">
                <span className="text-green-500">↑ 24%</span> from last month
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="messages" className="space-y-4">
          <TabsList>
            <TabsTrigger value="messages">Messages</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>

          <TabsContent value="messages" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Message Volume</CardTitle>
                <CardDescription>Total messages sent over time</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px] flex items-center justify-center">
                <div className="flex flex-col items-center text-muted-foreground">
                  <LineChart className="h-16 w-16 mb-2" />
                  <p>Message volume chart would appear here</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>User Engagement</CardTitle>
                <CardDescription>
                  User activity and engagement metrics
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[300px] flex items-center justify-center">
                <div className="flex flex-col items-center text-muted-foreground">
                  <BarChart className="h-16 w-16 mb-2" />
                  <p>User engagement chart would appear here</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Chatbot Performance</CardTitle>
                <CardDescription>
                  Response times and success rates
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[300px] flex items-center justify-center">
                <div className="flex flex-col items-center text-muted-foreground">
                  <PieChart className="h-16 w-16 mb-2" />
                  <p>Performance metrics chart would appear here</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Usage;
