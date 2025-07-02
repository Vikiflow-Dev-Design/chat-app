
import { Bot } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatMessageProps {
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
}

export function ChatMessage({ content, role, timestamp }: ChatMessageProps) {
  const isUser = role === "user";
  
  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div className="flex items-start space-x-2 max-w-[80%]">
        {!isUser && (
          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-highlight/10 text-highlight">
            <Bot className="h-5 w-5" />
          </div>
        )}
        
        <div className="flex flex-col">
          <div
            className={cn(
              "p-3 rounded-lg",
              isUser
                ? "bg-highlight/10 text-foreground"
                : "bg-secondary text-foreground"
            )}
          >
            <p className="text-sm whitespace-pre-wrap">{content}</p>
          </div>
          <span className="text-xs text-muted-foreground mt-1 self-start">
            {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </div>
  );
}
