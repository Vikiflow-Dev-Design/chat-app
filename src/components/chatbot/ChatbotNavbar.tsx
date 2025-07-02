import { Bot } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { UserButton } from "@clerk/clerk-react";

export function ChatbotNavbar() {
  const location = useLocation();
  const path = location.pathname;
  const chatbotId = path.split("/")[2]; // Extract chatbot ID from URL

  return (
    <nav className="bg-white border-b">
      <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
        <Link to="/" className="flex items-center space-x-2">
          <Bot className="h-6 w-6 text-highlight" />
          <span className="font-bold text-xl">ChatBot Agency</span>
        </Link>
        <div className="flex items-center space-x-4">
          <Link
            to="/docs"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Docs
          </Link>
          <Link
            to="/help"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Help
          </Link>
          <Link
            to="/changelog"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Changelog
          </Link>
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>

      {/* Secondary Navigation */}
      <div className="border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex space-x-8">
            <Link
              to="/dashboard"
              className={`py-4 border-b-2 text-sm font-medium ${
                path === "/dashboard"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300"
              }`}
            >
              Agents
            </Link>
            <Link
              to="/usage"
              className={`py-4 border-b-2 text-sm font-medium ${
                path === "/usage"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300"
              }`}
            >
              Usage
            </Link>
            <Link
              to="/settings"
              className={`py-4 border-b-2 text-sm font-medium ${
                path === "/settings"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300"
              }`}
            >
              Settings
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
