"use client";

import * as React from "react";
import {
  ChevronRight,
  Download,
  File as FileIcon,
  FileText,
  Folder,
  Image as ImageIcon,
  Loader2,
  UploadCloud,
  X,
} from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import {
  listFolder,
  presignDownload,
  presignUpload,
  type ListedFile,
  type ListedFolder,
} from "@/lib/cloudFiles";

const ROOTS = ["Documents", "Downloads", "Music", "Video"] as const;
type Root = (typeof ROOTS)[number];

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

function splitPath(path: string): string[] {
  return path.split("/").filter(Boolean);
}

function ext(name: string) {
  const i = name.lastIndexOf(".");
  return i === -1 ? "" : name.slice(i + 1).toLowerCase();
}

function kindFor(name: string) {
  const e = ext(name);
  if (["png", "jpg", "jpeg", "gif", "webp"].includes(e)) return "image";
  if (e === "pdf") return "pdf";
  if (["txt", "csv", "json", "md", "log"].includes(e)) return "text";
  return "file";
}

function rowIcon(kind: ReturnType<typeof kindFor>) {
  if (kind === "image") return ImageIcon;
  if (kind === "text") return FileText;
  return FileIcon;
}

type UploadItem = { name: string; status: "uploading" | "done" | "error"; message?: string };

