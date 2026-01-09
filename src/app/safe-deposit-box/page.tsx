import { AppShell } from "@/components/AppShell";
import { LogoutButton } from "@/components/LogoutButton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";

export default function SafeDepositBoxPage() {
  return (
    <AppShell
      title="Safe Deposit Box"
      subtitle="A higher-security area for your most sensitive documents in Unity Saving."
      headerRight={<LogoutButton />}
    >
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Coming soon</CardTitle>
            <CardDescription>We’ll add additional safeguards here (e.g., stricter access rules and extra confirmation).</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-slate-600">
            Today, everything uploads to S3. If you’d like, we can implement a separate prefix/bucket for this section.
          </div>
        </CardContent>
      </Card>
    </AppShell>
  );
}


