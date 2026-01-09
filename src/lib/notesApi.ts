export async function getNotes() {
  const res = await fetch("/api/notes", { method: "GET", cache: "no-store" });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Notes load failed: ${res.status}`);
  }
  return (await res.json()) as { text: string; updatedAt: string | null };
}

export async function saveNotes(params: { text: string }) {
  const res = await fetch("/api/notes", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Notes save failed: ${res.status}`);
  }
  return (await res.json()) as { ok: true; updatedAt: string };
}

export type NotesDoc = {
  text: string;
  updatedAt: string | null;
};

export async function getNotes(): Promise<NotesDoc> {
  const res = await fetch("/api/notes", { method: "GET", cache: "no-store" });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(t || `Notes load failed: ${res.status}`);
  }
  return (await res.json()) as NotesDoc;
}

export async function saveNotes(text: string): Promise<NotesDoc & { ok: true }> {
  const res = await fetch("/api/notes", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(t || `Notes save failed: ${res.status}`);
  }
  return (await res.json()) as NotesDoc & { ok: true };
}


