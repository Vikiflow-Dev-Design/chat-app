import { apiRequest } from "@/utils/api";

// Make sure we're using the correct API URL
const API_URL = `${
  import.meta.env.VITE_API_URL || "https://vikiaibackend.vikiflow.com/api"
}/chatbot-knowledge`;
console.log("Using API URL:", API_URL);

// Types for the unified knowledge model
export interface FileSource {
  _id: string;
  title: string;
  fileType: string;
  fileName: string;
  fileSize: number;
  content?: string;
  extractedInformation?: string;
  tags?: string[];
  isActive: boolean;
  processingStatus:
    | "pending"
    | "optimizing"
    | "processing"
    | "completed"
    | "failed";
  processingError?: string;
  originalSize?: number;
  optimizedSize?: number;
  sizeReduction?: number;
  createdAt: string;
  updatedAt: string;

  // Add any additional properties that might be in the API response
  [key: string]: any;
}

export interface TextSource {
  _id: string;
  title: string;
  description?: string;
  content: string;
  extractedInformation?: string;
  tags?: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface QAItem {
  question: string;
  answer: string;
}

export interface QASource {
  _id: string;
  title: string;
  qaItems: QAItem[];
  tags?: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LinkSource {
  _id: string;
  url: string;
  size: string | number;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ChatbotKnowledge {
  _id: string;
  chatbotId: string;
  files: FileSource[];
  texts: TextSource[];
  qaItems: QASource[];
  links?: LinkSource[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;

  // Add any additional properties that might be in the API response
  [key: string]: any;
}

// DTOs for creating new sources
export interface CreateTextSourceDto {
  chatbotId: string;
  title: string;
  description?: string;
  content: string;
  tags?: string[];
}

export interface CreateQASourceDto {
  chatbotId: string;
  title: string;
  qaItems: QAItem[];
  tags?: string[];
}

// Get knowledge for a chatbot
export const getChatbotKnowledge = async (
  chatbotId: string,
  token: string
): Promise<ChatbotKnowledge> => {
  if (!token) {
    throw new Error("Authentication required");
  }

  const response = await fetch(`${API_URL}/chatbot/${chatbotId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch chatbot knowledge");
  }

  return response.json();
};

// Add a text source
export const addTextSource = async (
  textSource: CreateTextSourceDto,
  token: string
): Promise<ChatbotKnowledge> => {
  if (!token) {
    throw new Error("Authentication required");
  }

  const response = await fetch(`${API_URL}/text`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(textSource),
  });

  if (!response.ok) {
    throw new Error("Failed to add text source");
  }

  return response.json();
};

// Add a Q&A source
export const addQASource = async (
  qaSource: CreateQASourceDto,
  token: string
): Promise<ChatbotKnowledge> => {
  if (!token) {
    throw new Error("Authentication required");
  }

  const response = await fetch(`${API_URL}/qa`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(qaSource),
  });

  if (!response.ok) {
    throw new Error("Failed to add Q&A source");
  }

  return response.json();
};

// Upload a file
export const uploadFile = async (
  file: File,
  chatbotId: string,
  title: string,
  tags: string[] = [],
  token: string
): Promise<ChatbotKnowledge> => {
  if (!token) {
    throw new Error("Authentication required");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("chatbotId", chatbotId);
  formData.append("title", title || file.name);

  if (tags.length > 0) {
    formData.append("tags", JSON.stringify(tags));
  }

  try {
    console.log(`Uploading file to ${API_URL}/file`);

    const response = await fetch(`${API_URL}/file`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Upload error response:", errorText);
      throw new Error(
        `Failed to upload file: ${response.status} ${response.statusText}`
      );
    }

    return response.json();
  } catch (error) {
    console.error("Error in uploadFile:", error);
    throw error;
  }
};

// Delete a file source
export const deleteFileSource = async (
  chatbotId: string,
  fileId: string,
  token: string
): Promise<void> => {
  if (!token) {
    throw new Error("Authentication required");
  }

  const response = await fetch(`${API_URL}/file/${chatbotId}/${fileId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to delete file source");
  }
};

// Delete a text source
export const deleteTextSource = async (
  chatbotId: string,
  textId: string,
  token: string
): Promise<void> => {
  if (!token) {
    throw new Error("Authentication required");
  }

  const response = await fetch(`${API_URL}/text/${chatbotId}/${textId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to delete text source");
  }
};

// Delete a Q&A source
export const deleteQASource = async (
  chatbotId: string,
  qaId: string,
  token: string
): Promise<void> => {
  if (!token) {
    throw new Error("Authentication required");
  }

  const response = await fetch(`${API_URL}/qa/${chatbotId}/${qaId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to delete Q&A source");
  }
};

// Update a text source
export const updateTextSource = async (
  chatbotId: string,
  textId: string,
  updates: {
    title?: string;
    description?: string;
    content?: string;
    tags?: string[];
  },
  token: string
): Promise<ChatbotKnowledge> => {
  if (!token) {
    throw new Error("Authentication required");
  }

  const response = await fetch(`${API_URL}/text/${chatbotId}/${textId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    throw new Error("Failed to update text source");
  }

  return response.json();
};

// Search knowledge
export const searchChatbotKnowledge = async (
  chatbotId: string,
  query: string,
  token: string
): Promise<ChatbotKnowledge> => {
  if (!token) {
    throw new Error("Authentication required");
  }

  const response = await fetch(
    `${API_URL}/search/${chatbotId}?query=${encodeURIComponent(query)}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to search chatbot knowledge");
  }

  return response.json();
};
