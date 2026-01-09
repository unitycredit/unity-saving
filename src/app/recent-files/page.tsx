import { AppShell } from "@/components/AppShell";
import { LogoutButton } from "@/components/LogoutButton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";

export default function RecentFilesPage() {
  return (
    <AppShell
      title="Recent Files"
      subtitle="A quick view of your most recently accessed documents in Unity Saving."
      headerRight={<LogoutButton />}
    >
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Coming soon</CardTitle>
            <CardDescription>Recent activity will appear here once you start uploading and opening files.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-slate-600">
            For now, use <span className="font-medium text-slate-900">My Drive</span> to browse and upload documents.
          </div>
        </CardContent>
      </Card>
    </AppShell>
  );
}


