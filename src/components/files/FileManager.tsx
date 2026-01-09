"use client";

import * as React from "react";
import {
  ChevronRight,
  Download,
  File as FileIcon,
  FileText,
  FileType,
  Folder,
  Image as ImageIcon,
  Loader2,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";
import {
  deleteFile,
  listFolder,
  presignDownload,
  presignDownloadAttachment,
  presignUpload,
  type ListedFile,
  type ListedFolder,
} from "@/lib/cloudFiles";

const ROOTS = ["Bank Statements", "Personal", "Emergency Fund"] as const;
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
  if (["doc", "docx"].includes(e)) return "doc";
  if (["txt", "csv", "json", "md", "log"].includes(e)) return "text";
  return "file";
}

function rowIcon(kind: ReturnType<typeof kindFor>) {
  if (kind === "image") return ImageIcon;
  if (kind === "doc") return FileType;
  if (kind === "text" || kind === "pdf") return FileText;
  return FileIcon;
}

function kindBadge(kind: ReturnType<typeof kindFor>) {
  if (kind === "pdf") return { label: "PDF", className: "bg-red-500/10 text-red-700 border-red-500/15" };
  if (kind === "doc") return { label: "DOC", className: "bg-[#0066FF]/10 text-[#0B3B9C] border-[#0066FF]/15" };
  return null;
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

type UploadItem = {
  id: string;
  name: string;
  progress: number; // 0-100
  status: "uploading" | "done" | "error";
  message?: string;
};

export function FileManager(
  props: {
    compact?: boolean;
    uploadActionRef?: React.MutableRefObject<(() => void) | null>;
    defaultView?: "browse" | "all";
  } = {},
) {
  const { compact = false, uploadActionRef, defaultView = "browse" } = props;
  const { toast } = useToast();

  const [root, setRoot] = React.useState<Root>(ROOTS[0]);
  const [subpath, setSubpath] = React.useState<string>(""); // without root
  const currentPath = subpath ? `${root}/${subpath}` : root;

  const [view, setView] = React.useState<"browse" | "all">(defaultView);

  const [folders, setFolders] = React.useState<ListedFolder[] | null>(null);
  const [files, setFiles] = React.useState<ListedFile[] | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [dragOver, setDragOver] = React.useState(false);
  const [uploads, setUploads] = React.useState<UploadItem[]>([]);

  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

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
      const out = await listFolder(view === "all" ? "__all__" : currentPath);
      setFolders(out.folders ?? []);
      setFiles(out.items ?? []);
    } catch (e) {
      setFolders(null);
      setFiles(null);
      setError(e instanceof Error ? e.message : "Failed to load from S3.");
    } finally {
      setLoading(false);
    }
  }, [currentPath, view]);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  React.useEffect(() => {
    if (!uploadActionRef) return;
    uploadActionRef.current = () => fileInputRef.current?.click();
    return () => {
      uploadActionRef.current = null;
    };
  }, [uploadActionRef]);

  function goToPath(path: string) {
    const parts = splitPath(path);
    const nextRoot = (parts[0] as Root | undefined) ?? ROOTS[0];
    if (!ROOTS.includes(nextRoot)) {
      setRoot(ROOTS[0]);
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

  function uploadId(file: File) {
    return `${file.name}-${file.size}-${file.lastModified}`;
  }

  async function uploadFiles(fileList: FileList | File[]) {
    const arr = Array.isArray(fileList) ? fileList : Array.from(fileList);
    if (arr.length === 0) return;

    const initial: UploadItem[] = arr.map((f) => ({
      id: uploadId(f),
      name: f.name,
      progress: 0,
      status: "uploading",
    }));
    setUploads((prev) => [...initial, ...prev].slice(0, 6));

    for (const file of arr) {
      const id = uploadId(file);
      try {
        const presigned = await presignUpload({
          folder: currentPath,
          fileName: file.name,
          contentType: file.type || "application/octet-stream",
        });

        await putWithProgress({
          url: presigned.url,
          file,
          contentType: file.type || "application/octet-stream",
          onProgress: (pct) => {
            setUploads((prev) => prev.map((u) => (u.id === id ? { ...u, progress: pct } : u)));
          },
        });

        setUploads((prev) =>
          prev.map((u) => (u.id === id ? { ...u, status: "done", progress: 100 } : u)),
        );
        toast({ title: "Uploaded", message: file.name, variant: "success" });
      } catch (e) {
        const message = e instanceof Error ? e.message : "Upload failed";
        setUploads((prev) =>
          prev.map((u) => (u.id === id ? { ...u, status: "error", message } : u)),
        );
        toast({ title: "Upload failed", message: `${file.name} — ${message}`, variant: "error" });
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

  async function startDownload(file: ListedFile) {
    try {
      const out = await presignDownloadAttachment({ key: file.key });
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

  async function removeFile(file: ListedFile) {
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

  const contentMaxHeight = compact ? "max-h-[420px]" : "max-h-[640px]";

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle className="text-lg">My Drive</CardTitle>
          <CardDescription>Upload, organize, and preview your documents inside Unity Saving.</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setView((v) => (v === "all" ? "browse" : "all"))}
            title={view === "all" ? "Switch to folder browsing" : "Show all files in the bucket"}
          >
            {view === "all" ? "Browse folders" : "All files"}
          </Button>
          <Button variant="secondary" size="sm" onClick={refresh} disabled={loading} title="Refresh">
            {loading ? "Loading…" : "Refresh"}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Folders */}
        <section className={view === "all" ? "hidden" : undefined}>
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="text-sm font-semibold text-slate-900">Folders</div>
            <div className="text-xs text-slate-500">Choose a category to browse.</div>
          </div>
          <div className={cn("grid gap-3", compact ? "sm:grid-cols-3" : "sm:grid-cols-2 lg:grid-cols-3")}>
            {ROOTS.map((r) => {
              const active = root === r && !subpath;
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => {
                    setRoot(r);
                    setSubpath("");
                  }}
                  className={cn(
                    "group flex items-center justify-between gap-3 rounded-3xl border bg-white/70 px-4 py-4 text-left shadow-sm backdrop-blur-xl transition-colors",
                    active ? "border-[#0066FF]/25 bg-white" : "border-black/5 hover:bg-white",
                  )}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "flex h-11 w-11 items-center justify-center rounded-3xl border bg-white/70",
                          active ? "border-[#0066FF]/20" : "border-black/5",
                        )}
                      >
                        <Folder className={cn("h-5 w-5", active ? "text-[#0066FF]" : "text-slate-600")} />
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-slate-900">{r}</div>
                        <div className="truncate text-xs text-slate-500">Open folder</div>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-slate-400" />
                </button>
              );
            })}
          </div>
        </section>

        {/* Browser */}
        <section className="overflow-hidden rounded-3xl border border-black/5 bg-white/70 shadow-sm backdrop-blur-xl">
          <div className="border-b border-black/5 px-5 py-4">
            {view === "browse" ? (
              <div className="flex flex-wrap items-center gap-1.5 text-sm">
                <button
                  type="button"
                  onClick={() => {
                    setSubpath("");
                  }}
                  className="font-semibold text-slate-900 hover:underline"
                >
                  {root}
                </button>
                {breadcrumbs.slice(1).map((segment, idx) => {
                  const target = [root, ...breadcrumbs.slice(1, idx + 2)].join("/");
                  return (
                    <React.Fragment key={target}>
                      <ChevronRight className="h-4 w-4 text-slate-300" />
                      <button
                        type="button"
                        onClick={() => goToPath(target)}
                        className="text-slate-600 hover:text-slate-900 hover:underline"
                      >
                        {segment}
                      </button>
                    </React.Fragment>
                  );
                })}
              </div>
            ) : (
              <div className="text-sm font-semibold text-slate-900">All files</div>
            )}

            <div className="mt-2 flex items-center justify-between gap-3">
              <div className="text-xs text-slate-500">
                {folders && files ? `${folders.length} folder(s) • ${files.length} file(s)` : "Configure S3 env vars to load objects."}
              </div>
              {view === "browse" ? (
                <Button variant="ghost" size="sm" onClick={goUp} disabled={!subpath}>
                  Up
                </Button>
              ) : null}
            </div>
          </div>

          <div className={cn("overflow-auto", contentMaxHeight)}>
            {/* Upload dropzone (supports drag & drop + external Upload button) */}
            <div className="p-5">
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
                  "flex cursor-pointer items-center justify-between gap-4 rounded-3xl border border-dashed px-4 py-4 transition-colors",
                  dragOver ? "border-[#0066FF]/35 bg-[#0066FF]/5" : "border-black/10 bg-white/60 hover:bg-white",
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-3xl border border-black/5 bg-white/70">
                    <UploadCloud className="h-5 w-5 text-[#0066FF]" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-900">Drag & drop to upload</div>
                    <div className="text-xs text-slate-500">Or click to select files.</div>
                  </div>
                </div>

                <input
                  ref={fileInputRef}
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
                <div className="mt-3 space-y-1.5">
                  {uploads.map((u) => (
                    <div
                      key={u.id}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-black/5 bg-white/60 px-3 py-2 text-xs"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-slate-700">{u.name}</div>
                        {u.status === "uploading" ? (
                          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-black/10">
                            <div
                              className="h-full rounded-full bg-[#0066FF] transition-[width]"
                              style={{ width: `${u.progress}%` }}
                            />
                          </div>
                        ) : null}
                        {u.status === "error" && u.message ? (
                          <div className="mt-1 truncate text-[11px] text-red-600">{u.message}</div>
                        ) : null}
                      </div>
                      <div
                        className={cn(
                          "shrink-0 pl-3 font-medium tabular-nums",
                          u.status === "done" && "text-emerald-600",
                          u.status === "uploading" && "text-slate-600",
                          u.status === "error" && "text-red-600",
                        )}
                        title={u.status === "uploading" ? `${u.progress}%` : undefined}
                      >
                        {u.status === "uploading"
                          ? `${u.progress}%`
                          : u.status === "done"
                            ? "Uploaded"
                            : "Failed"}
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            {/* Errors */}
            {error ? (
              <div className="px-5 pb-5 text-sm text-slate-600">
                <div className="font-semibold text-slate-900">S3 not configured yet</div>
                <div className="mt-1">Add AWS env vars (see `env.example`) and redeploy.</div>
                <div className="mt-3 rounded-2xl border border-black/5 bg-white/60 px-3 py-2 text-xs text-slate-700">
                  {error}
                </div>
              </div>
            ) : null}

            {/* Listing */}
            {!error && folders && files ? (
              <div className="px-2 pb-3">
                <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Name{" "}
                  <span className="float-right hidden sm:inline">
                    {view === "all" ? "Folder • Size • Date Uploaded" : "Size • Date Uploaded"}
                  </span>
                </div>

                <div className="space-y-1">
                  {view === "browse"
                    ? folders.map((f) => (
                    <button
                      key={f.path}
                      type="button"
                      className="w-full rounded-2xl px-3 py-3 text-left transition-colors hover:bg-black/5"
                      onClick={() => goToPath(f.path)}
                    >
                      <div className="grid items-center gap-3 sm:grid-cols-[1fr_110px_160px]">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-black/5 bg-white/70">
                            <Folder className="h-5 w-5 text-[#0066FF]" />
                          </div>
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold text-slate-900">{f.name}</div>
                            <div className="truncate text-xs text-slate-500">Folder</div>
                          </div>
                        </div>
                        <div className="hidden text-xs text-slate-500 sm:block">—</div>
                        <div className="hidden text-xs text-slate-500 sm:block">—</div>
                      </div>
                    </button>
                    ))
                    : null}

                  {files.length === 0 && (view === "all" ? true : folders.length === 0) ? (
                    <div className="px-3 py-10 text-center text-sm text-slate-500">This folder is empty.</div>
                  ) : null}

                  {files.map((x) => {
                    const kind = kindFor(x.name);
                    const Icon = rowIcon(kind);
                    const badge = kindBadge(kind);
                    return (
                      <div
                        key={x.key}
                        className="w-full rounded-2xl px-3 py-3 text-left transition-colors hover:bg-black/5"
                      >
                        <div className="grid items-center gap-3 sm:grid-cols-[1fr_140px_120px_170px_92px]">
                          <button
                            type="button"
                            className="flex min-w-0 items-center gap-3 text-left"
                            onClick={() => void openPreview(x)}
                          >
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-black/5 bg-white/70">
                              <div className="relative">
                                <Icon className="h-5 w-5 text-slate-600" />
                              </div>
                            </div>
                            <div className="min-w-0">
                              <div className="flex min-w-0 items-center gap-2">
                                <div className="truncate text-sm font-semibold text-slate-900">{x.name}</div>
                                {badge ? (
                                  <span
                                    className={cn(
                                      "hidden shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-wide sm:inline",
                                      badge.className,
                                    )}
                                  >
                                    {badge.label}
                                  </span>
                                ) : null}
                              </div>
                              <div className="truncate text-xs text-slate-500">File</div>
                              <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-slate-500 sm:hidden">
                                <span className="font-medium text-slate-700">{humanBytes(x.size)}</span>
                                <span>
                                  {x.lastModified ? new Date(x.lastModified).toLocaleDateString() : "—"}
                                </span>
                              </div>
                            </div>
                          </button>

                          <div className="hidden truncate text-xs text-slate-500 sm:block" title={x.path ? x.path : undefined}>
                            {view === "all" ? x.path ?? "—" : "—"}
                          </div>
                          <div className="hidden text-xs text-slate-600 sm:block">{humanBytes(x.size)}</div>
                          <div className="hidden text-xs text-slate-500 sm:block">
                            {x.lastModified ? new Date(x.lastModified).toLocaleString() : "—"}
                          </div>
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-black/5 bg-white/70 text-slate-700 transition-colors hover:bg-white"
                              onClick={() => void startDownload(x)}
                              aria-label={`Download ${x.name}`}
                              title="Download"
                            >
                              <Download className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-black/5 bg-white/70 text-slate-700 transition-colors hover:bg-white"
                              onClick={() => void removeFile(x)}
                              aria-label={`Delete ${x.name}`}
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>
        </section>

        {/* Preview modal */}
        {preview ? (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) setPreview(null);
            }}
          >
            <div className="w-full max-w-4xl overflow-hidden rounded-3xl border border-black/10 bg-white/80 shadow-[0_30px_120px_-40px_rgba(2,6,23,0.45)] backdrop-blur-xl">
              <div className="flex items-center justify-between gap-3 border-b border-black/5 px-5 py-4">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-slate-900">{preview.file.name}</div>
                  <div className="text-xs text-slate-500">Preview</div>
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
                  <div className="flex items-center gap-2 text-sm text-slate-700">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading preview…
                  </div>
                ) : preview.error ? (
                  <div className="text-sm text-red-600">{preview.error}</div>
                ) : preview.url ? (
                  (() => {
                    const k = kindFor(preview.file.name);
                    if (k === "image") {
                      // eslint-disable-next-line @next/next/no-img-element
                      return (
                        <img
                          src={preview.url}
                          alt={preview.file.name}
                          className="mx-auto max-h-[70vh] rounded-2xl border border-black/10 bg-white"
                        />
                      );
                    }
                    if (k === "pdf") {
                      return (
                        <iframe
                          title={preview.file.name}
                          src={preview.url}
                          className="h-[70vh] w-full rounded-2xl border border-black/10 bg-white"
                        />
                      );
                    }
                    return (
                      <div className="rounded-2xl border border-black/10 bg-white/70 p-4 text-sm text-slate-700">
                        Preview not available for this file type. Use <span className="font-medium text-slate-900">Open</span> to view
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


