"use client";

import * as React from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { listFolder, type ListedFile } from "@/lib/cloudFiles";

type FolderName = "Documents" | "Downloads" | "Music" | "Video";

const FOLDERS: FolderName[] = ["Documents", "Downloads", "Music", "Video"];

const SAMPLE_FILES: Record<FolderName, { name: string; size: string }[]> = {
  Documents: [
    { name: "notes.txt", size: "4 KB" },
    { name: "budget.xlsx", size: "96 KB" },
  ],
  Downloads: [
    { name: "installer.exe", size: "28.4 MB" },
    { name: "archive.zip", size: "8.0 MB" },
  ],
  Music: [
    { name: "song.mp3", size: "6.4 MB" },
    { name: "album.flac", size: "42 MB" },
  ],
  Video: [
    { name: "clip.mp4", size: "214 MB" },
    { name: "recording.mov", size: "1.2 GB" },
  ],
};

function humanBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "—";
  const units = ["B", "KB", "MB", "GB", "TB"] as const;
  let i = 0;
  let v = bytes;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export function FilesCard() {
  const [folder, setFolder] = React.useState<FolderName>("Documents");
  const [items, setItems] = React.useState<ListedFile[] | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const out = await listFolder(folder);
      setItems(out.items);
    } catch (e) {
      setItems(null);
      setError(e instanceof Error ? e.message : "Failed to load from S3.");
    } finally {
      setLoading(false);
    }
  }, [folder]);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div>
          <CardTitle>Cloud Files</CardTitle>
          <CardDescription>Folders now; S3 wiring later (AWS-only).</CardDescription>
        </div>
        <Button variant="secondary" size="sm" onClick={refresh} disabled={loading} title="Refresh">
          {loading ? "Loading…" : "Refresh"}
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-[180px_1fr]">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-2 shadow-sm">
            <div className="px-3 py-2 text-xs font-medium text-zinc-500">Folders</div>
            <div className="mt-1 space-y-1">
              {FOLDERS.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFolder(f)}
                  className={cn(
                    "w-full rounded-xl px-3 py-2 text-left text-sm transition-colors",
                    folder === f
                      ? "bg-white text-zinc-950"
                      : "hover:bg-white/5 text-white",
                  )}
                >
                  <div className="truncate font-medium">{f}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/20 shadow-sm">
            <div className="border-b border-white/10 px-4 py-3">
              <div className="text-sm font-semibold text-white">{folder}</div>
              <div className="text-xs text-zinc-500">
                {items ? `Loaded ${items.length} object(s) from S3.` : "Configure S3 env vars to load objects."}
              </div>
            </div>
            <div className="max-h-56 overflow-auto">
              {error ? (
                <div className="px-4 py-6 text-sm text-zinc-400">
                  <div className="font-medium text-white">S3 not configured yet</div>
                  <div className="mt-1">
                    Add AWS env vars (see `env.example`) and redeploy. Then click Refresh.
                  </div>
                  <div className="mt-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-zinc-300">
                    {error}
                  </div>
                </div>
              ) : null}

              {!error && items && items.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-zinc-400">
                  This folder is empty.
                </div>
              ) : null}

              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-zinc-950/70 backdrop-blur">
                  <tr className="text-left text-xs text-zinc-500">
                    <th className="px-4 py-2 font-medium">Name</th>
                    <th className="px-4 py-2 font-medium">Size</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {(items ?? SAMPLE_FILES[folder].map((x) => ({ key: x.name, name: x.name, size: 0, lastModified: null }))).map((x) => (
                    <tr key={x.key} className="hover:bg-white/5">
                      <td className="px-4 py-2 font-medium text-white">{x.name}</td>
                      <td className="px-4 py-2 text-zinc-300">{items ? humanBytes(x.size) : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


