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
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { MessageSquare, Plus } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { SourcesLayout } from "@/components/sources/SourcesLayout";
import { SelectableSourceList } from "@/components/sources/SelectableSourceList";
import { useChatbotSources } from "@/hooks/useChatbotSources";

export default function QASourcesPage() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [newQuestion, setNewQuestion] = useState("");
  const [newAnswer, setNewAnswer] = useState("");
  const [newTitle, setNewTitle] = useState("");

  const {
    loading,
    questions,
    sourcesSummary,
    needsRetraining,
    handleAddQA,
    handleDeleteQA,
    handleRetrain,
  } = useChatbotSources(id);

  const handleAddQASubmit = async () => {
    if (!newQuestion.trim() || !newAnswer.trim()) {
      toast({
        title: "Error",
        description: "Question and answer are required",
        variant: "destructive",
      });
      return;
    }

    try {
      // Use the title or generate one from the question
      const title =
        newTitle.trim() ||
        `Q: ${newQuestion.substring(0, 50)}${
          newQuestion.length > 50 ? "..." : ""
        }`;

      // Add the Q&A using the hook function
      await handleAddQA(title, newQuestion.trim(), newAnswer.trim());

      // Clear form
      setNewTitle("");
      setNewQuestion("");
      setNewAnswer("");
    } catch (error) {
      console.error("Error adding Q&A:", error);
      toast({
        title: "Error",
        description: "Failed to add Q&A",
        variant: "destructive",
      });
    }
  };

  const handleViewQA = (id: string) => {
    const index = parseInt(id);
    if (!isNaN(index) && index >= 0 && index < questions.length) {
      const qa = questions[index];
      // In a real app, this would open a dialog to view the Q&A
      console.log("Viewing Q&A:", qa);
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
            Q&A
          </CardTitle>
          <CardDescription>
            Add question and answer pairs to enhance your chatbot's knowledge
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-6">
            <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
              <h3 className="text-sm font-medium mb-3 text-gray-700 flex items-center">
                <MessageSquare className="h-4 w-4 mr-2 text-primary" />
                Add New Q&A
              </h3>
              <div className="space-y-4">
                <div>
                  <Input
                    placeholder="Title (optional)"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                  />
                </div>
                <div>
                  <Textarea
                    placeholder="Question"
                    className="min-h-[100px]"
                    value={newQuestion}
                    onChange={(e) => setNewQuestion(e.target.value)}
                  />
                </div>
                <div>
                  <Textarea
                    placeholder="Answer"
                    className="min-h-[150px]"
                    value={newAnswer}
                    onChange={(e) => setNewAnswer(e.target.value)}
                  />
                </div>
                <Button onClick={handleAddQASubmit} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Q&A
                </Button>
              </div>
            </div>

            {questions.length > 0 && (
              <SelectableSourceList
                title="Q&A Sources"
                icon={<MessageSquare className="h-4 w-4 text-primary" />}
                sources={questions.map((qa, index) => ({
                  id: index.toString(),
                  title:
                    qa.title ||
                    `Q: ${qa.question.substring(0, 50)}${
                      qa.question.length > 50 ? "..." : ""
                    }`,
                  type: "qa",
                  size: `${qa.question.length + qa.answer.length} chars`,
                  isNew: false,
                  lastUpdated: undefined,
                }))}
                onView={handleViewQA}
                onDelete={handleDeleteQA}
                onDeleteMultiple={(ids) => {
                  // Handle multiple deletion
                  ids.forEach((id) => handleDeleteQA(id));
                }}
              />
            )}
          </div>
        </CardContent>
      </Card>
    </SourcesLayout>
  );
}
