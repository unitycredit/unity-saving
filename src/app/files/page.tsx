 "use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Upload } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { LogoutButton } from "@/components/LogoutButton";
import { FileManager } from "@/components/files/FileManager";
import { Button } from "@/components/ui/Button";

export default function FilesPage() {
  const uploadActionRef = React.useRef<(() => void) | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Supports global "Upload" actions (e.g. from Sidebar) by auto-opening the picker.
  React.useEffect(() => {
    if (searchParams.get("upload") !== "1") return;
    // Let the FileManager mount and register the ref first.
    const t = window.setTimeout(() => {
      uploadActionRef.current?.();
      router.replace("/files");
    }, 0);
    return () => window.clearTimeout(t);
  }, [router, searchParams]);

  return (
    <AppShell
      title="My Drive"
      subtitle="A clean, modern workspace for bank statements, personal records, and emergency documents."
      headerRight={
        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            className="h-11 rounded-2xl px-6 shadow-[0_18px_45px_-25px_rgba(0,102,255,0.70)]"
            onClick={() => uploadActionRef.current?.()}
            title="Upload"
          >
            <Upload className="h-4 w-4" />
            Upload
          </Button>
          <LogoutButton />
        </div>
      }
    >
      <FileManager uploadActionRef={uploadActionRef} />
    </AppShell>
  );
}


