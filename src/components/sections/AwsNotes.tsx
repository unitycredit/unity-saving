"use client";

import * as React from "react";
import { Cloud, Loader2, Save } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Textarea } from "@/components/ui/Textarea";
import { useToast } from "@/components/ui/Toast";
import { getNotes, saveNotes } from "@/lib/notesApi";

export function AwsNotes() {
  const { toast } = useToast();
  const [text, setText] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = React.useState<string | null>(null);

  const dirtyRef = React.useRef(false);
  const saveTimerRef = React.useRef<number | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const out = await getNotes();
      setText(typeof out.text === "string" ? out.text : "");
      setLastSavedAt(out.updatedAt);
      dirtyRef.current = false;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load notes");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const doSave = React.useCallback(
    async (showToast: boolean) => {
      if (!dirtyRef.current) return;
      setSaving(true);
      setError(null);
      try {
        const out = await saveNotes({ text });
        setLastSavedAt(out.updatedAt);
        dirtyRef.current = false;
        if (showToast) toast({ title: "Saved", message: "Notes stored in AWS.", variant: "success" });
      } catch (e) {
        const message = e instanceof Error ? e.message : "Failed to save notes";
        setError(message);
        toast({ title: "Save failed", message, variant: "error" });
      } finally {
        setSaving(false);
      }
    },
    [text, toast],
  );

  React.useEffect(() => {
    if (!dirtyRef.current) return;
    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    saveTimerRef.current = window.setTimeout(() => {
      void doSave(false);
    }, 700);
    return () => {
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    };
  }, [text, doSave]);

  function onChange(next: string) {
    dirtyRef.current = true;
    setText(next);
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div>
          <CardTitle className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[#0066FF]/15 bg-[#0066FF]/10">
              <Cloud className="h-5 w-5 text-[#0066FF]" />
            </div>
            Notes
          </CardTitle>
          <CardDescription>Financial goals and reminders — saved to AWS (S3 JSON, per user).</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => void load()} disabled={loading || saving}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading…
              </>
            ) : (
              "Refresh"
            )}
          </Button>
          <Button variant="primary" size="sm" onClick={() => void doSave(true)} disabled={loading || saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {error ? (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}
        <Textarea
          value={text}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Write financial goals, reminders, and important notes…"
          className="min-h-72 resize-none"
          disabled={loading}
        />
        <div className="flex items-center justify-between gap-3 text-xs text-slate-500">
          <div>{dirtyRef.current ? "Unsaved changes…" : "All changes saved to AWS."}</div>
          <div>{lastSavedAt ? `Last saved: ${new Date(lastSavedAt).toLocaleString()}` : ""}</div>
        </div>
      </CardContent>
    </Card>
  );
}


