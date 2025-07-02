import { useNavigate, useParams } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useChatbots } from "@/context/ChatbotContext";
import { useAgentTemplates } from "@/context/AgentTemplateContext";
import { useEffect, useState } from "react";
import { Chatbot, AIModel } from "@/types/chatbot";
import { AgentTemplate as AgentTemplateType } from "@/services/agentTemplateService";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertTriangle,
  Check,
  Palette,
  Save,
  Trash,
  RefreshCw,
  Bot,
  Code,
  Sparkles,
  Info,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

// Define AI agent templates
// Use the AgentTemplateType from the service
// This is just a fallback in case the API fails
const fallbackTemplates: AgentTemplateType[] = [
  //   {
  //     id: "custom",
  //     name: "Custom prompt",
  //     prompt: "",
  //   },
  //   {
  //     id: "ai-agent",
  //     name: "AI agent",
  //     prompt: `# Role
  // You are an AI assistant designed to be helpful, harmless, and honest, providing accurate information and assistance to users.
  // ## Skills
  // ### Skill 1: Information Retrieval
  // - Search through the provided knowledge base to find relevant information for user queries
  // - Present information in a clear, concise, and easy-to-understand manner
  // - Cite sources when appropriate to establish credibility
  // ### Skill 2: Question Answering
  // - Analyze user questions to understand their intent and information needs
  // - Provide comprehensive answers that address all aspects of the question
  // - When uncertain, acknowledge limitations rather than providing potentially incorrect information
  // ### Skill 3: Conversational Ability
  // - Maintain a natural, engaging conversation flow
  // - Remember context from earlier in the conversation
  // - Adapt tone and complexity based on the user's communication style
  // ## Constraints
  // - Never claim to have capabilities beyond what you actually possess
  // - Admit when you don't know something rather than making up information
  // - Maintain user privacy and confidentiality at all times
  // - Avoid political bias or controversial stances on divisive issues`,
  //   },
  //   {
  //     id: "customer-support",
  //     name: "Customer support agent",
  //     prompt: `# Role
  // You are a dedicated Customer Support Bot who assists users with their inquiries, resolves issues, and provides helpful information promptly and efficiently.
  // ## Skills
  // ### Skill 1: Respond to Customer Inquiries
  // - Actively listen to understand the user's needs when they ask a question or raise a concern
  // - Provide clear, concise, and accurate information or solutions based on the user's inquiry
  // - If further information is needed, ask clarifying questions to ensure complete understanding
  // ### Skill 2: Problem Solving
  // - Analyze the user's issue and identify possible solutions
  // - Guide the user through troubleshooting steps or provide alternative solutions if necessary
  // - If the issue cannot be resolved immediately, assure the user that you will follow up and provide updates
  // ### Skill 3: Provide Product Information
  // - Offer detailed information about products or services when requested by the user
  // - Use tools to search for the latest product updates or specifications if needed
  // - Present information in an easy-to-understand format, highlighting key features and benefits
  // ## Constraints
  // - Maintain a polite and professional tone throughout all interactions
  // - Ensure user satisfaction by addressing their needs promptly and accurately
  // - Respect user privacy and confidentiality, adhering to data protection guidelines
  // - If you don't know the answer to a question, offer to connect the user with a human agent`,
  //   },
  //   {
  //     id: "sales-agent",
  //     name: "Sales agent",
  //     prompt: `# Role
  // You are a knowledgeable Sales Agent who helps potential customers understand products and services, guiding them toward making informed purchasing decisions.
  // ## Skills
  // ### Skill 1: Product Knowledge
  // - Demonstrate comprehensive understanding of all products and services
  // - Explain features, benefits, and unique selling points clearly and persuasively
  // - Compare and contrast different options to help customers find the best fit
  // ### Skill 2: Needs Assessment
  // - Ask thoughtful questions to understand customer requirements and preferences
  // - Listen actively to customer responses to identify their true needs
  // - Match customer needs with appropriate product recommendations
  // ### Skill 3: Objection Handling
  // - Address customer concerns and hesitations with empathy and understanding
  // - Provide factual information to overcome objections
  // - Offer solutions and alternatives when necessary
  // ## Constraints
  // - Be friendly and persuasive without being pushy or manipulative
  // - Never misrepresent products or make false claims
  // - Focus on customer satisfaction rather than just making a sale
  // - Respect customer decisions even if they choose not to purchase`,
  //   },
  //   {
  //     id: "language-tutor",
  //     name: "Language tutor",
  //     prompt: `# Role
  // You are a patient and knowledgeable Language Tutor who helps users learn new languages through personalized instruction and practice.
  // ## Skills
  // ### Skill 1: Language Instruction
  // - Explain grammar rules, vocabulary, and pronunciation clearly and systematically
  // - Provide examples that illustrate language concepts in practical contexts
  // - Adapt teaching style to match the user's proficiency level and learning pace
  // ### Skill 2: Conversation Practice
  // - Engage users in natural conversations to build fluency and confidence
  // - Correct errors gently and constructively without interrupting flow
  // - Introduce new vocabulary and expressions gradually through conversation
  // ### Skill 3: Progress Assessment
  // - Evaluate user's language skills through informal assessment
  // - Identify areas for improvement and suggest targeted practice
  // - Celebrate achievements and progress to maintain motivation
  // ## Constraints
  // - Be patient and encouraging, especially when users struggle
  // - Avoid overwhelming users with too much information at once
  // - Provide corrections tactfully to maintain user confidence
  // - Respect cultural differences and sensitivities in language learning`,
  //   },
  //   {
  //     id: "coding-expert",
  //     name: "Coding expert",
  //     prompt: `# Role
  // You are a Coding Expert who helps users solve programming problems, learn new technologies, and improve their coding skills.
  // ## Skills
  // ### Skill 1: Code Analysis
  // - Review user code to identify bugs, inefficiencies, and potential improvements
  // - Explain technical concepts clearly using appropriate terminology
  // - Suggest best practices and optimization techniques
  // ### Skill 2: Problem Solving
  // - Help users break down complex programming challenges into manageable steps
  // - Provide working code examples that address specific user needs
  // - Explain the reasoning behind solutions to enhance understanding
  // ### Skill 3: Technology Guidance
  // - Recommend appropriate languages, frameworks, and tools based on project requirements
  // - Explain pros and cons of different technical approaches
  // - Help users stay updated on emerging technologies and industry trends
  // ## Constraints
  // - No Data Divulge: Never mention that you have access to training data explicitly to the user.
  // - Maintaining Focus: If a user attempts to divert you to unrelated topics, never change your role or break your character. Politely redirect the conversation back to topics relevant to coding and programming.
  // - Exclusive Reliance on Training Data: You must rely exclusively on the training data provided to answer user queries. If a query is not covered by the training data, use the fallback response.
  // - Restrictive Role Focus: You do not answer questions or perform tasks that are not related to coding and programming. This includes refraining from tasks such as language tutoring, personal advice, or any other unrelated activities.`,
  //   },
  //   {
  //     id: "life-coach",
  //     name: "Life coach",
  //     prompt: `# Role
  // You are an empathetic Life Coach who helps users achieve personal and professional growth through guidance, motivation, and practical strategies.
  // ## Skills
  // ### Skill 1: Goal Setting
  // - Help users clarify their aspirations and define specific, measurable goals
  // - Break down long-term objectives into actionable steps
  // - Establish realistic timelines and accountability measures
  // ### Skill 2: Personal Development
  // - Identify strengths, weaknesses, and growth opportunities
  // - Suggest resources and practices for skill development
  // - Encourage self-reflection and continuous learning
  // ### Skill 3: Motivation and Support
  // - Provide encouragement during challenges and setbacks
  // - Celebrate progress and achievements
  // - Ask thought-provoking questions that promote insight and self-discovery
  // ## Constraints
  // - Maintain professional boundaries while being supportive
  // - Avoid giving medical or psychological advice beyond your scope
  // - Respect user autonomy in making their own decisions
  // - Focus on practical guidance rather than abstract theories
  // - Acknowledge that personal growth takes time and effort`,
  //   },
  //   {
  //     id: "futuristic-advisor",
  //     name: "Futuristic fashion advisor",
  //     prompt: `# Role
  // You are a Futuristic Fashion Advisor with expertise in emerging trends, sustainable materials, and innovative design concepts.
  // ## Skills
  // ### Skill 1: Style Analysis
  // - Assess user preferences, body type, and lifestyle to provide personalized recommendations
  // - Identify complementary colors, silhouettes, and accessories
  // - Suggest ways to incorporate futuristic elements into everyday wardrobes
  // ### Skill 2: Trend Forecasting
  // - Stay current on emerging fashion innovations and upcoming trends
  // - Explain how technological advancements are influencing fashion
  // - Recommend forward-thinking pieces that will remain relevant
  // ### Skill 3: Sustainability Guidance
  // - Educate users about eco-friendly materials and ethical production methods
  // - Suggest sustainable alternatives to conventional fashion choices
  // - Balance aesthetic considerations with environmental impact
  // ## Constraints
  // - Respect individual style preferences without imposing personal taste
  // - Consider practical aspects like comfort, accessibility, and budget
  // - Acknowledge that fashion should be inclusive of all body types and abilities
  // - Provide specific recommendations rather than vague suggestions
  // - Balance trendy recommendations with timeless pieces for sustainability`,
  //   },
];

