import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import SettingsLayout from "./SettingsLayout";
import { ChatbotManagementSection } from "@/components/settings/ChatbotManagementSection";

const GeneralSettings = () => {
  const [teamName, setTeamName] = useState("ChatBot Agency Team");
  const [teamUrl, setTeamUrl] = useState("chatbot-agency-team");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    // Simulate API call
    setTimeout(() => {
      setIsSaving(false);
    }, 1000);
  };

  return (
    <SettingsLayout>
      <Card>
        <CardHeader>
          <CardTitle>General</CardTitle>
          <CardDescription>Manage your team settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="team-name" className="text-sm font-medium">
              Team name
            </label>
            <Input
              id="team-name"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="team-url" className="text-sm font-medium">
              Team URL
            </label>
            <Input
              id="team-url"
              value={teamUrl}
              onChange={(e) => setTeamUrl(e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              Changing the team URL will redirect you to the new address.
            </p>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Separator className="my-8" />

      {/* Chatbot Management Section */}
      <ChatbotManagementSection />

      <Separator className="my-8" />

      <div className="space-y-4">
        <h3 className="text-lg font-medium text-destructive">Danger Zone</h3>

        <Card className="border-destructive/20">
          <CardHeader>
            <CardTitle className="text-destructive">Delete team</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Once you delete your team account, there is no going back. Please
              be certain.
            </p>
            <p className="text-sm text-muted-foreground">
              All your uploaded data and trained agents will be deleted.
            </p>
            <p className="text-sm font-semibold">
              This action is not reversible
            </p>
            <div className="flex justify-end">
              <Button variant="destructive">Delete ChatBot Agency Team</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </SettingsLayout>
  );
};

export default GeneralSettings;
