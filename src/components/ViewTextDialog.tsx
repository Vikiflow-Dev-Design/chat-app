import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Edit, Trash2, Save } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface TextSource {
  id: string;
  title: string;
  description: string;
  content: string;
  size: string;
  isNew?: boolean;
  createdAt: string;
}

interface ViewTextDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  text: TextSource | null;
  onDelete: (textId: string) => void;
  onUpdate: (textId: string, title: string, description: string, content: string) => Promise<void>;
}

export function ViewTextDialog({
  open,
  onOpenChange,
  text,
  onDelete,
  onUpdate,
}: ViewTextDialogProps) {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [editedDescription, setEditedDescription] = useState("");
  const [editedContent, setEditedContent] = useState("");
  
  if (!text) return null;

  const handleEdit = () => {
    setEditedTitle(text.title);
    setEditedDescription(text.description || "");
    setEditedContent(text.content);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!editedTitle.trim()) {
      toast({
        title: "Title required",
        description: "Please provide a title for your text source.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      await onUpdate(text.id, editedTitle, editedDescription, editedContent);
      setIsEditing(false);
      toast({
        title: "Text updated",
        description: "Your text has been updated successfully.",
      });
    } catch (error) {
      console.error("Error updating text:", error);
      toast({
        title: "Update failed",
        description: "An error occurred while updating the text. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this text? This action cannot be undone."
    );
    
    if (!confirmed) return;
    
    setIsDeleting(true);
    try {
      await onDelete(text.id);
      onOpenChange(false);
      toast({
        title: "Text deleted",
        description: "The text has been deleted successfully.",
      });
    } catch (error) {
      console.error("Error deleting text:", error);
      toast({
        title: "Error",
        description: "Failed to delete the text. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={isEditing ? "sm:max-w-2xl" : "sm:max-w-md"}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            {isEditing ? "Edit Text Source" : "Text Source Details"}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? "Edit the text source information." 
              : "View detailed information about this text source."}
          </DialogDescription>
        </DialogHeader>
        
        {isEditing ? (
          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <Input
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                placeholder="Enter title"
                className="w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description (optional)
              </label>
              <Input
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
                placeholder="Enter description"
                className="w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Content
              </label>
              <Textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                placeholder="Enter content"
                className="min-h-[200px] w-full"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="space-y-1">
              <h3 className="text-lg font-semibold">{text.title}</h3>
              {text.description && (
                <p className="text-sm text-muted-foreground">{text.description}</p>
              )}
            </div>

            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">
                    Size
                  </h4>
                  <p className="text-sm">{text.size}</p>
                </div>
                {text.createdAt && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">
                      Added
                    </h4>
                    <p className="text-sm">
                      {formatDistanceToNow(new Date(text.createdAt), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">
                  Content
                </h4>
                <div className="text-sm max-h-[200px] overflow-y-auto p-3 bg-muted rounded-md">
                  <p className="whitespace-pre-wrap">{text.content}</p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <DialogFooter className="flex justify-between">
          {isEditing ? (
            <>
              <Button
                variant="outline"
                onClick={handleCancelEdit}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>Saving...</>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
              <Button
                variant="outline"
                onClick={handleEdit}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