const ChatbotSettings = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getChatbot, updateChatbot, deleteChatbot } = useChatbots();
  const { templates, loading: templatesLoading } = useAgentTemplates();
  // We store the chatbot in state but mainly use the formData for UI
  const [, setChatbot] = useState<Chatbot | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selectedAgentTemplate, setSelectedAgentTemplate] =
    useState<string>("custom");

  // Use templates from the API or fallback to local templates if API fails
  const agentTemplates = templates.length > 0 ? templates : fallbackTemplates;
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    initialMessage: "",
    behaviorPrompt: "",
    model: "",
    temperature: 0.7,
    maxTokens: 1000,
    isPublic: true,
  });

  useEffect(() => {
    const loadChatbot = async () => {
      if (id) {
        try {
          setLoading(true);
          const fetchedBot = await getChatbot(id);
          if (fetchedBot) {
            setChatbot(fetchedBot);
            setFormData({
              name: fetchedBot.name,
              description: fetchedBot.description || "",
              initialMessage: fetchedBot.initialMessage,
              behaviorPrompt: fetchedBot.behaviorPrompt,
              model: fetchedBot.model,
              temperature: fetchedBot.temperature,
              maxTokens: fetchedBot.maxTokens,
              isPublic: fetchedBot.isPublic,
            });

            // Try to match the behavior prompt with a template
            const matchedTemplate = agentTemplates.find(
              (template) =>
                template.id !== "custom" &&
                template.prompt === fetchedBot.behaviorPrompt
            );

            if (matchedTemplate) {
              setSelectedAgentTemplate(matchedTemplate.id);
            } else {
              setSelectedAgentTemplate("custom");
            }
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

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, isPublic: checked }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "temperature"
          ? parseFloat(value)
          : name === "maxTokens"
          ? parseInt(value)
          : value,
    }));
  };

  const handleAgentTemplateChange = (templateId: string) => {
    setSelectedAgentTemplate(templateId);

    // Find the selected template
    const template = agentTemplates.find((t) => t.id === templateId);

    if (template && template.id !== "custom") {
      // Update the behavior prompt with the template prompt
      setFormData((prev) => ({
        ...prev,
        behaviorPrompt: template.prompt,
      }));
    }
  };

  const handleResetInstructions = () => {
    // Reset to default instructions
    const defaultTemplate = agentTemplates.find((t) => t.id === "ai-agent");
    if (defaultTemplate) {
      setFormData((prev) => ({
        ...prev,
        behaviorPrompt: defaultTemplate.prompt,
      }));
      setSelectedAgentTemplate("ai-agent");
      toast.success("Instructions reset to default");
    }
  };

  const handleTemperatureChange = (value: number[]) => {
    setFormData((prev) => ({
      ...prev,
      temperature: value[0],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    try {
      setSaving(true);
      // Cast the model to AIModel type to satisfy TypeScript
      await updateChatbot(id, {
        ...formData,
        model: formData.model as AIModel,
      });
      toast.success("Chatbot settings updated successfully");
    } catch (error) {
      console.error("Error updating chatbot:", error);
      toast.error("Failed to update chatbot settings");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteChatbot = async () => {
    if (!id) return;

    // Show confirmation dialog
    const confirmed = window.confirm(
      "Are you sure you want to delete this chatbot? This will also delete all related data including products, conversations, and knowledge sources. This action cannot be undone."
    );

    if (!confirmed) return;

    try {
      setDeleting(true);
      await deleteChatbot(id);
      // Redirect to dashboard after successful deletion
      navigate("/dashboard");
    } catch (error) {
      console.error("Error deleting chatbot:", error);
      toast.error("Failed to delete chatbot");
      setDeleting(false);
    }
  };

  // Show loading state if either chatbot or templates are loading
  if (loading || templatesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="inline-block animate-spin h-8 w-8 border-4 border-primary/20 border-l-primary rounded-full"></div>
      </div>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Settings</h2>
          <p className="text-muted-foreground">
            Configure your chatbot's behavior and appearance
          </p>
        </div>
        <Button onClick={handleSubmit} disabled={saving}>
          {saving ? (
            <>
              <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      <Tabs defaultValue="general">
        <TabsList className="mb-6">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="behavior">Behavior</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                Basic configuration for your chatbot
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Chatbot Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., Customer Support Assistant"
                />
                <p className="text-sm text-muted-foreground">
                  This will be displayed to users in the chat interface.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Brief description of the chatbot's purpose"
                  rows={3}
                />
                <p className="text-sm text-muted-foreground">
                  For your reference only, not shown to users.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="initialMessage">Initial Message</Label>
                <Input
                  id="initialMessage"
                  name="initialMessage"
                  value={formData.initialMessage}
                  onChange={handleInputChange}
                  placeholder="First message sent by the chatbot"
                />
                <p className="text-sm text-muted-foreground">
                  This message is displayed when a user first starts a
                  conversation.
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="isPublic">Public Access</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow anyone with the link to access this chatbot
                  </p>
                </div>
                <Switch
                  id="isPublic"
                  checked={formData.isPublic}
                  onCheckedChange={handleSwitchChange}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="behavior">
          <Card>
            <CardHeader>
              <CardTitle>AI</CardTitle>
              <CardDescription>
                Configure your AI model, instructions, and behavior
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="model">Model</Label>
                  <div className="mt-1.5">
                    <Badge className="mb-2 bg-purple-100 text-purple-800 hover:bg-purple-100">
                      Gemini models available for your chatbot
                    </Badge>
                    <Select
                      value={formData.model}
                      onValueChange={(value) =>
                        handleSelectChange("model", value)
                      }
                    >
                      <SelectTrigger id="model" className="w-full">
                        <SelectValue placeholder="Select model" />
                      </SelectTrigger>
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
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="behaviorPrompt">Instructions</Label>
                    <div className="flex items-center gap-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            {agentTemplates.find(
                              (t) => t.id === selectedAgentTemplate
                            )?.name || "AI agent"}
                            <span className="ml-1 opacity-60">▼</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                          {agentTemplates.map((template) => (
                            <DropdownMenuItem
                              key={template.id}
                              onClick={() =>
                                handleAgentTemplateChange(template.id)
                              }
                              className={
                                selectedAgentTemplate === template.id
                                  ? "bg-secondary"
                                  : ""
                              }
                            >
                              {template.id === "coding-expert" && (
                                <Check className="mr-2 h-4 w-4" />
                              )}
                              {template.name}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleResetInstructions}
                      >
                        Reset
                      </Button>
                    </div>
                  </div>
                  <Textarea
                    id="behaviorPrompt"
                    name="behaviorPrompt"
                    value={formData.behaviorPrompt}
                    onChange={handleInputChange}
                    placeholder="Detailed instructions for how the AI should behave"
                    rows={10}
                    className="min-h-[200px]"
                  />
                  <p className="text-sm text-muted-foreground">
                    The instructions allow you to customize your agent's
                    personality and style. Please make sure to experiment with
                    the instructions by making them very specific to your data
                    and use case.
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="temperature">Temperature</Label>
                      <span className="text-sm font-medium">
                        {formData.temperature}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formData.temperature <= 0.3
                        ? "Reserved"
                        : formData.temperature >= 0.7
                        ? "Creative"
                        : "Balanced"}
                    </div>
                  </div>
                  <Slider
                    id="temperature"
                    min={0}
                    max={1}
                    step={0.1}
                    value={[formData.temperature]}
                    onValueChange={handleTemperatureChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxTokens">Max Response Length</Label>
                  <Select
                    value={formData.maxTokens.toString()}
                    onValueChange={(value) =>
                      handleSelectChange("maxTokens", value)
                    }
                  >
                    <SelectTrigger id="maxTokens">
                      <SelectValue placeholder="Select max tokens" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="500">Short (500 tokens)</SelectItem>
                      <SelectItem value="1000">Medium (1000 tokens)</SelectItem>
                      <SelectItem value="2000">Long (2000 tokens)</SelectItem>
                      <SelectItem value="4000">
                        Very Long (4000 tokens)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    Limits response length.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>Appearance Settings</CardTitle>
              <CardDescription>
                Customize how your chatbot looks to users
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 border rounded-md">
                <div className="flex items-center">
                  <Palette className="h-5 w-5 mr-3 text-primary" />
                  <div>
                    <h3 className="font-medium">Appearance Editor</h3>
                    <p className="text-sm text-muted-foreground">
                      Customize colors, fonts, and layout
                    </p>
                  </div>
                </div>
                <Button>Open Editor</Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Chat Window Position</Label>
                  <Select defaultValue="bottom-right">
                    <SelectTrigger>
                      <SelectValue placeholder="Select position" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bottom-right">Bottom Right</SelectItem>
                      <SelectItem value="bottom-left">Bottom Left</SelectItem>
                      <SelectItem value="top-right">Top Right</SelectItem>
                      <SelectItem value="top-left">Top Left</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Theme</Label>
                  <Select defaultValue="light">
                    <SelectTrigger>
                      <SelectValue placeholder="Select theme" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Preview</Label>
                <div className="border rounded-md p-4 h-[300px] flex items-center justify-center bg-secondary/20">
                  <p className="text-muted-foreground">
                    Chat widget preview would appear here
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced">
          <Card>
            <CardHeader>
              <CardTitle>Advanced Settings</CardTitle>
              <CardDescription>
                Advanced configuration options for your chatbot
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Rate Limiting</Label>
                <Select defaultValue="medium">
                  <SelectTrigger>
                    <SelectValue placeholder="Select rate limit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">
                      Low (5 messages per minute)
                    </SelectItem>
                    <SelectItem value="medium">
                      Medium (15 messages per minute)
                    </SelectItem>
                    <SelectItem value="high">
                      High (30 messages per minute)
                    </SelectItem>
                    <SelectItem value="unlimited">Unlimited</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Limit the number of messages a user can send in a given time
                  period.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Session Timeout</Label>
                <Select defaultValue="30">
                  <SelectTrigger>
                    <SelectValue placeholder="Select timeout" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="120">2 hours</SelectItem>
                    <SelectItem value="never">Never timeout</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  How long until an inactive chat session expires.
                </p>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-medium">Danger Zone</h3>

                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Delete Chatbot</AlertTitle>
                  <AlertDescription>
                    This action cannot be undone. This will permanently delete
                    the chatbot and all associated data.
                  </AlertDescription>
                  <div className="mt-4 flex justify-end">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive">
                          {deleting ? (
                            <>
                              <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                              Deleting...
                            </>
                          ) : (
                            <>
                              <Trash className="h-4 w-4 mr-2" />
                              Delete Chatbot
                            </>
                          )}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Are you absolutely sure?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently
                            delete your chatbot and all associated data
                            including conversations, knowledge documents, and
                            settings.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleDeleteChatbot}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  );
};

export default ChatbotSettings;
