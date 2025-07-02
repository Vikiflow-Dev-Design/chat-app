
import { CreateProductDialog } from './CreateProductDialog';

interface ProductDialogWrapperProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chatbotId: string;
}

export function ProductDialogWrapper({ open, onOpenChange, chatbotId }: ProductDialogWrapperProps) {
  return (
    <CreateProductDialog 
      open={open} 
      onOpenChange={onOpenChange} 
      chatbotId={chatbotId}
    />
  );
}
