"use client";

import * as React from "react";

import { useLocalStorage } from "@/hooks/useLocalStorage";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Textarea } from "@/components/ui/Textarea";

const STORAGE_KEY = "unitySaving.notebook.v1";

export function NotebookCard() {
  const [text, setText] = useLocalStorage<string>(STORAGE_KEY, "");
  const [status, setStatus] = React.useState<"idle" | "saved">("idle");

  React.useEffect(() => {
    setStatus("saved");
    const t = setTimeout(() => setStatus("idle"), 800);
    return () => clearTimeout(t);
  }, [text]);

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div>
          <CardTitle>Note Book</CardTitle>
          <CardDescription>Write notes — saved locally.</CardDescription>
        </div>
        <div className="text-xs text-zinc-500">{status === "saved" ? "Saved" : ""}</div>
      </CardHeader>
      <CardContent>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write notes here…"
          className="min-h-56 resize-none"
        />
      </CardContent>
    </Card>
  );
}


