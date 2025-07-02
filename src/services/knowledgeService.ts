import { apiRequest } from "@/utils/api";

// Endpoint for knowledge API
const KNOWLEDGE_ENDPOINT = "/knowledge";

export interface KnowledgeDocument {
  _id: string;
  chatbotId: string;
  title: string;
  sourceType: "file" | "text" | "qa";
  content?: string;
  fileType?: string;
  fileName?: string;
  fileSize?: number;
  extractedInformation?: string;
  qaItems?: Array<{
    question: string;
    answer: string;
  }>;
  tags?: string[];
  isActive: boolean;
  processingStatus: "pending" | "processing" | "completed" | "failed";
  processingError?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTextDocumentDto {
  chatbotId: string;
  title: string;
  content: string;
  tags?: string[];
}

export interface CreateQADocumentDto {
  chatbotId: string;
  title: string;
  qaItems: Array<{
    question: string;
    answer: string;
  }>;
  tags?: string[];
}

export interface UpdateKnowledgeDocumentDto {
  title?: string;
  content?: string;
  qaItems?: Array<{
    question: string;
    answer: string;
  }>;
  tags?: string[];
  isActive?: boolean;
}

// Get all knowledge documents
export const getAllKnowledgeDocuments = async (
  token: string
): Promise<KnowledgeDocument[]> => {
  if (!token) {
    throw new Error("Authentication required");
  }

  try {
    return await apiRequest<KnowledgeDocument[]>(KNOWLEDGE_ENDPOINT, { token });
  } catch (error) {
    console.error("Failed to fetch all knowledge documents:", error);
    throw new Error("Failed to fetch all knowledge documents");
  }
};

// Get all knowledge documents for a chatbot
export const getKnowledgeDocuments = async (
  chatbotId: string,
  token: string
): Promise<KnowledgeDocument[]> => {
  if (!token) {
    throw new Error("Authentication required");
  }

  try {
    return await apiRequest<KnowledgeDocument[]>(
      `${KNOWLEDGE_ENDPOINT}/chatbot/${chatbotId}`,
      { token }
    );
  } catch (error) {
    console.error("Failed to fetch knowledge documents:", error);
    throw new Error("Failed to fetch knowledge documents");
  }
};

// Get a single knowledge document
export const getKnowledgeDocument = async (
  documentId: string,
  token: string
): Promise<KnowledgeDocument> => {
  if (!token) {
    throw new Error("Authentication required");
  }

  const response = await fetch(`${API_URL}/${documentId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch knowledge document");
  }

  return response.json();
};

// Create a new text knowledge document
export const createTextDocument = async (
  document: CreateTextDocumentDto,
  token: string
): Promise<KnowledgeDocument> => {
  if (!token) {
    throw new Error("Authentication required");
  }

  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(document),
  });

  if (!response.ok) {
    throw new Error("Failed to create text document");
  }

  return response.json();
};

// Create a new Q&A knowledge document
export const createQADocument = async (
  document: CreateQADocumentDto,
  token: string
): Promise<KnowledgeDocument> => {
  if (!token) {
    throw new Error("Authentication required");
  }

  const response = await fetch(`${API_URL}/qa`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(document),
  });

  if (!response.ok) {
    throw new Error("Failed to create Q&A document");
  }

  return response.json();
};

// Upload a file to create a file knowledge document
export const uploadFileDocument = async (
  file: File,
  chatbotId: string,
  title: string,
  token: string
): Promise<KnowledgeDocument> => {
  if (!token) {
    throw new Error("Authentication required");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("chatbotId", chatbotId);
  formData.append("title", title || file.name);

  const response = await fetch(`${API_URL}/upload`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Failed to upload file");
  }

  return response.json();
};

// Update a knowledge document
export const updateKnowledgeDocument = async (
  documentId: string,
  updates: UpdateKnowledgeDocumentDto,
  token: string
): Promise<KnowledgeDocument> => {
  if (!token) {
    throw new Error("Authentication required");
  }

  const response = await fetch(`${API_URL}/${documentId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    throw new Error("Failed to update knowledge document");
  }

  return response.json();
};

// Delete a knowledge document
export const deleteKnowledgeDocument = async (
  documentId: string,
  token: string
): Promise<void> => {
  if (!token) {
    throw new Error("Authentication required");
  }

  const response = await fetch(`${API_URL}/${documentId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to delete knowledge document");
  }
};

// Search knowledge documents
export const searchKnowledgeDocuments = async (
  chatbotId: string,
  query: string,
  token: string
): Promise<KnowledgeDocument[]> => {
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
    throw new Error("Failed to search knowledge documents");
  }

  return response.json();
};
