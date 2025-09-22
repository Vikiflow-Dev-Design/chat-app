import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MessageSquare, X } from 'lucide-react';
import { ChatPanel } from './ChatPanel';
import { AnimatePresence, motion } from 'framer-motion';

interface FloatingChatButtonProps {
  chatbotId: string;
}

export function FloatingChatButton({ chatbotId }: FloatingChatButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* Floating button */}
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={toggleChat}
          size="lg"
          className="rounded-full h-14 w-14 shadow-lg"
        >
          {isOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <MessageSquare className="h-6 w-6" />
          )}
        </Button>
      </div>

      {/* Chat panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed bottom-0 right-0 z-40 w-full sm:w-[400px] h-[600px] max-h-[80vh]"
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <ChatPanel 
              chatbotId={chatbotId} 
              onClose={() => setIsOpen(false)} 
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
