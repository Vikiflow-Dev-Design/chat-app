import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import {
  FileText,
  Layers,
  Info,
  Database,
  Tag,
  Calendar,
  FileType,
  HardDrive,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
import {
  getFileDetails,
  FileKnowledge,
  ChunkData,
} from "@/services/knowledgeManagementService";

interface FileDetailsDialogProps {
  file: FileKnowledge;
  isOpen: boolean;
  onClose: () => void;
  chatbotId: string;
}

export function FileDetailsDialog({
  file,
  isOpen,
  onClose,
  chatbotId,
}: FileDetailsDialogProps) {
  const { toast } = useToast();
  const [detailedFile, setDetailedFile] = useState<FileKnowledge | null>(null);
  const [chunks, setChunks] = useState<ChunkData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && file) {
      loadFileDetails();
    }
  }, [isOpen, file]);

  const loadFileDetails = async () => {
    try {
      setLoading(true);
      const response = await getFileDetails(chatbotId, file._id);
      setDetailedFile(response.file);
      setChunks(response.chunks);
    } catch (error) {
      console.error("Error loading file details:", error);
      toast({
        title: "Error",
        description: "Failed to load file details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "processing":
        return <Clock className="h-4 w-4 text-blue-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>{detailedFile?.title || file.title}</span>
          </DialogTitle>
          <DialogDescription>
            Detailed information about the file and its processed chunks
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="info">File Info</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="chunks">Chunks ({chunks.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center space-x-2">
                    <Info className="h-4 w-4" />
                    <span>Basic Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">File Name:</span>
                    <span className="text-sm font-medium">
                      {detailedFile?.fileName}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Type:</span>
                    <Badge variant="outline">
                      {detailedFile?.fileType.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Size:</span>
                    <span className="text-sm font-medium">
                      {formatFileSize(detailedFile?.fileSize || 0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Status:</span>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(detailedFile?.processingStatus || "")}
                      <Badge variant="secondary">
                        {detailedFile?.processingStatus}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Active:</span>
                    <Badge
                      variant={detailedFile?.isActive ? "default" : "secondary"}
                    >
                      {detailedFile?.isActive ? "Yes" : "No"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Processing Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center space-x-2">
                    <Database className="h-4 w-4" />
                    <span>Processing Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Chunks:</span>
                    <Badge variant="outline">{chunks.length}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      Advanced Processing:
                    </span>
                    <Badge
                      variant={chunks.length > 0 ? "default" : "secondary"}
                    >
                      {chunks.length > 0 ? "Yes" : "No"}
                    </Badge>
                  </div>
                  {detailedFile?.originalSize && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        Original Size:
                      </span>
                      <span className="text-sm font-medium">
                        {formatFileSize(detailedFile.originalSize)}
                      </span>
                    </div>
                  )}
                  {detailedFile?.optimizedSize && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        Optimized Size:
                      </span>
                      <span className="text-sm font-medium">
                        {formatFileSize(detailedFile.optimizedSize)}
                      </span>
                    </div>
                  )}
                  {detailedFile?.sizeReduction && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        Size Reduction:
                      </span>
                      <Badge variant="outline">
                        {detailedFile.sizeReduction}%
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Tags and Dates */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-sm flex items-center space-x-2">
                    <Tag className="h-4 w-4" />
                    <span>Tags & Dates</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <span className="text-sm text-gray-600 block mb-2">
                      Tags:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {detailedFile?.tags && detailedFile.tags.length > 0 ? (
                        detailedFile.tags.map((tag, index) => (
                          <Badge key={index} variant="secondary">
                            {tag}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-sm text-gray-400">No tags</span>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-gray-600">Created:</span>
                      <p className="text-sm font-medium">
                        {formatDate(detailedFile?.createdAt || "")}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Updated:</span>
                      <p className="text-sm font-medium">
                        {formatDate(detailedFile?.updatedAt || "")}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="content">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">File Content</CardTitle>
                <CardDescription>
                  {detailedFile?.extractedInformation ? "Extracted" : "Raw"}{" "}
                  content from the file
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96 w-full border rounded p-4">
                  <pre className="text-sm whitespace-pre-wrap">
                    {detailedFile?.extractedInformation ||
                      detailedFile?.content ||
                      "No content available"}
                  </pre>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="chunks">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center space-x-2">
                  <Layers className="h-4 w-4" />
                  <span>Processed Chunks</span>
                </CardTitle>
                <CardDescription>
                  Vector database chunks with embeddings and metadata
                </CardDescription>
              </CardHeader>
              <CardContent>
                {chunks.length === 0 ? (
                  <div className="text-center py-8">
                    <Layers className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No chunks found</p>
                    <p className="text-sm text-gray-400">
                      This file hasn't been processed with advanced RAG
                    </p>
                  </div>
                ) : (
                  <ScrollArea className="h-96">
                    <div className="space-y-4">
                      {chunks.map((chunk, index) => (
                        <Card
                          key={chunk.id}
                          className="border-l-4 border-l-blue-500"
                        >
                          <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-sm">
                                Chunk {chunk.chunk_index + 1}
                              </CardTitle>
                              <Badge variant="outline" className="text-xs">
                                {chunk.metadata?.sourceType || "unknown"}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-2">
                            <div className="text-sm">
                              <strong>Content:</strong>
                              <p className="mt-1 text-gray-700 line-clamp-3">
                                {chunk.content.substring(0, 200)}
                                {chunk.content.length > 200 && "..."}
                              </p>
                            </div>
                            {chunk.metadata?.topics && (
                              <div className="text-sm">
                                <strong>Topics:</strong>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {chunk.metadata.topics
                                    .slice(0, 3)
                                    .map((topic, i) => (
                                      <Badge
                                        key={i}
                                        variant="secondary"
                                        className="text-xs"
                                      >
                                        {topic}
                                      </Badge>
                                    ))}
                                </div>
                              </div>
                            )}
                            {chunk.metadata?.keywords && (
                              <div className="text-sm">
                                <strong>Keywords:</strong>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {chunk.metadata.keywords
                                    .slice(0, 5)
                                    .map((keyword, i) => (
                                      <Badge
                                        key={i}
                                        variant="outline"
                                        className="text-xs"
                                      >
                                        {keyword}
                                      </Badge>
                                    ))}
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
