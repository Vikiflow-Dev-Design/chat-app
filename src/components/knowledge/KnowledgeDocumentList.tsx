import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  KnowledgeDocument,
  getKnowledgeDocuments,
  deleteKnowledgeDocument,
  searchKnowledgeDocuments,
} from "@/services/knowledgeService";
import { formatDistanceToNow } from "date-fns";
import {
  FileText,
  FileQuestion,
  File,
  Search,
  Edit,
  Trash2,
  Plus,
  Tag,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface KnowledgeDocumentListProps {
  chatbotId: string;
  onEdit: (document: KnowledgeDocument) => void;
  onAdd: () => void;
}

export function KnowledgeDocumentList({
  chatbotId,
  onEdit,
  onAdd,
}: KnowledgeDocumentListProps) {
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    if (chatbotId) {
      loadDocuments();
    }
  }, [chatbotId]);

  const loadDocuments = async () => {
    try {
      setLoading(true);

      // Use mock token for development
      const token = "mock_jwt_token_for_development";

      const data = await getKnowledgeDocuments(chatbotId, token);
      setDocuments(data);
    } catch (error) {
      console.error("Error loading knowledge documents:", error);
      toast({
        title: "Error",
        description: "Failed to load knowledge documents",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadDocuments();
      return;
    }

    try {
      setLoading(true);

      // Use mock token for development
      const token = "mock_jwt_token_for_development";

      const results = await searchKnowledgeDocuments(
        chatbotId,
        searchQuery,
        token
      );
      setDocuments(results);
    } catch (error) {
      console.error("Error searching knowledge documents:", error);
      toast({
        title: "Error",
        description: "Failed to search knowledge documents",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (documentId: string) => {
    if (!confirm("Are you sure you want to delete this document?")) {
      return;
    }

    try {
      // Use mock token for development
      const token = "mock_jwt_token_for_development";

      await deleteKnowledgeDocument(documentId, token);
      setDocuments(documents.filter((doc) => doc._id !== documentId));
      toast({
        title: "Success",
        description: "Document deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting document:", error);
      toast({
        title: "Error",
        description: "Failed to delete document",
        variant: "destructive",
      });
    }
  };

  const getSourceTypeIcon = (sourceType: string) => {
    switch (sourceType) {
      case "text":
        return <FileText className="h-4 w-4" />;
      case "qa":
        return <FileQuestion className="h-4 w-4" />;
      case "file":
        return <File className="h-4 w-4" />;
      default:
        return <File className="h-4 w-4" />;
    }
  };

  const getSourceTypeName = (sourceType: string, fileType?: string) => {
    switch (sourceType) {
      case "text":
        return "Text";
      case "qa":
        return "Q&A";
      case "file":
        return fileType ? `File (${fileType.toUpperCase()})` : "File";
      default:
        return sourceType;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Knowledge Base</h2>
        <Button onClick={onAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Add Document
        </Button>
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="Search documents..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
        <Button variant="outline" onClick={handleSearch}>
          <Search className="h-4 w-4 mr-2" />
          Search
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading documents...</div>
      ) : documents.length === 0 ? (
        <div className="text-center py-8 border rounded-md bg-muted/20">
          <p className="text-muted-foreground">No documents found</p>
          <Button variant="outline" className="mt-4" onClick={onAdd}>
            <Plus className="h-4 w-4 mr-2" />
            Add your first document
          </Button>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead>Last Updated</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.map((doc) => (
              <TableRow key={doc._id}>
                <TableCell className="font-medium">{doc.title}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    {getSourceTypeIcon(doc.sourceType)}
                    <span>
                      {getSourceTypeName(doc.sourceType, doc.fileType)}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {doc.tags && doc.tags.length > 0 ? (
                      doc.tags.map((tag, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="flex items-center"
                        >
                          <Tag className="h-3 w-3 mr-1" />
                          {tag}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-muted-foreground text-sm">
                        No tags
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {formatDistanceToNow(new Date(doc.updatedAt), {
                    addSuffix: true,
                  })}
                </TableCell>
                <TableCell>
                  <Badge variant={doc.isActive ? "default" : "secondary"}>
                    {doc.isActive ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(doc)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(doc._id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
