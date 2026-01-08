"use client";

import * as React from "react";

import { useLocalStorage } from "@/hooks/useLocalStorage";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Textarea } from "@/components/ui/Textarea";

const STORAGE_KEY = "unitySaving.notes.v1";

export function NotesCard({ icon }: { icon: React.ReactNode }) {
  const [text, setText] = useLocalStorage<string>(STORAGE_KEY, "");
  const [status, setStatus] = React.useState<"idle" | "saved">("idle");

  React.useEffect(() => {
    setStatus("saved");
    const t = setTimeout(() => setStatus("idle"), 900);
    return () => clearTimeout(t);
  }, [text]);

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-2xl border border-white/10 bg-white/5 p-2.5 text-white">
            {icon}
          </div>
          <div>
            <CardTitle>Notes</CardTitle>
            <CardDescription>Auto-saves locally (for now).</CardDescription>
          </div>
        </div>
        <Button variant="secondary" size="sm" onClick={() => setText("")}>
          Clear
        </Button>
      </CardHeader>
      <CardContent>
        <div className="flex items-start justify-between gap-3">
          <div className="text-xs text-zinc-500">{status === "saved" ? "Saved" : ""}</div>
        </div>
        <div className="mt-3">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write notes here…"
            className="min-h-56 resize-none"
          />
        </div>
      </CardContent>
    </Card>
  );
}


