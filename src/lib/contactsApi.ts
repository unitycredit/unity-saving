export type Contact = {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  role?: string;
  notes?: string;
  createdAt: string;
};

export async function getContacts() {
  const res = await fetch("/api/contacts", { method: "GET", cache: "no-store" });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Contacts load failed: ${res.status}`);
  }
  return (await res.json()) as { items: Contact[]; updatedAt: string | null };
}

export async function saveContacts(params: { items: Contact[] }) {
  const res = await fetch("/api/contacts", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Contacts save failed: ${res.status}`);
  }
  return (await res.json()) as { ok: true; updatedAt: string };
}

import type { Contact } from "@/app/api/contacts/route";

export type ContactsDoc = {
  items: Contact[];
  updatedAt: string | null;
};

export async function getContacts(): Promise<ContactsDoc> {
  const res = await fetch("/api/contacts", { method: "GET", cache: "no-store" });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(t || `Contacts load failed: ${res.status}`);
  }
  return (await res.json()) as ContactsDoc;
}

export async function saveContacts(items: Contact[]): Promise<ContactsDoc & { ok: true }> {
  const res = await fetch("/api/contacts", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ items }),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(t || `Contacts save failed: ${res.status}`);
  }
  return (await res.json()) as ContactsDoc & { ok: true };
}


