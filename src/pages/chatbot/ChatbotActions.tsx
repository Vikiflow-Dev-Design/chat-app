import { useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useChatbots } from "@/context/ChatbotContext";
import { useEffect, useState } from "react";
import { Chatbot } from "@/types/chatbot";
import { Code, Plus, Settings, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const ChatbotActions = () => {
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

  // Mock actions data
  const actionsData = [
    { id: 1, name: "Send Email", trigger: "User requests to be contacted", status: "Active" },
    { id: 2, name: "Create Support Ticket", trigger: "User reports an issue", status: "Active" },
    { id: 3, name: "Schedule Demo", trigger: "User wants to see a product demo", status: "Inactive" },
    { id: 4, name: "Add to Newsletter", trigger: "User wants to subscribe", status: "Active" },
  ];

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Actions</h2>
          <p className="text-muted-foreground">Create automated actions triggered by user interactions</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Action
        </Button>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Configured Actions</CardTitle>
          <CardDescription>
            Actions that your chatbot can perform based on user interactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Trigger</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[120px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {actionsData.map((action) => (
                <TableRow key={action.id}>
                  <TableCell className="font-medium">{action.name}</TableCell>
                  <TableCell>{action.trigger}</TableCell>
                  <TableCell>
                    {action.status === "Active" ? (
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-200 border-none">
                        Active
                      </Badge>
                    ) : (
                      <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200 border-none">
                        Inactive
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="icon">
                        <Settings className="h-4 w-4 text-muted-foreground" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Action Templates</CardTitle>
          <CardDescription>
            Pre-built actions you can add to your chatbot
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-primary/10 p-2 rounded-md">
                    <Code className="h-5 w-5 text-primary" />
                  </div>
                  <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-none">
                    Popular
                  </Badge>
                </div>
                <h3 className="font-medium mb-2">API Integration</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Connect your chatbot to external APIs to fetch data or perform actions
                </p>
                <Button variant="outline" className="w-full">
                  Add Template
                </Button>
              </CardContent>
            </Card>
            
            <Card className="border hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-primary/10 p-2 rounded-md">
                    <Code className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <h3 className="font-medium mb-2">Email Notification</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Send email notifications based on user interactions
                </p>
                <Button variant="outline" className="w-full">
                  Add Template
                </Button>
              </CardContent>
            </Card>
            
            <Card className="border hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-primary/10 p-2 rounded-md">
                    <Code className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <h3 className="font-medium mb-2">Data Collection</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Collect and store user information from conversations
                </p>
                <Button variant="outline" className="w-full">
                  Add Template
                </Button>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </main>
  );
};

export default ChatbotActions;
