"use client";

import * as React from "react";
import { CloudUpload, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import { createUploadUrl, listFolder, type ListedFile } from "@/lib/fileApi";

type FolderName = "Documents" | "Downloads" | "Music" | "Video";
const FOLDERS: FolderName[] = ["Documents", "Downloads", "Music", "Video"];

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

export function S3FileManagerCard({ icon }: { icon: React.ReactNode }) {
  const [folder, setFolder] = React.useState<FolderName>("Documents");
  const [query, setQuery] = React.useState("");
  const [items, setItems] = React.useState<ListedFile[] | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [dragOver, setDragOver] = React.useState(false);

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

  const filtered = React.useMemo(() => {
    const list = items ?? [];
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter((f) => f.name.toLowerCase().includes(q));
  }, [items, query]);

  const onUpload = async (file: File) => {
    setError(null);
    const { url } = await createUploadUrl(folder, file);
    const res = await fetch(url, { method: "PUT", body: file, headers: { "content-type": file.type || "application/octet-stream" } });
    if (!res.ok) throw new Error(`S3 upload failed: ${res.status}`);
    await refresh();
  };

  const onDropFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    try {
      for (const f of Array.from(fileList)) {
        // Simple baseline: single PUT upload.
        // Future: multipart upload for very large files.
        await onUpload(f);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-2xl border border-white/10 bg-white/5 p-2.5 text-white">
            {icon}
          </div>
          <div>
            <CardTitle>File Manager (S3)</CardTitle>
            <CardDescription>Lists + uploads via `/api/files/upload` (direct-to-S3).</CardDescription>
          </div>
        </div>

        <Button variant="secondary" size="sm" onClick={refresh} disabled={loading}>
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          Refresh
        </Button>
      </CardHeader>

      <CardContent>
        <div className="grid gap-4 md:grid-cols-[180px_1fr]">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-2">
            <div className="px-3 py-2 text-xs font-medium text-zinc-500">Folders</div>
            <div className="mt-1 space-y-1">
              {FOLDERS.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFolder(f)}
                  className={cn(
                    "w-full rounded-xl px-3 py-2 text-left text-sm transition-colors",
                    folder === f ? "bg-white text-zinc-950" : "hover:bg-white/5 text-white",
                  )}
                >
                  <div className="truncate font-medium">{f}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/20">
            <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-white">{folder}</div>
                <div className="text-xs text-zinc-500">
                  {items ? `Showing ${filtered.length} object(s)` : "Configure AWS env vars to load objects"}
                </div>
              </div>
              <div className="w-44">
                <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search…" />
              </div>
            </div>

            <div
              onDragEnter={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                setDragOver(false);
              }}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                void onDropFiles(e.dataTransfer.files);
              }}
              className={cn("relative max-h-72 overflow-auto", dragOver && "ring-2 ring-white/15")}
            >
              <div className="border-b border-white/10 px-4 py-3">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white hover:bg-white/10">
                  <CloudUpload className="h-4 w-4" />
                  Upload file(s)
                  <input type="file" className="hidden" multiple onChange={(e) => void onDropFiles(e.target.files)} />
                </label>
                <div className="mt-2 text-xs text-zinc-500">Or drag & drop files here.</div>
                {error ? (
                  <div className="mt-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-zinc-300">
                    {error}
                  </div>
                ) : null}
              </div>

              {items && filtered.length === 0 ? (
                <div className="px-4 py-10 text-center text-sm text-zinc-400">No files yet.</div>
              ) : null}

              {!items && !error ? (
                <div className="px-4 py-10 text-center text-sm text-zinc-400">
                  S3 not configured. Copy `env.example` → `.env.local`, set AWS vars, and redeploy.
                </div>
              ) : null}

              {items ? (
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-zinc-950/70 backdrop-blur">
                    <tr className="text-left text-xs text-zinc-500">
                      <th className="px-4 py-2 font-medium">Name</th>
                      <th className="px-4 py-2 font-medium">Size</th>
                      <th className="px-4 py-2 font-medium">Modified</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {filtered.map((f) => (
                      <tr key={f.key} className="hover:bg-white/5">
                        <td className="px-4 py-2 font-medium text-white">{f.name}</td>
                        <td className="px-4 py-2 text-zinc-300">{humanBytes(f.size)}</td>
                        <td className="px-4 py-2 text-zinc-300">
                          {f.lastModified ? new Date(f.lastModified).toLocaleString() : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : null}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


