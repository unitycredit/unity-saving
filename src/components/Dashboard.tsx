"use client";

import * as React from "react";

import { CalculatorCard } from "@/components/cards/CalculatorCard";
import { ContactsCard } from "@/components/cards/ContactsCard";
import { FilesCard } from "@/components/cards/FilesCard";
import { NotebookCard } from "@/components/cards/NotebookCard";

export function Dashboard() {
  return (
    <div className="min-h-dvh bg-zinc-950">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.10),transparent_45%),radial-gradient(circle_at_90%_10%,rgba(255,255,255,0.08),transparent_40%),radial-gradient(circle_at_50%_100%,rgba(255,255,255,0.06),transparent_45%)]" />
      <div className="relative mx-auto max-w-6xl px-6 py-10">
        <header className="mb-8 flex flex-col gap-2">
          <p className="text-sm font-medium text-zinc-400">
            AWS-only (App Runner, S3, DynamoDB) • No external logins • No AI
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-white">
            Unity Saving
          </h1>
          <p className="max-w-2xl text-sm text-zinc-400">
            Premium, logic-first dashboard: Calculator, Note Book, Contacts, and Cloud Files.
          </p>
        </header>

        <div className="grid gap-6 md:grid-cols-2">
          <CalculatorCard />
          <NotebookCard />
          <ContactsCard />
          <FilesCard />
        </div>

        <p className="mt-10 text-xs text-zinc-500">
          Note Book and Contacts are stored in your browser (localStorage). Cloud Files is UI-first and ready for S3 wiring.
        </p>
      </div>
    </div>
  );
}


