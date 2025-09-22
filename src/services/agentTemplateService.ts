import { apiRequest } from "@/utils/api";

export interface AgentTemplate {
  id: string;
  name: string;
  prompt: string;
  category?: string;
  isDefault?: boolean;
  isPublic?: boolean;
  createdBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Endpoint for agent templates API
const AGENT_TEMPLATES_ENDPOINT = "/agent-templates";

/**
 * Service for interacting with agent templates API
 */
export const agentTemplateService = {
  /**
   * Get all agent templates
   */
  async getTemplates(): Promise<AgentTemplate[]> {
    try {
      const templates = await apiRequest<any[]>(AGENT_TEMPLATES_ENDPOINT);

      return templates.map((template: any) => ({
        ...template,
        id: template.id,
        createdAt: template.createdAt
          ? new Date(template.createdAt)
          : undefined,
        updatedAt: template.updatedAt
          ? new Date(template.updatedAt)
          : undefined,
      }));
    } catch (error) {
      console.error("Failed to fetch agent templates:", error);
      throw error;
    }
  },

  /**
   * Get a single agent template by ID
   */
  async getTemplate(id: string): Promise<AgentTemplate> {
    try {
      const template = await apiRequest<any>(
        `${AGENT_TEMPLATES_ENDPOINT}/${id}`
      );

      return {
        ...template,
        id: template.id,
        createdAt: template.createdAt
          ? new Date(template.createdAt)
          : undefined,
        updatedAt: template.updatedAt
          ? new Date(template.updatedAt)
          : undefined,
      };
    } catch (error) {
      console.error(`Failed to fetch agent template with id ${id}:`, error);
      throw error;
    }
  },

  /**
   * Create a new agent template (admin only)
   */
  async createTemplate(
    template: Omit<AgentTemplate, "createdAt" | "updatedAt">
  ): Promise<AgentTemplate> {
    try {
      const savedTemplate = await apiRequest<any>(AGENT_TEMPLATES_ENDPOINT, {
        method: "POST",
        body: JSON.stringify(template),
      });

      return {
        ...savedTemplate,
        id: savedTemplate.id,
        createdAt: savedTemplate.createdAt
          ? new Date(savedTemplate.createdAt)
          : undefined,
        updatedAt: savedTemplate.updatedAt
          ? new Date(savedTemplate.updatedAt)
          : undefined,
      };
    } catch (error) {
      console.error("Failed to create agent template:", error);
      throw error;
    }
  },

  /**
   * Update an existing agent template (admin only)
   */
  async updateTemplate(
    id: string,
    updates: Partial<Omit<AgentTemplate, "id" | "createdAt" | "updatedAt">>
  ): Promise<AgentTemplate> {
    try {
      const updatedTemplate = await apiRequest<any>(
        `${AGENT_TEMPLATES_ENDPOINT}/${id}`,
        {
          method: "PUT",
          body: JSON.stringify(updates),
        }
      );

      return {
        ...updatedTemplate,
        id: updatedTemplate.id,
        createdAt: updatedTemplate.createdAt
          ? new Date(updatedTemplate.createdAt)
          : undefined,
        updatedAt: updatedTemplate.updatedAt
          ? new Date(updatedTemplate.updatedAt)
          : undefined,
      };
    } catch (error) {
      console.error(`Failed to update agent template with id ${id}:`, error);
      throw error;
    }
  },

  /**
   * Get templates for a specific chatbot (including custom prompt)
   */
  async getChatbotTemplates(chatbotId: string): Promise<AgentTemplate[]> {
    try {
      const templates = await apiRequest<any[]>(
        `${AGENT_TEMPLATES_ENDPOINT}/chatbot/${chatbotId}`
      );

      return templates.map((template: any) => ({
        ...template,
        id: template.id,
        createdAt: template.createdAt
          ? new Date(template.createdAt)
          : undefined,
        updatedAt: template.updatedAt
          ? new Date(template.updatedAt)
          : undefined,
      }));
    } catch (error) {
      console.error(
        `Failed to fetch templates for chatbot ${chatbotId}:`,
        error
      );
      throw error;
    }
  },

  /**
   * Update a custom prompt for a specific chatbot
   */
  async updateCustomPrompt(
    chatbotId: string,
    prompt: string
  ): Promise<AgentTemplate> {
    try {
      const updatedTemplate = await apiRequest<any>(
        `${AGENT_TEMPLATES_ENDPOINT}/custom/${chatbotId}`,
        {
          method: "PUT",
          body: JSON.stringify({ prompt }),
        }
      );

      return {
        ...updatedTemplate,
        id: updatedTemplate.id,
        createdAt: updatedTemplate.createdAt
          ? new Date(updatedTemplate.createdAt)
          : undefined,
        updatedAt: updatedTemplate.updatedAt
          ? new Date(updatedTemplate.updatedAt)
          : undefined,
      };
    } catch (error) {
      console.error(
        `Failed to update custom prompt for chatbot ${chatbotId}:`,
        error
      );
      throw error;
    }
  },

  async deleteTemplate(
    id: string
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await apiRequest<{ message: string }>(
        `${AGENT_TEMPLATES_ENDPOINT}/${id}`,
        {
          method: "DELETE",
        }
      );

      return {
        success: true,
        message: response.message,
      };
    } catch (error) {
      console.error(`Failed to delete agent template with id ${id}:`, error);
      throw error;
    }
  },
};
