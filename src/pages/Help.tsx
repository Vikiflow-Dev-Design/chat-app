import { Link } from "react-router-dom";
import { Bot, ArrowLeft, Mail, MessageCircle, FileQuestion } from "lucide-react";
import { UserButton } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const Help = () => {
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
              className="text-sm font-medium text-primary"
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
          <h1 className="text-3xl font-bold mb-6">Help & Support</h1>
          <p className="text-lg text-muted-foreground mb-8">
            Need help with ChatBot Agency? We're here to assist you. Choose from the options below to get the support you need.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileQuestion className="h-5 w-5 mr-2 text-primary" />
                  FAQs
                </CardTitle>
                <CardDescription>
                  Find answers to commonly asked questions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Browse our frequently asked questions to find quick answers to common issues and questions.
                </p>
                <Button variant="outline" className="w-full">
                  View FAQs
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Mail className="h-5 w-5 mr-2 text-primary" />
                  Email Support
                </CardTitle>
                <CardDescription>
                  Contact our support team via email
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Send us an email and our support team will get back to you within 24 hours.
                </p>
                <Button variant="outline" className="w-full">
                  Contact Support
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageCircle className="h-5 w-5 mr-2 text-primary" />
                  Live Chat
                </CardTitle>
                <CardDescription>
                  Chat with our support team in real-time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Get immediate assistance through our live chat support available during business hours.
                </p>
                <Button className="w-full">
                  Start Chat
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Help;
