import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/clerk-react";
import { ChatbotProvider } from "./context/ChatbotContext";
import { AgentTemplateProvider } from "./context/AgentTemplateContext";

// Pages
import Home from "./pages/Home";
import About from "./pages/About";
import Dashboard from "./pages/Dashboard";

import ChatbotStudio from "./pages/ChatbotStudio";
import ChatInterface from "./pages/ChatInterface";
import NotFound from "./pages/NotFound";
import NewChatbot from "./pages/NewChatbot";
import GeneralSettings from "./pages/settings/GeneralSettings";
import MembersSettings from "./pages/settings/MembersSettings";
import PlansSettings from "./pages/settings/PlansSettings";
import BillingSettings from "./pages/settings/BillingSettings";
import Docs from "./pages/Docs";
import Help from "./pages/Help";
import Usage from "./pages/Usage";
import Changelog from "./pages/Changelog";

// Components
import DashboardLayout from "./components/layouts/DashboardLayout";
import ChatbotPageLayout from "./components/layouts/ChatbotPageLayout";
import RedirectToDashboard from "./components/RedirectToDashboard";

// Chatbot Pages
import ChatbotPlayground from "./pages/chatbot/ChatbotPlayground";
import ChatbotActivity from "./pages/chatbot/ChatbotActivity";
import ChatbotAnalytics from "./pages/chatbot/ChatbotAnalytics";
import ChatbotActions from "./pages/chatbot/ChatbotActions";
import ChatbotContacts from "./pages/chatbot/ChatbotContacts";
import ChatbotConnect from "./pages/chatbot/ChatbotConnect";
import ChatbotSettings from "./pages/chatbot/ChatbotSettings";

// Sources Pages
import SourcesIndexPage from "./pages/sources/SourcesIndexPage";
import FileSourcesPage from "./pages/sources/FileSourcesPage";
import TextSourcesPage from "./pages/sources/TextSourcesPage";
import WebsiteSourcesPage from "./pages/sources/WebsiteSourcesPage";
import QASourcesPage from "./pages/sources/QASourcesPage";
import MongoDBSourcesPage from "./pages/sources/MongoDBSourcesPage";
import SheetsSourcesPage from "./pages/sources/SheetsSourcesPage";
import NotionSourcesPage from "./pages/sources/NotionSourcesPage";
import ProductsSourcesPage from "./pages/sources/ProductsSourcesPage";
import { KnowledgeManagementPage } from "./pages/KnowledgeManagementPage";
import { ChunkDetailsPage } from "./pages/ChunkDetailsPage";
import DocumentSuggestions from "./pages/DocumentSuggestions";

const queryClient = new QueryClient();

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <SignedIn>{children}</SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AgentTemplateProvider>
        <ChatbotProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/about" element={<About />} />
                <Route path="/chat/:chatbotId" element={<ChatInterface />} />
                <Route path="/docs" element={<Docs />} />
                <Route path="/help" element={<Help />} />
                <Route path="/changelog" element={<Changelog />} />

                {/* Protected Admin Routes */}
                <Route
                  path="/dashboard"
                  element={<Navigate to="/dashboard/redirect" replace />}
                />

                <Route
                  path="/dashboard/redirect"
                  element={
                    <ProtectedRoute>
                      <RedirectToDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* Dashboard Routes with Team Slug */}
                <Route
                  path="/dashboard/:teamSlug"
                  element={
                    <ProtectedRoute>
                      <DashboardLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route path="chatbots" element={<Dashboard />} />
                  <Route path="usage" element={<Usage />} />
                  <Route
                    path="settings"
                    element={<Navigate to="settings/general" replace />}
                  />
                  <Route
                    path="settings/general"
                    element={<GeneralSettings />}
                  />
                  <Route
                    path="settings/members"
                    element={<MembersSettings />}
                  />
                  <Route path="settings/plans" element={<PlansSettings />} />
                  <Route
                    path="settings/billing"
                    element={<BillingSettings />}
                  />
                  <Route path="chatbot/new" element={<NewChatbot />} />
                  <Route path="chatbot/:id" element={<ChatbotPageLayout />}>
                    <Route
                      index
                      element={<Navigate to="playground" replace />}
                    />
                    <Route path="playground" element={<ChatbotPlayground />} />
                    <Route path="activity" element={<ChatbotActivity />} />
                    <Route path="analytics" element={<ChatbotAnalytics />} />

                    {/* Sources Routes */}
                    <Route path="sources" element={<SourcesIndexPage />} />
                    <Route path="sources/file" element={<FileSourcesPage />} />
                    <Route path="sources/text" element={<TextSourcesPage />} />
                    <Route
                      path="sources/website"
                      element={<WebsiteSourcesPage />}
                    />
                    <Route path="sources/qa" element={<QASourcesPage />} />
                    <Route
                      path="sources/mongodb"
                      element={<MongoDBSourcesPage />}
                    />
                    <Route
                      path="sources/sheets"
                      element={<SheetsSourcesPage />}
                    />
                    <Route
                      path="sources/notion"
                      element={<NotionSourcesPage />}
                    />
                    <Route
                      path="sources/products"
                      element={<ProductsSourcesPage />}
                    />

                    <Route path="actions" element={<ChatbotActions />} />
                    <Route path="contacts" element={<ChatbotContacts />} />
                    <Route path="connect" element={<ChatbotConnect />} />
                    <Route path="settings" element={<ChatbotSettings />} />
                    <Route
                      path="knowledge-management"
                      element={<KnowledgeManagementPage />}
                    />
                    <Route
                      path="knowledge-management/suggestions/:documentId"
                      element={<DocumentSuggestions />}
                    />
                    <Route
                      path="chunk/:chunkId"
                      element={<ChunkDetailsPage />}
                    />
                    {/* Redirect products page to sources/products */}
                    <Route
                      path="products"
                      element={<Navigate to="sources/products" replace />}
                    />
                  </Route>
                  <Route
                    path="chatbot/:id/studio"
                    element={<ChatbotStudio />}
                  />
                </Route>

                {/* Legacy routes for backward compatibility */}
                <Route
                  path="/settings"
                  element={<Navigate to="/dashboard/redirect" replace />}
                />

                <Route
                  path="/usage"
                  element={<Navigate to="/dashboard/redirect" replace />}
                />

                <Route
                  path="/chatbot/new"
                  element={<Navigate to="/dashboard/redirect" replace />}
                />

                <Route
                  path="/chatbot/:id"
                  element={<Navigate to="/dashboard/redirect" replace />}
                />

                <Route
                  path="/chatbot/:id/studio"
                  element={<Navigate to="/dashboard/redirect" replace />}
                />

                {/* Redirect /admin to /dashboard */}
                <Route
                  path="/admin"
                  element={<Navigate to="/dashboard" replace />}
                />

                {/* Catch-all route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </ChatbotProvider>
      </AgentTemplateProvider>
    </QueryClientProvider>
  );
};

export default App;
