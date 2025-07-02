import { useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useChatbots } from "@/context/ChatbotContext";
import { useEffect, useState } from "react";
import { Chatbot } from "@/types/chatbot";
import { Code, Copy, ExternalLink, Globe, MessageSquare } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";

const ChatbotConnect = () => {
  const { id } = useParams();
  const { getChatbot } = useChatbots();
  const [chatbot, setChatbot] = useState<Chatbot | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

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

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="inline-block animate-spin h-8 w-8 border-4 border-primary/20 border-l-primary rounded-full"></div>
      </div>
    );
  }

  const embedCode = `<script>
  window.chatbotConfig = {
    botId: "${id}",
    position: "bottom-right",
    theme: "light",
    welcomeMessage: "Hi there! How can I help you today?"
  };
</script>
<script src="https://cdn.chatbotagency.com/widget.js" async></script>`;

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Connect</h2>
          <p className="text-muted-foreground">Integrate your chatbot with your website or application</p>
        </div>
        <Button variant="outline">
          <ExternalLink className="h-4 w-4 mr-2" />
          View Live
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Integration Options</CardTitle>
              <CardDescription>
                Choose how to integrate your chatbot
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="website">
                <TabsList className="mb-4">
                  <TabsTrigger value="website" className="flex items-center">
                    <Globe className="h-4 w-4 mr-2" />
                    Website
                  </TabsTrigger>
                  <TabsTrigger value="api" className="flex items-center">
                    <Code className="h-4 w-4 mr-2" />
                    API
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="website">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium mb-2">Website Embed</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Add this code to your website to embed the chatbot widget
                      </p>
                      
                      <div className="relative">
                        <div className="bg-secondary/20 p-4 rounded-md font-mono text-sm overflow-x-auto">
                          <pre>{embedCode}</pre>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="absolute top-2 right-2"
                          onClick={() => handleCopy(embedCode)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="mt-4 flex justify-end">
                        <Button onClick={() => handleCopy(embedCode)}>
                          {copied ? "Copied!" : "Copy Code"}
                        </Button>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium mb-2">Direct Link</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Share this link to allow users to chat directly
                      </p>
                      
                      <div className="flex">
                        <Input 
                          value={`https://chatbotagency.com/chat/${id}`} 
                          readOnly 
                          className="flex-1"
                        />
                        <Button 
                          variant="outline" 
                          className="ml-2"
                          onClick={() => handleCopy(`https://chatbotagency.com/chat/${id}`)}
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Copy
                        </Button>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="api">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium mb-2">API Endpoint</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Use our API to integrate the chatbot with your application
                      </p>
                      
                      <div className="flex">
                        <Input 
                          value={`https://api.chatbotagency.com/v1/chat/${id}`} 
                          readOnly 
                          className="flex-1"
                        />
                        <Button 
                          variant="outline" 
                          className="ml-2"
                          onClick={() => handleCopy(`https://api.chatbotagency.com/v1/chat/${id}`)}
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Copy
                        </Button>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium mb-2">API Key</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Use this API key to authenticate your requests
                      </p>
                      
                      <div className="flex">
                        <Input 
                          value="sk_live_abc123def456ghi789jkl" 
                          type="password" 
                          readOnly 
                          className="flex-1"
                        />
                        <Button 
                          variant="outline" 
                          className="ml-2"
                          onClick={() => handleCopy("sk_live_abc123def456ghi789jkl")}
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Copy
                        </Button>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <Button variant="outline">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View API Documentation
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
              <CardDescription>
                How your chatbot will appear to users
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-md p-4 h-[400px] flex flex-col">
                <div className="bg-primary text-white p-3 rounded-t-md flex items-center">
                  <MessageSquare className="h-5 w-5 mr-2" />
                  <span className="font-medium">{chatbot?.name || "Chatbot"}</span>
                </div>
                
                <div className="flex-1 bg-secondary/20 p-4 flex flex-col justify-end">
                  <div className="bg-primary/10 p-3 rounded-lg text-sm mb-2 ml-auto max-w-[80%]">
                    How can I help you today?
                  </div>
                  
                  <div className="bg-white p-3 rounded-lg text-sm mb-2 mr-auto max-w-[80%] border">
                    I'd like to learn more about your services.
                  </div>
                  
                  <div className="bg-primary/10 p-3 rounded-lg text-sm ml-auto max-w-[80%]">
                    I'd be happy to tell you about our services! We offer...
                  </div>
                </div>
                
                <div className="border-t p-2 flex">
                  <Input placeholder="Type your message..." className="flex-1" />
                  <Button className="ml-2">Send</Button>
                </div>
              </div>
              
              <div className="mt-4">
                <Button variant="outline" className="w-full">
                  Customize Appearance
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
};

export default ChatbotConnect;
