"use client";

import * as React from "react";
import { Loader2, Plus, Save, Users } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { useToast } from "@/components/ui/Toast";
import { getContacts, saveContacts, type Contact } from "@/lib/contactsApi";

function createId() {
  try {
    return crypto.randomUUID();
  } catch {
    return `c_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  }
}

export function AwsContacts() {
  const { toast } = useToast();
  const [items, setItems] = React.useState<Contact[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [query, setQuery] = React.useState("");

  const [draft, setDraft] = React.useState<{
    id: string | null;
    name: string;
    phone: string;
    email: string;
    role: string;
    notes: string;
  }>({ id: null, name: "", phone: "", email: "", role: "", notes: "" });

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const out = await getContacts();
      setItems(Array.isArray(out.items) ? out.items : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load contacts");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  async function persist(next: Contact[], showToast: boolean) {
    setSaving(true);
    setError(null);
    try {
      await saveContacts({ items: next });
      setItems(next);
      if (showToast) toast({ title: "Saved", message: "Contacts stored in AWS.", variant: "success" });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to save contacts";
      setError(message);
      toast({ title: "Save failed", message, variant: "error" });
    } finally {
      setSaving(false);
    }
  }

  function resetDraft() {
    setDraft({ id: null, name: "", phone: "", email: "", role: "", notes: "" });
  }

  function beginEdit(c: Contact) {
    setDraft({
      id: c.id,
      name: c.name ?? "",
      phone: c.phone ?? "",
      email: c.email ?? "",
      role: c.role ?? "",
      notes: c.notes ?? "",
    });
  }

  async function submit() {
    const name = draft.name.trim();
    if (!name) return;
    const now = new Date().toISOString();

    const next: Contact[] =
      draft.id == null
        ? [
            {
              id: createId(),
              name,
              phone: draft.phone.trim() || undefined,
              email: draft.email.trim() || undefined,
              role: draft.role.trim() || undefined,
              notes: draft.notes.trim() || undefined,
              createdAt: now,
            },
            ...items,
          ]
        : items.map((c) =>
            c.id === draft.id
              ? {
                  ...c,
                  name,
                  phone: draft.phone.trim() || undefined,
                  email: draft.email.trim() || undefined,
                  role: draft.role.trim() || undefined,
                  notes: draft.notes.trim() || undefined,
                }
              : c,
          );

    resetDraft();
    await persist(next, true);
  }

  async function remove(id: string) {
    const ok = window.confirm("Delete this contact?");
    if (!ok) return;
    const next = items.filter((c) => c.id !== id);
    await persist(next, true);
  }

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((c) => {
      const hay = [c.name, c.email, c.phone, c.role, c.notes].filter(Boolean).join(" ").toLowerCase();
      return hay.includes(q);
    });
  }, [items, query]);

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div>
          <CardTitle className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[#0066FF]/15 bg-[#0066FF]/10">
              <Users className="h-5 w-5 text-[#0066FF]" />
            </div>
            Contacts
          </CardTitle>
          <CardDescription>Financial advisors, family, and trusted contacts — saved to AWS (S3 JSON, per user).</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-[min(320px,45vw)]">
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search contacts…" />
          </div>
          <Button variant="secondary" size="sm" onClick={() => void load()} disabled={loading || saving}>
            Refresh
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {error ? (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="rounded-3xl border border-black/5 bg-white/60 p-5 shadow-sm backdrop-blur-xl">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-semibold text-slate-900">
              {draft.id ? "Edit contact" : "Add contact"}
            </div>
            <div className="flex items-center gap-2">
              {draft.id ? (
                <Button variant="ghost" size="sm" onClick={resetDraft}>
                  Cancel
                </Button>
              ) : null}
              <Button variant="primary" size="sm" onClick={() => void submit()} disabled={saving || loading}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    {draft.id ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                    {draft.id ? "Save" : "Add"}
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Input value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} placeholder="Name" />
            <Input value={draft.role} onChange={(e) => setDraft((d) => ({ ...d, role: e.target.value }))} placeholder="Role (Advisor, Accountant…)" />
            <Input value={draft.phone} onChange={(e) => setDraft((d) => ({ ...d, phone: e.target.value }))} placeholder="Phone" inputMode="tel" />
            <Input value={draft.email} onChange={(e) => setDraft((d) => ({ ...d, email: e.target.value }))} placeholder="Email" inputMode="email" />
          </div>
          <div className="mt-3">
            <Textarea value={draft.notes} onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))} placeholder="Notes (optional)" className="min-h-24 resize-none" />
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl border border-black/5 bg-white/60 shadow-sm backdrop-blur-xl">
          <div className="flex items-center justify-between gap-3 border-b border-black/5 px-5 py-4">
            <div className="text-sm font-semibold text-slate-900">Contact list</div>
            <div className="text-xs text-slate-500">
              {loading ? "Loading…" : `${filtered.length} contact(s)`}
            </div>
          </div>

          {loading ? (
            <div className="px-5 py-10 text-sm text-slate-600">
              <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
              Loading contacts…
            </div>
          ) : filtered.length === 0 ? (
            <div className="px-5 py-10 text-sm text-slate-500">No contacts yet.</div>
          ) : (
            <div className="divide-y divide-black/5">
              {filtered.map((c) => (
                <div key={c.id} className="px-5 py-4 transition-colors hover:bg-white/70">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-slate-900">{c.name}</div>
                      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
                        {c.role ? <span className="rounded-full border border-black/5 bg-white/60 px-2 py-0.5">{c.role}</span> : null}
                        {c.phone ? <span>{c.phone}</span> : null}
                        {c.email ? <span>{c.email}</span> : null}
                      </div>
                      {c.notes ? <div className="mt-2 text-sm text-slate-700">{c.notes}</div> : null}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="secondary" size="sm" onClick={() => beginEdit(c)} disabled={saving}>
                        Edit
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => void remove(c.id)} disabled={saving} className="text-red-700 hover:text-red-700">
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}


