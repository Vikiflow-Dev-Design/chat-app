import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Layers,
  Search,
  Filter,
  Database,
  FileText,
  MessageSquare,
  HelpCircle,
  Tag,
  Hash,
  Eye,
  ExternalLink,
} from "lucide-react";
import { getChunks, ChunkData } from "@/services/knowledgeManagementService";

interface ChunksTabProps {
  chatbotId: string;
}

export function ChunksTab({ chatbotId }: ChunksTabProps) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [chunks, setChunks] = useState<ChunkData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string>("all");
  const [sourceTypeFilter, setSourceTypeFilter] = useState<string>("all");

  useEffect(() => {
    loadChunks();
  }, [chatbotId, currentPage, selectedDocumentId]);

  const loadChunks = async () => {
    try {
      setLoading(true);

      // If a specific document is selected, load chunks for that document
      const documentId =
        selectedDocumentId === "all" ? "*" : selectedDocumentId;

      const response = await getChunks(chatbotId, documentId, currentPage, 20);
      setChunks(response.chunks);
      setTotalPages(response.pagination.totalPages);
      setTotalItems(response.pagination.totalItems);
    } catch (error) {
      console.error("Error loading chunks:", error);
      toast({
        title: "Error",
        description: "Failed to load chunks",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    loadChunks();
  };

  const getSourceTypeIcon = (sourceType: string) => {
    switch (sourceType) {
      case "file":
      case "pdf":
      case "document":
        return <FileText className="h-4 w-4" />;
      case "text":
        return <MessageSquare className="h-4 w-4" />;
      case "qa":
        return <HelpCircle className="h-4 w-4" />;
      default:
        return <Database className="h-4 w-4" />;
    }
  };

  const getSourceTypeColor = (sourceType: string) => {
    switch (sourceType) {
      case "file":
      case "pdf":
      case "document":
        return "bg-blue-100 text-blue-800";
      case "text":
        return "bg-green-100 text-green-800";
      case "qa":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const truncateText = (text: string, maxLength: number = 200) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  const filteredChunks = chunks.filter((chunk) => {
    if (
      sourceTypeFilter !== "all" &&
      chunk.metadata?.sourceType !== sourceTypeFilter
    ) {
      return false;
    }
    if (
      searchQuery &&
      !chunk.content.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Core Metadata Guide */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center space-x-2 text-blue-800">
            🎯 <span>Core Metadata Fields Guide</span>
          </CardTitle>
          <CardDescription className="text-blue-700">
            Understanding the 5 essential metadata fields that power intelligent
            RAG retrieval
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-sm">
            <div className="bg-white p-3 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-800 mb-2 flex items-center">
                📝 chunk_type
              </h4>
              <p className="text-xs text-gray-600 mb-2">
                Content format classification
              </p>
              <div className="space-y-1 text-xs">
                <div className="flex items-center space-x-1">
                  <span className="w-2 h-2 bg-blue-500 rounded"></span>
                  <span>text, code, table, list</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-3 rounded-lg border border-green-200">
              <h4 className="font-semibold text-green-800 mb-2 flex items-center">
                📍 document_section
              </h4>
              <p className="text-xs text-gray-600 mb-2">
                Location within document
              </p>
              <div className="space-y-1 text-xs">
                <div className="flex items-center space-x-1">
                  <span className="w-2 h-2 bg-green-500 rounded"></span>
                  <span>introduction, setup, config</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-3 rounded-lg border border-purple-200">
              <h4 className="font-semibold text-purple-800 mb-2 flex items-center">
                🏷️ topics
              </h4>
              <p className="text-xs text-gray-600 mb-2">
                AI-extracted main themes
              </p>
              <div className="space-y-1 text-xs">
                <div className="flex items-center space-x-1">
                  <span className="w-2 h-2 bg-purple-500 rounded"></span>
                  <span>Semantic grouping</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-3 rounded-lg border border-orange-200">
              <h4 className="font-semibold text-orange-800 mb-2 flex items-center">
                🔑 keywords
              </h4>
              <p className="text-xs text-gray-600 mb-2">
                Important terms & concepts
              </p>
              <div className="space-y-1 text-xs">
                <div className="flex items-center space-x-1">
                  <span className="w-2 h-2 bg-orange-500 rounded"></span>
                  <span>Precise term matching</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-3 rounded-lg border border-teal-200">
              <h4 className="font-semibold text-teal-800 mb-2 flex items-center">
                🏗️ heading_context
              </h4>
              <p className="text-xs text-gray-600 mb-2">
                Document structure hierarchy
              </p>
              <div className="space-y-1 text-xs">
                <div className="flex items-center space-x-1">
                  <span className="w-2 h-2 bg-teal-500 rounded"></span>
                  <span>H1, H2, H3 levels</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Layers className="h-5 w-5" />
            <span>Vector Database Chunks</span>
          </CardTitle>
          <CardDescription>
            Browse and analyze processed chunks with their core metadata in the
            Supabase vector database
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg">
                <Database className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium">Total Chunks</p>
                  <p className="text-lg font-bold text-blue-600">
                    {totalItems}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2 p-3 bg-green-50 rounded-lg">
                <Layers className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium">Current Page</p>
                  <p className="text-lg font-bold text-green-600">
                    {currentPage} of {totalPages}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2 p-3 bg-purple-50 rounded-lg">
                <Filter className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm font-medium">Filtered</p>
                  <p className="text-lg font-bold text-purple-600">
                    {filteredChunks.length}
                  </p>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search chunk content..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select
                value={selectedDocumentId}
                onValueChange={setSelectedDocumentId}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select document" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Documents</SelectItem>
                  {/* Add specific document options here if needed */}
                </SelectContent>
              </Select>
              <Select
                value={sourceTypeFilter}
                onValueChange={setSourceTypeFilter}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="file">Files</SelectItem>
                  <SelectItem value="text">Texts</SelectItem>
                  <SelectItem value="qa">Q&A</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleSearch}>Apply Filters</Button>
            </div>

            {/* Core Metadata Overview */}
            {filteredChunks.length > 0 && (
              <div className="bg-gradient-to-r from-blue-50 to-green-50 p-4 rounded-lg border border-blue-200">
                <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                  📊 Core Metadata Overview ({filteredChunks.length} chunks)
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                  {/* Chunk Types Distribution */}
                  <div className="bg-white p-3 rounded border">
                    <h4 className="font-medium text-gray-600 mb-2">
                      chunk_type:
                    </h4>
                    <div className="space-y-1">
                      {Object.entries(
                        filteredChunks.reduce((acc, chunk) => {
                          const type = chunk.chunk_type || "text";
                          acc[type] = (acc[type] || 0) + 1;
                          return acc;
                        }, {} as Record<string, number>)
                      ).map(([type, count]) => (
                        <div
                          key={type}
                          className="flex justify-between text-xs"
                        >
                          <span className="font-mono">📝 {type}</span>
                          <span className="font-bold">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Document Sections */}
                  <div className="bg-white p-3 rounded border">
                    <h4 className="font-medium text-gray-600 mb-2">
                      document_section:
                    </h4>
                    <div className="space-y-1">
                      {Object.entries(
                        filteredChunks.reduce((acc, chunk) => {
                          const section = chunk.document_section || "N/A";
                          acc[section] = (acc[section] || 0) + 1;
                          return acc;
                        }, {} as Record<string, number>)
                      )
                        .slice(0, 3)
                        .map(([section, count]) => (
                          <div
                            key={section}
                            className="flex justify-between text-xs"
                          >
                            <span className="font-mono truncate">
                              📍 {section}
                            </span>
                            <span className="font-bold">{count}</span>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Topics Stats */}
                  <div className="bg-white p-3 rounded border">
                    <h4 className="font-medium text-gray-600 mb-2">topics:</h4>
                    <div className="text-xs space-y-1">
                      <div className="flex justify-between">
                        <span>Total unique:</span>
                        <span className="font-bold">
                          {
                            new Set(
                              filteredChunks.flatMap(
                                (c) => c.metadata?.topics || []
                              )
                            ).size
                          }
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Avg per chunk:</span>
                        <span className="font-bold">
                          {(
                            filteredChunks.reduce(
                              (sum, c) =>
                                sum + (c.metadata?.topics?.length || 0),
                              0
                            ) / filteredChunks.length
                          ).toFixed(1)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Keywords Stats */}
                  <div className="bg-white p-3 rounded border">
                    <h4 className="font-medium text-gray-600 mb-2">
                      keywords:
                    </h4>
                    <div className="text-xs space-y-1">
                      <div className="flex justify-between">
                        <span>Total unique:</span>
                        <span className="font-bold">
                          {
                            new Set(
                              filteredChunks.flatMap(
                                (c) => c.metadata?.keywords || []
                              )
                            ).size
                          }
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Avg per chunk:</span>
                        <span className="font-bold">
                          {(
                            filteredChunks.reduce(
                              (sum, c) =>
                                sum + (c.metadata?.keywords?.length || 0),
                              0
                            ) / filteredChunks.length
                          ).toFixed(1)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Heading Context Stats */}
                  <div className="bg-white p-3 rounded border">
                    <h4 className="font-medium text-gray-600 mb-2">
                      heading_context:
                    </h4>
                    <div className="text-xs space-y-1">
                      <div className="flex justify-between">
                        <span>With structure:</span>
                        <span className="font-bold">
                          {
                            filteredChunks.filter(
                              (c) => c.heading_context?.length > 0
                            ).length
                          }
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Avg levels:</span>
                        <span className="font-bold">
                          {(
                            filteredChunks.reduce(
                              (sum, c) =>
                                sum + (c.heading_context?.length || 0),
                              0
                            ) / filteredChunks.length
                          ).toFixed(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Chunks List */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredChunks.length === 0 ? (
            <div className="text-center py-8">
              <Layers className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No chunks found</p>
              <p className="text-sm text-gray-400">
                Try adjusting your filters or upload some content
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[600px]">
              <div className="p-6 space-y-4">
                {filteredChunks.map((chunk, index) => (
                  <Card key={chunk.id} className="border-l-4 border-l-blue-500">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 flex-wrap">
                          {/* Chunk Type - Core Metadata */}
                          <Badge
                            variant={
                              chunk.chunk_type === "text"
                                ? "default"
                                : chunk.chunk_type === "code"
                                ? "secondary"
                                : chunk.chunk_type === "table"
                                ? "destructive"
                                : chunk.chunk_type === "list"
                                ? "outline"
                                : "default"
                            }
                            className="text-xs font-medium"
                          >
                            📝 {chunk.chunk_type || "text"}
                          </Badge>

                          {/* Document Section - Core Metadata */}
                          {chunk.document_section && (
                            <Badge variant="outline" className="text-xs">
                              📍 {chunk.document_section}
                            </Badge>
                          )}

                          {/* Source Type */}
                          <Badge
                            variant="outline"
                            className="flex items-center space-x-1 text-xs"
                          >
                            {getSourceTypeIcon(
                              chunk.metadata?.sourceType || "unknown"
                            )}
                            <span>
                              {chunk.metadata?.sourceType || "unknown"}
                            </span>
                          </Badge>

                          {/* Chunk Index */}
                          <Badge variant="secondary" className="text-xs">
                            <Hash className="h-3 w-3 mr-1" />#
                            {chunk.chunk_index + 1}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              navigate(
                                `/dashboard/vikiflowdesign-team/chatbot/${chatbotId}/chunk/${chunk.id}`
                              )
                            }
                            className="flex items-center space-x-1"
                          >
                            <Eye className="h-3 w-3" />
                            <span>View Details</span>
                          </Button>
                          <div className="text-xs text-gray-500">
                            {formatDate(chunk.created_at)}
                          </div>
                        </div>
                      </div>
                      {chunk.metadata?.title && (
                        <CardTitle className="text-sm">
                          {chunk.metadata.title}
                        </CardTitle>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {/* Content */}
                      <div>
                        <h4 className="text-sm font-medium mb-2">Content:</h4>
                        <div className="p-3 bg-gray-50 rounded text-sm">
                          {truncateText(chunk.content)}
                        </div>
                      </div>

                      {/* Core Metadata Section */}
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <h3 className="text-sm font-semibold text-blue-800 mb-3 flex items-center">
                          🎯 Core Metadata
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Topics - Core Metadata */}
                          {chunk.metadata?.topics &&
                            Array.isArray(chunk.metadata.topics) &&
                            chunk.metadata.topics.length > 0 && (
                              <div>
                                <h4 className="text-sm font-medium mb-2 flex items-center text-blue-700">
                                  <Tag className="h-4 w-4 mr-1" />
                                  Topics:
                                </h4>
                                <div className="flex flex-wrap gap-1">
                                  {chunk.metadata.topics
                                    .slice(0, 4)
                                    .map((topic, i) => (
                                      <Badge
                                        key={i}
                                        variant="secondary"
                                        className="text-xs bg-blue-100 text-blue-800 hover:bg-blue-200"
                                      >
                                        {topic}
                                      </Badge>
                                    ))}
                                  {chunk.metadata.topics.length > 4 && (
                                    <Badge
                                      variant="outline"
                                      className="text-xs border-blue-300 text-blue-600"
                                    >
                                      +{chunk.metadata.topics.length - 4} more
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            )}

                          {/* Keywords - Core Metadata */}
                          {chunk.metadata?.keywords &&
                            Array.isArray(chunk.metadata.keywords) &&
                            chunk.metadata.keywords.length > 0 && (
                              <div>
                                <h4 className="text-sm font-medium mb-2 flex items-center text-blue-700">
                                  <Hash className="h-4 w-4 mr-1" />
                                  Keywords:
                                </h4>
                                <div className="flex flex-wrap gap-1">
                                  {chunk.metadata.keywords
                                    .slice(0, 6)
                                    .map((keyword, i) => (
                                      <Badge
                                        key={i}
                                        variant="outline"
                                        className="text-xs border-blue-300 text-blue-700 hover:bg-blue-50"
                                      >
                                        {keyword}
                                      </Badge>
                                    ))}
                                  {chunk.metadata.keywords.length > 6 && (
                                    <Badge
                                      variant="outline"
                                      className="text-xs border-blue-300 text-blue-600"
                                    >
                                      +{chunk.metadata.keywords.length - 6} more
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            )}
                        </div>
                      </div>

                      {/* Heading Context - Core Metadata */}
                      {chunk.heading_context &&
                        Array.isArray(chunk.heading_context) &&
                        chunk.heading_context.length > 0 && (
                          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                            <h4 className="text-sm font-semibold mb-3 flex items-center text-green-800">
                              🏗️ Document Structure (heading_context):
                            </h4>
                            <div className="space-y-2">
                              {chunk.heading_context.map((heading, i) => (
                                <div
                                  key={i}
                                  className="text-sm text-green-700 flex items-center bg-green-100 p-2 rounded"
                                >
                                  <span className="mr-3 text-green-600 font-mono">
                                    {"  ".repeat((heading?.level || 1) - 1)}H
                                    {heading?.level || 1}
                                  </span>
                                  <span className="font-medium">
                                    {heading?.title || "Unknown"}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                      {/* Core Metadata Summary */}
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <h4 className="text-sm font-semibold mb-3 text-gray-800 flex items-center">
                          📊 Core Metadata Summary
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                          {/* Chunk Type */}
                          <div className="bg-white p-2 rounded border">
                            <span className="font-medium text-gray-600">
                              chunk_type:
                            </span>
                            <p className="text-gray-800 font-mono">
                              {chunk.chunk_type || "text"}
                            </p>
                          </div>

                          {/* Document Section */}
                          <div className="bg-white p-2 rounded border">
                            <span className="font-medium text-gray-600">
                              document_section:
                            </span>
                            <p className="text-gray-800 font-mono truncate">
                              {chunk.document_section || "N/A"}
                            </p>
                          </div>

                          {/* Topics Count */}
                          <div className="bg-white p-2 rounded border">
                            <span className="font-medium text-gray-600">
                              topics:
                            </span>
                            <p className="text-gray-800 font-mono">
                              {chunk.metadata?.topics?.length || 0} items
                            </p>
                          </div>

                          {/* Keywords Count */}
                          <div className="bg-white p-2 rounded border">
                            <span className="font-medium text-gray-600">
                              keywords:
                            </span>
                            <p className="text-gray-800 font-mono">
                              {chunk.metadata?.keywords?.length || 0} items
                            </p>
                          </div>

                          {/* Heading Context Count */}
                          <div className="bg-white p-2 rounded border">
                            <span className="font-medium text-gray-600">
                              heading_context:
                            </span>
                            <p className="text-gray-800 font-mono">
                              {chunk.heading_context?.length || 0} levels
                            </p>
                          </div>

                          {/* Embeddings */}
                          <div className="bg-white p-2 rounded border">
                            <span className="font-medium text-gray-600">
                              embeddings:
                            </span>
                            <p className="text-gray-800 font-mono">
                              {chunk.embeddings
                                ? Object.keys(chunk.embeddings).length
                                : 0}{" "}
                              types
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Technical Details */}
                      <div className="pt-2 border-t border-gray-200">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs text-gray-500">
                          <div>
                            <span className="font-medium">Document ID:</span>
                            <p className="truncate font-mono">
                              {chunk.document_id}
                            </p>
                          </div>
                          <div>
                            <span className="font-medium">Chunk ID:</span>
                            <p className="truncate font-mono">{chunk.id}</p>
                          </div>
                          <div>
                            <span className="font-medium">Updated:</span>
                            <p>{formatDate(chunk.updated_at)}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <span className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setCurrentPage(Math.min(totalPages, currentPage + 1))
            }
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
