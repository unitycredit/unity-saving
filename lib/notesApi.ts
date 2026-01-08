export type NoteSummary = {
  id: string;
  key: string;
  title: string;
  createdAt: string | null;
  updatedAt: string | null;
  size: number;
};

export type NoteDoc = {
  id: string;
  title: string;
  content: string;
  createdAt: string | null;
  updatedAt: string;
};

export async function listNotes() {
  const res = await fetch("/api/notes/list", { method: "GET", cache: "no-store" });
  if (!res.ok) {
    const raw = await res.text().catch(() => "");
    try {
      const parsed = JSON.parse(raw) as { error?: string };
      throw new Error(parsed.error || `List notes failed: ${res.status}`);
    } catch {
      throw new Error(raw || `List notes failed: ${res.status}`);
    }
  }
  return (await res.json()) as { notes: NoteSummary[] };
}

export async function getNote(id: string) {
  const res = await fetch(`/api/notes/get?id=${encodeURIComponent(id)}`, { method: "GET", cache: "no-store" });
  if (!res.ok) {
    const raw = await res.text().catch(() => "");
    try {
      const parsed = JSON.parse(raw) as { error?: string };
      throw new Error(parsed.error || `Get note failed: ${res.status}`);
    } catch {
      throw new Error(raw || `Get note failed: ${res.status}`);
    }
  }
  return (await res.json()) as { note: NoteDoc };
}

export async function saveNote(params: { id: string; content: string }) {
  const res = await fetch("/api/notes/save", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const raw = await res.text().catch(() => "");
    try {
      const parsed = JSON.parse(raw) as { error?: string };
      throw new Error(parsed.error || `Save note failed: ${res.status}`);
    } catch {
      throw new Error(raw || `Save note failed: ${res.status}`);
    }
  }
  return (await res.json()) as { ok: true; note: NoteDoc; key: string };
}

export async function deleteNote(params: { id: string }) {
  const res = await fetch("/api/notes/delete", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const raw = await res.text().catch(() => "");
    try {
      const parsed = JSON.parse(raw) as { error?: string };
      throw new Error(parsed.error || `Delete note failed: ${res.status}`);
    } catch {
      throw new Error(raw || `Delete note failed: ${res.status}`);
    }
  }
  return (await res.json()) as { ok: true; id: string; key: string };
}

