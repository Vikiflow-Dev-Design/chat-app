import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, ChevronRight, FileText, File } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface SelectableSourceItemProps {
  id: string;
  title: string;
  type: string;
  size?: string;
  isNew?: boolean;
  lastUpdated?: string;
  status?: string;
  optimizationInfo?: string;
  selected: boolean;
  onSelect: (id: string, selected: boolean) => void;
  onView?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function SelectableSourceItem({
  id,
  title,
  type,
  size,
  isNew = false,
  lastUpdated,
  status,
  optimizationInfo,
  selected,
  onSelect,
  onView,
  onEdit,
  onDelete,
}: SelectableSourceItemProps) {
  const getFileIcon = () => {
    switch (type.toLowerCase()) {
      case "pdf":
        return (
          <div className="w-8 h-10 flex-shrink-0 relative">
            <div className="absolute inset-0 bg-red-500 rounded-sm flex items-center justify-center">
              <span className="text-white text-[8px] font-bold">PDF</span>
            </div>
          </div>
        );
      case "txt":
        return (
          <div className="w-8 h-10 flex-shrink-0 relative">
            <div className="absolute inset-0 bg-purple-500 rounded-sm flex items-center justify-center">
              <span className="text-white text-[8px] font-bold">TXT</span>
            </div>
          </div>
        );
      case "doc":
      case "docx":
        return (
          <div className="w-8 h-10 flex-shrink-0 relative">
            <div className="absolute inset-0 bg-blue-500 rounded-sm flex items-center justify-center">
              <span className="text-white text-[8px] font-bold">DOC</span>
            </div>
          </div>
        );
      case "link":
        return (
          <div className="w-8 h-8 flex-shrink-0 bg-gray-100 rounded-full flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-gray-500"
            >
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
            </svg>
          </div>
        );
      case "text":
        return (
          <div className="w-8 h-8 flex-shrink-0 bg-gray-100 rounded-full flex items-center justify-center">
            <FileText className="h-4 w-4 text-gray-500" />
          </div>
        );
      case "qa":
        return (
          <div className="w-8 h-8 flex-shrink-0 bg-gray-100 rounded-full flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-gray-500"
            >
              <path d="M21 12h-4a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1v-4a1 1 0 0 0-1-1Z"></path>
              <path d="M7 12H3a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1v-4a1 1 0 0 0-1-1Z"></path>
              <path d="M14 6h-4a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1Z"></path>
              <path d="M14 17v.01"></path>
              <path d="M7 7v.01"></path>
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 flex-shrink-0 bg-gray-100 rounded-full flex items-center justify-center">
            <File className="h-4 w-4 text-gray-500" />
          </div>
        );
    }
  };

  return (
    <div className="flex items-center justify-between py-3 px-4 hover:bg-gray-50 rounded-md transition-colors">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <Checkbox
          checked={selected}
          onCheckedChange={(checked) => onSelect(id, !!checked)}
          className="h-5 w-5"
        />
        {getFileIcon()}
        <div className="flex-1 min-w-0">
          <div className="flex items-center">
            <p className="text-sm font-medium text-gray-800 truncate">
              {title}
            </p>
            {isNew && (
              <Badge
                variant="outline"
                className="ml-2 bg-green-100 text-green-800 border-0"
              >
                New
              </Badge>
            )}
            {status === "Processing" && (
              <Badge
                variant="outline"
                className="ml-2 bg-blue-100 text-blue-800 border-0 animate-pulse"
              >
                Processing
              </Badge>
            )}
            {status === "Optimizing" && (
              <Badge
                variant="outline"
                className="ml-2 bg-purple-100 text-purple-800 border-0 animate-pulse"
              >
                Optimizing
              </Badge>
            )}
            {status === "Failed" && (
              <Badge
                variant="outline"
                className="ml-2 bg-red-100 text-red-800 border-0"
              >
                Failed
              </Badge>
            )}
          </div>
          <div className="flex items-center text-xs text-gray-500 mt-0.5">
            {size && <span className="mr-2">{size}</span>}
            {lastUpdated && <span className="mr-2">{lastUpdated}</span>}
            {optimizationInfo && (
              <span className="text-green-600 font-medium">
                {optimizationInfo}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">More options</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {onView && (
              <DropdownMenuItem onClick={() => onView(id)}>
                View
              </DropdownMenuItem>
            )}
            {onEdit && (
              <DropdownMenuItem onClick={() => onEdit(id)}>
                Edit
              </DropdownMenuItem>
            )}
            {onDelete && (
              <DropdownMenuItem
                onClick={() => onDelete(id)}
                className="text-red-600"
              >
                Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onView && onView(id)}
        >
          <ChevronRight className="h-4 w-4" />
          <span className="sr-only">View</span>
        </Button>
      </div>
    </div>
  );
}
