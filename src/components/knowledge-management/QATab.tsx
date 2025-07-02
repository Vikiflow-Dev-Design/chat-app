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
  HelpCircle,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Layers,
  Plus,
} from "lucide-react";
import {
  getQAItems,
  deleteQA,
  QAKnowledge,
} from "@/services/knowledgeManagementService";

interface QATabProps {
  chatbotId: string;
  onRefresh: () => void;
}

export function QATab({ chatbotId, onRefresh }: QATabProps) {
  const { toast } = useToast();
  const [qaItems, setQAItems] = useState<QAKnowledge[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedQA, setSelectedQA] = useState<QAKnowledge | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [qaToDelete, setQAToDelete] = useState<QAKnowledge | null>(null);

  useEffect(() => {
    loadQAItems();
  }, [chatbotId, currentPage, searchQuery]);

  const loadQAItems = async () => {
    try {
      setLoading(true);
      const response = await getQAItems(
        chatbotId,
        currentPage,
        10,
        searchQuery
      );
      setQAItems(response.qaItems);
      setTotalPages(response.pagination.totalPages);
    } catch (error) {
      console.error("Error loading Q&A items:", error);
      toast({
        title: "Error",
        description: "Failed to load Q&A items",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    loadQAItems();
  };

  const handleViewDetails = (qa: QAKnowledge) => {
    setSelectedQA(qa);
    setShowDetailsDialog(true);
  };

  const handleEdit = (qa: QAKnowledge) => {
    setSelectedQA(qa);
    setShowEditDialog(true);
  };

  const handleCreate = () => {
    setShowCreateDialog(true);
  };

  const handleDeleteClick = (qa: QAKnowledge) => {
    setQAToDelete(qa);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!qaToDelete) return;

    try {
      await deleteQA(chatbotId, qaToDelete._id);
      toast({
        title: "Success",
        description: "Q&A deleted successfully",
      });
      loadQAItems();
      onRefresh();
    } catch (error) {
      console.error("Error deleting Q&A:", error);
      toast({
        title: "Error",
        description: "Failed to delete Q&A",
        variant: "destructive",
      });
    } finally {
      setShowDeleteDialog(false);
      setQAToDelete(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getQAItemsCount = (qa: QAKnowledge) => {
    return qa.qaItems?.length || 0;
  };

  const getFirstQuestion = (qa: QAKnowledge) => {
    if (qa.qaItems && qa.qaItems.length > 0) {
      return qa.qaItems[0].question;
    }
    return "No questions";
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
              <HelpCircle className="h-5 w-5" />
              <span>Q&A Management</span>
            </div>
            <Button
              onClick={handleCreate}
              className="flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Add Q&A</span>
            </Button>
          </CardTitle>
          <CardDescription>
            Manage question and answer pairs and their processed chunks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search Q&A..."
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

      {/* Q&A Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          ) : qaItems.length === 0 ? (
            <div className="text-center py-8">
              <HelpCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No Q&A items found</p>
              <Button onClick={handleCreate} className="mt-4">
                Add Your First Q&A
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>First Question</TableHead>
                  <TableHead>Q&A Count</TableHead>
                  <TableHead>Chunks</TableHead>
                  <TableHead>Advanced Processing</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {qaItems.map((qa) => (
                  <TableRow key={qa._id}>
                    <TableCell>
                      <div className="font-medium">{qa.title}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-600 max-w-xs">
                        {truncateText(getFirstQuestion(qa), 80)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {getQAItemsCount(qa)} pairs
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Layers className="h-4 w-4 text-gray-400" />
                        <span>{qa.chunkCount}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {qa.hasAdvancedProcessing ? (
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
                      <Badge variant={qa.isActive ? "default" : "secondary"}>
                        {qa.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(qa.createdAt)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleViewDetails(qa)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(qa)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteClick(qa)}
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Q&A</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{qaToDelete?.title}"? This will
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
