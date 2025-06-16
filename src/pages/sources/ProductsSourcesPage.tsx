import { useParams } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SourcesLayout } from "@/components/sources/SourcesLayout";
import { useChatbotSources } from "@/hooks/useChatbotSources";
import { ChatbotProductsSection } from "@/components/chatbot/ChatbotProductsSection";

export default function ProductsSourcesPage() {
  const { id } = useParams<{ id: string }>();
  
  const {
    sourcesSummary,
    needsRetraining,
    handleRetrain,
  } = useChatbotSources(id);

  return (
    <SourcesLayout
      sourcesSummary={sourcesSummary}
      needsRetraining={needsRetraining}
      onRetrain={handleRetrain}
    >
      <Card className="border border-gray-100 shadow-sm">
        <CardHeader className="border-b bg-gray-50/50">
          <CardTitle className="text-lg font-medium text-gray-800">
            Products
          </CardTitle>
          <CardDescription>
            Manage products that your chatbot can recommend to users
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {id && <ChatbotProductsSection chatbotId={id} />}
        </CardContent>
      </Card>
    </SourcesLayout>
  );
}
