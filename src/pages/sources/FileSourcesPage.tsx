import React, { useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { ViewFileDialog } from "@/components/ViewFileDialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Upload, Loader2, Sparkles } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { SourcesLayout } from "@/components/sources/SourcesLayout";
import { SelectableSourceList } from "@/components/sources/SelectableSourceList";
import { useChatbotSources } from "@/hooks/useChatbotSources";
import { isSupportedFileType } from "@/utils/fileUpload";
import {
  uploadFileWithAdvancedRAG,
  validateFileForAdvancedRAG,
  isAdvancedRAGAvailable,
} from "@/services/advancedRAGUploadService";

export default function FileSourcesPage() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isFileDialogOpen, setIsFileDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [advancedRAGAvailable, setAdvancedRAGAvailable] = useState<
    boolean | null
  >(null);
  const [uploadProgress, setUploadProgress] = useState<{
    [key: string]: number;
  }>({});
  const [uploadStatus, setUploadStatus] = useState<{ [key: string]: string }>(
    {}
  );

  const {
    loading,
    uploadedFiles,
    setUploadedFiles,
    sourcesSummary,
    needsRetraining,
    setNeedsRetraining,

    refreshData,
    triggerRefresh,
    handleViewFile,
    handleDeleteFile,
    handleUploadFile,
    handleRetrain,
  } = useChatbotSources(id);

  // Check Advanced RAG availability on mount
  React.useEffect(() => {
    const checkAdvancedRAG = async () => {
      try {
        const available = await isAdvancedRAGAvailable();
        setAdvancedRAGAvailable(available);
        if (!available) {
          console.warn("Advanced RAG not available, using legacy upload");
        }
      } catch (error) {
        console.error("Error checking Advanced RAG availability:", error);
        setAdvancedRAGAvailable(false);
      }
    };

    checkAdvancedRAG();
  }, []);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      handleFileUpload(files);
    }
  };

  const handleFileUpload = async (files: File[]) => {
    if (!id) {
      toast({
        title: "Error",
        description: "Chatbot ID is required",
        variant: "destructive",
      });
      return;
    }

    // Validate files for Advanced RAG
    const validFiles: File[] = [];
    const invalidFiles: { file: File; error: string }[] = [];

    files.forEach((file) => {
      const validation = validateFileForAdvancedRAG(file);
      if (validation.valid) {
        validFiles.push(file);
      } else {
        invalidFiles.push({ file, error: validation.error || "Invalid file" });
      }
    });

    // Show errors for invalid files
    if (invalidFiles.length > 0) {
      invalidFiles.forEach(({ file, error }) => {
        toast({
          title: `Invalid file: ${file.name}`,
          description: error,
          variant: "destructive",
        });
      });
    }

    if (validFiles.length === 0) return;

    try {
      setIsUploading(true);
      let successCount = 0;

      // Process each file with Advanced RAG
      for (const file of validFiles) {
        const fileKey = `${file.name}-${file.size}`;

        try {
          console.log(`🚀 Starting Advanced RAG upload for: ${file.name}`);

          // Initialize progress tracking
          setUploadProgress((prev) => ({ ...prev, [fileKey]: 0 }));
          setUploadStatus((prev) => ({ ...prev, [fileKey]: "Uploading..." }));

          // Show initial toast
          toast({
            title: `Processing ${file.name}`,
            description: advancedRAGAvailable
              ? "Using Advanced RAG processing..."
              : "Processing with standard upload...",
          });

          const title =
            file.name.substring(0, file.name.lastIndexOf(".")) || file.name;
          const token = "mock_jwt_token_for_development";

          let result;

          if (advancedRAGAvailable) {
            // Use Advanced RAG upload
            result = await uploadFileWithAdvancedRAG(
              file,
              id,
              title,
              [],
              token
            );

            // Update progress based on processing details
            if (result.success) {
              setUploadProgress((prev) => ({ ...prev, [fileKey]: 100 }));
              setUploadStatus((prev) => ({ ...prev, [fileKey]: "Completed" }));

              // Show detailed success message
              toast({
                title: `✅ ${file.name} processed successfully`,
                description: `Created ${result.processingDetails.chunking.chunksCreated} chunks with ${result.processingDetails.storage.relationshipsCreated} relationships`,
              });
            }
          } else {
            // Fallback to legacy upload (through the hook)
            result = await handleUploadFile(file, title);
            setUploadProgress((prev) => ({ ...prev, [fileKey]: 100 }));
            setUploadStatus((prev) => ({ ...prev, [fileKey]: "Completed" }));

            toast({
              title: `✅ ${file.name} uploaded`,
              description:
                "File uploaded successfully with standard processing",
            });
          }

          successCount++;
        } catch (fileError) {
          console.error(`❌ Error uploading file ${file.name}:`, fileError);

          setUploadProgress((prev) => ({ ...prev, [fileKey]: 0 }));
          setUploadStatus((prev) => ({ ...prev, [fileKey]: "Failed" }));

          toast({
            title: `Failed to upload ${file.name}`,
            description:
              fileError instanceof Error ? fileError.message : "Upload failed",
            variant: "destructive",
          });
        }
      }

      if (successCount > 0) {
        toast({
          title: "Upload Complete! 🎉",
          description: `${successCount} of ${
            validFiles.length
          } file(s) processed successfully with ${
            advancedRAGAvailable ? "Advanced RAG" : "standard processing"
          }.`,
        });

        // Set needs retraining flag
        setNeedsRetraining(true);

        // Refresh the data
        triggerRefresh();
      }
    } catch (error) {
      console.error("❌ Error in file upload process:", error);
      toast({
        title: "Upload failed",
        description:
          "An error occurred while uploading files. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      // Clear progress tracking after a delay
      setTimeout(() => {
        setUploadProgress({});
        setUploadStatus({});
      }, 3000);
    }
  };

  const handleViewFileWrapper = (fileId: string) => {
    const file = uploadedFiles.find((f) => f.id === fileId);
    if (file) {
      setSelectedFile({
        id: file.id,
        title: file.name,
        fileName: file.name,
        fileType: file.fileType || "file",
        fileSize: file.size,
        processingStatus: "completed",
        createdAt: file.createdAt || new Date().toISOString(),
      });
      setIsFileDialogOpen(true);
    }
  };

  return (
    <SourcesLayout
      sourcesSummary={sourcesSummary}
      needsRetraining={needsRetraining}
      onRetrain={handleRetrain}
    >
      <Card className="border border-gray-100 shadow-sm">
        <CardHeader className="border-b bg-gray-50/50">
          <CardTitle className="text-lg font-medium text-gray-800 flex items-center gap-2">
            Files
            {advancedRAGAvailable && (
              <Badge variant="secondary" className="text-xs">
                <Sparkles className="h-3 w-3 mr-1" />
                Advanced RAG
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Upload documents to enhance your chatbot's knowledge
            {advancedRAGAvailable && (
              <span className="block text-green-600 text-sm mt-1">
                ✨ Advanced RAG processing available - intelligent chunking and
                relationships
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
              isDragging
                ? "border-primary bg-primary/5 shadow-sm"
                : isUploading
                ? "border-gray-200 bg-gray-50/50 opacity-75"
                : "border-gray-200 hover:border-gray-300 hover:bg-gray-50/50"
            }`}
            onDragEnter={isUploading ? undefined : handleDragEnter}
            onDragLeave={isUploading ? undefined : handleDragLeave}
            onDragOver={isUploading ? undefined : handleDragOver}
            onDrop={isUploading ? undefined : handleDrop}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={isUploading ? undefined : handleFileInputChange}
              className="hidden"
              multiple
              disabled={isUploading}
              accept={
                advancedRAGAvailable
                  ? ".pdf,.doc,.docx,.txt,.html,.pptx"
                  : ".pdf,.doc,.docx,.txt,.csv,.md"
              }
            />
            <div className="flex flex-col items-center justify-center gap-2">
              {isUploading ? (
                <>
                  <Loader2 className="h-10 w-10 text-primary animate-spin" />
                  <h3 className="text-lg font-medium text-gray-700">
                    Uploading files...
                  </h3>
                  <p className="text-sm text-gray-500 max-w-md">
                    Please wait while your files are being processed
                  </p>
                </>
              ) : (
                <>
                  <Upload className="h-10 w-10 text-gray-400" />
                  <h3 className="text-lg font-medium text-gray-700">
                    Drag and drop files here
                  </h3>
                  <p className="text-sm text-gray-500 max-w-md">
                    {advancedRAGAvailable
                      ? "Advanced RAG supports: PDF, DOCX, TXT, HTML, PPTX (max 50MB)"
                      : "Supported file types: PDF, DOCX, TXT, CSV, MD"}
                  </p>
                  <Button
                    variant="outline"
                    className="mt-2"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Browse files
                  </Button>
                </>
              )}
            </div>
          </div>

          {uploadedFiles.length > 0 && (
            <div className="mt-8">
              <SelectableSourceList
                title="File Sources"
                icon={<FileText className="h-4 w-4 text-primary" />}
                sources={uploadedFiles.map((file) => ({
                  id: file.id,
                  title: file.name,
                  type: file.fileType || "file",
                  size: file.size,
                  status:
                    file.processingStatus === "processing"
                      ? "Processing"
                      : file.processingStatus === "optimizing"
                      ? "Optimizing"
                      : file.processingStatus === "failed"
                      ? "Failed"
                      : undefined,
                  optimizationInfo: file.optimizationInfo,
                  isNew:
                    new Date(file.createdAt || Date.now()).getTime() >
                    Date.now() - 86400000, // 24 hours
                  lastUpdated: file.createdAt
                    ? new Date(file.createdAt).toLocaleDateString()
                    : undefined,
                }))}
                onView={handleViewFileWrapper}
                onDelete={handleDeleteFile}
                onDeleteMultiple={async (ids) => {
                  try {
                    // Handle multiple deletion with Promise.all for parallel processing
                    await Promise.all(ids.map((id) => handleDeleteFile(id)));

                    // Refresh data after all deletions are complete
                    triggerRefresh();

                    toast({
                      title: "Success",
                      description: `${ids.length} file(s) deleted successfully`,
                    });
                  } catch (error) {
                    console.error("Error deleting multiple files:", error);
                    toast({
                      title: "Error",
                      description: "Some files could not be deleted",
                      variant: "destructive",
                    });
                  }
                }}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* File View Dialog */}
      <ViewFileDialog
        open={isFileDialogOpen}
        onOpenChange={setIsFileDialogOpen}
        file={selectedFile}
        onDelete={handleDeleteFile}
      />
    </SourcesLayout>
  );
}
