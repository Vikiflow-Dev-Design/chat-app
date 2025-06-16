import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductList } from "@/components/ProductList";
import { ProductDialogWrapper } from "@/components/ProductDialogWrapper";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ChatbotProductsSectionProps {
  chatbotId: string;
}

export function ChatbotProductsSection({ chatbotId }: ChatbotProductsSectionProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle>Products</CardTitle>
          <CardDescription>
            Manage products for your chatbot to recommend
          </CardDescription>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Product
        </Button>
      </CardHeader>
      <CardContent>
        <ProductList chatbotId={chatbotId} />
        <ProductDialogWrapper 
          open={isCreateDialogOpen} 
          onOpenChange={setIsCreateDialogOpen}
          chatbotId={chatbotId}
        />
      </CardContent>
    </Card>
  );
}
