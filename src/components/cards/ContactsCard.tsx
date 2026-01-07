"use client";

import * as React from "react";

import { useLocalStorage } from "@/hooks/useLocalStorage";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type Contact = {
  id: string;
  name: string;
  phone: string;
};

const STORAGE_KEY = "unitySaving.contacts.v1";

function createId() {
  try {
    return crypto.randomUUID();
  } catch {
    return `c_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  }
}

export function ContactsCard() {
  const [contacts, setContacts] = useLocalStorage<Contact[]>(STORAGE_KEY, []);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");

  const reset = () => {
    setEditingId(null);
    setName("");
    setPhone("");
  };

  const submit = () => {
    const n = name.trim();
    const p = phone.trim();
    if (!n || !p) return;

    if (editingId) {
      setContacts((prev) => prev.map((c) => (c.id === editingId ? { ...c, name: n, phone: p } : c)));
      reset();
      return;
    }
    setContacts((prev) => [{ id: createId(), name: n, phone: p }, ...prev]);
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
        <div>
          <CardTitle>Contacts</CardTitle>
          <CardDescription>Names and phone numbers saved locally.</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4 shadow-sm">
          <div className="grid gap-2 sm:grid-cols-2">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name"
            />
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone"
              inputMode="tel"
            />
          </div>
          <div className="mt-2 flex items-center justify-between gap-2">
            <div className="text-xs text-zinc-500">{editingId ? "Editing contact" : "Add a contact"}</div>
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

        <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-black/20 shadow-sm">
          {contacts.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-zinc-500">No contacts yet.</div>
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
                {contacts.map((c) => (
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
                          onClick={() => remove(c.id)}
                          className="text-red-300 hover:text-red-200"
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


