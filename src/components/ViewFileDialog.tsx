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
import { File, Download, Trash2, FileText } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";

interface FileSource {
  id: string;
  title: string;
  fileName: string;
  fileType: string;
  fileSize: string;
  content?: string;
  extractedInformation?: string;
  processingStatus: string;
  createdAt: string;
}

interface ViewFileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: FileSource | null;
  onDelete: (fileId: string) => void;
}

export function ViewFileDialog({
  open,
  onOpenChange,
  file,
  onDelete,
}: ViewFileDialogProps) {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  
  if (!file) return null;

  const handleDelete = async () => {
    if (!file) return;
    
    const confirmed = window.confirm(
      "Are you sure you want to delete this file? This action cannot be undone."
    );
    
    if (!confirmed) return;
    
    setIsDeleting(true);
    try {
      await onDelete(file.id);
      onOpenChange(false);
      toast({
        title: "File deleted",
        description: "The file has been deleted successfully.",
      });
    } catch (error) {
      console.error("Error deleting file:", error);
      toast({
        title: "Error",
        description: "Failed to delete the file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const getFileIcon = () => {
    switch (file.fileType) {
      case "pdf":
        return <File className="h-5 w-5 text-red-500" />;
      case "doc":
      case "docx":
        return <File className="h-5 w-5 text-blue-500" />;
      case "txt":
        return <FileText className="h-5 w-5 text-gray-500" />;
      default:
        return <File className="h-5 w-5 text-primary" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getFileIcon()}
            File Details
          </DialogTitle>
          <DialogDescription>
            View information about this file.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold">{file.title}</h3>
            <p className="text-sm text-muted-foreground">{file.fileName}</p>
          </div>

          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">
                  File Type
                </h4>
                <p className="text-sm uppercase">{file.fileType}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">
                  Size
                </h4>
                <p className="text-sm">{file.fileSize}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">
                  Status
                </h4>
                <Badge
                  variant={
                    file.processingStatus === "completed"
                      ? "default"
                      : file.processingStatus === "failed"
                      ? "destructive"
                      : "secondary"
                  }
                  className="mt-1"
                >
                  {file.processingStatus === "completed"
                    ? "Processed"
                    : file.processingStatus === "failed"
                    ? "Failed"
                    : "Processing"}
                </Badge>
              </div>
              {file.createdAt && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">
                    Added
                  </h4>
                  <p className="text-sm">
                    {formatDistanceToNow(new Date(file.createdAt), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              )}
            </div>

            {file.extractedInformation && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">
                  Extracted Information
                </h4>
                <div className="text-sm max-h-32 overflow-y-auto p-2 bg-muted rounded-md">
                  <p className="whitespace-pre-wrap">{file.extractedInformation}</p>
                </div>
              </div>
            )}
          </div>
        </div>
        <DialogFooter className="flex justify-between">
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
