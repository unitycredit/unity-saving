"use client";

import * as React from "react";

import { useLocalStorage } from "@/hooks/useLocalStorage";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

type Contact = {
  id: string;
  name: string;
  phone: string;
  updatedAt: number;
};

const STORAGE_KEY = "unitySaving.contacts.v1";

function createId() {
  try {
    return crypto.randomUUID();
  } catch {
    return `c_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  }
}

export function ContactsCard({ icon }: { icon: React.ReactNode }) {
  const [contacts, setContacts] = useLocalStorage<Contact[]>(STORAGE_KEY, []);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");

  const sorted = React.useMemo(
    () => contacts.slice().sort((a, b) => b.updatedAt - a.updatedAt),
    [contacts],
  );

  const reset = () => {
    setEditingId(null);
    setName("");
    setPhone("");
  };

  const submit = () => {
    const n = name.trim();
    const p = phone.trim();
    if (!n || !p) return;

    const payload = { name: n, phone: p, updatedAt: Date.now() };
    if (editingId) {
      setContacts((prev) =>
        prev.map((c) => (c.id === editingId ? { ...c, ...payload } : c)),
      );
      reset();
      return;
    }
    setContacts((prev) => [{ id: createId(), ...payload }, ...prev]);
    reset();
  };

  const edit = (c: Contact) => {
    setEditingId(c.id);
    setName(c.name);
    setPhone(c.phone);
  };

  const remove = (id: string) => setContacts((prev) => prev.filter((c) => c.id !== id));

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-2xl border border-white/10 bg-white/5 p-2.5 text-white">
            {icon}
          </div>
          <div>
            <CardTitle>Contacts</CardTitle>
            <CardDescription>Names and phone numbers (stored locally for now).</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <div className="grid gap-2 sm:grid-cols-2">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" inputMode="tel" />
          </div>
          <div className="mt-3 flex items-center justify-between gap-2">
            <div className="text-xs text-zinc-500">{editingId ? "Editing contact" : "Add a new contact"}</div>
            <div className="flex gap-2">
              {editingId ? (
                <Button variant="secondary" size="sm" onClick={reset}>
                  Cancel
                </Button>
              ) : null}
              <Button variant="primary" size="sm" onClick={submit}>
                {editingId ? "Save" : "Add"}
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-black/20">
          {sorted.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-zinc-400">No contacts yet.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-white/5 text-xs text-zinc-500">
                <tr className="text-left">
                  <th className="px-4 py-2 font-medium">Name</th>
                  <th className="px-4 py-2 font-medium">Phone</th>
                  <th className="px-4 py-2 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {sorted.map((c) => (
                  <tr key={c.id} className="hover:bg-white/5">
                    <td className="px-4 py-2 font-medium text-white">{c.name}</td>
                    <td className="px-4 py-2 text-zinc-300">{c.phone}</td>
                    <td className="px-4 py-2">
                      <div className="flex justify-end gap-2">
                        <Button variant="secondary" size="sm" onClick={() => edit(c)}>
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-300 hover:text-red-200"
                          onClick={() => remove(c.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </CardContent>
    </Card>
  );
}


