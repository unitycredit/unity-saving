import { AppShell } from "@/components/AppShell";
import { LogoutButton } from "@/components/LogoutButton";
import { FileManager } from "@/components/files/FileManager";

export default function FilesPage() {
  return (
    <AppShell
      title="My Files"
      subtitle="A secure, folder-based workspace with drag & drop uploads and instant previews."
      headerRight={<LogoutButton />}
    >
      <FileManager />
    </AppShell>
  );
}


