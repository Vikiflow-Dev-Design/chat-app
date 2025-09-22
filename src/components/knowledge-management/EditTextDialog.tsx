import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { X } from "lucide-react";
import {
  updateText,
  TextKnowledge,
} from "@/services/knowledgeManagementService";

interface EditTextDialogProps {
  text: TextKnowledge;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  chatbotId: string;
}

export function EditTextDialog({
  text,
  isOpen,
  onClose,
  onSave,
  chatbotId,
}: EditTextDialogProps) {
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (text) {
      setTitle(text.title);
      setDescription(text.description || "");
      setContent(text.content);
      setIsActive(text.isActive);
      setTags(text.tags || []);
      setTagInput("");
    }
  }, [text]);

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast({
        title: "Error",
        description: "Title is required",
        variant: "destructive",
      });
      return;
    }

    if (!content.trim()) {
      toast({
        title: "Error",
        description: "Content is required",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      await updateText(chatbotId, text._id, {
        title: title.trim(),
        description: description.trim() || undefined,
        content: content.trim(),
        tags,
        isActive,
      });

      toast({
        title: "Success",
        description: "Text updated successfully",
      });

      onSave();
      onClose();
    } catch (error) {
      console.error("Error updating text:", error);
      toast({
        title: "Error",
        description: "Failed to update text",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Text Entry</DialogTitle>
          <DialogDescription>
            Update text information and content
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Text Info (Read-only) */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">
              Text Information
            </Label>
            <div className="p-3 bg-gray-50 rounded-md space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Chunks:</span>
                <Badge variant="secondary">{text.chunkCount}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  Advanced Processing:
                </span>
                <Badge
                  variant={text.hasAdvancedProcessing ? "default" : "secondary"}
                >
                  {text.hasAdvancedProcessing ? "Yes" : "No"}
                </Badge>
              </div>
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter text title"
              disabled={loading}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter text description (optional)"
              disabled={loading}
            />
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="content">Content *</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter text content"
              disabled={loading}
              rows={8}
              className="resize-none"
            />
            <div className="text-xs text-gray-500">
              {content.length} characters
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <div className="space-y-2">
              <div className="flex space-x-2">
                <Input
                  id="tags"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Add a tag"
                  disabled={loading}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddTag}
                  disabled={loading || !tagInput.trim()}
                >
                  Add
                </Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="flex items-center space-x-1"
                    >
                      <span>{tag}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        disabled={loading}
                        className="ml-1 hover:text-red-500"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Active Status */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="active">Active Status</Label>
              <p className="text-sm text-gray-600">
                Inactive texts won't be used in knowledge search
              </p>
            </div>
            <Switch
              id="active"
              checked={isActive}
              onCheckedChange={setIsActive}
              disabled={loading}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading || !title.trim() || !content.trim()}
          >
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
