import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import {
  AgentTemplate,
  agentTemplateService,
} from "@/services/agentTemplateService";
import { toast } from "sonner";

interface AgentTemplateContextType {
  templates: AgentTemplate[];
  loading: boolean;
  error: string | null;
  getTemplate: (id: string) => Promise<AgentTemplate | null>;
  refreshTemplates: () => Promise<void>;
}

const AgentTemplateContext = createContext<
  AgentTemplateContextType | undefined
>(undefined);

export const useAgentTemplates = () => {
  const context = useContext(AgentTemplateContext);
  if (!context) {
    throw new Error(
      "useAgentTemplates must be used within an AgentTemplateProvider"
    );
  }
  return context;
};

interface AgentTemplateProviderProps {
  children: ReactNode;
}

export const AgentTemplateProvider: React.FC<AgentTemplateProviderProps> = ({
  children,
}) => {
  const [templates, setTemplates] = useState<AgentTemplate[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Default templates to use if API fails
  const defaultTemplates: AgentTemplate[] = [
    {
      id: "custom",
      name: "Custom prompt",
      prompt: "",
    },
    {
      id: "ai-agent",
      name: "AI agent",
      prompt: `# Role\nYou are an AI assistant designed to be helpful, harmless, and honest...`,
    },
    {
      id: "customer-support",
      name: "Customer support agent",
      prompt: `# Role\nYou are a dedicated Customer Support Bot who assists users...`,
    },
    {
      id: "coding-expert",
      name: "Coding expert",
      prompt: `# Role\nYou are a Coding Expert who helps users solve programming problems...`,
    },
  ];

  const fetchTemplates = async () => {
    setLoading(true);
    setError(null);
    try {
      const fetchedTemplates = await agentTemplateService.getTemplates();
      setTemplates(fetchedTemplates);
    } catch (err) {
      console.error("Failed to fetch agent templates:", err);
      setError("Failed to load agent templates. Using default templates.");
      toast.error("Failed to load agent templates. Using default templates.");
      // Use default templates if API fails
      setTemplates(defaultTemplates);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const getTemplate = async (id: string): Promise<AgentTemplate | null> => {
    try {
      // First check if we already have it in state
      const cachedTemplate = templates.find((t) => t.id === id);
      if (cachedTemplate) return cachedTemplate;

      // Otherwise fetch from API
      return await agentTemplateService.getTemplate(id);
    } catch (err) {
      console.error(`Failed to get template with id ${id}:`, err);
      toast.error(`Failed to load template: ${id}`);
      return null;
    }
  };

  const refreshTemplates = async (): Promise<void> => {
    await fetchTemplates();
  };

  const value = {
    templates,
    loading,
    error,
    getTemplate,
    refreshTemplates,
  };

  return (
    <AgentTemplateContext.Provider value={value}>
      {children}
    </AgentTemplateContext.Provider>
  );
};
