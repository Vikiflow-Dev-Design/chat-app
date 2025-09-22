import { apiRequest } from "@/utils/api";

// Base API endpoint
const API_BASE = "/knowledge-management";

// Types for knowledge management
export interface KnowledgeOverview {
  chatbotId: string;
  chatbotName: string;
  mongodb: {
    files: number;
    texts: number;
    qaItems: number;
    totalSources: number;
  };
  supabase: {
    totalChunks: number;
    chunksByType: Record<string, number>;
  };
  lastUpdated: string | null;
}

export interface FileKnowledge {
  _id: string;
  title: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  content: string;
  extractedInformation?: string;
  tags: string[];
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
  chunks: ChunkData[];
  chunkCount: number;
  hasAdvancedProcessing: boolean;
}

export interface TextKnowledge {
  _id: string;
  title: string;
  description?: string;
  content: string;
  extractedInformation?: string;
  tags: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  chunks: ChunkData[];
  chunkCount: number;
  hasAdvancedProcessing: boolean;
}

export interface QAKnowledge {
  _id: string;
  title: string;
  qaItems: Array<{
    question: string;
    answer: string;
  }>;
  tags: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  chunks: ChunkData[];
  chunkCount: number;
  hasAdvancedProcessing: boolean;
}

export interface ChunkData {
  id: string;
  chatbot_id: string;
  document_id: string;
  chunk_index: number;
  content: string;
  chunk_type?: string;
  document_section?: string;
  content_length?: number;
  word_count?: number;
  metadata: {
    title?: string;
    sourceType?: string;
    topics?: string[];
    keywords?: string[];
    entities?: string[];
    complexity_level?: string;
    question_types?: string[];
    audience?: string[];
    prerequisites?: string[];
    related_concepts?: string[];
    source_document?: any;
    processing_version?: string;
    [key: string]: any;
  };
  heading_context?: Array<{
    level: number;
    title: string;
  }>;
  embeddings?: {
    content?: number[];
    topics?: number[];
    keywords?: number[];
    heading_context?: number[];
    document_section?: number[];
    audience?: number[];
    question_type?: number[];
  };
  llm_processed?: boolean;
  llm_processing_version?: string;
  processing_method?: string;
  created_at: string;
  updated_at: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

// API Functions

// Get knowledge overview
export const getKnowledgeOverview = async (
  chatbotId: string
): Promise<KnowledgeOverview> => {
  return apiRequest(`${API_BASE}/overview/${chatbotId}`, {
    method: "GET",
  });
};

// Files API
export const getFiles = async (
  chatbotId: string,
  page = 1,
  limit = 10,
  search = ""
): Promise<{ files: FileKnowledge[]; pagination: any }> => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    search,
  });

  return apiRequest(`${API_BASE}/files/${chatbotId}?${params}`, {
    method: "GET",
  });
};

export const getFileDetails = async (
  chatbotId: string,
  fileId: string
): Promise<{
  file: FileKnowledge;
  chunks: ChunkData[];
  chunkCount: number;
}> => {
  return apiRequest(`${API_BASE}/files/${chatbotId}/${fileId}`, {
    method: "GET",
  });
};

export const updateFile = async (
  chatbotId: string,
  fileId: string,
  data: { title?: string; tags?: string[]; isActive?: boolean }
): Promise<{ message: string; file: FileKnowledge }> => {
  return apiRequest(`${API_BASE}/files/${chatbotId}/${fileId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
};

export const deleteFile = async (
  chatbotId: string,
  fileId: string
): Promise<{ message: string }> => {
  return apiRequest(`${API_BASE}/files/${chatbotId}/${fileId}`, {
    method: "DELETE",
  });
};

// Texts API
export const getTexts = async (
  chatbotId: string,
  page = 1,
  limit = 10,
  search = ""
): Promise<{ texts: TextKnowledge[]; pagination: any }> => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    search,
  });

  return apiRequest(`${API_BASE}/texts/${chatbotId}?${params}`, {
    method: "GET",
  });
};

export const getTextDetails = async (
  chatbotId: string,
  textId: string
): Promise<{
  text: TextKnowledge;
  chunks: ChunkData[];
  chunkCount: number;
}> => {
  return apiRequest(`${API_BASE}/texts/${chatbotId}/${textId}`, {
    method: "GET",
  });
};

export const updateText = async (
  chatbotId: string,
  textId: string,
  data: {
    title?: string;
    description?: string;
    content?: string;
    tags?: string[];
    isActive?: boolean;
  }
): Promise<{ message: string; text: TextKnowledge }> => {
  return apiRequest(`${API_BASE}/texts/${chatbotId}/${textId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
};

export const deleteText = async (
  chatbotId: string,
  textId: string
): Promise<{ message: string }> => {
  return apiRequest(`${API_BASE}/texts/${chatbotId}/${textId}`, {
    method: "DELETE",
  });
};

// Q&A API
export const getQAItems = async (
  chatbotId: string,
  page = 1,
  limit = 10,
  search = ""
): Promise<{ qaItems: QAKnowledge[]; pagination: any }> => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    search,
  });

  return apiRequest(`${API_BASE}/qa/${chatbotId}?${params}`, {
    method: "GET",
  });
};

export const getQADetails = async (
  chatbotId: string,
  qaId: string
): Promise<{ qa: QAKnowledge; chunks: ChunkData[]; chunkCount: number }> => {
  return apiRequest(`${API_BASE}/qa/${chatbotId}/${qaId}`, {
    method: "GET",
  });
};

export const updateQA = async (
  chatbotId: string,
  qaId: string,
  data: {
    title?: string;
    qaItems?: Array<{ question: string; answer: string }>;
    tags?: string[];
    isActive?: boolean;
  }
): Promise<{ message: string; qa: QAKnowledge }> => {
  return apiRequest(`${API_BASE}/qa/${chatbotId}/${qaId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
};

export const deleteQA = async (
  chatbotId: string,
  qaId: string
): Promise<{ message: string }> => {
  return apiRequest(`${API_BASE}/qa/${chatbotId}/${qaId}`, {
    method: "DELETE",
  });
};

// Chunks API
export const getChunks = async (
  chatbotId: string,
  documentId: string,
  page = 1,
  limit = 20
): Promise<{ chunks: ChunkData[]; pagination: any }> => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });

  return apiRequest(`${API_BASE}/chunks/${chatbotId}/${documentId}?${params}`, {
    method: "GET",
  });
};

// Get single chunk details
export const getChunkDetails = async (
  chatbotId: string,
  chunkId: string
): Promise<ChunkData> => {
  return apiRequest(`${API_BASE}/chunks/${chatbotId}/chunk/${chunkId}`, {
    method: "GET",
  });
};

// Update chunk metadata (only metadata fields, not content)
export const updateChunkMetadata = async (
  chatbotId: string,
  chunkId: string,
  metadata: {
    topics?: string[];
    keywords?: string[];
    heading_context?: Array<{ level: number; title: string }>;
    document_section?: string;
    chunk_type?: string;
  }
): Promise<{ message: string; chunk: ChunkData }> => {
  return apiRequest(
    `${API_BASE}/chunks/${chatbotId}/chunk/${chunkId}/metadata`,
    {
      method: "PUT",
      body: JSON.stringify(metadata),
    }
  );
};

// Delete chunk
export const deleteChunk = async (
  chatbotId: string,
  chunkId: string
): Promise<{ message: string }> => {
  return apiRequest(`${API_BASE}/chunks/${chatbotId}/chunk/${chunkId}`, {
    method: "DELETE",
  });
};
