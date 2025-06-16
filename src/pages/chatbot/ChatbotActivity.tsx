import { useParams } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useChatbots } from "@/context/ChatbotContext";
import { useEffect, useState } from "react";
import { Chatbot } from "@/types/chatbot";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import {
  Search,
  MessageSquare,
  User,
  Calendar,
  Mail,
  Phone,
  ArrowUpDown,
  Loader2,
  Eye,
  Trash2,
  AlertCircle,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import {
  Conversation,
  ConversationDetails,
  conversationService,
} from "@/services/conversationService";

const ChatbotActivity = () => {
  const { id } = useParams();
  const { getChatbot } = useChatbots();
  const [chatbot, setChatbot] = useState<Chatbot | null>(null);
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<
    Conversation[]
  >([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<"startedAt" | "messageCount">(
    "startedAt"
  );
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const [conversationMessages, setConversationMessages] = useState<Message[]>(
    []
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(false);

  const itemsPerPage = 10;

  useEffect(() => {
    const loadChatbot = async () => {
      if (id) {
        try {
          setLoading(true);
          const fetchedBot = await getChatbot(id);
          if (fetchedBot) {
            setChatbot(fetchedBot);
            await loadConversations(id);
          }
        } catch (error) {
          console.error("Error loading chatbot:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    loadChatbot();
  }, [id, getChatbot]);

  const { toast } = useToast();

  const loadConversations = async (chatbotId: string) => {
    try {
      setLoadingConversations(true);
      const data = await conversationService.getConversations(chatbotId);
      setConversations(data);
      setFilteredConversations(data);
    } catch (error) {
      console.error("Error loading conversations:", error);
      toast({
        title: "Error loading conversations",
        description: "Failed to load conversation data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingConversations(false);
    }
  };

  const loadConversationMessages = async (sessionId: string) => {
    try {
      setLoadingMessages(true);
      const data = await conversationService.getConversationDetails(sessionId);
      setConversationMessages(data.messages);
    } catch (error) {
      console.error("Error loading conversation messages:", error);
      toast({
        title: "Error loading conversation",
        description: "Failed to load conversation details. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleDeleteConversation = async (sessionId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this conversation? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      await conversationService.deleteConversation(sessionId);

      // Remove the conversation from the list
      const updatedConversations = conversations.filter(
        (conv) => conv.sessionId !== sessionId
      );
      setConversations(updatedConversations);

      // Close the dialog if it's open
      if (isDialogOpen && selectedConversation?.sessionId === sessionId) {
        setIsDialogOpen(false);
      }

      toast({
        title: "Conversation deleted",
        description: "The conversation has been successfully deleted.",
      });
    } catch (error) {
      console.error("Error deleting conversation:", error);
      toast({
        title: "Error deleting conversation",
        description: "Failed to delete the conversation. Please try again.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    // Apply filtering and sorting
    let filtered = [...conversations];

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (conv) =>
          conv.userInfo?.name?.toLowerCase().includes(term) ||
          conv.userInfo?.email?.toLowerCase().includes(term) ||
          conv.lastMessage?.toLowerCase().includes(term)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      if (sortField === "startedAt") {
        return sortDirection === "asc"
          ? a.startedAt.getTime() - b.startedAt.getTime()
          : b.startedAt.getTime() - a.startedAt.getTime();
      } else {
        return sortDirection === "asc"
          ? a.messageCount - b.messageCount
          : b.messageCount - a.messageCount;
      }
    });

    setFilteredConversations(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [conversations, searchTerm, sortField, sortDirection]);

  const handleViewConversation = async (conversation: Conversation) => {
    setSelectedConversation(conversation);
    await loadConversationMessages(conversation.sessionId);
    setIsDialogOpen(true);
  };

  const toggleSortDirection = () => {
    setSortDirection(sortDirection === "asc" ? "desc" : "asc");
  };

  const changeSortField = (field: "startedAt" | "messageCount") => {
    if (sortField === field) {
      toggleSortDirection();
    } else {
      setSortField(field);
      setSortDirection("desc"); // Default to descending when changing fields
    }
  };

  // Calculate pagination
  const totalPages = Math.ceil(filteredConversations.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedConversations = filteredConversations.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    return (
      <Pagination className="mt-4">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            />
          </PaginationItem>

          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            // Show current page and surrounding pages
            let pageToShow: number;
            if (totalPages <= 5) {
              pageToShow = i + 1;
            } else if (currentPage <= 3) {
              pageToShow = i + 1;
            } else if (currentPage >= totalPages - 2) {
              pageToShow = totalPages - 4 + i;
            } else {
              pageToShow = currentPage - 2 + i;
            }

            return (
              <PaginationItem key={pageToShow}>
                <PaginationLink
                  isActive={currentPage === pageToShow}
                  onClick={() => setCurrentPage(pageToShow)}
                >
                  {pageToShow}
                </PaginationLink>
              </PaginationItem>
            );
          })}

          <PaginationItem>
            <PaginationNext
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="inline-block animate-spin h-8 w-8 border-4 border-primary/20 border-l-primary rounded-full"></div>
      </div>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle>Conversations</CardTitle>
            <CardDescription>
              View all conversations with your chatbot
            </CardDescription>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search conversations..."
                className="pl-8 w-full sm:w-[250px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <Select
              value={`${sortField}-${sortDirection}`}
              onValueChange={(value) => {
                const [field, direction] = value.split("-") as [
                  "startedAt" | "messageCount",
                  "asc" | "desc"
                ];
                setSortField(field);
                setSortDirection(direction);
              }}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="startedAt-desc">Newest first</SelectItem>
                <SelectItem value="startedAt-asc">Oldest first</SelectItem>
                <SelectItem value="messageCount-desc">Most messages</SelectItem>
                <SelectItem value="messageCount-asc">
                  Fewest messages
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent>
          {loadingConversations ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-4 p-4 border rounded-md"
                >
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[150px]" />
                  </div>
                  <Skeleton className="h-10 w-[100px]" />
                </div>
              ))}
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">
                No conversations found
              </h3>
              <p className="text-muted-foreground">
                {searchTerm
                  ? "Try adjusting your search terms"
                  : "Your chatbot hasn't had any conversations yet"}
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>
                        <button
                          className="flex items-center gap-1"
                          onClick={() => changeSortField("startedAt")}
                        >
                          Date
                          <ArrowUpDown className="h-3.5 w-3.5" />
                        </button>
                      </TableHead>
                      <TableHead>
                        <button
                          className="flex items-center gap-1"
                          onClick={() => changeSortField("messageCount")}
                        >
                          Messages
                          <ArrowUpDown className="h-3.5 w-3.5" />
                        </button>
                      </TableHead>
                      <TableHead>Last Message</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedConversations.map((conversation) => (
                      <TableRow key={conversation._id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {conversation.userInfo?.name || "Anonymous User"}
                            </span>
                            {conversation.userInfo?.email && (
                              <span className="text-xs text-muted-foreground">
                                {conversation.userInfo.email}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span>
                              {format(conversation.startedAt, "MMM d, yyyy")}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {format(conversation.startedAt, "h:mm a")}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{conversation.messageCount}</TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {conversation.lastMessage || "No messages"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              conversation.endedAt ? "outline" : "secondary"
                            }
                          >
                            {conversation.endedAt ? "Completed" : "Active"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleViewConversation(conversation)
                              }
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteConversation(
                                  conversation.sessionId
                                );
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-2 text-destructive" />
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {renderPagination()}
            </>
          )}
        </CardContent>
      </Card>

      {/* Conversation Detail Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl h-[80vh] flex flex-col">
          <DialogHeader>
            <div className="flex justify-between items-start">
              <div>
                <DialogTitle>Conversation Details</DialogTitle>
                <DialogDescription>
                  {selectedConversation && (
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-2">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {selectedConversation.userInfo?.name ||
                            "Anonymous User"}
                        </span>
                      </div>

                      {selectedConversation.userInfo?.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span>{selectedConversation.userInfo.email}</span>
                        </div>
                      )}

                      {selectedConversation.userInfo?.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span>{selectedConversation.userInfo.phone}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {format(
                            selectedConversation.startedAt,
                            "MMM d, yyyy h:mm a"
                          )}
                        </span>
                      </div>
                    </div>
                  )}
                </DialogDescription>
              </div>

              {selectedConversation && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:bg-destructive/10"
                  onClick={() => {
                    handleDeleteConversation(selectedConversation.sessionId);
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Conversation
                </Button>
              )}
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-hidden mt-4">
            {loadingMessages ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <ScrollArea className="h-full pr-4">
                <div className="space-y-6">
                  {/* Group messages by conversation turns */}
                  {conversationMessages.length === 0 ? (
                    <div className="text-center py-12">
                      <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">
                        No messages found
                      </h3>
                      <p className="text-muted-foreground">
                        This conversation doesn't contain any messages
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Group messages by time proximity (5 seconds) to handle potential duplicates */}
                      {(() => {
                        // Sort messages by timestamp to ensure correct order
                        const sortedMessages = [...conversationMessages].sort(
                          (a, b) =>
                            a.timestamp.getTime() - b.timestamp.getTime()
                        );

                        // Group messages by conversation turns
                        const messageGroups: Array<{
                          role: "user" | "assistant";
                          messages: typeof conversationMessages;
                          timestamp: Date;
                        }> = [];

                        sortedMessages.forEach((message) => {
                          // Check if this message should be part of the previous group
                          const lastGroup =
                            messageGroups[messageGroups.length - 1];

                          const shouldCreateNewGroup =
                            !lastGroup ||
                            lastGroup.role !== message.role ||
                            // If more than 5 seconds apart, create a new group
                            message.timestamp.getTime() -
                              lastGroup.timestamp.getTime() >
                              5000;

                          if (shouldCreateNewGroup) {
                            messageGroups.push({
                              role: message.role,
                              messages: [message],
                              timestamp: message.timestamp,
                            });
                          } else {
                            // Add to existing group
                            lastGroup.messages.push(message);
                            // Update timestamp to the latest one
                            if (message.timestamp > lastGroup.timestamp) {
                              lastGroup.timestamp = message.timestamp;
                            }
                          }
                        });

                        return messageGroups.map((group, groupIndex) => (
                          <div key={groupIndex} className="message-group">
                            <div
                              className={`flex ${
                                group.role === "user"
                                  ? "justify-end"
                                  : "justify-start"
                              }`}
                            >
                              {/* Avatar for assistant messages */}
                              {group.role === "assistant" && (
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-2 mt-1">
                                  <MessageSquare className="h-4 w-4 text-primary" />
                                </div>
                              )}

                              <div className="flex flex-col max-w-[75%]">
                                {/* Role label */}
                                <div
                                  className={`text-xs mb-1 ${
                                    group.role === "user"
                                      ? "text-right"
                                      : "text-left"
                                  }`}
                                >
                                  {group.role === "user" ? "User" : "Chatbot"}
                                </div>

                                {/* Message bubbles */}
                                <div className="space-y-1">
                                  {group.messages.map(
                                    (message, messageIndex) => (
                                      <div
                                        key={message._id}
                                        className={`rounded-lg p-3 ${
                                          message.role === "user"
                                            ? "bg-primary text-primary-foreground"
                                            : "bg-muted"
                                        }`}
                                      >
                                        <div className="text-sm whitespace-pre-wrap">
                                          {message.content}
                                        </div>
                                      </div>
                                    )
                                  )}
                                </div>

                                {/* Timestamp */}
                                <div
                                  className={`text-xs mt-1 text-muted-foreground ${
                                    group.role === "user"
                                      ? "text-right"
                                      : "text-left"
                                  }`}
                                >
                                  {format(group.timestamp, "MMM d, h:mm a")}
                                </div>
                              </div>

                              {/* Avatar for user messages */}
                              {group.role === "user" && (
                                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center ml-2 mt-1">
                                  <User className="h-4 w-4 text-primary" />
                                </div>
                              )}
                            </div>
                          </div>
                        ));
                      })()}

                      <div className="flex items-center justify-center mt-6 mb-2">
                        <Badge variant="outline" className="text-xs">
                          {conversationMessages.length} message
                          {conversationMessages.length !== 1 ? "s" : ""}
                        </Badge>
                      </div>
                    </>
                  )}
                </div>
              </ScrollArea>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
};

export default ChatbotActivity;
