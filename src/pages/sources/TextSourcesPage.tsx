import { useState } from "react";
import { useParams } from "react-router-dom";
import { ViewTextDialog } from "@/components/ViewTextDialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { FileText, Plus } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { SourcesLayout } from "@/components/sources/SourcesLayout";
import { SelectableSourceList } from "@/components/sources/SelectableSourceList";
import { useChatbotSources } from "@/hooks/useChatbotSources";

export default function TextSourcesPage() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [newTextTitle, setNewTextTitle] = useState("");
  const [newTextContent, setNewTextContent] = useState("");
  const [isTextDialogOpen, setIsTextDialogOpen] = useState(false);
  const [selectedText, setSelectedText] = useState<any>(null);

  const {
    loading,
    textSources,
    sourcesSummary,
    needsRetraining,
    handleViewText,
    handleDeleteTextSource,
    handleUpdateText,
    handleAddText: addTextSource,
    handleRetrain,
  } = useChatbotSources(id);

  const handleAddText = async () => {
    if (!newTextTitle.trim() || !newTextContent.trim()) {
      toast({
        title: "Error",
        description: "Title and content are required",
        variant: "destructive",
      });
      return;
    }

    try {
      // Add the text source using the hook function
      await addTextSource(
        newTextTitle.trim(),
        "", // description is optional
        newTextContent.trim()
      );

      // Clear form
      setNewTextTitle("");
      setNewTextContent("");
    } catch (error) {
      console.error("Error adding text:", error);
      toast({
        title: "Error",
        description: "Failed to add text",
        variant: "destructive",
      });
    }
  };

  const handleViewTextWrapper = (textId: string) => {
    const text = textSources.find((t) => t.id === textId);
    if (text) {
      setSelectedText({
        id: text.id,
        title: text.title,
        description: text.description || "",
        content: text.content,
        size: text.size,
        createdAt: text.createdAt || new Date().toISOString(),
      });
      setIsTextDialogOpen(true);
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
          <CardTitle className="text-lg font-medium text-gray-800">
            Text
          </CardTitle>
          <CardDescription>
            Add text content to enhance your chatbot's knowledge
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
              <h3 className="text-sm font-medium mb-3 text-gray-700 flex items-center">
                <FileText className="h-4 w-4 mr-2 text-primary" />
                Add New Text
              </h3>
              <div className="space-y-4">
                <div>
                  <Input
                    placeholder="Title"
                    value={newTextTitle}
                    onChange={(e) => setNewTextTitle(e.target.value)}
                  />
                </div>
                <div>
                  <Textarea
                    placeholder="Enter text content here..."
                    className="min-h-[150px]"
                    value={newTextContent}
                    onChange={(e) => setNewTextContent(e.target.value)}
                  />
                </div>
                <Button onClick={handleAddText} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Text
                </Button>
              </div>
            </div>

            {textSources.length > 0 && (
              <div className="mt-8">
                <SelectableSourceList
                  title="Text Sources"
                  icon={<FileText className="h-4 w-4 text-primary" />}
                  sources={textSources.map((text) => ({
                    id: text.id,
                    title: text.title,
                    type: "text",
                    size: text.size,
                    isNew:
                      new Date(text.createdAt || Date.now()).getTime() >
                      Date.now() - 86400000, // 24 hours
                    lastUpdated: text.createdAt
                      ? new Date(text.createdAt).toLocaleDateString()
                      : undefined,
                  }))}
                  onView={handleViewTextWrapper}
                  onEdit={handleViewTextWrapper} // Using the same handler for edit and view
                  onDelete={handleDeleteTextSource}
                  onDeleteMultiple={(ids) => {
                    // Handle multiple deletion
                    ids.forEach((id) => handleDeleteTextSource(id));
                  }}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Text View Dialog */}
      <ViewTextDialog
        open={isTextDialogOpen}
        onOpenChange={setIsTextDialogOpen}
        text={selectedText}
        onDelete={handleDeleteTextSource}
        onUpdate={handleUpdateText}
      />
    </SourcesLayout>
  );
}
