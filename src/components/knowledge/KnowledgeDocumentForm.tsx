import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  KnowledgeDocument,
  CreateTextDocumentDto,
  UpdateKnowledgeDocumentDto,
  createTextDocument,
  updateKnowledgeDocument,
} from "@/services/knowledgeService";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface KnowledgeDocumentFormProps {
  chatbotId: string;
  document?: KnowledgeDocument;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export function KnowledgeDocumentForm({
  chatbotId,
  document,
  isOpen,
  onClose,
  onSave,
}: KnowledgeDocumentFormProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [sourceType, setSourceType] = useState<"text" | "qa" | "file">("text");
  const [isActive, setIsActive] = useState(true);
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Initialize form when document changes
  useEffect(() => {
    if (document) {
      setTitle(document.title);
      setContent(document.content || "");
      setSourceType(document.sourceType);
      setIsActive(document.isActive);
      setTags(document.tags || []);
    } else {
      // Reset form for new document
      setTitle("");
      setContent("");
      setSourceType("text");
      setIsActive(true);
      setTags([]);
    }
  }, [document, isOpen]);

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      toast({
        title: "Validation Error",
        description: "Title and content are required",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      if (document) {
        // Update existing document
        const updateData: UpdateKnowledgeDocumentDto = {
          title,
          content,
          tags,
          isActive,
        };

        // Use mock token for development
        const token = "mock_jwt_token_for_development";

        await updateKnowledgeDocument(document._id, updateData, token);
        toast({
          title: "Success",
          description: "Document updated successfully",
        });
      } else {
        // Create new document
        const newDocument: CreateTextDocumentDto = {
          chatbotId,
          title,
          content,
          tags,
        };

        // Use mock token for development
        const token = "mock_jwt_token_for_development";

        await createTextDocument(newDocument, token);
        toast({
          title: "Success",
          description: "Document created successfully",
        });
      }

      onSave();
      onClose();
    } catch (error) {
      console.error("Error saving document:", error);
      toast({
        title: "Error",
        description: document
          ? "Failed to update document"
          : "Failed to create document",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getContentPlaceholder = () => {
    switch (sourceType) {
      case "text":
        return "Enter the text content...";
      case "qa":
        return "Format as Q: Question\nA: Answer\n\nQ: Another question\nA: Another answer";
      case "file":
        return "Enter document content...";
      default:
        return "Enter content...";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {document ? "Edit Document" : "Add New Document"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="title" className="text-right">
              Title
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="col-span-3"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="sourceType" className="text-right">
              Source Type
            </Label>
            <Select
              value={sourceType}
              onValueChange={(value) => setSourceType(value as any)}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select source type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Text</SelectItem>
                <SelectItem value="qa">Q&A</SelectItem>
                <SelectItem value="file">File</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="content" className="text-right pt-2">
              Content
            </Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="col-span-3 min-h-[200px]"
              placeholder={getContentPlaceholder()}
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="tags" className="text-right">
              Tags
            </Label>
            <div className="col-span-3 space-y-2">
              <div className="flex gap-2">
                <Input
                  id="tags"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="Add tags..."
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                />
                <Button type="button" onClick={handleAddTag} variant="outline">
                  Add
                </Button>
              </div>

              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {tags.map((tag, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          {document && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="isActive" className="text-right">
                Active
              </Label>
              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={isActive}
                  onCheckedChange={setIsActive}
                />
                <Label htmlFor="isActive">
                  {isActive ? "Active" : "Inactive"}
                </Label>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Saving..." : document ? "Update" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
