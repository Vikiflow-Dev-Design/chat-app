import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Lightbulb, FileText, ArrowRight, X } from 'lucide-react';

interface SuggestionsPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentName: string;
  documentId: string;
  chatbotId: string;
}

const SuggestionsPromptModal: React.FC<SuggestionsPromptModalProps> = ({
  isOpen,
  onClose,
  documentName,
  documentId,
  chatbotId
}) => {
  const navigate = useNavigate();

  const handleGenerateSuggestions = () => {
    onClose();
    // Navigate to suggestions management page
    navigate(`suggestions/${documentId}`);
  };

  const handleSkip = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Lightbulb className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold">
                Generate Quick Suggestions?
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-600 mt-1">
                Document uploaded successfully!
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-4">
          <div className="flex items-start gap-3 mb-4">
            <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900 mb-1">{documentName}</p>
              <p className="text-sm text-gray-600">
                Your document has been processed and is ready to use.
              </p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">
              💡 Want to create helpful suggestions?
            </h4>
            <p className="text-sm text-blue-800 mb-3">
              Generate AI-powered question suggestions based on your document sections. 
              This helps users discover relevant information more easily.
            </p>
            
            <div className="space-y-2 text-xs text-blue-700">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                <span>Analyzes document sections automatically</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                <span>Creates contextual questions users might ask</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                <span>You can edit and customize suggestions</span>
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600">
              <strong>Note:</strong> You can always generate suggestions later from the Knowledge Management page.
            </p>
          </div>
        </div>

        <DialogFooter className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleSkip}
            className="flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            Skip for Now
          </Button>
          
          <Button
            onClick={handleGenerateSuggestions}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
          >
            <Lightbulb className="w-4 h-4" />
            Generate Suggestions
            <ArrowRight className="w-4 h-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SuggestionsPromptModal;
