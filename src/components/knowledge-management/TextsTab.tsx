import React, { useState, useEffect } from "react";
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
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  MessageSquare,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Layers,
  Plus,
} from "lucide-react";
import {
  getTexts,
  deleteText,
  TextKnowledge,
} from "@/services/knowledgeManagementService";
import { TextDetailsDialog } from "./TextDetailsDialog";
import { EditTextDialog } from "./EditTextDialog";
import { CreateTextDialog } from "./CreateTextDialog";

interface TextsTabProps {
  chatbotId: string;
  onRefresh: () => void;
}

export function TextsTab({ chatbotId, onRefresh }: TextsTabProps) {
  const { toast } = useToast();
  const [texts, setTexts] = useState<TextKnowledge[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedText, setSelectedText] = useState<TextKnowledge | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [textToDelete, setTextToDelete] = useState<TextKnowledge | null>(null);

  useEffect(() => {
    loadTexts();
  }, [chatbotId, currentPage, searchQuery]);

  const loadTexts = async () => {
    try {
      setLoading(true);
      const response = await getTexts(chatbotId, currentPage, 10, searchQuery);
      setTexts(response.texts);
      setTotalPages(response.pagination.totalPages);
    } catch (error) {
      console.error("Error loading texts:", error);
      toast({
        title: "Error",
        description: "Failed to load texts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    loadTexts();
  };

  const handleViewDetails = (text: TextKnowledge) => {
    setSelectedText(text);
    setShowDetailsDialog(true);
  };

  const handleEdit = (text: TextKnowledge) => {
    setSelectedText(text);
    setShowEditDialog(true);
  };

  const handleCreate = () => {
    setShowCreateDialog(true);
  };

  const handleDeleteClick = (text: TextKnowledge) => {
    setTextToDelete(text);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!textToDelete) return;

    try {
      await deleteText(chatbotId, textToDelete._id);
      toast({
        title: "Success",
        description: "Text deleted successfully",
      });
      loadTexts();
      onRefresh();
    } catch (error) {
      console.error("Error deleting text:", error);
      toast({
        title: "Error",
        description: "Failed to delete text",
        variant: "destructive",
      });
    } finally {
      setShowDeleteDialog(false);
      setTextToDelete(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5" />
              <span>Text Entries Management</span>
            </div>
            <Button
              onClick={handleCreate}
              className="flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Add Text</span>
            </Button>
          </CardTitle>
          <CardDescription>
            Manage manual text entries and their processed chunks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search texts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                  className="pl-10"
                />
              </div>
            </div>
            <Button onClick={handleSearch}>Search</Button>
          </div>
        </CardContent>
      </Card>

      {/* Texts Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          ) : texts.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No text entries found</p>
              <Button onClick={handleCreate} className="mt-4">
                Add Your First Text
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Content Preview</TableHead>
                  <TableHead>Chunks</TableHead>
                  <TableHead>Advanced Processing</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {texts.map((text) => (
                  <TableRow key={text._id}>
                    <TableCell>
                      <div className="font-medium">{text.title}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-600">
                        {text.description
                          ? truncateText(text.description, 50)
                          : "No description"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-600 max-w-xs">
                        {truncateText(text.content, 80)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Layers className="h-4 w-4 text-gray-400" />
                        <span>{text.chunkCount}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {text.hasAdvancedProcessing ? (
                        <Badge
                          variant="default"
                          className="bg-green-100 text-green-800"
                        >
                          Yes
                        </Badge>
                      ) : (
                        <Badge variant="secondary">No</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={text.isActive ? "default" : "secondary"}>
                        {text.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(text.createdAt)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleViewDetails(text)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(text)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteClick(text)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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

      {/* Dialogs */}
      {selectedText && (
        <>
          <TextDetailsDialog
            text={selectedText}
            isOpen={showDetailsDialog}
            onClose={() => {
              setShowDetailsDialog(false);
              setSelectedText(null);
            }}
            chatbotId={chatbotId}
          />
          <EditTextDialog
            text={selectedText}
            isOpen={showEditDialog}
            onClose={() => {
              setShowEditDialog(false);
              setSelectedText(null);
            }}
            onSave={() => {
              loadTexts();
              onRefresh();
            }}
            chatbotId={chatbotId}
          />
        </>
      )}

      <CreateTextDialog
        isOpen={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onSave={() => {
          loadTexts();
          onRefresh();
        }}
        chatbotId={chatbotId}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Text Entry</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{textToDelete?.title}"? This will
              also delete all associated chunks and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
