import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserButton } from "@clerk/clerk-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Bot, Check, Code, Settings, Database } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useChatbots } from "@/context/ChatbotContext";
import { AIModel, Chatbot } from "@/types/chatbot";
import { toast } from "sonner";
import { KnowledgeBaseTab } from "@/components/knowledge/KnowledgeBaseTab";

// Define form schema with proper type conversions
const formSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Chatbot name must be at least 2 characters." }),
  description: z.string().optional(),
  initialMessage: z
    .string()
    .min(1, { message: "Initial message is required." }),
  behaviorPrompt: z
    .string()
    .min(10, { message: "Behavior prompt must be detailed." }),
  model: z.string(),
  temperature: z.coerce.number().min(0).max(1),
  maxTokens: z.coerce.number().min(100).max(4000),
  isPublic: z.boolean().default(true),
});

const ChatbotStudio = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getChatbot, updateChatbot } = useChatbots();
  const [chatbot, setChatbot] = useState<Chatbot | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize form with proper number types
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      initialMessage: "",
      behaviorPrompt: "",
      model: "gemini-2.5-flash-preview-04-17",
      temperature: 0.7,
      maxTokens: 1000,
      isPublic: true,
    },
  });

  // Load chatbot data
  useEffect(() => {
    const loadChatbot = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const fetchedBot = await getChatbot(id);
        if (fetchedBot) {
          setChatbot(fetchedBot);

          // Set form values from fetched chatbot with proper type conversion
          form.reset({
            name: fetchedBot.name,
            description: fetchedBot.description || "",
            initialMessage: fetchedBot.initialMessage,
            behaviorPrompt: fetchedBot.behaviorPrompt,
            model: fetchedBot.model,
            temperature: fetchedBot.temperature,
            maxTokens: fetchedBot.maxTokens,
            isPublic: fetchedBot.isPublic,
          });
        } else {
          toast.error("Chatbot not found");
          navigate("/dashboard");
        }
      } catch (error) {
        console.error("Error loading chatbot:", error);
        toast.error("Failed to load chatbot");
      } finally {
        setLoading(false);
      }
    };

    loadChatbot();
  }, [id, getChatbot, navigate, form]);

  // Form submission handler
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!id) return;

    try {
      setIsSaving(true);

      await updateChatbot(id, {
        name: values.name,
        description: values.description,
        initialMessage: values.initialMessage,
        behaviorPrompt: values.behaviorPrompt,
        model: values.model as AIModel,
        temperature: values.temperature,
        maxTokens: values.maxTokens,
        isPublic: values.isPublic,
      });

      toast.success("Chatbot configuration saved successfully!");
    } catch (error) {
      console.error("Failed to update chatbot:", error);
      toast.error("Failed to save configuration");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-secondary/30 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin h-8 w-8 border-4 border-primary/20 border-l-primary rounded-full mb-4"></div>
          <p>Loading chatbot configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/30">
      {/* Navbar */}
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
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>

        {/* Secondary Navigation */}
        <div className="border-b">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex space-x-8">
              <Link
                to="/dashboard"
                className="py-4 border-b-2 border-transparent text-sm font-medium text-muted-foreground hover:text-foreground hover:border-gray-300"
              >
                Agents
              </Link>
              <Link
                to="/usage"
                className="py-4 border-b-2 border-transparent text-sm font-medium text-muted-foreground hover:text-foreground hover:border-gray-300"
              >
                Usage
              </Link>
              <Link
                to="/settings"
                className="py-4 border-b-2 border-transparent text-sm font-medium text-muted-foreground hover:text-foreground hover:border-gray-300"
              >
                Settings
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Link
            to={`/chatbot/${id}`}
            className="hover:text-foreground flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Chatbot
          </Link>
        </div>
      </div>

      {/* Studio Header */}
      <header className="max-w-7xl mx-auto px-4 pb-6">
        <h1 className="text-3xl font-bold">Configuration Studio</h1>
        <p className="text-muted-foreground">
          Customize your AI chatbot's behavior and appearance
        </p>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 pb-12">
        <Tabs defaultValue="configuration" className="mb-8">
          <TabsList>
            <TabsTrigger
              value="configuration"
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              Configuration
            </TabsTrigger>
            <TabsTrigger value="knowledge" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Knowledge Base
            </TabsTrigger>
          </TabsList>

          <TabsContent value="configuration">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Chatbot Configuration</CardTitle>
                    <CardDescription>
                      Define how your chatbot behaves and responds to users
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...form}>
                      <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-6"
                      >
                        <div className="space-y-4">
                          <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Chatbot Name</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="e.g., Customer Support Assistant"
                                    {...field}
                                  />
                                </FormControl>
                                <FormDescription>
                                  This will be displayed to users in the chat
                                  interface.
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Description</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Brief description of the chatbot's purpose"
                                    {...field}
                                  />
                                </FormControl>
                                <FormDescription>
                                  For your reference only, not shown to users.
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="initialMessage"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Initial Message</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="First message sent by the chatbot"
                                    {...field}
                                  />
                                </FormControl>
                                <FormDescription>
                                  This message is displayed when a user first
                                  starts a conversation.
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="behaviorPrompt"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Behavior Prompt</FormLabel>
                                <FormControl>
                                  <Textarea
                                    placeholder="Detailed instructions for how the AI should behave"
                                    className="min-h-[150px]"
                                    {...field}
                                  />
                                </FormControl>
                                <FormDescription>
                                  These instructions define your AI's
                                  personality, knowledge, and limitations.
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <FormField
                              control={form.control}
                              name="model"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>AI Model</FormLabel>
                                  <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select model" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="gemini-2.5-flash-preview-04-17">
                                        Gemini 2.5 Flash Preview
                                      </SelectItem>
                                      <SelectItem value="gemini-2.5-pro-preview-05-06">
                                        Gemini 2.5 Pro Preview
                                      </SelectItem>
                                      <SelectItem value="gemini-2.0-flash">
                                        Gemini 2.0 Flash
                                      </SelectItem>
                                      <SelectItem value="gemini-2.0-flash-lite">
                                        Gemini 2.0 Flash Lite
                                      </SelectItem>
                                      <SelectItem value="gemini-1.5-pro">
                                        Gemini 1.5 Pro
                                      </SelectItem>
                                      <SelectItem value="gemini-1.5-flash">
                                        Gemini 1.5 Flash
                                      </SelectItem>
                                      <SelectItem value="gemini-1.5-flash-8b">
                                        Gemini 1.5 Flash 8B
                                      </SelectItem>
                                      <SelectItem value="gemma-3-1b-it">
                                        Gemma 3 1B IT
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormDescription>
                                    Determines AI capabilities and cost.
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="temperature"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Temperature</FormLabel>
                                  <Select
                                    onValueChange={(value) =>
                                      field.onChange(parseFloat(value))
                                    }
                                    value={field.value.toString()}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select temperature" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="0.2">
                                        0.2 - More focused
                                      </SelectItem>
                                      <SelectItem value="0.5">
                                        0.5 - Balanced
                                      </SelectItem>
                                      <SelectItem value="0.7">
                                        0.7 - Creative
                                      </SelectItem>
                                      <SelectItem value="1.0">
                                        1.0 - Very creative
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormDescription>
                                    Controls response randomness.
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="maxTokens"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Max Response Length</FormLabel>
                                  <Select
                                    onValueChange={(value) =>
                                      field.onChange(parseInt(value))
                                    }
                                    value={field.value.toString()}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select max tokens" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="500">
                                        Short (500 tokens)
                                      </SelectItem>
                                      <SelectItem value="1000">
                                        Medium (1000 tokens)
                                      </SelectItem>
                                      <SelectItem value="2000">
                                        Long (2000 tokens)
                                      </SelectItem>
                                      <SelectItem value="4000">
                                        Very Long (4000 tokens)
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormDescription>
                                    Limits response length.
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>

                        <Button
                          type="submit"
                          className="w-full"
                          disabled={isSaving}
                        >
                          <Check className="h-4 w-4 mr-2" />
                          {isSaving ? "Saving..." : "Save Configuration"}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </div>

              <div>
                <Card className="sticky top-4">
                  <CardHeader>
                    <CardTitle>Preview & Tips</CardTitle>
                    <CardDescription>
                      See how your chatbot will appear to users
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="border rounded-md p-4 mb-6">
                      <div className="flex items-center space-x-2 mb-4 pb-2 border-b">
                        <Bot className="h-5 w-5 text-highlight" />
                        <span className="font-medium">
                          {form.watch("name")}
                        </span>
                      </div>
                      <div className="bg-secondary p-3 rounded-lg text-sm">
                        {form.watch("initialMessage")}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="font-semibold flex items-center">
                        <Code className="h-4 w-4 mr-2 text-muted-foreground" />
                        Configuration Tips
                      </h3>
                      <ul className="text-sm space-y-2 text-muted-foreground">
                        <li>
                          • Be specific in your behavior prompt for consistent
                          responses
                        </li>
                        <li>
                          • Lower temperature (0.2-0.5) for factual, predictable
                          answers
                        </li>
                        <li>
                          • Higher temperature (0.7-1.0) for more creative,
                          varied responses
                        </li>
                        <li>
                          • Set Max Tokens based on expected response length
                          needs
                        </li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="knowledge">
            {id && <KnowledgeBaseTab chatbotId={id} />}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default ChatbotStudio;
