import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  FileText,
  MessageSquare,
  HelpCircle,
  Database,
  ArrowLeft,
  BarChart3,
  Layers,
  Search,
  Lightbulb,
  Settings,
} from "lucide-react";
import {
  getKnowledgeOverview,
  KnowledgeOverview,
} from "@/services/knowledgeManagementService";
import { FilesTab } from "@/components/knowledge-management/FilesTab";
import { TextsTab } from "@/components/knowledge-management/TextsTab";
import { QATab } from "@/components/knowledge-management/QATab";
import { ChunksTab } from "@/components/knowledge-management/ChunksTab";

export function KnowledgeManagementPage() {
  const { id: chatbotId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [overview, setOverview] = useState<KnowledgeOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (chatbotId) {
      loadOverview();
    }
  }, [chatbotId]);

  const loadOverview = async () => {
    try {
      setLoading(true);
      const data = await getKnowledgeOverview(chatbotId!);
      setOverview(data);
    } catch (error) {
      console.error("Error loading knowledge overview:", error);
      toast({
        title: "Error",
        description: `Failed to load knowledge overview: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadOverview();
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading knowledge base...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!overview) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <p className="text-gray-600">
            Failed to load knowledge base overview
          </p>
          <Button onClick={loadOverview} className="mt-4">
            Try Again
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
            <span>Back</span>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Knowledge Management</h1>
            <p className="text-gray-600">{overview.chatbotName}</p>
            <p className="text-sm text-blue-600 font-medium">
              🎯 Core Metadata: topics • keywords • heading_context •
              document_section • chunk_type
            </p>
          </div>
        </div>
        <Button onClick={handleRefresh} variant="outline">
          Refresh
        </Button>
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span>Overview</span>
          </TabsTrigger>
          <TabsTrigger value="files" className="flex items-center space-x-2">
            <FileText className="h-4 w-4" />
            <span>Files ({overview.mongodb.files})</span>
          </TabsTrigger>
          <TabsTrigger value="texts" className="flex items-center space-x-2">
            <MessageSquare className="h-4 w-4" />
            <span>Texts ({overview.mongodb.texts})</span>
          </TabsTrigger>
          <TabsTrigger value="qa" className="flex items-center space-x-2">
            <HelpCircle className="h-4 w-4" />
            <span>Q&A ({overview.mongodb.qaItems})</span>
          </TabsTrigger>
          <TabsTrigger value="chunks" className="flex items-center space-x-2">
            <Layers className="h-4 w-4" />
            <span>Chunks ({overview.supabase.totalChunks})</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* MongoDB Statistics */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Sources
                </CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {overview.mongodb.totalSources}
                </div>
                <p className="text-xs text-muted-foreground">
                  MongoDB knowledge sources
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Files</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {overview.mongodb.files}
                </div>
                <p className="text-xs text-muted-foreground">
                  Uploaded documents
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Text Entries
                </CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {overview.mongodb.texts}
                </div>
                <p className="text-xs text-muted-foreground">
                  Manual text entries
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Q&A Pairs</CardTitle>
                <HelpCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {overview.mongodb.qaItems}
                </div>
                <p className="text-xs text-muted-foreground">
                  Question & answer sets
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Supabase Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Layers className="h-5 w-5" />
                <span>Vector Database (Supabase)</span>
              </CardTitle>
              <CardDescription>
                Advanced RAG chunks with core metadata: topics, keywords,
                heading_context, document_section, chunk_type
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total Chunks</span>
                  <Badge variant="secondary">
                    {overview.supabase.totalChunks}
                  </Badge>
                </div>

                {Object.entries(overview.supabase.chunksByType).length > 0 && (
                  <div className="space-y-2">
                    <span className="text-sm font-medium">Chunks by Type</span>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(overview.supabase.chunksByType).map(
                        ([type, count]) => (
                          <div
                            key={type}
                            className="flex items-center justify-between p-2 bg-gray-50 rounded"
                          >
                            <span className="text-xs capitalize">{type}</span>
                            <Badge variant="outline" size="sm">
                              {count}
                            </Badge>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Suggestions Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Lightbulb className="h-5 w-5 text-yellow-600" />
                <span>Document Suggestions</span>
              </CardTitle>
              <CardDescription>
                Generate and manage AI-powered question suggestions for your documents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Create contextual question suggestions based on your document sections to help users discover relevant information.
                </p>

                <div className="flex items-center gap-3">
                  <Button
                    onClick={() => navigate(`suggestions/doc_${chatbotId}_sample`)}
                    className="flex items-center gap-2"
                    variant="default"
                  >
                    <Settings className="h-4 w-4" />
                    Manage Suggestions
                  </Button>

                  <div className="text-xs text-gray-500">
                    Generate suggestions for document sections
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Last Updated */}
          {overview.lastUpdated && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-sm text-muted-foreground">
                  Last updated:{" "}
                  {new Date(overview.lastUpdated).toLocaleString()}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Files Tab */}
        <TabsContent value="files">
          <FilesTab chatbotId={chatbotId!} onRefresh={handleRefresh} />
        </TabsContent>

        {/* Texts Tab */}
        <TabsContent value="texts">
          <TextsTab chatbotId={chatbotId!} onRefresh={handleRefresh} />
        </TabsContent>

        {/* Q&A Tab */}
        <TabsContent value="qa">
          <QATab chatbotId={chatbotId!} onRefresh={handleRefresh} />
        </TabsContent>

        {/* Chunks Tab */}
        <TabsContent value="chunks">
          <ChunksTab chatbotId={chatbotId!} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
