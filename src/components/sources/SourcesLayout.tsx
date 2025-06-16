import { ReactNode } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  FileText,
  Globe,
  MessageSquare,
  Database,
  Table,
  ShoppingCart,
} from "lucide-react";
import { SourcesSummary } from "./SourcesSummary";

interface SourcesLayoutProps {
  children: ReactNode;
  sourcesSummary: {
    text: { count: number; size: string };
    links: { count: number; size: string };
    qa: { count: number; size: string };
    mongodb: { count: number; size: string };
    sheets: { count: number; size: string };
    totalSize: string;
    quota: string;
  };
  needsRetraining?: boolean;
  onRetrain?: () => void;
}

export function SourcesLayout({
  children,
  sourcesSummary,
  needsRetraining = false,
  onRetrain,
}: SourcesLayoutProps) {
  const location = useLocation();
  const basePath = location.pathname.split("/sources")[0];

  const navItems = [
    {
      name: "Files",
      path: `${basePath}/sources/file`,
      icon: <FileText className="h-5 w-5" />,
    },
    {
      name: "Text",
      path: `${basePath}/sources/text`,
      icon: <FileText className="h-5 w-5" />,
    },
    {
      name: "Website",
      path: `${basePath}/sources/website`,
      icon: <Globe className="h-5 w-5" />,
    },
    {
      name: "Q&A",
      path: `${basePath}/sources/qa`,
      icon: <MessageSquare className="h-5 w-5" />,
    },
    {
      name: "MongoDB",
      path: `${basePath}/sources/mongodb`,
      icon: <Database className="h-5 w-5" />,
    },
    {
      name: "Google Sheets",
      path: `${basePath}/sources/sheets`,
      icon: <Table className="h-5 w-5" />,
    },
    {
      name: "Notion",
      path: `${basePath}/sources/notion`,
      icon: <FileText className="h-5 w-5" />,
    },
    {
      name: "Products",
      path: `${basePath}/sources/products`,
      icon: <ShoppingCart className="h-5 w-5" />,
    },
  ];

  return (
    <div className="flex flex-col lg:flex-row gap-6 max-w-7xl mx-auto px-4 py-6">
      {/* Left sidebar with navigation */}
      <div className="w-full lg:w-64 shrink-0">
        <h1 className="text-2xl font-bold mb-4 text-gray-800">Sources</h1>
        <div className="bg-white rounded-lg shadow-sm border border-gray-100">
          <nav className="flex flex-row lg:flex-col items-stretch h-auto p-0 bg-transparent overflow-x-auto lg:overflow-visible">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-2 justify-start px-4 py-3 ${
                    isActive
                      ? "bg-primary/5 text-primary font-medium border-b-2 lg:border-b-0 lg:border-l-2 border-primary"
                      : "border-b-2 lg:border-b-0 lg:border-l-2 border-transparent"
                  } rounded-none transition-all`
                }
              >
                {item.icon}
                <span className="hidden sm:inline">{item.name}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Sources Summary */}
        <div className="mt-6">
          <SourcesSummary
            summary={sourcesSummary}
            onRetrain={onRetrain}
            needsRetraining={needsRetraining}
          />
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
}
