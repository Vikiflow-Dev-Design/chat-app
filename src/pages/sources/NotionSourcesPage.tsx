import { useState } from "react";
import { useParams } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileText, Plus, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { SourcesLayout } from "@/components/sources/SourcesLayout";
import { useChatbotSources } from "@/hooks/useChatbotSources";

export default function NotionSourcesPage() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [notionPageUrl, setNotionPageUrl] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);

  const {
    sourcesSummary,
    needsRetraining,
    handleRetrain,
  } = useChatbotSources(id);

  const handleConnectNotion = async () => {
    if (!notionPageUrl) {
      toast({
        title: "Error",
        description: "Notion page URL is required",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsConnecting(true);
      // Mock connecting to Notion - in a real app, this would be an API call
      console.log("Connecting to Notion:", notionPageUrl);
      
      // Simulate delay
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      toast({
        title: "Success",
        description: "Connected to Notion successfully",
      });
      
      // Clear form
      setNotionPageUrl("");
    } catch (error) {
      console.error("Error connecting to Notion:", error);
      toast({
        title: "Error",
        description: "Failed to connect to Notion",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <SourcesLayout
      sourcesSummary={sourcesSummary}
      needsRetraining={needsRetraining}
      onRetrain={handleRetrain}
    >
      <Card className="border border-gray-100 shadow-sm">
        <CardHeader className="border-b bg-gray-50/50">
          <CardTitle className="text-lg font-medium text-gray-800">
            Notion
          </CardTitle>
          <CardDescription>
            Connect to Notion to enhance your chatbot's knowledge
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-6">
            <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
              <h3 className="text-sm font-medium mb-3 text-gray-700 flex items-center">
                <FileText className="h-4 w-4 mr-2 text-primary" />
                Connect to Notion
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-700 mb-1 block">
                    Notion Page URL
                  </label>
                  <Input
                    placeholder="https://www.notion.so/..."
                    value={notionPageUrl}
                    onChange={(e) => setNotionPageUrl(e.target.value)}
                    disabled={isConnecting}
                  />
                </div>
                <Button 
                  onClick={handleConnectNotion} 
                  disabled={isConnecting}
                  className="w-full"
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Connect
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </SourcesLayout>
  );
}
