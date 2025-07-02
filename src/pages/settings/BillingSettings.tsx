import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import SettingsLayout from "./SettingsLayout";

const BillingSettings = () => {
  return (
    <SettingsLayout>
      <Card>
        <CardHeader>
          <CardTitle>Billing</CardTitle>
          <CardDescription>
            Manage your billing information and view invoices
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTitle>No billing information</AlertTitle>
            <AlertDescription>
              You are on the Free plan and don't have any billing information
              set up.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </SettingsLayout>
  );
};

export default BillingSettings;
