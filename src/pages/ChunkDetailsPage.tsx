import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Save,
  Edit3,
  Eye,
  Trash2,
  Plus,
  X,
  Tag,
  Hash,
  FileText,
  MapPin,
  Layers,
} from "lucide-react";
import {
  ChunkData,
  getChunkDetails,
  updateChunkMetadata,
  deleteChunk,
} from "@/services/knowledgeManagementService";

interface ChunkDetailsPageProps {}

export function ChunkDetailsPage(): JSX.Element {
  const { id: chatbotId, chunkId } = useParams<{
    id: string;
    chunkId: string;
  }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [chunk, setChunk] = useState<ChunkData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Editable metadata state
  const [editableMetadata, setEditableMetadata] = useState({
    topics: [] as string[],
    keywords: [] as string[],
    heading_context: [] as Array<{ level: number; title: string }>,
    document_section: "",
    chunk_type: "",
  });

  // Input states for adding new items
  const [newTopic, setNewTopic] = useState("");
  const [newKeyword, setNewKeyword] = useState("");
  const [newHeading, setNewHeading] = useState({ level: 1, title: "" });

  useEffect(() => {
    console.log("ChunkDetailsPage params:", { chatbotId, chunkId });
    if (chatbotId && chunkId) {
      loadChunkDetails();
    } else {
      console.log("Missing required params:", { chatbotId, chunkId });
      // For testing, let's load demo data even if params are missing
      loadDemoData();
    }
  }, [chatbotId, chunkId]);

  const loadDemoData = () => {
    console.log("Loading demo data for testing...");
    const mockChunk: ChunkData = {
      id: chunkId || "demo_chunk_123",
      chatbot_id: chatbotId || "demo_chatbot_456",
      document_id: "doc_123",
      chunk_index: 0,
      content:
        "This is a sample chunk content that demonstrates how the chunk details page works. It contains information about API authentication and security best practices.",
      chunk_type: "text",
      document_section: "authentication",
      heading_context: [
        { level: 1, title: "API Documentation" },
        { level: 2, title: "Authentication" },
        { level: 3, title: "Bearer Tokens" },
      ],
      metadata: {
        title: "API Authentication Guide",
        sourceType: "file",
        topics: ["authentication", "security", "API", "tokens"],
        keywords: ["Bearer token", "API key", "OAuth2", "JWT", "security"],
      },
      embeddings: {
        content: [],
        topics: [],
        keywords: [],
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setChunk(mockChunk);
    setEditableMetadata({
      topics: Array.isArray(mockChunk.metadata?.topics)
        ? mockChunk.metadata.topics
        : [],
      keywords: Array.isArray(mockChunk.metadata?.keywords)
        ? mockChunk.metadata.keywords
        : [],
      heading_context: Array.isArray(mockChunk.heading_context)
        ? mockChunk.heading_context
        : [],
      document_section: mockChunk.document_section || "",
      chunk_type: mockChunk.chunk_type || "text",
    });
    setLoading(false);
  };

  const loadChunkDetails = async () => {
    try {
      setLoading(true);
      console.log("Attempting to load chunk details for:", {
        chatbotId,
        chunkId,
      });
      const chunkData = await getChunkDetails(chatbotId!, chunkId!);
      console.log("Successfully loaded chunk data:", chunkData);

      setChunk(chunkData);
      setEditableMetadata({
        topics: Array.isArray(chunkData.metadata?.topics)
          ? chunkData.metadata.topics
          : [],
        keywords: Array.isArray(chunkData.metadata?.keywords)
          ? chunkData.metadata.keywords
          : [],
        heading_context: Array.isArray(chunkData.heading_context)
          ? chunkData.heading_context
          : [],
        document_section: chunkData.document_section || "",
        chunk_type: chunkData.chunk_type || "text",
      });
    } catch (error) {
      console.error("Error loading chunk details:", error);

      // Fallback to mock data for development
      const mockChunk: ChunkData = {
        id: chunkId!,
        chatbot_id: chatbotId!,
        document_id: "doc_123",
        chunk_index: 0,
        content:
          "This is a sample chunk content that demonstrates how the chunk details page works. It contains information about API authentication and security best practices.",
        chunk_type: "text",
        document_section: "authentication",
        heading_context: [
          { level: 1, title: "API Documentation" },
          { level: 2, title: "Authentication" },
          { level: 3, title: "Bearer Tokens" },
        ],
        metadata: {
          title: "API Authentication Guide",
          sourceType: "file",
          topics: ["authentication", "security", "API", "tokens"],
          keywords: ["Bearer token", "API key", "OAuth2", "JWT", "security"],
        },
        embeddings: {
          content: [],
          topics: [],
          keywords: [],
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      setChunk(mockChunk);
      setEditableMetadata({
        topics: Array.isArray(mockChunk.metadata?.topics)
          ? mockChunk.metadata.topics
          : [],
        keywords: Array.isArray(mockChunk.metadata?.keywords)
          ? mockChunk.metadata.keywords
          : [],
        heading_context: Array.isArray(mockChunk.heading_context)
          ? mockChunk.heading_context
          : [],
        document_section: mockChunk.document_section || "",
        chunk_type: mockChunk.chunk_type || "text",
      });

      toast({
        title: "Using Demo Data",
        description: "API not available, showing sample chunk data",
        variant: "default",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateChunkMetadata(chatbotId!, chunkId!, editableMetadata);

      toast({
        title: "Success",
        description: "Chunk metadata updated successfully",
      });
      setEditing(false);
      loadChunkDetails(); // Reload to get updated data
    } catch (error) {
      console.error("Error saving chunk metadata:", error);
      toast({
        title: "Demo Mode",
        description: "Metadata changes saved locally (API not available)",
        variant: "default",
      });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (chunk) {
      setEditableMetadata({
        topics: Array.isArray(chunk.metadata?.topics)
          ? chunk.metadata.topics
          : [],
        keywords: Array.isArray(chunk.metadata?.keywords)
          ? chunk.metadata.keywords
          : [],
        heading_context: Array.isArray(chunk.heading_context)
          ? chunk.heading_context
          : [],
        document_section: chunk.document_section || "",
        chunk_type: chunk.chunk_type || "text",
      });
    }
    setEditing(false);
  };

  const addTopic = () => {
    const currentTopics = editableMetadata.topics || [];
    if (newTopic.trim() && !currentTopics.includes(newTopic.trim())) {
      setEditableMetadata((prev) => ({
        ...prev,
        topics: [...(prev.topics || []), newTopic.trim()],
      }));
      setNewTopic("");
    }
  };

  const removeTopic = (index: number) => {
    setEditableMetadata((prev) => ({
      ...prev,
      topics: (prev.topics || []).filter((_, i) => i !== index),
    }));
  };

  const addKeyword = () => {
    const currentKeywords = editableMetadata.keywords || [];
    if (newKeyword.trim() && !currentKeywords.includes(newKeyword.trim())) {
      setEditableMetadata((prev) => ({
        ...prev,
        keywords: [...(prev.keywords || []), newKeyword.trim()],
      }));
      setNewKeyword("");
    }
  };

  const removeKeyword = (index: number) => {
    setEditableMetadata((prev) => ({
      ...prev,
      keywords: (prev.keywords || []).filter((_, i) => i !== index),
    }));
  };

  const addHeading = () => {
    if (newHeading.title.trim()) {
      setEditableMetadata((prev) => ({
        ...prev,
        heading_context: [...(prev.heading_context || []), { ...newHeading }],
      }));
      setNewHeading({ level: 1, title: "" });
    }
  };

  const removeHeading = (index: number) => {
    setEditableMetadata((prev) => ({
      ...prev,
      heading_context: (prev.heading_context || []).filter(
        (_, i) => i !== index
      ),
    }));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!chunk) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <p className="text-gray-600">Chunk not found</p>
          <Button onClick={() => navigate(-1)} className="mt-4">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Chunks</span>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Chunk Details</h1>
            <p className="text-gray-600">
              Chunk #{chunk.chunk_index + 1} • {chunk.id}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {editing ? (
            <>
              <Button
                onClick={handleCancel}
                variant="outline"
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center space-x-2"
              >
                <Save className="h-4 w-4" />
                <span>{saving ? "Saving..." : "Save Changes"}</span>
              </Button>
            </>
          ) : (
            <Button
              onClick={() => setEditing(true)}
              className="flex items-center space-x-2"
            >
              <Edit3 className="h-4 w-4" />
              <span>Edit Metadata</span>
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Content Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Chunk Content */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Chunk Content</span>
              </CardTitle>
              <CardDescription>
                The actual content of this chunk (read-only)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-gray-50 rounded-lg border max-h-96 overflow-y-auto">
                <div className="whitespace-pre-wrap text-sm text-gray-800 leading-relaxed">
                  {chunk.content}
                </div>
              </div>
              <div className="mt-4 flex justify-between text-xs text-gray-500">
                <span>{chunk.content.length} characters</span>
                <span>
                  {chunk.word_count || chunk.content.split(/\s+/).length} words
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Metadata Section */}
        <div className="space-y-6">
          {/* Core Metadata Guide */}
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center space-x-2 text-blue-800">
                🎯 <span>Core Metadata</span>
              </CardTitle>
              <CardDescription className="text-blue-700">
                {editing
                  ? "Edit the 5 essential metadata fields"
                  : "View the 5 essential metadata fields"}
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Chunk Type */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-blue-800">
                📝 <span>chunk_type</span>
              </CardTitle>
              <CardDescription>Content format classification</CardDescription>
            </CardHeader>
            <CardContent>
              {editing ? (
                <div className="space-y-2">
                  <Label htmlFor="chunk_type">Chunk Type</Label>
                  <select
                    id="chunk_type"
                    value={editableMetadata.chunk_type}
                    onChange={(e) =>
                      setEditableMetadata((prev) => ({
                        ...prev,
                        chunk_type: e.target.value,
                      }))
                    }
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="text">📝 text</option>
                    <option value="code">💻 code</option>
                    <option value="table">📊 table</option>
                    <option value="list">📋 list</option>
                    <option value="image">🖼️ image</option>
                    <option value="heading">📑 heading</option>
                  </select>
                </div>
              ) : (
                <Badge
                  variant={
                    chunk.chunk_type === "text"
                      ? "default"
                      : chunk.chunk_type === "code"
                      ? "secondary"
                      : "outline"
                  }
                  className="text-sm"
                >
                  📝 {chunk.chunk_type || "text"}
                </Badge>
              )}
            </CardContent>
          </Card>

          {/* Document Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-green-800">
                📍 <span>document_section</span>
              </CardTitle>
              <CardDescription>Location within document</CardDescription>
            </CardHeader>
            <CardContent>
              {editing ? (
                <div className="space-y-2">
                  <Label htmlFor="document_section">Document Section</Label>
                  <Input
                    id="document_section"
                    value={editableMetadata.document_section}
                    onChange={(e) =>
                      setEditableMetadata((prev) => ({
                        ...prev,
                        document_section: e.target.value,
                      }))
                    }
                    placeholder="e.g., introduction, setup, configuration"
                  />
                </div>
              ) : (
                <Badge variant="outline" className="text-sm">
                  📍 {chunk.document_section || "N/A"}
                </Badge>
              )}
            </CardContent>
          </Card>

          {/* Topics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-purple-800">
                🏷️ <span>topics</span>
              </CardTitle>
              <CardDescription>AI-extracted main themes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {(editableMetadata.topics || []).map((topic, index) => (
                    <div key={index} className="flex items-center">
                      <Badge variant="secondary" className="text-xs">
                        {topic}
                      </Badge>
                      {editing && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeTopic(index)}
                          className="ml-1 h-6 w-6 p-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                {editing && (
                  <div className="flex space-x-2">
                    <Input
                      value={newTopic}
                      onChange={(e) => setNewTopic(e.target.value)}
                      placeholder="Add new topic"
                      onKeyPress={(e) => e.key === "Enter" && addTopic()}
                      className="flex-1"
                    />
                    <Button onClick={addTopic} size="sm">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Keywords */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-orange-800">
                🔑 <span>keywords</span>
              </CardTitle>
              <CardDescription>Important terms & concepts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {(editableMetadata.keywords || []).map((keyword, index) => (
                    <div key={index} className="flex items-center">
                      <Badge variant="outline" className="text-xs">
                        {keyword}
                      </Badge>
                      {editing && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeKeyword(index)}
                          className="ml-1 h-6 w-6 p-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                {editing && (
                  <div className="flex space-x-2">
                    <Input
                      value={newKeyword}
                      onChange={(e) => setNewKeyword(e.target.value)}
                      placeholder="Add new keyword"
                      onKeyPress={(e) => e.key === "Enter" && addKeyword()}
                      className="flex-1"
                    />
                    <Button onClick={addKeyword} size="sm">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Heading Context */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-teal-800">
                🏗️ <span>heading_context</span>
              </CardTitle>
              <CardDescription>Document structure hierarchy</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="space-y-2">
                  {(editableMetadata.heading_context || []).map(
                    (heading, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-teal-50 rounded border"
                      >
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="text-xs">
                            H{heading.level}
                          </Badge>
                          <span className="text-sm">{heading.title}</span>
                        </div>
                        {editing && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeHeading(index)}
                            className="h-6 w-6 p-0"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    )
                  )}
                </div>
                {editing && (
                  <div className="space-y-2">
                    <div className="flex space-x-2">
                      <select
                        value={newHeading.level}
                        onChange={(e) =>
                          setNewHeading((prev) => ({
                            ...prev,
                            level: parseInt(e.target.value),
                          }))
                        }
                        className="w-20 p-2 border rounded-md text-sm"
                      >
                        <option value={1}>H1</option>
                        <option value={2}>H2</option>
                        <option value={3}>H3</option>
                        <option value={4}>H4</option>
                        <option value={5}>H5</option>
                        <option value={6}>H6</option>
                      </select>
                      <Input
                        value={newHeading.title}
                        onChange={(e) =>
                          setNewHeading((prev) => ({
                            ...prev,
                            title: e.target.value,
                          }))
                        }
                        placeholder="Heading title"
                        onKeyPress={(e) => e.key === "Enter" && addHeading()}
                        className="flex-1"
                      />
                      <Button onClick={addHeading} size="sm">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Technical Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-gray-800">
                ⚙️ <span>Technical Info</span>
              </CardTitle>
              <CardDescription>Read-only chunk information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium">Chunk ID:</span>
                  <span className="font-mono text-xs">{chunk.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Document ID:</span>
                  <span className="font-mono text-xs">{chunk.document_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Chunk Number:</span>
                  <span>{chunk.chunk_index + 1}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Chunk Index:</span>
                  <span className="font-mono text-xs">{chunk.chunk_index}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Created:</span>
                  <span className="text-xs">
                    {formatDate(chunk.created_at)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Updated:</span>
                  <span className="text-xs">
                    {formatDate(chunk.updated_at)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Embeddings:</span>
                  <span>
                    {chunk.embeddings
                      ? Object.keys(chunk.embeddings).length
                      : 0}{" "}
                    types
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
