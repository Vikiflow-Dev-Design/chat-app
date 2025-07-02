import { Link } from "react-router-dom";
import { Bot, ArrowLeft } from "lucide-react";
import { UserButton } from "@clerk/clerk-react";

const Docs = () => {
  return (
    <div className="min-h-screen bg-secondary/30">
      {/* Navbar */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <Link to="/" className="flex items-center space-x-2">
            <Bot className="h-6 w-6 text-highlight" />
            <span className="font-bold text-xl">ChatBot Agency</span>
          </Link>
          <div className="flex items-center space-x-4">
            <Link
              to="/docs"
              className="text-sm font-medium text-primary"
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
            <UserButton signInUrl="/" />
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <Link
            to="/dashboard"
            className="flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
        </div>

        <div className="bg-white rounded-lg p-8 shadow-sm">
          <h1 className="text-3xl font-bold mb-6">Documentation</h1>
          <p className="text-lg text-muted-foreground mb-4">
            Welcome to the ChatBot Agency documentation. Here you'll find comprehensive guides and documentation to help you start working with our platform as quickly as possible.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            <div className="border rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-2">Getting Started</h2>
              <p className="text-muted-foreground mb-4">
                Learn the basics of ChatBot Agency and how to create your first chatbot.
              </p>
              <ul className="space-y-2 text-blue-600">
                <li>
                  <a href="#" className="hover:underline">Quick Start Guide</a>
                </li>
                <li>
                  <a href="#" className="hover:underline">Creating Your First Chatbot</a>
                </li>
                <li>
                  <a href="#" className="hover:underline">Understanding the Dashboard</a>
                </li>
              </ul>
            </div>

            <div className="border rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-2">Advanced Features</h2>
              <p className="text-muted-foreground mb-4">
                Dive deeper into advanced features and customization options.
              </p>
              <ul className="space-y-2 text-blue-600">
                <li>
                  <a href="#" className="hover:underline">Knowledge Base Integration</a>
                </li>
                <li>
                  <a href="#" className="hover:underline">Custom Prompts and Behaviors</a>
                </li>
                <li>
                  <a href="#" className="hover:underline">API Integration</a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Docs;
