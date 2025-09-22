import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import SettingsLayout from "./SettingsLayout";

const PlansSettings = () => {
  return (
    <SettingsLayout>
      <Card>
        <CardHeader>
          <CardTitle>Plans</CardTitle>
          <CardDescription>Manage your subscription plan</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTitle>You are on the Free plan</AlertTitle>
            <AlertDescription>
              Upgrade to Pro to unlock more features and higher usage limits.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <Card className="border-2">
              <CardHeader>
                <CardTitle>Free</CardTitle>
                <CardDescription>
                  <span className="text-2xl font-bold">$0</span> / month
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2 text-sm">
                  <li>• 1 chatbot</li>
                  <li>• 100 messages / month</li>
                  <li>• Basic customization</li>
                  <li>• Community support</li>
                </ul>
                <Button className="w-full" disabled>
                  Current Plan
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pro</CardTitle>
                <CardDescription>
                  <span className="text-2xl font-bold">$29</span> / month
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2 text-sm">
                  <li>• Unlimited chatbots</li>
                  <li>• 5,000 messages / month</li>
                  <li>• Advanced customization</li>
                  <li>• Priority support</li>
                  <li>• Knowledge base integration</li>
                </ul>
                <Button className="w-full">Upgrade to Pro</Button>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </SettingsLayout>
  );
};

export default PlansSettings;
