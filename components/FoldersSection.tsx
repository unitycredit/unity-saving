"use client";

import * as React from "react";
import { Download, Loader2, RefreshCw, Trash2, UploadCloud } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";
import { createUploadUrl, deleteFile, listFolder, presignDownload, type ListedFile } from "@/lib/fileApi";

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

function putWithProgress(params: {
  url: string;
  file: File;
  contentType: string;
  onProgress: (pct: number) => void;
}) {
  const { url, file, contentType, onProgress } = params;
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", contentType);

    xhr.upload.onprogress = (e) => {
      if (!e.lengthComputable) return;
      const pct = Math.max(0, Math.min(100, Math.round((e.loaded / e.total) * 100)));
      onProgress(pct);
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) return resolve();
      reject(new Error(`Upload failed (${xhr.status})`));
    };
    xhr.onerror = () => reject(new Error("Upload failed (network error)"));
    xhr.onabort = () => reject(new Error("Upload cancelled"));

    xhr.send(file);
  });
}

export function FoldersSection() {
  const { toast } = useToast();

  const DEFAULT_UPLOAD_FOLDER = "Documents";
  const [items, setItems] = React.useState<ListedFile[] | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [uploading, setUploading] = React.useState<{
    name: string;
    progress: number;
    status: "uploading" | "done" | "error";
    message?: string;
  } | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const out = await listFolder("__all__");
      const sorted = [...(out.items ?? [])].sort((a, b) => {
        const ad = a.lastModified ? Date.parse(a.lastModified) : 0;
        const bd = b.lastModified ? Date.parse(b.lastModified) : 0;
        return bd - ad;
      });
      setItems(sorted);
    } catch (e) {
      setItems(null);
      setError(e instanceof Error ? e.message : "Failed to load from S3.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  async function onUpload(file: File) {
    setError(null);
    setUploading({ name: file.name, progress: 0, status: "uploading" });
    try {
      const presigned = await createUploadUrl(DEFAULT_UPLOAD_FOLDER, file);
      await putWithProgress({
        url: presigned.url,
        file,
        contentType: file.type || "application/octet-stream",
        onProgress: (pct) => setUploading((prev) => (prev ? { ...prev, progress: pct } : prev)),
      });

      setUploading({ name: file.name, progress: 100, status: "done" });
      toast({ title: "Uploaded", message: file.name, variant: "success" });
      void refresh();
    } catch (e) {
      const message = e instanceof Error ? e.message : "Upload failed";
      setUploading({ name: file.name, progress: 0, status: "error", message });
      toast({ title: "Upload failed", message: `${file.name} — ${message}`, variant: "error" });
    }
  }

  async function startDownload(file: ListedFile) {
    try {
      const out = await presignDownload({ key: file.key, disposition: "attachment" });
      const a = document.createElement("a");
      a.href = out.url;
      a.target = "_blank";
      a.rel = "noreferrer";
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast({ title: "Download started", message: file.name, variant: "success" });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to download";
      toast({ title: "Download failed", message: `${file.name} — ${message}`, variant: "error" });
    }
  }

  async function remove(file: ListedFile) {
    const ok = window.confirm(`Delete "${file.name}"? This cannot be undone.`);
    if (!ok) return;
    try {
      await deleteFile({ key: file.key });
      toast({ title: "Deleted", message: file.name, variant: "success" });
      void refresh();
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to delete";
      toast({ title: "Delete failed", message: `${file.name} — ${message}`, variant: "error" });
    }
  }

  return (
    <Card className="overflow-hidden">
      <div className="p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm font-semibold tracking-wide text-[#0066FF]">Folders</div>
            <div className="mt-1 text-xl font-semibold tracking-tight text-slate-900">S3 Files</div>
            <div className="mt-1 text-sm text-slate-600">Upload and manage files stored in your S3 bucket.</div>
          </div>

          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              className="hidden"
              type="file"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void onUpload(f);
                e.currentTarget.value = "";
              }}
            />
            <Button variant="primary" size="sm" onClick={() => fileInputRef.current?.click()}>
              <UploadCloud className="h-4 w-4" />
              Upload
            </Button>
            <Button variant="secondary" size="sm" onClick={refresh} disabled={loading}>
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
              Refresh
            </Button>
          </div>
        </div>

        {uploading ? (
          <div className="mt-5 rounded-3xl border border-black/5 bg-white/60 p-4 shadow-sm backdrop-blur-xl">
            <div className="flex items-center justify-between gap-3 text-sm">
              <div className="min-w-0">
                <div className="truncate font-semibold text-slate-900">{uploading.name}</div>
                {uploading.status === "error" && uploading.message ? (
                  <div className="mt-1 truncate text-xs text-red-600">{uploading.message}</div>
                ) : (
                  <div className="mt-1 text-xs text-slate-500">
                    {uploading.status === "done" ? "Uploaded" : "Uploading…"}
                  </div>
                )}
              </div>
              <div className="shrink-0 tabular-nums text-xs font-semibold text-slate-700">
                {uploading.status === "uploading" ? `${uploading.progress}%` : uploading.status === "done" ? "100%" : "—"}
              </div>
            </div>
            {uploading.status === "uploading" ? (
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-black/5">
                <div className="h-full rounded-full bg-gradient-to-r from-[#0066FF] to-[#6EA8FF]" style={{ width: `${uploading.progress}%` }} />
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="mt-6 overflow-hidden rounded-3xl border border-black/5 bg-white/60 shadow-sm backdrop-blur-xl">
          <div className="flex items-center justify-between gap-3 border-b border-black/5 px-5 py-4">
            <div className="text-sm font-semibold text-slate-900">
              Files {items ? <span className="text-slate-500 font-medium">({items.length})</span> : null}
            </div>
            {loading ? (
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading…
              </div>
            ) : null}
          </div>

          {error ? (
            <div className="px-5 py-5 text-sm text-slate-700">
              <div className="font-semibold text-slate-900">Couldn’t load S3 files</div>
              <div className="mt-1 text-slate-600">{error}</div>
            </div>
          ) : null}

          {!error && items && items.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-slate-500">No files yet.</div>
          ) : null}

          {!error && items ? (
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-white/70 backdrop-blur-xl">
                  <tr className="text-left text-xs text-slate-500">
                    <th className="px-5 py-3 font-semibold">Name</th>
                    <th className="px-5 py-3 font-semibold">Size</th>
                    <th className="px-5 py-3 font-semibold">Date</th>
                    <th className="px-5 py-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {items.map((f) => (
                    <tr key={f.key} className="hover:bg-white/70">
                      <td className="px-5 py-3">
                        <div className="min-w-0">
                          <div className="truncate font-semibold text-slate-900">{f.name}</div>
                          {f.path ? <div className="truncate text-xs text-slate-500">{f.path}</div> : null}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-slate-700">{humanBytes(f.size)}</td>
                      <td className="px-5 py-3 text-slate-600">
                        {f.lastModified ? new Date(f.lastModified).toLocaleString() : "—"}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-black/5 bg-white/70 text-slate-700 transition-colors hover:bg-white"
                            onClick={() => void startDownload(f)}
                            aria-label={`Download ${f.name}`}
                            title="Download"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-black/5 bg-white/70 text-slate-700 transition-colors hover:bg-white"
                            onClick={() => void remove(f)}
                            aria-label={`Delete ${f.name}`}
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      </div>
    </Card>
  );
}

