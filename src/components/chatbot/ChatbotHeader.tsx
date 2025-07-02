
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Settings, Share2, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import type { Chatbot } from "@/types/chatbot";

interface ChatbotHeaderProps {
  chatbot: Chatbot;
  onDelete: () => Promise<void>;
}

export function ChatbotHeader({ chatbot, onDelete }: ChatbotHeaderProps) {
  return (
    <header className="max-w-7xl mx-auto px-4 pb-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">{chatbot.name}</h1>
          <p className="text-muted-foreground mt-1">{chatbot.description || "No description provided"}</p>
        </div>
        <div className="flex space-x-3 mt-4 md:mt-0">
          <Button variant="outline" asChild>
            <Link to={`/chat/${chatbot.id}`}>
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Link>
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="icon">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Chatbot</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this chatbot? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button asChild>
            <Link to={`/chatbot/${chatbot.id}/studio`}>
              <Settings className="h-4 w-4 mr-2" />
              Configure
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
