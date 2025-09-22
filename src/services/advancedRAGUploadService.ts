/**
 * Advanced RAG Upload Service
 * Handles file uploads with the new Advanced RAG processing pipeline
 */

import { ChatbotKnowledge } from "@/types/knowledge";

const API_URL = "http://localhost:5000/api/chatbot-knowledge"; // Temporarily hardcoded for testing
const isDevelopment = import.meta.env.DEV;

export interface AdvancedRAGUploadResult {
  success: boolean;
  message: string;
  knowledge: ChatbotKnowledge;
  processingDetails: {
    method: string;
    doclingProcessing: {
      success: boolean;
      contentLength: number;
      metadata: any;
    };
    chunking: {
      chunksCreated: number;
      chunkingMethod: string;
    };
    storage: {
      chunksStored: number;
      relationshipsCreated: number;
      supabaseDocumentId: string;
    };
    processingTime: number;
    embeddingStatus: string;
  };
}

export interface ProcessingStatus {
  fileId: string;
  status: {
    processingStatus: string;
    embeddingStatus: string;
    advancedRAGEnabled: boolean;
    chunkCount: number;
    chunksStored: number;
    relationshipsCreated: number;
    processingTime: number;
    processingError?: string;
    embeddingError?: string;
  };
}

/**
 * Upload a file using the Advanced RAG processing pipeline
 * @param file The file to upload
 * @param chatbotId The ID of the chatbot
 * @param title Title for the file
 * @param tags Optional tags for the file
 * @param token JWT token for authentication
 * @returns Promise with the advanced RAG upload result
 */
export const uploadFileWithAdvancedRAG = async (
  file: File,
  chatbotId: string,
  title: string,
  tags: string[] = [],
  token: string = "mock_jwt_token_for_development"
): Promise<AdvancedRAGUploadResult> => {
  if (!token) {
    throw new Error("Authentication required");
  }

  if (!file) {
    throw new Error("No file provided");
  }

  if (!chatbotId) {
    throw new Error("Chatbot ID is required");
  }

  if (!title) {
    throw new Error("Title is required");
  }

  // Validate file type
  const allowedTypes = [".pdf", ".doc", ".docx", ".txt", ".html", ".pptx"];
  const fileExtension = "." + file.name.split(".").pop()?.toLowerCase();

  if (!allowedTypes.includes(fileExtension)) {
    throw new Error(
      `Unsupported file type. Allowed types: ${allowedTypes.join(", ")}`
    );
  }

  // Validate file size (50MB limit)
  const maxSize = 50 * 1024 * 1024; // 50MB
  if (file.size > maxSize) {
    throw new Error("File size exceeds 50MB limit");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("chatbotId", chatbotId);
  formData.append("title", title);
  formData.append("useAdvancedRAG", "true");

  if (tags && tags.length > 0) {
    formData.append("tags", JSON.stringify(tags));
  }

  try {
    const uploadUrl = `${API_URL}/advanced-upload`;
    console.log(`🔍 API_URL: ${API_URL}`);
    console.log(`🔍 Full upload URL: ${uploadUrl}`);
    console.log(`🚀 Uploading file with Advanced RAG to ${uploadUrl}`);
    console.log("File details:", {
      name: file.name,
      type: file.type,
      size: file.size,
      chatbotId,
      title,
      tags,
    });

    const headers: HeadersInit = {
      Authorization: `Bearer ${token}`,
    };

    const response = await fetch(uploadUrl, {
      method: "POST",
      headers,
      body: formData,
      credentials: isDevelopment ? "include" : "same-origin",
      mode: "cors",
    });

    console.log("Advanced RAG upload response status:", response.status);

    if (!response.ok) {
      let errorMessage = `Failed to upload file with Advanced RAG: ${response.status} ${response.statusText}`;
      try {
        const errorText = await response.text();
        console.error("Advanced RAG upload error response:", errorText);
        if (errorText) {
          try {
            const errorJson = JSON.parse(errorText);
            errorMessage = errorJson.message || errorJson.error || errorMessage;
          } catch (e) {
            errorMessage = errorText;
          }
        }
      } catch (e) {
        console.error("Error parsing error response:", e);
      }
      throw new Error(errorMessage);
    }

    const result: AdvancedRAGUploadResult = await response.json();
    console.log("✅ Advanced RAG upload successful:", result);

    return result;
  } catch (error) {
    console.error("❌ Error in Advanced RAG upload:", error);
    throw error;
  }
};

/**
 * Get processing status for a file
 * @param chatbotId The chatbot ID
 * @param fileId The file ID
 * @param token JWT token for authentication
 * @returns Promise with the processing status
 */
export const getProcessingStatus = async (
  chatbotId: string,
  fileId: string,
  token: string = "mock_jwt_token_for_development"
): Promise<ProcessingStatus> => {
  if (!token) {
    throw new Error("Authentication required");
  }

  try {
    const statusUrl = `${API_URL}/processing-status/${chatbotId}/${fileId}`;
    console.log(`📊 Getting processing status from ${statusUrl}`);

    const response = await fetch(statusUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      credentials: isDevelopment ? "include" : "same-origin",
    });

    if (!response.ok) {
      let errorMessage = `Failed to get processing status: ${response.status} ${response.statusText}`;
      try {
        const errorText = await response.text();
        console.error("Status error response:", errorText);
        if (errorText) {
          try {
            const errorJson = JSON.parse(errorText);
            errorMessage = errorJson.message || errorJson.error || errorMessage;
          } catch (e) {
            errorMessage = errorText;
          }
        }
      } catch (e) {
        console.error("Error parsing error response:", e);
      }
      throw new Error(errorMessage);
    }

    const result: ProcessingStatus = await response.json();
    console.log("📊 Processing status:", result);

    return result;
  } catch (error) {
    console.error("❌ Error getting processing status:", error);
    throw error;
  }
};

