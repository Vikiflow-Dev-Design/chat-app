import { ChatbotKnowledge } from "./chatbotKnowledgeService";

// Determine if we're in development mode
const isDevelopment =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";

// Use local API URL for development, production URL otherwise
const API_BASE_URL = isDevelopment
  ? "http://localhost:5000/api" // Use port 4000 which is the default port for the backend server
  : import.meta.env.VITE_API_URL || "https://vikiaibackend.vikiflow.com/api";

console.log("API Base URL:", API_BASE_URL);

// Construct the full API URL
const API_URL = `${API_BASE_URL}/chatbot-knowledge`;

console.log("Environment:", isDevelopment ? "Development" : "Production");
console.log("Using API Base URL:", API_BASE_URL);
console.log("Full API URL:", API_URL);

/**
 * Upload a file to the server
 * @param file The file to upload
 * @param chatbotId The ID of the chatbot
 * @param title Optional title for the file
 * @param tags Optional tags for the file
 * @param token JWT token for authentication
 * @returns Promise with the updated chatbot knowledge
 */
export const uploadFile = async (
  file: File,
  chatbotId: string,
  title?: string,
  tags: string[] = [],
  token: string = "mock_jwt_token_for_development"
): Promise<ChatbotKnowledge> => {
  if (!token) {
    throw new Error("Authentication required");
  }

  if (!file) {
    throw new Error("No file provided");
  }

  if (!chatbotId) {
    throw new Error("Chatbot ID is required");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("chatbotId", chatbotId);
  formData.append("title", title || file.name);

  if (tags && tags.length > 0) {
    formData.append("tags", JSON.stringify(tags));
  }

  try {
    const uploadUrl = `${API_URL}/file`;
    console.log(`Uploading file to ${uploadUrl}`);
    console.log("File details:", {
      name: file.name,
      type: file.type,
      size: file.size,
      chatbotId,
      title: title || file.name,
    });

    // For development, we need to ensure CORS is handled properly
    const headers: HeadersInit = {
      Authorization: `Bearer ${token}`,
    };

    // Don't set Content-Type header - let the browser set it with the boundary for multipart/form-data

    // For development, we need to ensure CORS is handled properly
    console.log(`Making fetch request to ${uploadUrl}`);

    const response = await fetch(uploadUrl, {
      method: "POST",
      headers,
      body: formData,
      // Use the appropriate credentials mode
      credentials: "include",
      mode: "cors",
    });

    console.log("Upload response status:", response.status);

    if (!response.ok) {
      let errorMessage = `Failed to upload file: ${response.status} ${response.statusText}`;
      try {
        const errorText = await response.text();
        console.error("Upload error response:", errorText);
        if (errorText) {
          try {
            const errorJson = JSON.parse(errorText);
            errorMessage = errorJson.message || errorMessage;
          } catch (e) {
            // If it's not JSON, use the text as is
            errorMessage = errorText;
          }
        }
      } catch (e) {
        console.error("Error parsing error response:", e);
      }
      throw new Error(errorMessage);
    }

    const result = await response.json();
    console.log("Upload successful, response:", result);

    // Call processFile to ensure the file is processed
    if (result && result.files && result.files.length > 0) {
      const newFile = result.files[result.files.length - 1];
      if (newFile._id) {
        try {
          await processFile(newFile._id, chatbotId, token);
        } catch (processError) {
          console.warn(
            "File uploaded but processing may have failed:",
            processError
          );
          // Don't fail the upload if processing fails
        }
      }
    }

    return result;
  } catch (error) {
    console.error("Error in uploadFile:", error);
    throw error;
  }
};

/**
 * Process a file after upload
 * Calls the backend API to process the file and extract text
 */
export const processFile = async (
  fileId: string,
  chatbotId: string,
  token: string = "mock_jwt_token_for_development"
): Promise<void> => {
  try {
    console.log(`Processing file ${fileId} for chatbot ${chatbotId}`);

    // Call the API to process the file
    // The process-file endpoint is registered under the chatbot-knowledge path
    const processUrl = `${API_URL}/process-file`;
    console.log(`Calling process API at ${processUrl}`);

    const response = await fetch(processUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        fileId,
        chatbotId,
      }),
      credentials: isDevelopment ? "include" : "same-origin",
    });

    if (!response.ok) {
      let errorMessage = `Failed to process file: ${response.status} ${response.statusText}`;
      try {
        const errorText = await response.text();
        console.error("Process error response:", errorText);
        if (errorText) {
          try {
            const errorJson = JSON.parse(errorText);
            errorMessage = errorJson.message || errorMessage;
          } catch (e) {
            // If it's not JSON, use the text as is
            errorMessage = errorText;
          }
        }
      } catch (e) {
        console.error("Error parsing error response:", e);
      }
      throw new Error(errorMessage);
    }

    console.log("File processing initiated successfully");
  } catch (error) {
    console.error("Error processing file:", error);
    throw error;
  }
};
