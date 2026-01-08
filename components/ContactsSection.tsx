"use client";

import * as React from "react";
import { Mail, Phone, Plus, Search, Trash2, Users } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";
import { getContacts, saveContacts, type Contact } from "@/lib/contactsApi";

function newId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function formatWhen(iso: string | null | undefined) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

function normalizeQuery(q: string) {
  return q.trim().toLowerCase();
}

export function ContactsSection(props: { filterQuery: string }) {
  const { filterQuery } = props;
  const { toast } = useToast();

  const [contacts, setContacts] = React.useState<Contact[] | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [activeId, setActiveId] = React.useState<string | null>(null);
  const active = React.useMemo(() => (contacts ?? []).find((c) => c.id === activeId) ?? null, [contacts, activeId]);

  const [localSearch, setLocalSearch] = React.useState("");
  const query = normalizeQuery(filterQuery || localSearch);

  const [savingState, setSavingState] = React.useState<
    { state: "idle" } | { state: "saving" } | { state: "saved"; at: string } | { state: "error"; message: string }
  >({ state: "idle" });
  const saveSeqRef = React.useRef(0);
  const dirtyRef = React.useRef(false);

  const [addOpen, setAddOpen] = React.useState(false);
  const [draft, setDraft] = React.useState<Pick<Contact, "fullName" | "role" | "phone" | "email" | "privateNotes">>({
    fullName: "",
    role: "",
    phone: "",
    email: "",
    privateNotes: "",
  });

  const refresh = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const out = await getContacts();
      const list = [...(out.contacts ?? [])].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
      setContacts(list);
      if (!activeId && list.length) setActiveId(list[0]!.id);
    } catch (e) {
      setContacts(null);
      setError(e instanceof Error ? e.message : "Failed to load contacts.");
    } finally {
      setLoading(false);
    }
  }, [activeId]);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  const filtered = React.useMemo(() => {
    const list = contacts ?? [];
    if (!query) return list;
    return list.filter((c) => `${c.fullName} ${c.role}`.toLowerCase().includes(query));
  }, [contacts, query]);

  async function flushSave(next: Contact[]) {
    const seq = ++saveSeqRef.current;
    setSavingState({ state: "saving" });
    try {
      const out = await saveContacts({ contacts: next });
      if (saveSeqRef.current !== seq) return;
      dirtyRef.current = false;
      setSavingState({ state: "saved", at: out.updatedAt });
    } catch (e) {
      if (saveSeqRef.current !== seq) return;
      setSavingState({ state: "error", message: e instanceof Error ? e.message : "Save failed." });
    }
  }

  // Debounced autosave (1.5s) for contact edits.
  React.useEffect(() => {
    if (!dirtyRef.current) return;
    if (!contacts) return;
    const t = window.setTimeout(() => {
      void flushSave(contacts);
    }, 1500);
    return () => window.clearTimeout(t);
  }, [contacts]);

  function markDirty() {
    dirtyRef.current = true;
    if (savingState.state !== "saving") setSavingState({ state: "idle" });
  }

  function updateActive(patch: Partial<Contact>) {
    if (!active || !contacts) return;
    const next = contacts.map((c) => (c.id === active.id ? { ...c, ...patch, updatedAt: new Date().toISOString() } : c));
    setContacts(next);
    markDirty();
  }

  async function deleteActive() {
    if (!active || !contacts) return;
    const ok = window.confirm(`Delete contact "${active.fullName || "Untitled"}"?`);
    if (!ok) return;
    const next = contacts.filter((c) => c.id !== active.id);
    setContacts(next);
    setActiveId(next[0]?.id ?? null);
    markDirty();
    toast({ title: "Deleted", message: active.fullName || "Contact removed", variant: "success" });
    // Save immediately (no waiting).
    await flushSave(next);
  }

  async function addContact() {
    if (!contacts) return;
    const fullName = draft.fullName.trim();
    if (!fullName) {
      toast({ title: "Missing name", message: "Full Name is required.", variant: "error" });
      return;
    }
    const now = new Date().toISOString();
    const c: Contact = {
      id: newId(),
      fullName,
      role: draft.role.trim(),
      phone: draft.phone.trim(),
      email: draft.email.trim(),
      privateNotes: draft.privateNotes.trim(),
      createdAt: now,
      updatedAt: now,
    };
    const next = [c, ...contacts];
    setContacts(next);
    setActiveId(c.id);
    setAddOpen(false);
    setDraft({ fullName: "", role: "", phone: "", email: "", privateNotes: "" });
    toast({ title: "Added contact", message: c.fullName, variant: "success" });
    await flushSave(next);
  }

  const statusLabel =
    savingState.state === "saving"
      ? "Saving…"
      : savingState.state === "saved"
        ? `Saved • ${formatWhen(savingState.at)}`
        : savingState.state === "error"
          ? `Error • ${savingState.message}`
          : dirtyRef.current
            ? "Pending…"
            : "—";

  return (
    <Card className="overflow-hidden">
      <div className="p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm font-semibold tracking-wide text-[#0066FF]">Contacts</div>
            <div className="mt-1 text-xl font-semibold tracking-tight text-slate-900">Contact Manager</div>
            <div className="mt-1 text-sm text-slate-600">Saved to S3 as one JSON file per user.</div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setAddOpen(true)}
              className="border border-[#0066FF]/25 bg-[#0066FF] text-white shadow-[0_18px_45px_-25px_rgba(0,102,255,0.55)] hover:bg-[#005AE0] active:bg-[#004FC6]"
            >
              <Plus className="h-4 w-4" />
              Add Contact
            </Button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[360px_1fr]">
          {/* List */}
          <div className="overflow-hidden rounded-3xl border border-[#0066FF]/10 bg-white shadow-sm">
            <div className="border-b border-[#0066FF]/10 px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={localSearch}
                    onChange={(e) => setLocalSearch(e.target.value)}
                    placeholder={filterQuery ? "Filtering via top search…" : "Search contacts…"}
                    className="h-10 pl-9"
                    disabled={Boolean(filterQuery)}
                  />
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between gap-3 text-xs text-slate-500">
                <span>{contacts ? `${filtered.length} contact(s)` : "Configure AWS env vars to load contacts."}</span>
                <span className={cn(savingState.state === "error" ? "text-red-600" : "text-slate-500")}>
                  {loading ? "Loading…" : `Last Saved: ${statusLabel}`}
                </span>
              </div>
            </div>

            <div className="max-h-[520px] overflow-auto p-2">
              {error ? (
                <div className="rounded-2xl border border-black/5 bg-white/70 px-3 py-2 text-sm text-slate-700">
                  <div className="font-semibold text-slate-900">Couldn’t load contacts</div>
                  <div className="mt-1 text-slate-600">{error}</div>
                </div>
              ) : null}

              {!error && contacts && filtered.length === 0 ? (
                <div className="px-3 py-10 text-center text-sm text-slate-500">No contacts found.</div>
              ) : null}

              {contacts
                ? filtered.map((c) => {
                    const isActive = c.id === activeId;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setActiveId(c.id)}
                        className={cn(
                          "mb-2 flex w-full items-start justify-between gap-3 rounded-3xl border px-3 py-3 text-left transition-colors",
                          isActive
                            ? "border-[#0066FF]/25 bg-[#0066FF]/[0.04]"
                            : "border-black/5 bg-white hover:bg-[#0066FF]/[0.03]",
                        )}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-semibold text-slate-900">{c.fullName || "Untitled"}</div>
                          <div className="mt-0.5 truncate text-xs text-slate-500">
                            {c.role ? c.role : "—"} • Created {formatWhen(c.createdAt)}
                          </div>
                        </div>
                        <Users className={cn("mt-0.5 h-4 w-4 shrink-0", isActive ? "text-[#0066FF]" : "text-slate-300")} />
                      </button>
                    );
                  })
                : null}
            </div>
          </div>

          {/* Detail */}
          <div className="overflow-hidden rounded-3xl border border-[#0066FF]/10 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#0066FF]/10 px-5 py-4">
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-slate-900">{active ? active.fullName : "Select a contact"}</div>
                <div className="mt-1 text-xs text-slate-500">
                  {active ? `Created ${formatWhen(active.createdAt)}` : "Choose a contact on the left or add a new one."}
                </div>
              </div>
              {active ? (
                <div className="flex items-center gap-2">
                  <a
                    href={active.phone ? `tel:${active.phone}` : undefined}
                    className={cn("inline-flex", !active.phone && "pointer-events-none opacity-50")}
                    title={active.phone ? "Call" : "No phone number"}
                  >
                    <Button variant="secondary" size="sm" type="button">
                      <Phone className="h-4 w-4" />
                      Call
                    </Button>
                  </a>
                  <a
                    href={active.email ? `mailto:${active.email}` : undefined}
                    className={cn("inline-flex", !active.email && "pointer-events-none opacity-50")}
                    title={active.email ? "Email" : "No email"}
                  >
                    <Button variant="secondary" size="sm" type="button">
                      <Mail className="h-4 w-4" />
                      Email
                    </Button>
                  </a>
                  <Button variant="secondary" size="sm" onClick={() => void deleteActive()} title="Delete contact">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ) : null}
            </div>

            <div className="p-5">
              {active ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Full Name" value={active.fullName} onChange={(v) => updateActive({ fullName: v })} />
                  <Field label="Role" value={active.role} onChange={(v) => updateActive({ role: v })} placeholder="Accountant, Banker, Lawyer…" />
                  <Field label="Phone Number" value={active.phone} onChange={(v) => updateActive({ phone: v })} placeholder="+1 (555) 555-5555" />
                  <Field label="Email" value={active.email} onChange={(v) => updateActive({ email: v })} placeholder="name@domain.com" />

                  <div className="md:col-span-2">
                    <div className="text-sm font-semibold text-slate-900">Private Notes</div>
                    <div className="mt-0.5 text-xs text-slate-500">Only stored in your S3 bucket for your user.</div>
                    <textarea
                      value={active.privateNotes}
                      onChange={(e) => updateActive({ privateNotes: e.target.value })}
                      placeholder="Add private details about this contact…"
                      className={cn(
                        "mt-2 min-h-[140px] w-full resize-y rounded-3xl border border-[#0066FF]/18 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm",
                        "placeholder:text-slate-400",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066FF]/30 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
                      )}
                    />
                    <div className="mt-2 text-xs text-slate-500">Last Saved: {statusLabel}</div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center rounded-3xl border border-dashed border-black/10 bg-white/40 px-4 py-16 text-sm text-slate-500">
                  {loading ? "Loading…" : "Select a contact to view details."}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {addOpen ? (
        <Modal title="Add Contact" onClose={() => setAddOpen(false)}>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Full Name" value={draft.fullName} onChange={(v) => setDraft((d) => ({ ...d, fullName: v }))} />
            <Field label="Role" value={draft.role} onChange={(v) => setDraft((d) => ({ ...d, role: v }))} placeholder="Accountant, Banker…" />
            <Field label="Phone Number" value={draft.phone} onChange={(v) => setDraft((d) => ({ ...d, phone: v }))} />
            <Field label="Email" value={draft.email} onChange={(v) => setDraft((d) => ({ ...d, email: v }))} />
            <div className="md:col-span-2">
              <div className="text-sm font-semibold text-slate-900">Private Notes</div>
              <textarea
                value={draft.privateNotes}
                onChange={(e) => setDraft((d) => ({ ...d, privateNotes: e.target.value }))}
                className={cn(
                  "mt-2 min-h-[120px] w-full resize-y rounded-3xl border border-[#0066FF]/18 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm",
                  "placeholder:text-slate-400",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066FF]/30 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
                )}
                placeholder="Optional private details…"
              />
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => void addContact()}
              className="border border-[#0066FF]/25 bg-[#0066FF] text-white shadow-[0_18px_45px_-25px_rgba(0,102,255,0.55)] hover:bg-[#005AE0] active:bg-[#004FC6]"
            >
              <Plus className="h-4 w-4" />
              Add
            </Button>
          </div>
        </Modal>
      ) : null}
    </Card>
  );
}

function Field(props: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  const { label, value, onChange, placeholder } = props;
  return (
    <label className="block">
      <div className="text-sm font-semibold text-slate-900">{label}</div>
      <div className="mt-2">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="h-11 rounded-2xl border border-[#0066FF]/15 bg-white shadow-sm focus-visible:ring-[#0066FF]/25"
        />
      </div>
    </label>
  );
}

function Modal(props: { title: string; children: React.ReactNode; onClose: () => void }) {
  const { title, children, onClose } = props;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-black/10 bg-white/90 shadow-[0_30px_120px_-40px_rgba(2,6,23,0.45)] backdrop-blur-xl">
        <div className="border-b border-black/10 px-5 py-4">
          <div className="text-sm font-semibold text-slate-900">{title}</div>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

