"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Clock, HardDrive, LayoutGrid, LockKeyhole, Settings, Upload } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

const NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { href: "/files", label: "My Drive", icon: HardDrive },
  { href: "/recent-files", label: "Recent Files", icon: Clock },
  { href: "/safe-deposit-box", label: "Safe Deposit Box", icon: LockKeyhole },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppShell(props: {
  title: string;
  subtitle?: string;
  headerRight?: React.ReactNode;
  headerBottom?: React.ReactNode;
  children: React.ReactNode;
}) {
  const { title, subtitle, headerRight, headerBottom, children } = props;
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="min-h-dvh bg-[#F9FAFB]">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(0,102,255,0.18),transparent_42%),radial-gradient(circle_at_90%_10%,rgba(0,102,255,0.10),transparent_40%),radial-gradient(circle_at_55%_100%,rgba(2,6,23,0.06),transparent_45%)]" />

      <div className="relative mx-auto flex min-h-dvh max-w-7xl">
        <aside className="hidden w-72 shrink-0 p-4 md:block">
          <div className="rounded-3xl border border-black/5 bg-white/60 shadow-[0_18px_50px_-30px_rgba(2,6,23,0.22)] backdrop-blur-xl">
            <div className="px-5 py-6">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-3xl border border-black/5 bg-white/70">
                  <div className="h-7 w-7 rounded-2xl bg-gradient-to-br from-[#0066FF] to-[#6EA8FF]" />
                </div>
                <div className="leading-tight">
                  <div className="text-sm font-semibold text-slate-900">Unity Saving</div>
                  <div className="text-xs text-slate-500">Your secure financial drive</div>
                </div>
              </div>
            </div>

            <nav className="px-3 pb-4">
              <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Navigation
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
                          ? "bg-[#0066FF] text-white shadow-sm"
                          : "text-slate-700 hover:bg-black/5",
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-[18px] w-[18px]",
                          active ? "text-white" : "text-slate-500 group-hover:text-slate-700",
                        )}
                      />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </nav>

            <div className="border-t border-black/5 px-5 py-5">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Quick actions</div>
              <div className="mt-3">
                <Button
                  variant="primary"
                  className="w-full justify-center shadow-[0_18px_45px_-25px_rgba(0,102,255,0.70)]"
                  title="Upload to S3"
                  onClick={() => router.push("/files?upload=1")}
                >
                  <Upload className="h-4 w-4" />
                  Upload
                </Button>
              </div>
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="px-6 pb-4 pt-8 md:px-8">
            {headerBottom ? <div className="mb-6">{headerBottom}</div> : null}
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs font-semibold tracking-wide text-slate-500">Unity Saving</p>
                <h1 className="mt-1 truncate text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
                  {title}
                </h1>
                {subtitle ? <p className="mt-2 max-w-2xl text-sm text-slate-600">{subtitle}</p> : null}
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


