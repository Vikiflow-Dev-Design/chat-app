
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface ChatbotSettingsSectionProps {
  chatbotId: string;
}

export function ChatbotSettingsSection({ chatbotId }: ChatbotSettingsSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Chatbot Settings</CardTitle>
        <CardDescription>
          Manage your chatbot configuration
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground mb-4">
          Use the configuration studio to customize your chatbot behavior, appearance, and prompts.
        </p>
        <Button asChild>
          <Link to={`/chatbot/${chatbotId}/studio`}>
            Open Configuration Studio
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
