import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useChatbots } from "@/context/ChatbotContext";
import { Trash2, Bot, MessageSquare, Users, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export function ChatbotManagementSection() {
  const {
    chatbots,
    loading,
    deleteChatbot,
    deleteChatbots,
    deleteAllChatbots,
  } = useChatbots();
  const [selectedChatbots, setSelectedChatbots] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);

  // Handle individual chatbot selection
  const handleChatbotSelect = (
    chatbotId: string,
    checked: boolean | "indeterminate"
  ) => {
    if (checked === true) {
      setSelectedChatbots((prev) => [...prev, chatbotId]);
    } else {
      setSelectedChatbots((prev) => prev.filter((id) => id !== chatbotId));
    }
  };

  // Handle select all
  const handleSelectAll = (checked: boolean | "indeterminate") => {
    if (checked === true) {
      setSelectedChatbots(chatbots.map((bot) => bot.id));
    } else {
      setSelectedChatbots([]);
    }
  };

  // Delete selected chatbots
  const handleDeleteSelected = async () => {
    if (selectedChatbots.length === 0) return;

    setIsDeleting(true);
    try {
      const result = await deleteChatbots(selectedChatbots);
      setSelectedChatbots([]);
    } catch (error) {
      console.error("Error deleting selected chatbots:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Delete all chatbots
  const handleDeleteAll = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteAllChatbots();
      setSelectedChatbots([]);
    } catch (error) {
      console.error("Error deleting all chatbots:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Delete single chatbot
  const handleDeleteSingle = async (chatbotId: string) => {
    setIsDeleting(true);
    try {
      await deleteChatbot(chatbotId);
      setSelectedChatbots((prev) => prev.filter((id) => id !== chatbotId));
    } catch (error) {
      console.error("Error deleting chatbot:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Chatbot Management</CardTitle>
          <CardDescription>Loading chatbots...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          Chatbot Management
        </CardTitle>
        <CardDescription>
          Manage your chatbots. You can delete individual chatbots, multiple
          selected chatbots, or all chatbots at once.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {chatbots.length === 0 ? (
          <div className="text-center py-8">
            <Bot className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No chatbots found</p>
            <p className="text-sm text-muted-foreground mt-1">
              Create your first chatbot to get started
            </p>
          </div>
        ) : (
          <>
            {/* Bulk Actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="select-all"
                    checked={
                      selectedChatbots.length === chatbots.length
                        ? true
                        : selectedChatbots.length > 0
                        ? "indeterminate"
                        : false
                    }
                    onCheckedChange={handleSelectAll}
                  />
                  <label htmlFor="select-all" className="text-sm font-medium">
                    Select All ({chatbots.length})
                  </label>
                </div>
                {selectedChatbots.length > 0 && (
                  <Badge variant="secondary">
                    {selectedChatbots.length} selected
                  </Badge>
                )}
              </div>

              <div className="flex items-center space-x-2">
                {selectedChatbots.length > 0 && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={isDeleting}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Selected ({selectedChatbots.length})
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Delete Selected Chatbots
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete{" "}
                          {selectedChatbots.length} selected chatbot(s)? This
                          will permanently delete all associated data including
                          conversations, knowledge bases, and analytics. This
                          action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDeleteSelected}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete {selectedChatbots.length} Chatbots
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={isDeleting || chatbots.length === 0}
                    >
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Delete All
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete All Chatbots</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete ALL {chatbots.length}{" "}
                        chatbots? This will permanently delete all your chatbots
                        and their associated data including conversations,
                        knowledge bases, and analytics. This action cannot be
                        undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteAll}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete All {chatbots.length} Chatbots
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>

            <Separator />

            {/* Chatbots List */}
            <div className="space-y-4">
              {chatbots.map((chatbot) => (
                <div
                  key={chatbot.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <Checkbox
                      checked={selectedChatbots.includes(chatbot.id)}
                      onCheckedChange={(checked) =>
                        handleChatbotSelect(chatbot.id, checked)
                      }
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium">{chatbot.name}</h4>
                        {chatbot.isPublic && (
                          <Badge variant="outline" className="text-xs">
                            Public
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {chatbot.description || "No description"}
                      </p>
                      <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <MessageSquare className="h-3 w-3" />
                          <span>
                            {chatbot.stats?.totalMessages || 0} messages
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Users className="h-3 w-3" />
                          <span>{chatbot.stats?.activeUsers || 0} users</span>
                        </div>
                        <span>Created {formatDate(chatbot.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={isDeleting}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Chatbot</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{chatbot.name}"? This
                          will permanently delete all associated data including
                          conversations, knowledge bases, and analytics. This
                          action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteSingle(chatbot.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete Chatbot
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
