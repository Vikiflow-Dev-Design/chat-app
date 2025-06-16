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
import { Globe, Plus, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { SourcesLayout } from "@/components/sources/SourcesLayout";
import { SelectableSourceList } from "@/components/sources/SelectableSourceList";
import { useChatbotSources } from "@/hooks/useChatbotSources";

export default function WebsiteSourcesPage() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [newWebsiteUrl, setNewWebsiteUrl] = useState("");
  const [isCrawling, setIsCrawling] = useState(false);

  const {
    loading,
    crawledLinks,
    sourcesSummary,
    needsRetraining,
    handleAddWebsite,
    handleDeleteLink,
    handleRetrain,
  } = useChatbotSources(id);

  const handleAddWebsiteSubmit = async () => {
    if (!newWebsiteUrl.trim()) {
      toast({
        title: "Error",
        description: "Website URL is required",
        variant: "destructive",
      });
      return;
    }

    // Basic URL validation
    try {
      new URL(newWebsiteUrl);
    } catch (error) {
      toast({
        title: "Error",
        description: "Please enter a valid URL",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsCrawling(true);

      // Add the website using the hook function
      await handleAddWebsite(newWebsiteUrl.trim());

      // Clear form
      setNewWebsiteUrl("");

      toast({
        title: "Success",
        description: "Website crawled successfully",
      });
    } catch (error) {
      console.error("Error crawling website:", error);
      toast({
        title: "Error",
        description: "Failed to crawl website",
        variant: "destructive",
      });
    } finally {
      setIsCrawling(false);
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
            Website
          </CardTitle>
          <CardDescription>
            Add website content to enhance your chatbot's knowledge
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-6">
            <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
              <h3 className="text-sm font-medium mb-3 text-gray-700 flex items-center">
                <Globe className="h-4 w-4 mr-2 text-primary" />
                Add Website
              </h3>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="https://example.com"
                    value={newWebsiteUrl}
                    onChange={(e) => setNewWebsiteUrl(e.target.value)}
                    disabled={isCrawling}
                  />
                  <Button
                    onClick={handleAddWebsiteSubmit}
                    disabled={isCrawling}
                  >
                    {isCrawling ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Crawling...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Add
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {crawledLinks.length > 0 && (
              <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
                <SelectableSourceList
                  title="Link Sources"
                  icon={<Globe className="h-4 w-4 text-primary" />}
                  sources={crawledLinks.map((link, index) => ({
                    id: index.toString(), // Using index as ID since links might not have unique IDs
                    title: link.url,
                    type: "link",
                    size: link.size,
                    isNew: false,
                    lastUpdated: "Last scraped recently",
                  }))}
                  onDelete={(id) => {
                    const index = parseInt(id);
                    if (
                      !isNaN(index) &&
                      index >= 0 &&
                      index < crawledLinks.length
                    ) {
                      handleDeleteLink(crawledLinks[index].url);
                    }
                  }}
                  onDeleteMultiple={(ids) => {
                    // Handle multiple deletion
                    ids.forEach((id) => {
                      const index = parseInt(id);
                      if (
                        !isNaN(index) &&
                        index >= 0 &&
                        index < crawledLinks.length
                      ) {
                        handleDeleteLink(crawledLinks[index].url);
                      }
                    });
                  }}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </SourcesLayout>
  );
}
