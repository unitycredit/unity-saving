"use client";

import * as React from "react";

import { AppShell } from "@/components/AppShell";
import { LogoutButton } from "@/components/LogoutButton";
import { CalculatorCard } from "@/components/cards/CalculatorCard";
import { ContactsCard } from "@/components/cards/ContactsCard";
import { FilesCard } from "@/components/cards/FilesCard";
import { NotebookCard } from "@/components/cards/NotebookCard";

export function Dashboard() {
  return (
    <AppShell
      title="Dashboard"
      subtitle="A high-end Savings Drive: calculators, notes, contacts, and a secure cloud file workspace."
      headerRight={<LogoutButton />}
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <CalculatorCard />
        <NotebookCard />
        <ContactsCard />
        <div className="lg:col-span-2">
          <FilesCard />
        </div>
      </div>

      <p className="mt-10 text-xs text-zinc-500">
        Note Book and Contacts are stored in your browser (localStorage). Cloud Files uses S3 via API routes and presigned URLs.
      </p>
    </AppShell>
  );
}


