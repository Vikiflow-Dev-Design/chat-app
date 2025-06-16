import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  FileText,
  Link as LinkIcon,
  FileQuestion,
  AlertCircle,
} from "lucide-react";

interface SourcesSummaryProps {
  summary: {
    text: { count: number; size: string };
    links: { count: number; size: string };
    qa: { count: number; size: string };
    mongodb: { count: number; size: string };
    sheets: { count: number; size: string };
    totalSize: string;
    quota: string;
  };
  onRetrain?: () => void;
  needsRetraining?: boolean;
}

export function SourcesSummary({
  summary,
  onRetrain,
  needsRetraining = false,
}: SourcesSummaryProps) {
  return (
    <Card className="border border-gray-100 shadow-sm">
      <CardContent className="p-6">
        <h3 className="font-semibold text-gray-800 mb-4 uppercase text-sm tracking-wide">
          Sources
        </h3>

        <div className="space-y-3">
          {summary.text.count > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-700">
                  {summary.text.count} Text{" "}
                  {summary.text.count === 1 ? "File" : "Files"}
                </span>
              </div>
              <span className="text-sm text-gray-500">{summary.text.size}</span>
            </div>
          )}

          {summary.links.count > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <LinkIcon className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-700">
                  {summary.links.count}{" "}
                  {summary.links.count === 1 ? "Link" : "Links"}
                </span>
              </div>
              <span className="text-sm text-gray-500">
                {summary.links.size}
              </span>
            </div>
          )}

          {summary.qa.count > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileQuestion className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-700">
                  {summary.qa.count} Q&A{" "}
                  {summary.qa.count === 1 ? "Item" : "Items"}
                </span>
              </div>
              <span className="text-sm text-gray-500">{summary.qa.size}</span>
            </div>
          )}
        </div>

        <Separator className="my-4" />

        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-gray-700">Total size:</span>
          <span className="text-sm text-gray-700">
            {summary.totalSize} / {summary.quota}
          </span>
        </div>

        <Button className="w-full" onClick={onRetrain} variant="default">
          Retrain agent
        </Button>

        {needsRetraining && (
          <div className="mt-4 flex items-center gap-2 text-amber-600 text-sm">
            <AlertCircle className="h-4 w-4" />
            <span>Retraining is required for changes to apply</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
