import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import type { Chatbot } from "@/types/chatbot";
import { Bot, MessageSquare, Users } from "lucide-react";

interface ChatbotCardProps {
  chatbot: Chatbot;
  teamSlug: string;
}

export function ChatbotCard({ chatbot, teamSlug }: ChatbotCardProps) {
  const formatDate = (date: Date) => {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === now.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    }
  };

  // Ensure the date is correctly handled
  const updatedAt =
    chatbot.updatedAt instanceof Date
      ? chatbot.updatedAt
      : new Date(chatbot.updatedAt);

  return (
    <Card className="bg-white hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex justify-between">
          <div>
            <CardTitle>{chatbot.name}</CardTitle>
            <CardDescription>
              Last updated: {formatDate(updatedAt)}
            </CardDescription>
          </div>
          <div className="p-2 bg-secondary/30 rounded-full">
            <Bot className="h-5 w-5 text-primary/80" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
          {chatbot.description || "No description provided"}
        </p>

        <div className="flex space-x-4 text-sm text-muted-foreground">
          <div className="flex items-center">
            <MessageSquare className="h-4 w-4 mr-1" />
            <span>{(chatbot.stats?.totalMessages || 0).toLocaleString()}</span>
          </div>
          <div className="flex items-center">
            <Users className="h-4 w-4 mr-1" />
            <span>{chatbot.stats?.activeUsers || 0}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" size="sm" asChild>
          <Link to={`/chat/${chatbot.id}`}>Public Link</Link>
        </Button>
        <Button size="sm" asChild>
          <Link to={`/dashboard/${teamSlug}/chatbot/${chatbot.id}`}>
            Manage
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
