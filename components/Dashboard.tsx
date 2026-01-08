"use client";

import * as React from "react";
import { Calculator, Folder, NotebookPen, Search, Users } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { FoldersSection } from "@/components/FoldersSection";
import { NotesSection } from "@/components/NotesSection";
import { CalculatorSection } from "@/components/CalculatorSection";
import { ContactsSection } from "@/components/ContactsSection";
import { WelcomeTour } from "@/components/WelcomeTour";
import { cn } from "@/lib/utils";

export function Dashboard() {
  type SectionId = "folders" | "calculator" | "notes" | "contacts";
  const [active, setActive] = React.useState<SectionId | null>(null);
  const [query, setQuery] = React.useState("");
  const [searchOpen, setSearchOpen] = React.useState(false);

  const SECTIONS = React.useMemo(
    () =>
      [
        {
          id: "folders" as const,
          title: "Folders",
          subtitle: "Browse and organize your saved categories and documents.",
          icon: Folder,
        },
        {
          id: "calculator" as const,
          title: "Calculator",
          subtitle: "Run quick projections and validate financial decisions.",
          icon: Calculator,
        },
        {
          id: "notes" as const,
          title: "Notes",
          subtitle: "Write and store quick notes, goals, and reminders.",
          icon: NotebookPen,
        },
        {
          id: "contacts" as const,
          title: "Contacts",
          subtitle: "Keep trusted contacts organized in one place.",
          icon: Users,
        },
      ],
    [],
  );

  const matches = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return SECTIONS;
    return SECTIONS.filter((s) => `${s.title} ${s.subtitle}`.toLowerCase().includes(q));
  }, [SECTIONS, query]);

  function openSection(next: SectionId) {
    setActive(next);
    setSearchOpen(false);
  }

  function clearActive() {
    setActive(null);
  }

  return (
    <div className="min-h-dvh bg-[#F9FAFB] text-slate-900">
      <WelcomeTour />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(0,102,255,0.18),transparent_42%),radial-gradient(circle_at_90%_10%,rgba(0,102,255,0.10),transparent_40%),radial-gradient(circle_at_55%_100%,rgba(2,6,23,0.06),transparent_45%)]" />

      <div className="relative mx-auto max-w-6xl px-6 py-10">
        {/* Search bar (very top) */}
        <div className="relative" data-tour="search">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setSearchOpen(true)}
              onBlur={() => window.setTimeout(() => setSearchOpen(false), 120)}
              onKeyDown={(e) => {
                if (e.key === "Escape") return void (setSearchOpen(false), (e.currentTarget as HTMLInputElement).blur());
                if (e.key === "Enter" && !active) {
                  const first = matches[0];
                  if (first) openSection(first.id);
                }
              }}
              placeholder={
                active === "contacts"
                  ? "Search contacts: name or role…"
                  : "Search: Folders, Calculator, Notes, Contacts…"
              }
              className="pl-11 h-12 rounded-3xl bg-white/65 shadow-[0_18px_50px_-30px_rgba(2,6,23,0.28)]"
            />
          </div>

          {searchOpen && query.trim() && !active ? (
            <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-3xl border border-black/5 bg-white/80 shadow-[0_18px_50px_-30px_rgba(2,6,23,0.35)] backdrop-blur-xl">
              {matches.length === 0 ? (
                <div className="px-5 py-4 text-sm text-slate-600">No matching sections.</div>
              ) : (
                <div className="divide-y divide-black/5">
                  {matches.map((s) => {
                    const Icon = s.icon;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => openSection(s.id)}
                        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition-colors hover:bg-white"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[#0066FF]/15 bg-[#0066FF]/10">
                            <Icon className="h-5 w-5 text-[#0066FF]" />
                          </div>
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold text-slate-900">{s.title}</div>
                            <div className="truncate text-xs text-slate-500">{s.subtitle}</div>
                          </div>
                        </div>
                        <div className="text-xs font-medium text-slate-500">Open</div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ) : null}
        </div>

        <header className="mb-6 mt-6">
          <p className="text-xs font-semibold tracking-wide text-slate-500">Unity Saving</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">Dashboard</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Bright Financial Blue • Glassmorphism cards • Quick navigation.
          </p>
        </header>

        {/* Cards + placeholder panel */}
        <div className="mt-6 space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {(active ? SECTIONS : query.trim() ? matches : SECTIONS).map((s) => (
              <SectionCard
                key={s.id}
                title={s.title}
                subtitle={s.subtitle}
                icon={s.icon}
                active={active === s.id}
                onClick={() => openSection(s.id)}
                tourId={
                  s.id === "folders"
                    ? "card-folders"
                    : s.id === "calculator"
                      ? "card-calculator"
                      : s.id === "notes"
                        ? "card-notes"
                        : "card-contacts"
                }
              />
            ))}
          </div>

          <div
            className={cn(
              "transition-all duration-300",
              active ? "opacity-100 translate-y-0" : "pointer-events-none -translate-y-2 opacity-0",
            )}
          >
            {active ? (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="text-sm font-semibold text-slate-800">
                    Selected: <span className="text-[#0066FF]">{SECTIONS.find((s) => s.id === active)?.title}</span>
                  </div>
                  <Button variant="secondary" size="sm" onClick={clearActive}>
                    Close
                  </Button>
                </div>
                <PlaceholderSection section={active} filterQuery={query} />
              </div>
            ) : null}
          </div>
        </div>

        <p className="mt-10 text-xs text-slate-500">
          This dashboard layout is a placeholder shell for Folders, Calculator, Notes, and Contacts.
        </p>
      </div>
    </div>
  );
}