/**
 * Poll processing status until completion
 * @param chatbotId The chatbot ID
 * @param fileId The file ID
 * @param token JWT token for authentication
 * @param onProgress Callback for progress updates
 * @param maxAttempts Maximum polling attempts
 * @param intervalMs Polling interval in milliseconds
 * @returns Promise with the final processing status
 */
export const pollProcessingStatus = async (
  chatbotId: string,
  fileId: string,
  token: string = "mock_jwt_token_for_development",
  onProgress?: (status: ProcessingStatus) => void,
  maxAttempts: number = 30,
  intervalMs: number = 2000
): Promise<ProcessingStatus> => {
  let attempts = 0;

  while (attempts < maxAttempts) {
    try {
      const status = await getProcessingStatus(chatbotId, fileId, token);

      if (onProgress) {
        onProgress(status);
      }

      // Check if processing is complete
      const isProcessingComplete =
        status.status.processingStatus === "completed" ||
        status.status.processingStatus === "failed";

      const isEmbeddingComplete =
        status.status.embeddingStatus === "completed" ||
        status.status.embeddingStatus === "failed" ||
        !status.status.embeddingStatus; // No embedding status means not started yet

      if (isProcessingComplete && isEmbeddingComplete) {
        console.log(`✅ Processing completed for file ${fileId}`);
        return status;
      }

      // Wait before next poll
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
      attempts++;
    } catch (error) {
      console.error(
        `❌ Error polling status (attempt ${attempts + 1}):`,
        error
      );
      attempts++;

      if (attempts >= maxAttempts) {
        throw new Error(
          `Failed to get processing status after ${maxAttempts} attempts`
        );
      }

      // Wait before retry
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
  }

  throw new Error(
    `Processing status polling timed out after ${maxAttempts} attempts`
  );
};

/**
 * Check if Advanced RAG is available
 * @returns Promise<boolean> indicating if Advanced RAG is available
 */
export const isAdvancedRAGAvailable = async (): Promise<boolean> => {
  try {
    // Check if the backend is available and has the advanced upload endpoint
    const healthUrl = `${API_URL.replace("/chatbot-knowledge", "")}/health`;
    const response = await fetch(healthUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      // If backend is healthy, assume Advanced RAG is available
      // This is a simplified check - in production you might want more sophisticated health checks
      console.log("✅ Backend is healthy, Advanced RAG is available");
      return true;
    }

    return false;
  } catch (error) {
    console.warn("Could not check Advanced RAG availability:", error);
    return false;
  }
};

/**
 * Get supported file types for Advanced RAG
 * @returns Array of supported file extensions
 */
export const getSupportedFileTypes = (): string[] => {
  return [".pdf", ".doc", ".docx", ".txt", ".html", ".pptx"];
};

/**
 * Format file size for display
 * @param bytes File size in bytes
 * @returns Formatted file size string
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

/**
 * Validate file for Advanced RAG upload
 * @param file The file to validate
 * @returns Object with validation result and error message if any
 */
export const validateFileForAdvancedRAG = (
  file: File
): { valid: boolean; error?: string } => {
  const supportedTypes = getSupportedFileTypes();
  const fileExtension = "." + file.name.split(".").pop()?.toLowerCase();

  if (!supportedTypes.includes(fileExtension)) {
    return {
      valid: false,
      error: `Unsupported file type. Supported types: ${supportedTypes.join(
        ", "
      )}`,
    };
  }

  const maxSize = 50 * 1024 * 1024; // 50MB
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size (${formatFileSize(file.size)}) exceeds the 50MB limit`,
    };
  }

  if (file.size === 0) {
    return {
      valid: false,
      error: "File is empty",
    };
  }

  return { valid: true };
};
