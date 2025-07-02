import { Link } from "react-router-dom";
import { Bot, ArrowLeft, Calendar } from "lucide-react";
import { UserButton } from "@clerk/clerk-react";
import { Separator } from "@/components/ui/separator";

const Changelog = () => {
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
              className="text-sm font-medium text-primary"
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
          <h1 className="text-3xl font-bold mb-6">Changelog</h1>
          <p className="text-lg text-muted-foreground mb-8">
            Stay up to date with the latest features, improvements, and bug fixes.
          </p>

          <div className="space-y-12">
            {/* Release Entry */}
            <div>
              <div className="flex items-center mb-4">
                <div className="bg-primary/10 text-primary rounded-full px-3 py-1 text-sm font-medium">
                  v1.2.0
                </div>
                <div className="ml-4 flex items-center text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4 mr-1" />
                  May 15, 2023
                </div>
              </div>
              
              <h2 className="text-xl font-bold mb-4">Knowledge Base Integration</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-md font-semibold text-primary mb-2">New Features</h3>
                  <ul className="space-y-2 pl-5 list-disc text-muted-foreground">
                    <li>Added Knowledge Base integration for chatbots</li>
                    <li>Document upload and processing capabilities</li>
                    <li>Automatic information extraction from documents</li>
                    <li>Knowledge linking between documents</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-md font-semibold text-primary mb-2">Improvements</h3>
                  <ul className="space-y-2 pl-5 list-disc text-muted-foreground">
                    <li>Enhanced chatbot response accuracy</li>
                    <li>Improved conversation history UI</li>
                    <li>Better mobile responsiveness</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-md font-semibold text-primary mb-2">Bug Fixes</h3>
                  <ul className="space-y-2 pl-5 list-disc text-muted-foreground">
                    <li>Fixed issue with conversation history not loading properly</li>
                    <li>Resolved authentication token refresh problems</li>
                    <li>Fixed styling issues in Safari browser</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <Separator />
            
            {/* Release Entry */}
            <div>
              <div className="flex items-center mb-4">
                <div className="bg-primary/10 text-primary rounded-full px-3 py-1 text-sm font-medium">
                  v1.1.0
                </div>
                <div className="ml-4 flex items-center text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4 mr-1" />
                  April 2, 2023
                </div>
              </div>
              
              <h2 className="text-xl font-bold mb-4">Conversation History & User Management</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-md font-semibold text-primary mb-2">New Features</h3>
                  <ul className="space-y-2 pl-5 list-disc text-muted-foreground">
                    <li>Added conversation history for chatbots</li>
                    <li>Implemented user identification and tracking</li>
                    <li>Added ability to view individual conversations</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-md font-semibold text-primary mb-2">Improvements</h3>
                  <ul className="space-y-2 pl-5 list-disc text-muted-foreground">
                    <li>Enhanced chatbot configuration options</li>
                    <li>Improved dashboard analytics</li>
                    <li>Better error handling and user feedback</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <Separator />
            
            {/* Release Entry */}
            <div>
              <div className="flex items-center mb-4">
                <div className="bg-primary/10 text-primary rounded-full px-3 py-1 text-sm font-medium">
                  v1.0.0
                </div>
                <div className="ml-4 flex items-center text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4 mr-1" />
                  March 1, 2023
                </div>
              </div>
              
              <h2 className="text-xl font-bold mb-4">Initial Release</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-md font-semibold text-primary mb-2">Features</h3>
                  <ul className="space-y-2 pl-5 list-disc text-muted-foreground">
                    <li>Create and manage AI-powered chatbots</li>
                    <li>Customize chatbot behavior and appearance</li>
                    <li>Deploy chatbots on websites</li>
                    <li>Basic analytics and reporting</li>
                    <li>User authentication and account management</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Changelog;