function SectionCard(props: {
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
  onClick: () => void;
  tourId?: string;
}) {
  const { title, subtitle, icon: Icon, active, onClick, tourId } = props;
  return (
    <button
      type="button"
      onClick={onClick}
      data-tour={tourId}
      className="group text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066FF]/30 focus-visible:ring-offset-2 focus-visible:ring-offset-[#F9FAFB] rounded-3xl"
    >
      <Card
        className={cn(
          "relative min-h-[240px] overflow-hidden transition-all duration-300 hover:bg-white hover:-translate-y-0.5 hover:shadow-[0_28px_70px_-44px_rgba(0,102,255,0.75)]",
          active && "ring-2 ring-[#0066FF]/25",
        )}
      >
        <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <div className="absolute -left-24 -top-24 h-64 w-64 rounded-full bg-[#0066FF]/12 blur-2xl" />
          <div className="absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-[#6EA8FF]/14 blur-2xl" />
        </div>

        <div className="relative p-8">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="text-xl font-semibold tracking-tight text-slate-900">{title}</div>
              <div className="mt-1 text-sm text-slate-600">{subtitle}</div>
            </div>
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-3xl border border-[#0066FF]/18 bg-[#0066FF]/10 shadow-sm transition-colors group-hover:bg-[#0066FF]/12">
              <Icon className="h-7 w-7 text-[#0066FF]" />
            </div>
          </div>
          <div className="mt-6 h-2 w-full overflow-hidden rounded-full bg-black/5">
            <div className="h-full w-1/2 rounded-full bg-gradient-to-r from-[#0066FF] to-[#6EA8FF] transition-all duration-300 group-hover:w-2/3" />
          </div>
        </div>
      </Card>
    </button>
  );
}

function PlaceholderSection(props: { section: "folders" | "calculator" | "notes" | "contacts"; filterQuery: string }) {
  const { section, filterQuery } = props;

  if (section === "folders") {
    return <FoldersSection />;
  }
  if (section === "calculator") {
    return <CalculatorSection />;
  }
  if (section === "notes") {
    return <NotesSection />;
  }
  if (section === "contacts") {
    return <ContactsSection filterQuery={filterQuery} />;
  }

  const meta = {
    folders: {
      title: "Folders",
      description: "This is a placeholder area for your Folders experience.",
      bullets: ["Create and organize folders", "Upload and manage documents", "Quick actions and recent items"],
    },
    calculator: {
      title: "Calculator",
      description: "This is a placeholder area for your Calculator tools.",
      bullets: ["Savings growth projections", "Interest and contribution scenarios", "Export / share results"],
    },
    notes: {
      title: "Notes",
      description: "This is a placeholder area for Notes.",
      bullets: ["Create rich notes", "Tag and search", "Pin important items"],
    },
    contacts: {
      title: "Contacts",
      description: "This is a placeholder area for Contacts.",
      bullets: ["Store key people and providers", "Add notes and reminders", "Fast search and filters"],
    },
  }[section];

  return (
    <Card className="overflow-hidden">
      <div className="p-8">
        <div className="text-sm font-semibold tracking-wide text-[#0066FF]">Coming soon</div>
        <div className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{meta.title}</div>
        <div className="mt-2 text-sm text-slate-600">{meta.description}</div>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {meta.bullets.map((b) => (
            <div
              key={b}
              className="rounded-3xl border border-black/5 bg-white/55 px-5 py-4 shadow-[0_18px_45px_-35px_rgba(2,6,23,0.22)] backdrop-blur-xl"
            >
              <div className="text-sm font-medium text-slate-800">{b}</div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}


