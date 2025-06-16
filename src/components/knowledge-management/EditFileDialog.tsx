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
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { X } from "lucide-react";
import {
  updateFile,
  FileKnowledge,
} from "@/services/knowledgeManagementService";

interface EditFileDialogProps {
  file: FileKnowledge;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  chatbotId: string;
}

export function EditFileDialog({
  file,
  isOpen,
  onClose,
  onSave,
  chatbotId,
}: EditFileDialogProps) {
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (file) {
      setTitle(file.title);
      setIsActive(file.isActive);
      setTags(file.tags || []);
      setTagInput("");
    }
  }, [file]);

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

    try {
      setLoading(true);

      await updateFile(chatbotId, file._id, {
        title: title.trim(),
        tags,
        isActive,
      });

      toast({
        title: "Success",
        description: "File updated successfully",
      });

      onSave();
      onClose();
    } catch (error) {
      console.error("Error updating file:", error);
      toast({
        title: "Error",
        description: "Failed to update file",
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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit File</DialogTitle>
          <DialogDescription>
            Update file information and settings
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* File Info (Read-only) */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">
              File Information
            </Label>
            <div className="p-3 bg-gray-50 rounded-md space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">File Name:</span>
                <span className="text-sm font-medium">{file.fileName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Type:</span>
                <Badge variant="outline">{file.fileType.toUpperCase()}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Chunks:</span>
                <Badge variant="secondary">{file.chunkCount}</Badge>
              </div>
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter file title"
              disabled={loading}
            />
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
                Inactive files won't be used in knowledge search
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
          <Button onClick={handleSave} disabled={loading || !title.trim()}>
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
