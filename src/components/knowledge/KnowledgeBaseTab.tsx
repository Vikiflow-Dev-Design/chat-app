import { useState } from 'react';
import { KnowledgeDocumentList } from './KnowledgeDocumentList';
import { KnowledgeDocumentForm } from './KnowledgeDocumentForm';
import { KnowledgeDocument } from '@/services/knowledgeService';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, HelpCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface KnowledgeBaseTabProps {
  chatbotId: string;
}

export function KnowledgeBaseTab({ chatbotId }: KnowledgeBaseTabProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<KnowledgeDocument | undefined>(undefined);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleAddDocument = () => {
    setSelectedDocument(undefined);
    setIsFormOpen(true);
  };

  const handleEditDocument = (document: KnowledgeDocument) => {
    setSelectedDocument(document);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
  };

  const handleFormSave = () => {
    // Trigger a refresh of the document list
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="bg-primary/10 p-3 rounded-full">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-medium">Text Documents</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Add plain text content to enhance your chatbot's knowledge.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="bg-primary/10 p-3 rounded-full">
                <HelpCircle className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-medium">FAQ Documents</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Add frequently asked questions and answers in Q&A format.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="bg-primary/10 p-3 rounded-full">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-medium">Document Processing</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  The system extracts key information from your documents automatically.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Alert>
        <AlertTitle>How Knowledge Base Works</AlertTitle>
        <AlertDescription>
          When a user asks a question, the chatbot searches the knowledge base for relevant information
          and uses it to provide more accurate and detailed responses. Add documents, FAQs, or text content
          to enhance your chatbot's knowledge.
        </AlertDescription>
      </Alert>

      <KnowledgeDocumentList
        chatbotId={chatbotId}
        onEdit={handleEditDocument}
        onAdd={handleAddDocument}
        key={refreshTrigger} // Force re-render when refreshTrigger changes
      />

      <KnowledgeDocumentForm
        chatbotId={chatbotId}
        document={selectedDocument}
        isOpen={isFormOpen}
        onClose={handleFormClose}
        onSave={handleFormSave}
      />
    </div>
  );
}