export function FileManager(props: { compact?: boolean } = {}) {
  const { compact = false } = props;

  const [root, setRoot] = React.useState<Root>("Documents");
  const [subpath, setSubpath] = React.useState<string>(""); // without root
  const currentPath = subpath ? `${root}/${subpath}` : root;

  const [folders, setFolders] = React.useState<ListedFolder[] | null>(null);
  const [files, setFiles] = React.useState<ListedFile[] | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [dragOver, setDragOver] = React.useState(false);
  const [uploads, setUploads] = React.useState<UploadItem[]>([]);

  const [preview, setPreview] = React.useState<null | {
    file: ListedFile;
    url: string | null;
    loading: boolean;
    error: string | null;
  }>(null);

  const breadcrumbs = React.useMemo(() => splitPath(currentPath), [currentPath]);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const out = await listFolder(currentPath);
      setFolders(out.folders ?? []);
      setFiles(out.items ?? []);
    } catch (e) {
      setFolders(null);
      setFiles(null);
      setError(e instanceof Error ? e.message : "Failed to load from S3.");
    } finally {
      setLoading(false);
    }
  }, [currentPath]);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  function goToPath(path: string) {
    const parts = splitPath(path);
    const nextRoot = (parts[0] as Root | undefined) ?? "Documents";
    if (!ROOTS.includes(nextRoot)) {
      setRoot("Documents");
      setSubpath("");
      return;
    }
    setRoot(nextRoot);
    setSubpath(parts.slice(1).join("/"));
  }

  function goUp() {
    if (!subpath) return;
    const parts = splitPath(subpath);
    parts.pop();
    setSubpath(parts.join("/"));
  }

  async function uploadFiles(fileList: FileList | File[]) {
    const arr = Array.isArray(fileList) ? fileList : Array.from(fileList);
    if (arr.length === 0) return;

    const initial: UploadItem[] = arr.map((f) => ({ name: f.name, status: "uploading" }));
    setUploads((prev) => [...initial, ...prev].slice(0, 6));

    for (const file of arr) {
      try {
        const presigned = await presignUpload({
          folder: currentPath,
          fileName: file.name,
          contentType: file.type || "application/octet-stream",
        });
        const res = await fetch(presigned.url, {
          method: "PUT",
          headers: { "content-type": file.type || "application/octet-stream" },
          body: file,
        });
        if (!res.ok) throw new Error(`Upload failed (${res.status})`);
        setUploads((prev) =>
          prev.map((u) => (u.name === file.name ? { ...u, status: "done" } : u)),
        );
      } catch (e) {
        const message = e instanceof Error ? e.message : "Upload failed";
        setUploads((prev) =>
          prev.map((u) => (u.name === file.name ? { ...u, status: "error", message } : u)),
        );
      }
    }

    void refresh();
  }

  async function openPreview(file: ListedFile) {
    setPreview({ file, url: null, loading: true, error: null });
    try {
      const out = await presignDownload({ key: file.key });
      setPreview({ file, url: out.url, loading: false, error: null });
    } catch (e) {
      setPreview({
        file,
        url: null,
        loading: false,
        error: e instanceof Error ? e.message : "Failed to open preview",
      });
    }
  }

  const contentMaxHeight = compact ? "max-h-[420px]" : "max-h-[640px]";

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div>
          <CardTitle>Cloud Files</CardTitle>
          <CardDescription>Folder navigation, drag & drop uploads, and in-app previews.</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={refresh} disabled={loading} title="Refresh">
            {loading ? "Loading…" : "Refresh"}
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <div className={cn("grid gap-4", compact ? "md:grid-cols-[180px_1fr]" : "md:grid-cols-[220px_1fr]")}>
          {/* Folders */}
          <div className="rounded-2xl border border-white/10 bg-black/20 p-2 shadow-sm">
            <div className="px-3 py-2 text-xs font-medium text-zinc-500">Folders</div>
            <div className="mt-1 space-y-1">
              {ROOTS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => {
                    setRoot(r);
                    setSubpath("");
                  }}
                  className={cn(
                    "w-full rounded-xl px-3 py-2 text-left text-sm transition-colors",
                    root === r ? "bg-white text-zinc-950" : "hover:bg-white/5 text-white",
                  )}
                >
                  <div className="truncate font-medium">{r}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Browser */}
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/20 shadow-sm">
            <div className="border-b border-white/10 px-4 py-3">
              <div className="flex flex-wrap items-center gap-1 text-sm">
                <button
                  type="button"
                  onClick={() => {
                    setSubpath("");
                  }}
                  className="font-semibold text-white hover:underline"
                >
                  {root}
                </button>
                {breadcrumbs.slice(1).map((segment, idx) => {
                  const target = [root, ...breadcrumbs.slice(1, idx + 2)].join("/");
                  return (
                    <React.Fragment key={target}>
                      <ChevronRight className="h-4 w-4 text-zinc-600" />
                      <button
                        type="button"
                        onClick={() => goToPath(target)}
                        className="text-zinc-200 hover:underline"
                      >
                        {segment}
                      </button>
                    </React.Fragment>
                  );
                })}
              </div>
              <div className="mt-1 flex items-center justify-between gap-3">
                <div className="text-xs text-zinc-500">
                  {folders && files
                    ? `${folders.length} folder(s) • ${files.length} file(s)`
                    : "Configure S3 env vars to load objects."}
                </div>
                <Button variant="ghost" size="sm" onClick={goUp} disabled={!subpath}>
                  Up
                </Button>
              </div>
            </div>

            <div className={cn("overflow-auto", contentMaxHeight)}>
              {/* Upload */}
              <div className="p-4">
                <label
                  onDragEnter={() => setDragOver(true)}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(false);
                    void uploadFiles(e.dataTransfer.files);
                  }}
                  className={cn(
                    "flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-dashed px-4 py-4 transition-colors",
                    dragOver
                      ? "border-emerald-400/40 bg-emerald-500/10"
                      : "border-white/10 bg-white/5 hover:bg-white/10",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-black/30">
                      <UploadCloud className="h-5 w-5 text-zinc-200" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-white">Drag & drop to upload</div>
                      <div className="text-xs text-zinc-500">Or click to select files.</div>
                    </div>
                  </div>
                  <input
                    className="hidden"
                    type="file"
                    multiple
                    onChange={(e) => {
                      const files = e.target.files;
                      if (files) void uploadFiles(files);
                      e.currentTarget.value = "";
                    }}
                  />
                  <Button variant="secondary" size="sm" type="button">
                    Choose
                  </Button>
                </label>

                {uploads.length ? (
                  <div className="mt-3 space-y-1">
                    {uploads.map((u) => (
                      <div
                        key={`${u.name}-${u.status}`}
                        className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs"
                      >
                        <div className="min-w-0 truncate text-zinc-200">{u.name}</div>
                        <div
                          className={cn(
                            "shrink-0",
                            u.status === "done" && "text-emerald-300",
                            u.status === "uploading" && "text-zinc-300",
                            u.status === "error" && "text-red-300",
                          )}
                        >
                          {u.status === "uploading" ? "Uploading…" : u.status === "done" ? "Uploaded" : "Failed"}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>

              {/* Errors */}
              {error ? (
                <div className="px-4 pb-4 text-sm text-zinc-400">
                  <div className="font-medium text-white">S3 not configured yet</div>
                  <div className="mt-1">Add AWS env vars (see `env.example`) and redeploy.</div>
                  <div className="mt-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-zinc-300">
                    {error}
                  </div>
                </div>
              ) : null}

              {/* Listing */}
              {!error && folders && files ? (
                <div className="pb-4">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-zinc-950/70 backdrop-blur">
                      <tr className="text-left text-xs text-zinc-500">
                        <th className="px-4 py-2 font-medium">Name</th>
                        <th className="px-4 py-2 font-medium">Size</th>
                        <th className="px-4 py-2 font-medium">Modified</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {folders.map((f) => (
                        <tr
                          key={f.path}
                          className="cursor-pointer hover:bg-white/5"
                          onClick={() => goToPath(f.path)}
                        >
                          <td className="px-4 py-2 font-medium text-white">
                            <div className="flex items-center gap-2">
                              <Folder className="h-4 w-4 text-emerald-300" />
                              <span className="truncate">{f.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-2 text-zinc-400">—</td>
                          <td className="px-4 py-2 text-zinc-500">—</td>
                        </tr>
                      ))}

                      {files.length === 0 && folders.length === 0 ? (
                        <tr>
                          <td className="px-4 py-8 text-center text-sm text-zinc-400" colSpan={3}>
                            This folder is empty.
                          </td>
                        </tr>
                      ) : null}

                      {files.map((x) => {
                        const kind = kindFor(x.name);
                        const Icon = rowIcon(kind);
                        return (
                          <tr
                            key={x.key}
                            className="cursor-pointer hover:bg-white/5"
                            onClick={() => void openPreview(x)}
                          >
                            <td className="px-4 py-2 font-medium text-white">
                              <div className="flex items-center gap-2">
                                <Icon className="h-4 w-4 text-zinc-300" />
                                <span className="truncate">{x.name}</span>
                              </div>
                            </td>
                            <td className="px-4 py-2 text-zinc-300">{humanBytes(x.size)}</td>
                            <td className="px-4 py-2 text-zinc-500">
                              {x.lastModified ? new Date(x.lastModified).toLocaleString() : "—"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {/* Preview modal */}
        {preview ? (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) setPreview(null);
            }}
          >
            <div className="w-full max-w-4xl overflow-hidden rounded-3xl border border-white/10 bg-zinc-950 shadow-[0_30px_120px_-40px_rgba(0,0,0,0.9)]">
              <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-white">{preview.file.name}</div>
                  <div className="text-xs text-zinc-500">Preview</div>
                </div>
                <div className="flex items-center gap-2">
                  {preview.url ? (
                    <a
                      href={preview.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex"
                      title="Open in new tab"
                    >
                      <Button variant="secondary" size="sm" type="button">
                        <Download className="h-4 w-4" />
                        Open
                      </Button>
                    </a>
                  ) : null}
                  <Button variant="ghost" size="sm" onClick={() => setPreview(null)} aria-label="Close preview">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="max-h-[75vh] overflow-auto p-5">
                {preview.loading ? (
                  <div className="flex items-center gap-2 text-sm text-zinc-300">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading preview…
                  </div>
                ) : preview.error ? (
                  <div className="text-sm text-red-300">{preview.error}</div>
                ) : preview.url ? (
                  (() => {
                    const k = kindFor(preview.file.name);
                    if (k === "image") {
                      // eslint-disable-next-line @next/next/no-img-element
                      return (
                        <img
                          src={preview.url}
                          alt={preview.file.name}
                          className="mx-auto max-h-[70vh] rounded-2xl border border-white/10"
                        />
                      );
                    }
                    if (k === "pdf") {
                      return (
                        <iframe
                          title={preview.file.name}
                          src={preview.url}
                          className="h-[70vh] w-full rounded-2xl border border-white/10 bg-black"
                        />
                      );
                    }
                    return (
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-zinc-300">
                        Preview not available for this file type. Use <span className="text-white">Open</span> to view
                        it in a new tab.
                      </div>
                    );
                  })()
                ) : null}
              </div>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}


