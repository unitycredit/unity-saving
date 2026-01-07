"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Folder, Settings } from "lucide-react";

import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

const NAV: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/files", label: "My Files", icon: Folder },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppShell(props: {
  title: string;
  subtitle?: string;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
}) {
  const { title, subtitle, headerRight, children } = props;
  const pathname = usePathname();

  return (
    <div className="min-h-dvh bg-zinc-950">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.10),transparent_45%),radial-gradient(circle_at_90%_10%,rgba(99,102,241,0.10),transparent_40%),radial-gradient(circle_at_55%_100%,rgba(16,185,129,0.08),transparent_45%)]" />

      <div className="relative mx-auto flex min-h-dvh max-w-7xl">
        <aside className="hidden w-64 shrink-0 border-r border-white/10 bg-black/20 backdrop-blur md:block">
          <div className="px-5 py-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl border border-white/10 bg-gradient-to-br from-emerald-500/20 to-indigo-500/20" />
              <div className="leading-tight">
                <div className="text-sm font-semibold text-white">Savings Drive</div>
                <div className="text-xs text-zinc-500">Secure • AWS • Cognito</div>
              </div>
            </div>
          </div>

          <nav className="px-3 pb-6">
            <div className="px-3 pb-2 text-[11px] font-medium uppercase tracking-wider text-zinc-500">
              Workspace
            </div>
            <div className="space-y-1">
              {NAV.map((item) => {
                const active = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition-colors",
                      active
                        ? "bg-white text-zinc-950"
                        : "text-white hover:bg-white/5",
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-4 w-4",
                        active ? "text-zinc-950" : "text-zinc-300 group-hover:text-white",
                      )}
                    />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </nav>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="px-6 pb-4 pt-8 md:px-8">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs font-medium text-zinc-400">
                  High-end financial dashboard • Cloud storage • Audit-friendly UI
                </p>
                <h1 className="mt-1 truncate text-3xl font-semibold tracking-tight text-white">
                  {title}
                </h1>
                {subtitle ? <p className="mt-2 max-w-2xl text-sm text-zinc-400">{subtitle}</p> : null}
              </div>
              {headerRight ? <div className="shrink-0">{headerRight}</div> : null}
            </div>
          </header>

          <main className="px-6 pb-10 md:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
}


