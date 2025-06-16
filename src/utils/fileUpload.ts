import { uploadFileDocument } from "@/services/knowledgeService";

/**
 * Upload a file to the knowledge base
 * @param file The file to upload
 * @param chatbotId The ID of the chatbot to associate the file with
 * @param token The authentication token
 * @returns A promise that resolves to the uploaded file information
 */
export const uploadFile = async (
  file: File,
  chatbotId: string,
  token: string
) => {
  try {
    // Use the title as the file name without extension
    const fileName = file.name;
    const title = fileName.substring(0, fileName.lastIndexOf(".")) || fileName;

    return await uploadFileDocument(file, chatbotId, title, token);
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
};

/**
 * Check if a file type is supported
 * @param fileOrFileName The file or file name to check
 * @returns True if the file type is supported, false otherwise
 */
export const isSupportedFileType = (fileOrFileName: File | string): boolean => {
  const supportedTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
  ];

  // Also check by extension
  const supportedExtensions = [".pdf", ".doc", ".docx", ".txt", ".csv", ".md"];

  // Handle both File objects and string filenames
  if (typeof fileOrFileName === "string") {
    // It's a filename string
    const fileName = fileOrFileName;
    // Check if the filename has an extension
    if (fileName && fileName.lastIndexOf(".") !== -1) {
      const extension = fileName
        .substring(fileName.lastIndexOf("."))
        .toLowerCase();
      return supportedExtensions.includes(extension);
    }
    return false; // No extension found
  } else {
    // It's a File object
    const file = fileOrFileName;
    // Get extension from file name
    const extension =
      file.name && file.name.lastIndexOf(".") !== -1
        ? file.name.substring(file.name.lastIndexOf(".")).toLowerCase()
        : "";

    return (
      supportedTypes.includes(file.type) ||
      supportedExtensions.includes(extension)
    );
  }
};

/**
 * Format file size for display
 * @param bytes File size in bytes
 * @returns Formatted file size string (e.g., "2.5 MB")
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 B";

  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};
