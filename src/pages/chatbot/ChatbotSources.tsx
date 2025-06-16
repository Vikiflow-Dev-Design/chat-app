import { useParams } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useChatbots } from "@/context/ChatbotContext";
import { useEffect, useState, useRef } from "react";
import { Chatbot } from "@/types/chatbot";
import {
  FileText,
  Link as LinkIcon,
  Plus,
  Trash2,
  Download,
  File,
  Text,
  Globe,
  MessageSquare,
  FileQuestion,
  AlertCircle,
  X,
  Info,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";

const ChatbotSources = () => {
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

  // Mock sources data
  const sourcesData = [
    {
      id: 1,
      name: "Product Documentation",
      type: "PDF",
      size: "2.4 MB",
      added: "2023-05-10",
      status: "Processed",
    },
    {
      id: 2,
      name: "FAQ",
      type: "Text",
      size: "156 KB",
      added: "2023-05-12",
      status: "Processed",
    },
    {
      id: 3,
      name: "Company Website",
      type: "URL",
      size: "N/A",
      added: "2023-05-14",
      status: "Processing",
    },
    {
      id: 4,
      name: "User Manual",
      type: "PDF",
      size: "4.7 MB",
      added: "2023-05-15",
      status: "Processed",
    },
  ];

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Knowledge Sources</h2>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Source
        </Button>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Sources</CardTitle>
          <CardDescription>
            Knowledge sources that power your chatbot
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Added</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sourcesData.map((source) => (
                <TableRow key={source.id}>
                  <TableCell className="font-medium flex items-center">
                    {source.type === "PDF" ? (
                      <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                    ) : source.type === "URL" ? (
                      <Link className="h-4 w-4 mr-2 text-muted-foreground" />
                    ) : (
                      <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                    )}
                    {source.name}
                  </TableCell>
                  <TableCell>{source.type}</TableCell>
                  <TableCell>{source.size}</TableCell>
                  <TableCell>{source.added}</TableCell>
                  <TableCell>
                    {source.status === "Processing" ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Processing
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Processed
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon">
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Add New Source</CardTitle>
          <CardDescription>
            Upload files or add URLs to enhance your chatbot's knowledge
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-dashed hover:bg-secondary/10 transition-colors cursor-pointer">
              <CardContent className="flex flex-col items-center justify-center p-6">
                <FileText className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="font-medium">Upload Files</p>
                <p className="text-xs text-muted-foreground mt-1">
                  PDF, DOCX, TXT (Max 10MB)
                </p>
              </CardContent>
            </Card>

            <Card className="border-dashed hover:bg-secondary/10 transition-colors cursor-pointer">
              <CardContent className="flex flex-col items-center justify-center p-6">
                <Link className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="font-medium">Add URL</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Website or web page
                </p>
              </CardContent>
            </Card>

            <Card className="border-dashed hover:bg-secondary/10 transition-colors cursor-pointer">
              <CardContent className="flex flex-col items-center justify-center p-6">
                <FileText className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="font-medium">Text Input</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Directly enter text content
                </p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </main>
  );
};

export default ChatbotSources;
