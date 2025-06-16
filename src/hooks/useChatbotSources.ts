import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/components/ui/use-toast";
import { formatFileSize } from "@/utils/fileUpload";
import {
  getChatbotKnowledge,
  uploadFile,
  deleteFileSource,
  addTextSource,
  updateTextSource,
  deleteTextSource,
  addQASource,
  deleteQASource,
} from "@/services/chatbotKnowledgeService";
import {
  FileSource,
  TextSource,
  QASource,
  LinkSource,
  SourcesSummary,
} from "@/types/knowledge";

export function useChatbotSources(chatbotId: string | undefined) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [uploadedFiles, setUploadedFiles] = useState<FileSource[]>([]);
  const [textSources, setTextSources] = useState<TextSource[]>([]);
  const [questions, setQuestions] = useState<QASource[]>([]);
  const [crawledLinks, setCrawledLinks] = useState<LinkSource[]>([]);
  const [needsRetraining, setNeedsRetraining] = useState(false);
  // Removed polling mechanism
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [sourcesSummary, setSourcesSummary] = useState<SourcesSummary>({
    text: { count: 0, size: "0 B" },
    links: { count: 0, size: "0 B" },
    qa: { count: 0, size: "0 B" },
    mongodb: { count: 0, size: "0 B" },
    sheets: { count: 0, size: "0 B" },
    totalSize: "0 B",
    quota: "400 KB",
  });

  // Function to refresh data
  const refreshData = useCallback(async () => {
    if (!chatbotId) return;

    try {
      setLoading(true);

      // Use mock token for development
      const token = "mock_jwt_token_for_development";

      // Get chatbot knowledge from API
      const knowledge = await getChatbotKnowledge(chatbotId, token);

      // Process the knowledge sources
      const files = knowledge.files || [];
      const texts = knowledge.texts || [];
      const qaItems = knowledge.qaItems || [];
      const links = knowledge.links || [];

      // Update uploaded files
      setUploadedFiles(
        files.map((file) => ({
          id: file._id,
          name: file.fileName || "Unknown file",
          size: formatFileSize(file.fileSize || 0),
          status:
            file.processingStatus === "completed"
              ? "Processed"
              : file.processingStatus === "failed"
              ? "Failed"
              : file.processingStatus === "optimizing"
              ? "Optimizing"
              : "Processing",
          title: file.title,
          fileName: file.fileName,
          fileType: file.fileType,
          fileSize: formatFileSize(file.fileSize || 0),
          content: file.content,
          extractedInformation: file.extractedInformation,
          processingStatus: file.processingStatus,
          processingError: file.processingError,
          originalSize: file.originalSize,
          optimizedSize: file.optimizedSize,
          sizeReduction: file.sizeReduction,
          optimizationInfo:
            file.originalSize && file.optimizedSize
              ? `Optimized: ${formatFileSize(
                  file.originalSize
                )} → ${formatFileSize(file.optimizedSize)} (${
                  file.sizeReduction
                }% reduction)`
              : undefined,
          createdAt: file.createdAt,
          isActive: file.isActive !== undefined ? file.isActive : true,
        }))
      );

      // Update text sources
      setTextSources(
        texts.map((text) => ({
          id: text._id,
          title: text.title,
          description: text.description || "",
          content: text.content,
          size: formatFileSize(text.content.length || 0),
          createdAt: text.createdAt,
        }))
      );

      // Update Q&A sources
      setQuestions(
        qaItems.flatMap((qaSource) =>
          qaSource.qaItems.map((qa) => ({
            id: qaSource._id,
            title: qaSource.title,
            question: qa.question,
            answer: qa.answer,
          }))
        )
      );

      // Calculate sizes
      const fileSize = files.reduce((total: number, file: any) => {
        return total + (file.fileSize || 0);
      }, 0);

      const textSize = texts.reduce((total: number, text: any) => {
        return total + (text.content.length || 0);
      }, 0);

      const qaSize = qaItems.reduce((total: number, qaSource: any) => {
        return (
          total +
          qaSource.qaItems.reduce((qaTotal: number, qa: any) => {
            return qaTotal + qa.question.length + qa.answer.length;
          }, 0)
        );
      }, 0);

      // Update sources summary
      setSourcesSummary({
        text: {
          count: texts.length,
          size: formatFileSize(textSize),
        },
        links: {
          count: links.length,
          size: formatFileSize(
            links.reduce((total: number, link: any) => {
              return total + (parseInt(link.size) || 0);
            }, 0)
          ),
        },
        qa: {
          count: qaItems.reduce((total: number, qaSource: any) => {
            return total + qaSource.qaItems.length;
          }, 0),
          size: formatFileSize(qaSize),
        },
        mongodb: { count: 0, size: "0 B" },
        sheets: { count: 0, size: "0 B" },
        totalSize: formatFileSize(textSize + fileSize + qaSize),
        quota: "400 KB",
      });

      // Removed polling code

      return knowledge;
    } catch (error) {
      console.error("Error refreshing data:", error);
      toast({
        title: "Error",
        description: "Failed to refresh data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [chatbotId, toast]);

  // Removed all polling-related code

  // Load data
  useEffect(() => {
    refreshData();
  }, [refreshTrigger, refreshData]);

  // File handlers
  const handleUploadFile = async (file: File, title?: string) => {
    if (!chatbotId) return;

    try {
      // Use mock token for development
      const token = "mock_jwt_token_for_development";

      // Upload the file
      const knowledge = await uploadFile(
        file,
        chatbotId,
        title || file.name,
        [],
        token
      );

      // Get the newly added file (last one in the files array)
      const uploadedFile = knowledge.files[knowledge.files.length - 1];

      // Update the UI
      setUploadedFiles((prev) => [
        ...prev,
        {
          id: uploadedFile._id,
          name: uploadedFile.fileName || file.name,
          size: formatFileSize(uploadedFile.fileSize || file.size),
          status:
            uploadedFile.processingStatus === "completed"
              ? "Processed"
              : uploadedFile.processingStatus === "failed"
              ? "Failed"
              : uploadedFile.processingStatus === "optimizing"
              ? "Optimizing"
              : "Processing",
          title: uploadedFile.title,
          fileName: uploadedFile.fileName,
          fileType: uploadedFile.fileType,
          fileSize: formatFileSize(uploadedFile.fileSize || 0),
          content: uploadedFile.content,
          extractedInformation: uploadedFile.extractedInformation,
          processingStatus: uploadedFile.processingStatus,
          processingError: uploadedFile.processingError,
          // Handle optimization info if available
          optimizationInfo:
            uploadedFile.originalSize && uploadedFile.optimizedSize
              ? `Optimized: ${formatFileSize(
                  uploadedFile.originalSize
                )} → ${formatFileSize(uploadedFile.optimizedSize)} (${
                  uploadedFile.sizeReduction
                }% reduction)`
              : undefined,
          createdAt: uploadedFile.createdAt,
          isActive:
            uploadedFile.isActive !== undefined ? uploadedFile.isActive : true,
        },
      ]);

      setNeedsRetraining(true);

      // Removed polling code

      return uploadedFile;
    } catch (error) {
      console.error("Error uploading file:", error);
      toast({
        title: "Error",
        description: "Failed to upload file",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleViewFile = (fileId: string) => {
    const file = uploadedFiles.find((f) => f.id === fileId);
    if (file) {
      return file;
    }
    return null;
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!chatbotId) return;

    try {
      // Use mock token for development
      const token = "mock_jwt_token_for_development";

      // Delete the file
      await deleteFileSource(chatbotId, fileId, token);

      // Update the UI
      setUploadedFiles((prev) => prev.filter((file) => file.id !== fileId));
      setNeedsRetraining(true);

      // Use setRefreshTrigger instead of refreshData to avoid potential polling issues
      setRefreshTrigger((prev) => prev + 1);

      toast({
        title: "Success",
        description: "File deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting file:", error);
      toast({
        title: "Error",
        description: "Failed to delete file",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Text source handlers
  const handleAddText = async (
    title: string,
    description: string,
    content: string
  ) => {
    if (!chatbotId) return;

    try {
      // Use mock token for development
      const token = "mock_jwt_token_for_development";

      // Add the text source
      const response = await addTextSource(
        {
          chatbotId,
          title,
          description,
          content,
        },
        token
      );

      // Get the newly added text source
      const newTextSource = response.texts[response.texts.length - 1];

      // Add the new text source to the list
      setTextSources((prev) => [
        ...prev,
        {
          id: newTextSource._id,
          title: newTextSource.title,
          description: newTextSource.description || "",
          content: newTextSource.content,
          size: formatFileSize(newTextSource.content.length || 0),
          isNew: true,
          createdAt: newTextSource.createdAt,
        },
      ]);

      setNeedsRetraining(true);

      toast({
        title: "Success",
        description: "Text source added successfully",
      });

      return newTextSource;
    } catch (error) {
      console.error("Error adding text source:", error);
      toast({
        title: "Error",
        description: "Failed to add text source",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleViewText = (textId: string) => {
    const text = textSources.find((t) => t.id === textId);
    if (text) {
      return text;
    }
    return null;
  };

  const handleDeleteTextSource = async (textId: string) => {
    if (!chatbotId) return;

    try {
      // Use mock token for development
      const token = "mock_jwt_token_for_development";

      // Delete the text source
      await deleteTextSource(chatbotId, textId, token);

      // Update the UI
      setTextSources((prev) => prev.filter((t) => t.id !== textId));
      setNeedsRetraining(true);

      // Use setRefreshTrigger instead of refreshData to avoid potential polling issues
      setRefreshTrigger((prev) => prev + 1);

      toast({
        title: "Success",
        description: "Text source deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting text source:", error);
      toast({
        title: "Error",
        description: "Failed to delete text source",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleUpdateText = async (
    textId: string,
    title: string,
    description: string,
    content: string
  ) => {
    if (!chatbotId) return;

    try {
      // Use mock token for development
      const token = "mock_jwt_token_for_development";

      // Update the text source
      await updateTextSource(
        chatbotId,
        textId,
        {
          title,
          description,
          content,
        },
        token
      );

      // Update the UI
      setTextSources((prev) =>
        prev.map((text) =>
          text.id === textId
            ? {
                ...text,
                title,
                description,
                content,
                size: formatFileSize(content.length || 0),
              }
            : text
        )
      );

      setNeedsRetraining(true);

      toast({
        title: "Success",
        description: "Text source updated successfully",
      });
    } catch (error) {
      console.error("Error updating text source:", error);
      toast({
        title: "Error",
        description: "Failed to update text source",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Q&A handlers
  const handleAddQA = async (
    title: string,
    question: string,
    answer: string
  ) => {
    if (!chatbotId) return;

    try {
      // Use mock token for development
      const token = "mock_jwt_token_for_development";

      // Add the Q&A source
      const response = await addQASource(
        {
          chatbotId,
          title,
          qaItems: [{ question, answer }],
        },
        token
      );

      // Get the newly added Q&A source
      const newQASource = response.qaItems[response.qaItems.length - 1];

      // Add the new Q&A to the list
      setQuestions((prev) => [
        ...prev,
        {
          id: newQASource._id,
          title: newQASource.title,
          question: newQASource.qaItems[0].question,
          answer: newQASource.qaItems[0].answer,
        },
      ]);

      setNeedsRetraining(true);

      toast({
        title: "Success",
        description: "Q&A added successfully",
      });

      return newQASource;
    } catch (error) {
      console.error("Error adding Q&A:", error);
      toast({
        title: "Error",
        description: "Failed to add Q&A",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleDeleteQA = async (qaId: string) => {
    if (!chatbotId) return;

    try {
      // Use mock token for development
      const token = "mock_jwt_token_for_development";

      // Delete the Q&A source
      await deleteQASource(chatbotId, qaId, token);

      // Update the UI
      setQuestions((prev) => prev.filter((q) => q.id !== qaId));
      setNeedsRetraining(true);

      // Use setRefreshTrigger instead of refreshData to avoid potential polling issues
      setRefreshTrigger((prev) => prev + 1);

      toast({
        title: "Success",
        description: "Q&A deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting Q&A:", error);
      toast({
        title: "Error",
        description: "Failed to delete Q&A",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Website/link handlers
  const handleAddWebsite = async (url: string) => {
    // This is a placeholder for the website crawling functionality
    // In a real app, this would call an API endpoint to crawl the website
    try {
      // Mock adding a website
      const newLink = {
        id: Date.now().toString(),
        url,
        size: "5 KB",
        status: "Active",
      };

      setCrawledLinks((prev) => [...prev, newLink]);
      setNeedsRetraining(true);

      toast({
        title: "Success",
        description: "Website added successfully",
      });

      return newLink;
    } catch (error) {
      console.error("Error adding website:", error);
      toast({
        title: "Error",
        description: "Failed to add website",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleDeleteLink = async (url: string) => {
    try {
      // Mock deleting a link
      setCrawledLinks((prev) => prev.filter((link) => link.url !== url));
      setNeedsRetraining(true);

      // Use setRefreshTrigger instead of refreshData to avoid potential polling issues
      setRefreshTrigger((prev) => prev + 1);

      toast({
        title: "Success",
        description: "Link deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting link:", error);
      toast({
        title: "Error",
        description: "Failed to delete link",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Retrain handler
  const handleRetrain = async () => {
    if (!chatbotId) return;

    try {
      // In a real app, this would call an API endpoint to retrain the chatbot
      // For now, we'll just update the UI
      setNeedsRetraining(false);

      toast({
        title: "Success",
        description: "Chatbot retrained successfully",
      });
    } catch (error) {
      console.error("Error retraining chatbot:", error);
      toast({
        title: "Error",
        description: "Failed to retrain chatbot",
        variant: "destructive",
      });
      throw error;
    }
  };

  return {
    loading,
    uploadedFiles,
    setUploadedFiles,
    textSources,
    setTextSources,
    questions,
    setQuestions,
    crawledLinks,
    setCrawledLinks,
    sourcesSummary,
    setSourcesSummary,
    needsRetraining,
    setNeedsRetraining,
    refreshData,
    handleUploadFile,
    handleViewFile,
    handleDeleteFile,
    handleAddText,
    handleViewText,
    handleDeleteTextSource,
    handleUpdateText,
    handleAddQA,
    handleDeleteQA,
    handleAddWebsite,
    handleDeleteLink,
    handleRetrain,
    triggerRefresh: () => setRefreshTrigger((prev) => prev + 1),
  };
}
