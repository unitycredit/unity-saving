export type Contact = {
  id: string;
  fullName: string;
  role: string;
  phone: string;
  email: string;
  privateNotes: string;
  createdAt: string;
  updatedAt: string;
};

export async function getContacts() {
  const res = await fetch("/api/contacts/get", { method: "GET", cache: "no-store" });
  if (!res.ok) {
    const raw = await res.text().catch(() => "");
    try {
      const parsed = JSON.parse(raw) as { error?: string };
      throw new Error(parsed.error || `Get contacts failed: ${res.status}`);
    } catch {
      throw new Error(raw || `Get contacts failed: ${res.status}`);
    }
  }
  return (await res.json()) as { ok: true; key: string; updatedAt: string | null; contacts: Contact[] };
}

export async function saveContacts(params: { contacts: Contact[] }) {
  const res = await fetch("/api/contacts/save", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const raw = await res.text().catch(() => "");
    try {
      const parsed = JSON.parse(raw) as { error?: string };
      throw new Error(parsed.error || `Save contacts failed: ${res.status}`);
    } catch {
      throw new Error(raw || `Save contacts failed: ${res.status}`);
    }
  }
  return (await res.json()) as { ok: true; key: string; updatedAt: string; count: number };
}

