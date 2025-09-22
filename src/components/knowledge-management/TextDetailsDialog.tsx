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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import {
  MessageSquare,
  Layers,
  Info,
  Database,
  Tag,
  Calendar,
} from "lucide-react";
import {
  getTextDetails,
  TextKnowledge,
  ChunkData,
} from "@/services/knowledgeManagementService";

interface TextDetailsDialogProps {
  text: TextKnowledge;
  isOpen: boolean;
  onClose: () => void;
  chatbotId: string;
}

export function TextDetailsDialog({
  text,
  isOpen,
  onClose,
  chatbotId,
}: TextDetailsDialogProps) {
  const { toast } = useToast();
  const [detailedText, setDetailedText] = useState<TextKnowledge | null>(null);
  const [chunks, setChunks] = useState<ChunkData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && text) {
      loadTextDetails();
    }
  }, [isOpen, text]);

  const loadTextDetails = async () => {
    try {
      setLoading(true);
      const response = await getTextDetails(chatbotId, text._id);
      setDetailedText(response.text);
      setChunks(response.chunks);
    } catch (error) {
      console.error("Error loading text details:", error);
      toast({
        title: "Error",
        description: "Failed to load text details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
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
            <MessageSquare className="h-5 w-5" />
            <span>{detailedText?.title || text.title}</span>
          </DialogTitle>
          <DialogDescription>
            Detailed information about the text entry and its processed chunks
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="info">Text Info</TabsTrigger>
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
                    <span className="text-sm text-gray-600">Title:</span>
                    <span className="text-sm font-medium">
                      {detailedText?.title}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Description:</span>
                    <span className="text-sm font-medium">
                      {detailedText?.description || "No description"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Active:</span>
                    <Badge
                      variant={detailedText?.isActive ? "default" : "secondary"}
                    >
                      {detailedText?.isActive ? "Yes" : "No"}
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
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      Content Length:
                    </span>
                    <span className="text-sm font-medium">
                      {detailedText?.content?.length || 0} characters
                    </span>
                  </div>
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
                      {detailedText?.tags && detailedText.tags.length > 0 ? (
                        detailedText.tags.map((tag, index) => (
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
                        {formatDate(detailedText?.createdAt || "")}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Updated:</span>
                      <p className="text-sm font-medium">
                        {formatDate(detailedText?.updatedAt || "")}
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
                <CardTitle className="text-sm">Text Content</CardTitle>
                <CardDescription>
                  The full content of this text entry
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96 w-full border rounded p-4">
                  <pre className="text-sm whitespace-pre-wrap">
                    {detailedText?.content || "No content available"}
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
                      This text hasn't been processed with advanced RAG
                    </p>
                  </div>
                ) : (
                  <ScrollArea className="h-96">
                    <div className="space-y-4">
                      {chunks.map((chunk, index) => (
                        <Card
                          key={chunk.id}
                          className="border-l-4 border-l-green-500"
                        >
                          <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-sm">
                                Chunk {chunk.chunk_index + 1}
                              </CardTitle>
                              <Badge variant="outline" className="text-xs">
                                {chunk.metadata?.sourceType || "text"}
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
