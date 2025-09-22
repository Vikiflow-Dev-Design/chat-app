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
import { Database, Plus, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { SourcesLayout } from "@/components/sources/SourcesLayout";
import { useChatbotSources } from "@/hooks/useChatbotSources";

export default function MongoDBSourcesPage() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [connectionString, setConnectionString] = useState("");
  const [database, setDatabase] = useState("");
  const [collection, setCollection] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const {
    sourcesSummary,
    needsRetraining,
    handleRetrain,
  } = useChatbotSources(id);

  const handleConnect = async () => {
    if (!connectionString || !database || !collection) {
      toast({
        title: "Error",
        description: "All fields are required",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsConnecting(true);
      // Mock connecting to MongoDB - in a real app, this would be an API call
      console.log("Connecting to MongoDB:", { connectionString, database, collection });
      
      // Simulate delay
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      setIsConnected(true);
      toast({
        title: "Success",
        description: "Connected to MongoDB successfully",
      });
    } catch (error) {
      console.error("Error connecting to MongoDB:", error);
      toast({
        title: "Error",
        description: "Failed to connect to MongoDB",
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
            MongoDB
          </CardTitle>
          <CardDescription>
            Connect to MongoDB to enhance your chatbot's knowledge
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-6">
            <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
              <h3 className="text-sm font-medium mb-3 text-gray-700 flex items-center">
                <Database className="h-4 w-4 mr-2 text-primary" />
                Connect to MongoDB
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-700 mb-1 block">
                    Connection String
                  </label>
                  <Input
                    placeholder="mongodb://username:password@host:port"
                    value={connectionString}
                    onChange={(e) => setConnectionString(e.target.value)}
                    disabled={isConnecting || isConnected}
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-700 mb-1 block">
                    Database
                  </label>
                  <Input
                    placeholder="database_name"
                    value={database}
                    onChange={(e) => setDatabase(e.target.value)}
                    disabled={isConnecting || isConnected}
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-700 mb-1 block">
                    Collection
                  </label>
                  <Input
                    placeholder="collection_name"
                    value={collection}
                    onChange={(e) => setCollection(e.target.value)}
                    disabled={isConnecting || isConnected}
                  />
                </div>
                <Button 
                  onClick={handleConnect} 
                  disabled={isConnecting || isConnected}
                  className="w-full"
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Connecting...
                    </>
                  ) : isConnected ? (
                    "Connected"
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
