"use client";

import * as React from "react";
import { FilePlus2, Loader2, RefreshCw, Search, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";
import { deleteNote, getNote, listNotes, saveNote, type NoteSummary } from "@/lib/notesApi";

function newNoteId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function formatWhen(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

export function NotesSection() {
  const { toast } = useToast();

  const [notes, setNotes] = React.useState<NoteSummary[] | null>(null);
  const [loadingList, setLoadingList] = React.useState(false);
  const [listError, setListError] = React.useState<string | null>(null);

  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [content, setContent] = React.useState("");
  const [dirty, setDirty] = React.useState(false);

  const [status, setStatus] = React.useState<
    | { state: "idle" }
    | { state: "saving" }
    | { state: "saved"; at: string }
    | { state: "error"; message: string }
  >({ state: "idle" });

  const [query, setQuery] = React.useState("");

  const loadingNoteRef = React.useRef(0);
  const saveSeqRef = React.useRef(0);

  const refreshList = React.useCallback(async () => {
    setLoadingList(true);
    setListError(null);
    try {
      const out = await listNotes();
      setNotes(out.notes ?? []);
    } catch (e) {
      setNotes(null);
      setListError(e instanceof Error ? e.message : "Failed to load notes.");
    } finally {
      setLoadingList(false);
    }
  }, []);

  React.useEffect(() => {
    void refreshList();
  }, [refreshList]);

  const filtered = React.useMemo(() => {
    const list = notes ?? [];
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter((n) => `${n.title} ${n.id}`.toLowerCase().includes(q));
  }, [notes, query]);

  async function loadNote(id: string) {
    const token = ++loadingNoteRef.current;
    setStatus({ state: "idle" });
    setDirty(false);
    try {
      const out = await getNote(id);
      if (loadingNoteRef.current !== token) return;
      setActiveId(out.note.id);
      setContent(out.note.content ?? "");
      setDirty(false);
      setStatus({ state: "saved", at: out.note.updatedAt });
    } catch (e) {
      if (loadingNoteRef.current !== token) return;
      setActiveId(id);
      setContent("");
      setDirty(false);
      setStatus({ state: "error", message: e instanceof Error ? e.message : "Failed to load note." });
    }
  }

  async function flushSave(id: string, nextContent: string) {
    const seq = ++saveSeqRef.current;
    setStatus({ state: "saving" });
    try {
      const out = await saveNote({ id, content: nextContent });
      if (saveSeqRef.current !== seq) return;
      setDirty(false);
      setStatus({ state: "saved", at: out.note.updatedAt });

      // Update list locally (fast) so sidebar stays in sync without a full refresh.
      setNotes((prev) => {
        const list = prev ?? [];
        const existingIdx = list.findIndex((n) => n.id === id);
        const updated: NoteSummary = {
          id,
          key: out.key,
          title: out.note.title,
          size: JSON.stringify(out.note).length,
          createdAt: out.note.createdAt,
          updatedAt: out.note.updatedAt,
        };
        if (existingIdx === -1) return [updated, ...list];
        const next = [...list];
        next[existingIdx] = updated;
        // Move to top
        next.sort((a, b) => {
          const ad = a.updatedAt ? Date.parse(a.updatedAt) : 0;
          const bd = b.updatedAt ? Date.parse(b.updatedAt) : 0;
          return bd - ad;
        });
        return next;
      });
    } catch (e) {
      if (saveSeqRef.current !== seq) return;
      setStatus({ state: "error", message: e instanceof Error ? e.message : "Save failed." });
    }
  }

  // Debounced autosave: 2 seconds after typing stops.
  React.useEffect(() => {
    if (!activeId) return;
    if (!dirty) return;

    const t = window.setTimeout(() => {
      void flushSave(activeId, content);
    }, 2000);

    return () => window.clearTimeout(t);
  }, [activeId, content, dirty]);

  async function selectNote(id: string) {
    // If we have unsaved changes, save immediately before switching.
    if (activeId && dirty) {
      await flushSave(activeId, content);
    }
    await loadNote(id);
  }

  async function createNew() {
    const id = newNoteId();
    // Create the note immediately in S3 so it shows up in the list.
    setActiveId(id);
    setContent("");
    setDirty(false);
    setStatus({ state: "saving" });
    try {
      await saveNote({ id, content: "" });
      toast({ title: "Note created", message: "Untitled note", variant: "success" });
      await refreshList();
      await loadNote(id);
    } catch (e) {
      setStatus({ state: "error", message: e instanceof Error ? e.message : "Failed to create note." });
    }
  }

  async function remove(id: string) {
    const ok = window.confirm("Delete this note? This cannot be undone.");
    if (!ok) return;
    try {
      await deleteNote({ id });
      toast({ title: "Deleted", message: "Note removed", variant: "success" });
      setNotes((prev) => (prev ?? []).filter((n) => n.id !== id));
      if (activeId === id) {
        setActiveId(null);
        setContent("");
        setDirty(false);
        setStatus({ state: "idle" });
      }
    } catch (e) {
      toast({ title: "Delete failed", message: e instanceof Error ? e.message : "Failed to delete note.", variant: "error" });
    }
  }

  const statusLabel =
    status.state === "idle"
      ? dirty
        ? "Unsaved changes"
        : "Idle"
      : status.state === "saving"
        ? "Saving…"
        : status.state === "saved"
          ? `Saved • ${formatWhen(status.at)}`
          : `Error • ${status.message}`;

  return (
    <Card className="overflow-hidden">
      <div className="p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm font-semibold tracking-wide text-[#0066FF]">Notes</div>
            <div className="mt-1 text-xl font-semibold tracking-tight text-slate-900">Editor</div>
            <div className="mt-1 text-sm text-slate-600">Autosaves to S3 as JSON (debounced 2 seconds).</div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => void createNew()}
              className="border border-[#0066FF]/25 bg-[#0066FF] text-white shadow-[0_18px_45px_-25px_rgba(0,102,255,0.55)] hover:bg-[#005AE0] active:bg-[#004FC6]"
            >
              <FilePlus2 className="h-4 w-4" />
              New note
            </Button>
            <Button variant="secondary" size="sm" onClick={() => void refreshList()} disabled={loadingList}>
              <RefreshCw className={cn("h-4 w-4", loadingList && "animate-spin")} />
              Refresh
            </Button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[320px_1fr]">
          {/* Sidebar */}
          <div className="overflow-hidden rounded-3xl border border-[#0066FF]/10 bg-white shadow-sm">
            <div className="border-b border-[#0066FF]/10 px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search notes…" className="h-10 pl-9" />
                </div>
              </div>
              <div className="mt-2 text-xs text-slate-500">
                {notes ? `${filtered.length} note(s)` : "Configure AWS env vars to load notes."}
              </div>
            </div>

            <div className="max-h-[460px] overflow-auto p-2">
              {listError ? (
                <div className="rounded-2xl border border-black/5 bg-white/70 px-3 py-2 text-sm text-slate-700">
                  <div className="font-semibold text-slate-900">Couldn’t load notes</div>
                  <div className="mt-1 text-slate-600">{listError}</div>
                </div>
              ) : null}

              {!listError && notes && filtered.length === 0 ? (
                <div className="px-3 py-10 text-center text-sm text-slate-500">No notes yet.</div>
              ) : null}

              {notes
                ? filtered.map((n) => {
                    const active = n.id === activeId;
                    return (
                      <div
                        key={n.id}
                        className={cn(
                          "mb-2 flex items-start justify-between gap-2 rounded-3xl border px-3 py-3 transition-colors",
                          active ? "border-[#0066FF]/25 bg-[#0066FF]/[0.04]" : "border-black/5 bg-white hover:bg-[#0066FF]/[0.03]",
                        )}
                      >
                        <button type="button" className="min-w-0 flex-1 text-left" onClick={() => void selectNote(n.id)}>
                          <div className="truncate text-sm font-semibold text-slate-900">{n.title || "Untitled note"}</div>
                          <div className="mt-0.5 truncate text-xs text-slate-500">Created {formatWhen(n.createdAt)}</div>
                        </button>
                        <button
                          type="button"
                          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-black/5 bg-white/70 text-slate-700 transition-colors hover:bg-white"
                          onClick={() => void remove(n.id)}
                          title="Delete"
                          aria-label="Delete note"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    );
                  })
                : null}
            </div>
          </div>

          {/* Editor */}
          <div className="overflow-hidden rounded-3xl border border-[#0066FF]/10 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#0066FF]/10 px-5 py-4">
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-slate-900">
                  {activeId ? "Editing note" : "Select a note"}
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  {activeId ? "Autosave is enabled." : "Choose a note on the left or create a new one."}
                </div>
              </div>
              {activeId ? (
                <div className="text-xs font-medium text-slate-500 tabular-nums">{dirty ? "●" : "○"}</div>
              ) : null}
            </div>

            <div className="p-5">
              {activeId ? (
                <div className="space-y-3">
                  <textarea
                    value={content}
                    onChange={(e) => {
                      setContent(e.target.value);
                      setDirty(true);
                      if (status.state !== "saving") setStatus({ state: "idle" });
                    }}
                    placeholder="Start typing… (autosaves 2 seconds after you stop typing)"
                    className={cn(
                      "min-h-[360px] w-full resize-y rounded-3xl border border-[#0066FF]/18 bg-white px-4 py-4 text-[15px] leading-relaxed text-slate-900 shadow-sm",
                      "placeholder:text-slate-400",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066FF]/30 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
                    )}
                  />
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <div
                      className={cn(
                        "text-slate-500",
                        status.state === "error" && "text-red-600",
                        status.state === "saving" && "text-slate-700",
                      )}
                    >
                      Last Saved:{" "}
                      <span className="font-medium">
                        {status.state === "saved"
                          ? formatWhen(status.at)
                          : status.state === "saving"
                            ? "Saving…"
                            : status.state === "error"
                              ? "Error"
                              : dirty
                                ? "Pending…"
                                : "—"}
                      </span>
                    </div>
                    <div className="text-slate-500">{status.state === "error" ? statusLabel : null}</div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center rounded-3xl border border-dashed border-black/10 bg-white/40 px-4 py-16 text-sm text-slate-500">
                  {loadingList ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading…
                    </div>
                  ) : (
                    "Create or select a note to begin."
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

