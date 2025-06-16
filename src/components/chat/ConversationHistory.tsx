import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquarePlus } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export interface Conversation {
  id: string;
  sessionId: string;
  title: string;
  lastMessage: string;
  lastMessageAt: Date;
  messageCount: number;
}

interface ConversationHistoryProps {
  chatbotId: string;
  visitorId: string;
  onSelectConversation: (sessionId: string) => void;
  onNewConversation: () => void;
  activeSessionId?: string;
}

export function ConversationHistory({
  chatbotId,
  visitorId,
  onSelectConversation,
  onNewConversation,
  activeSessionId,
}: ConversationHistoryProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadConversations = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `${
            import.meta.env.VITE_API_URL
          }/chat/visitor-conversations?visitorId=${visitorId}&chatbotId=${chatbotId}`
        );

        if (!response.ok) {
          throw new Error(`Failed to load conversations: ${response.status}`);
        }

        const data = await response.json();

        // Transform the data to match our Conversation interface
        const formattedConversations = data.map((conv: any) => ({
          id: conv.id,
          sessionId: conv.sessionId,
          title: conv.title || "New Conversation",
          lastMessage: conv.lastMessage || "",
          lastMessageAt: new Date(conv.lastMessageAt),
          messageCount: conv.messageCount || 0,
        }));

        setConversations(formattedConversations);
        setError(null);
      } catch (err) {
        console.error("Failed to load conversations:", err);
        setError("Failed to load conversation history");
      } finally {
        setLoading(false);
      }
    };

    loadConversations();
  }, [chatbotId, visitorId]);

  if (loading) {
    return (
      <div className="space-y-4 p-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex flex-col space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center">
        <p className="text-destructive">{error}</p>
        <Button variant="outline" className="mt-2" onClick={onNewConversation}>
          Start New Conversation
        </Button>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="p-4 text-center">
        <p className="text-muted-foreground">No conversation history found.</p>
        <Button variant="outline" className="mt-2" onClick={onNewConversation}>
          Start New Conversation
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-2 p-4">
          {conversations.map((conversation) => (
            <div
              key={conversation.id}
              className={`p-3 rounded-md cursor-pointer transition-colors ${
                activeSessionId === conversation.sessionId
                  ? "bg-primary/10 border border-primary/20"
                  : "hover:bg-muted"
              }`}
              onClick={() => onSelectConversation(conversation.sessionId)}
            >
              <div className="flex justify-between items-start">
                <h3 className="font-medium truncate">{conversation.title}</h3>
                <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                  {formatDistanceToNow(new Date(conversation.lastMessageAt), {
                    addSuffix: true,
                  })}
                </span>
              </div>
              <p className="text-sm text-muted-foreground truncate mt-1">
                {conversation.lastMessage}
              </p>
              <div className="text-xs text-muted-foreground mt-1">
                {conversation.messageCount} messages
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 border-t">
        <Button className="w-full" onClick={onNewConversation}>
          <MessageSquarePlus className="h-4 w-4 mr-2" />
          New conversation
        </Button>
      </div>
    </div>
  );
}
