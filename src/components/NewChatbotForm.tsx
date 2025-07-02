import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useChatbots } from "@/context/ChatbotContext";
import { AIModel } from "@/types/chatbot";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// Define form schema
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
  isPublic: z.boolean().default(true),
});

export function NewChatbotForm() {
  const navigate = useNavigate();
  const { createChatbot } = useChatbots();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      initialMessage: "Hi! How can I help you today?",
      behaviorPrompt:
        "You are a helpful assistant. Answer user questions accurately and professionally.",
      model: "gemini-2.5-flash-preview-04-17",
      isPublic: true,
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);

    try {
      // Ensure all required fields are provided explicitly
      const newBot = await createChatbot({
        name: values.name,
        description: values.description || "",
        initialMessage: values.initialMessage,
        behaviorPrompt: values.behaviorPrompt,
        model: values.model as AIModel,
        temperature: 0.7,
        maxTokens: 1000,
        isPublic: values.isPublic,
      });

      toast.success("Chatbot created successfully!");
      navigate(`/chatbot/${newBot.id}`);
    } catch (error) {
      console.error("Failed to create chatbot:", error);
      toast.error("Failed to create chatbot. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4 max-w-2xl mx-auto"
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Chatbot Name</FormLabel>
              <FormControl>
                <Input placeholder="Customer Support Assistant" {...field} />
              </FormControl>
              <FormDescription>
                Choose a descriptive name for your chatbot.
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
                <Textarea
                  placeholder="Describe what your chatbot does..."
                  {...field}
                />
              </FormControl>
              <FormDescription>
                A brief description to help you identify this chatbot.
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
                <Input placeholder="Hi! How can I help you today?" {...field} />
              </FormControl>
              <FormDescription>
                The first message users will see from your chatbot.
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
                  placeholder="Instructions for how the AI should behave..."
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Detailed instructions that define your chatbot's personality and
                knowledge.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="model"
          render={({ field }) => (
            <FormItem>
              <FormLabel>AI Model</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a model" />
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
                  <SelectItem value="gemini-1.5-pro">Gemini 1.5 Pro</SelectItem>
                  <SelectItem value="gemini-1.5-flash">
                    Gemini 1.5 Flash
                  </SelectItem>
                  <SelectItem value="gemini-1.5-flash-8b">
                    Gemini 1.5 Flash 8B
                  </SelectItem>
                  <SelectItem value="gemma-3-1b-it">Gemma 3 1B IT</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                More powerful models cost more but give better responses.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Creating..." : "Create Chatbot"}
        </Button>
      </form>
    </Form>
  );
}
