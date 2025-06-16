import { useState } from "react";
import { useParams } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, Plus, Loader2, CheckCircle2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { SourcesLayout } from "@/components/sources/SourcesLayout";
import { useChatbotSources } from "@/hooks/useChatbotSources";

export default function SheetsSourcesPage() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [sheetsUrl, setSheetsUrl] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSheetsConnected, setIsSheetsConnected] = useState(false);
  const [selectedSheets, setSelectedSheets] = useState<string[]>([]);
  const [isImportingSheets, setIsImportingSheets] = useState(false);

  const {
    sourcesSummary,
    needsRetraining,
    handleRetrain,
  } = useChatbotSources(id);

  const handleConnectSheets = async () => {
    if (!sheetsUrl) {
      toast({
        title: "Error",
        description: "Google Sheets URL is required",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsConnecting(true);
      // Mock connecting to Google Sheets - in a real app, this would be an API call
      console.log("Connecting to Google Sheets:", sheetsUrl);
      
      // Simulate delay
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      setIsSheetsConnected(true);
      // Mock available sheets
      setSelectedSheets(["Sheet1", "Sheet2", "Sheet3"]);
      
      toast({
        title: "Success",
        description: "Connected to Google Sheets successfully",
      });
    } catch (error) {
      console.error("Error connecting to Google Sheets:", error);
      toast({
        title: "Error",
        description: "Failed to connect to Google Sheets",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleImportSheets = async () => {
    if (selectedSheets.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one sheet to import",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsImportingSheets(true);
      // Mock importing sheets - in a real app, this would be an API call
      console.log("Importing sheets:", selectedSheets);
      
      // Simulate delay
      await new Promise((resolve) => setTimeout(resolve, 2000));
      
      toast({
        title: "Success",
        description: "Sheets imported successfully",
      });
      
      // Reset state
      setSheetsUrl("");
      setIsSheetsConnected(false);
      setSelectedSheets([]);
    } catch (error) {
      console.error("Error importing sheets:", error);
      toast({
        title: "Error",
        description: "Failed to import sheets",
        variant: "destructive",
      });
    } finally {
      setIsImportingSheets(false);
    }
  };

  return (
    <SourcesLayout
      sourcesSummary={sourcesSummary}
      needsRetraining={needsRetraining}
      onRetrain={handleRetrain}
    >
      <Card className="border border-gray-100 shadow-sm">
        <CardHeader className="border-b bg-gray-50/50">
          <CardTitle className="text-lg font-medium text-gray-800">
            Google Sheets
          </CardTitle>
          <CardDescription>
            Import data from Google Sheets as knowledge sources
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-6">
            {!isSheetsConnected ? (
              <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
                <h3 className="text-sm font-medium mb-3 text-gray-700 flex items-center">
                  <Table className="h-4 w-4 mr-2 text-primary" />
                  Connect to Google Sheets
                </h3>
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="sheets-url"
                      className="text-sm text-gray-700 mb-1 block"
                    >
                      Google Sheets URL
                    </label>
                    <Input
                      id="sheets-url"
                      placeholder="https://docs.google.com/spreadsheets/d/..."
                      value={sheetsUrl}
                      onChange={(e) => setSheetsUrl(e.target.value)}
                      disabled={isConnecting}
                    />
                  </div>
                  <Button
                    onClick={handleConnectSheets}
                    disabled={isConnecting}
                    className="w-full"
                  >
                    {isConnecting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Connect
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
                <h3 className="text-sm font-medium mb-3 text-gray-700 flex items-center">
                  <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                  Connected to Google Sheets
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Select the sheets you want to import:
                </p>
                <div className="space-y-2 mb-4">
                  {selectedSheets.map((sheet) => (
                    <div key={sheet} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`sheet-${sheet}`}
                        className="mr-2"
                        checked
                        readOnly
                      />
                      <label
                        htmlFor={`sheet-${sheet}`}
                        className="text-sm text-gray-700"
                      >
                        {sheet}
                      </label>
                    </div>
                  ))}
                </div>
                <Button
                  onClick={handleImportSheets}
                  disabled={isImportingSheets}
                  className="w-full"
                >
                  {isImportingSheets ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Import Selected Sheets
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </SourcesLayout>
  );
}
