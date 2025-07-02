import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Conversation,
  conversationService,
} from "@/services/conversationService";
import { toast } from "sonner";
import { Trash2, Eye } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { formatDistanceToNow } from "date-fns";

interface ChatbotConversationsListProps {
  conversations: Conversation[];
  onDelete: (sessionId: string) => void;
}

export function ChatbotConversationsList({
  conversations,
  onDelete,
}: ChatbotConversationsListProps) {
  const [selectedConversation, setSelectedConversation] = useState<
    string | null
  >(null);
  const [conversationDetails, setConversationDetails] = useState<any | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);

  const handleViewConversation = async (sessionId: string) => {
    try {
      setIsLoading(true);
      setSelectedConversation(sessionId);
      const details = await conversationService.getConversationDetails(
        sessionId
      );
      setConversationDetails(details);
    } catch (error) {
      console.error("Error fetching conversation details:", error);
      toast.error("Failed to load conversation details");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseDialog = () => {
    setSelectedConversation(null);
    setConversationDetails(null);
  };

  const handleDeleteConversation = async (sessionId: string) => {
    if (
      confirm(
        "Are you sure you want to delete this conversation? This action cannot be undone."
      )
    ) {
      try {
        await conversationService.deleteConversation(sessionId);
        onDelete(sessionId);
        toast.success("Conversation deleted successfully");
      } catch (error) {
        console.error("Error deleting conversation:", error);
        toast.error("Failed to delete conversation");
      }
    }
  };

  const formatDate = (date: Date) => {
    return formatDistanceToNow(date, { addSuffix: true });
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Recent Conversations</CardTitle>
          <CardDescription>
            Review recent chat history and user interactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {conversations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No conversations found for this chatbot.
            </div>
          ) : (
            <div className="border rounded-md divide-y">
              {conversations.map((conversation) => (
                <div
                  key={conversation._id}
                  className="p-4 hover:bg-secondary/20"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">
                        {conversation.userInfo?.name ||
                          conversation.userId ||
                          "Anonymous User"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {conversation.userInfo?.email && (
                          <span className="mr-2">
                            {conversation.userInfo.email}
                          </span>
                        )}
                        {formatDate(conversation.startedAt)}
                      </p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-sm text-muted-foreground">
                        {conversation.messageCount} messages
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleViewConversation(conversation.sessionId)
                        }
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View Conversation
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          handleDeleteConversation(conversation.sessionId)
                        }
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedConversation} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Conversation Details</DialogTitle>
            <DialogDescription>
              {conversationDetails && (
                <div className="space-y-1 mt-1">
                  <div>
                    <span className="font-medium">User: </span>
                    {conversationDetails.userInfo?.name ||
                      conversationDetails.userId ||
                      "Anonymous User"}
                  </div>
                  {conversationDetails.userInfo?.email && (
                    <div>
                      <span className="font-medium">Email: </span>
                      {conversationDetails.userInfo.email}
                    </div>
                  )}
                  {conversationDetails.userInfo?.phone && (
                    <div>
                      <span className="font-medium">Phone: </span>
                      {conversationDetails.userInfo.phone}
                    </div>
                  )}
                  <div>
                    <span className="font-medium">Started: </span>
                    {formatDate(conversationDetails.startedAt)}
                  </div>
                  {conversationDetails.endedAt && (
                    <div>
                      <span className="font-medium">Ended: </span>
                      {formatDate(conversationDetails.endedAt)}
                    </div>
                  )}
                </div>
              )}
            </DialogDescription>
          </DialogHeader>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin h-8 w-8 border-4 border-primary/20 border-l-primary rounded-full"></div>
            </div>
          ) : (
            conversationDetails && (
              <div className="space-y-4 py-4">
                {conversationDetails.messages.map(
                  (message: any, index: number) => (
                    <div
                      key={message._id || index}
                      className={`flex ${
                        message.role === "user"
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[80%] p-3 rounded-lg ${
                          message.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        <p>{message.content}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  )
                )}
              </div>
            )
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
