
import { Bot } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { UserButton } from "@clerk/clerk-react";
import { NewChatbotForm } from "@/components/NewChatbotForm";

const NewChatbot = () => {
  return (
    <div className="min-h-screen bg-secondary/30">
      <nav className="bg-white border-b px-4 py-3">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Bot className="h-6 w-6 text-highlight" />
            <span className="font-bold text-xl">ChatBot Agency</span>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" asChild>
              <Link to="/dashboard">Back to Dashboard</Link>
            </Button>
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Create New Chatbot</h1>
          <p className="text-muted-foreground mt-1">
            Configure your AI chatbot's behavior and appearance
          </p>
        </div>

        <NewChatbotForm />
      </main>
    </div>
  );
};

export default NewChatbot;
