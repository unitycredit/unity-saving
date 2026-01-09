"use client";

import * as React from "react";
import { HardDrive, KeyRound, Mail, ShieldCheck, UserRound } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { LogoutButton } from "@/components/LogoutButton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { COGNITO_ID_TOKEN_COOKIE, getCookieFromString, getJwtPayload } from "@/lib/auth/cognitoCookies";

type Claims = Record<string, unknown>;

function claimString(c: Claims | null, key: string) {
  const v = c?.[key];
  return typeof v === "string" ? v : undefined;
}

function initials(given?: string, family?: string) {
  const a = (given ?? "").trim().slice(0, 1);
  const b = (family ?? "").trim().slice(0, 1);
  const out = `${a}${b}`.toUpperCase();
  return out || "US";
}

function formatGB(bytes: number) {
  const gb = bytes / (1024 ** 3);
  return `${gb.toFixed(gb < 10 ? 1 : 0)} GB`;
}

export default function SettingsPage() {
  const [claims, setClaims] = React.useState<Claims | null>(null);

  React.useEffect(() => {
    const token = getCookieFromString(document.cookie, COGNITO_ID_TOKEN_COOKIE);
    if (!token) {
      setClaims(null);
      return;
    }
    setClaims(getJwtPayload(token));
  }, []);

  const email = claimString(claims, "email");
  const given = claimString(claims, "given_name");
  const family = claimString(claims, "family_name");
  const fullName = [given, family].filter(Boolean).join(" ") || "—";

  // Storage plan UI (placeholder until we wire real usage from S3 / backend).
  const planBytes = 10 * 1024 ** 3; // 10 GB
  const usedBytes = 1.2 * 1024 ** 3; // 1.2 GB
  const usedPct = Math.max(0, Math.min(100, (usedBytes / planBytes) * 100));

  const mfaSetting =
    claimString(claims, "cognito:preferred_mfa_setting") ?? claimString(claims, "preferred_mfa_setting");
  const mfaEnabled = Boolean(mfaSetting && mfaSetting !== "NOMFA");

  return (
    <AppShell title="Settings" subtitle="Manage your Unity Saving profile, security, and storage." headerRight={null}>
      <div className="space-y-6">
        {/* Profile Overview */}
        <Card className="overflow-hidden">
          <CardHeader>
            <div>
              <CardTitle>Profile overview</CardTitle>
              <CardDescription>Your Unity Saving identity (from AWS Cognito).</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="relative flex h-14 w-14 items-center justify-center rounded-3xl border border-black/5 bg-white/70 shadow-sm">
                  <div className="absolute inset-0 rounded-3xl bg-[radial-gradient(circle_at_30%_25%,rgba(0,102,255,0.20),transparent_55%)]" />
                  <div className="relative flex h-12 w-12 items-center justify-center rounded-3xl bg-gradient-to-br from-[#0066FF] to-[#6EA8FF] text-sm font-semibold text-white">
                    {initials(given, family)}
                  </div>
                </div>

                <div className="min-w-0">
                  <div className="truncate text-xl font-semibold tracking-tight text-slate-900">{fullName}</div>
                  <div className="mt-1 flex items-center gap-2 text-sm text-slate-600">
                    <Mail className="h-4 w-4 text-slate-400" />
                    <span className="truncate">{email ?? "—"}</span>
                  </div>
                </div>
              </div>

              <div className="shrink-0">
                <LogoutButton
                  variant="secondary"
                  size="md"
                  className="w-full justify-center sm:w-auto"
                  label="Log Out"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sections */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Personal Information */}
          <Card className="overflow-hidden">
            <CardHeader>
              <div>
                <CardTitle>Personal information</CardTitle>
                <CardDescription>View (and later edit) your name and email.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start justify-between gap-3 rounded-2xl border border-black/5 bg-white/60 p-4">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl border border-black/5 bg-white/70">
                    <UserRound className="h-5 w-5 text-[#0066FF]" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-900">Name</div>
                    <div className="mt-0.5 truncate text-sm text-slate-600">{fullName}</div>
                  </div>
                </div>
                <div className="text-xs font-medium text-slate-500" title="Editing coming soon">
                  View only
                </div>
              </div>

              <div className="flex items-start justify-between gap-3 rounded-2xl border border-black/5 bg-white/60 p-4">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl border border-black/5 bg-white/70">
                    <Mail className="h-5 w-5 text-[#0066FF]" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-900">Email</div>
                    <div className="mt-0.5 truncate text-sm text-slate-600">{email ?? "—"}</div>
                  </div>
                </div>
                <div className="text-xs font-medium text-slate-500" title="Editing coming soon">
                  View only
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security */}
          <Card className="overflow-hidden">
            <CardHeader>
              <div>
                <CardTitle>Security</CardTitle>
                <CardDescription>Password and two-factor authentication.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start justify-between gap-3 rounded-2xl border border-black/5 bg-white/60 p-4">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl border border-black/5 bg-white/70">
                    <KeyRound className="h-5 w-5 text-[#0066FF]" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-900">Change password</div>
                    <div className="mt-0.5 text-sm text-slate-600">Managed in AWS Cognito.</div>
                  </div>
                </div>
                <div className="text-xs font-medium text-slate-500">Coming soon</div>
              </div>

              <div className="flex items-start justify-between gap-3 rounded-2xl border border-black/5 bg-white/60 p-4">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl border border-black/5 bg-white/70">
                    <ShieldCheck className="h-5 w-5 text-[#0066FF]" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-900">Two-Factor Authentication</div>
                    <div className="mt-0.5 text-sm text-slate-600">Status is controlled by your Cognito settings.</div>
                  </div>
                </div>
                <div className="text-right text-xs font-semibold">
                  <div className={mfaEnabled ? "text-emerald-600" : "text-slate-600"}>
                    {mfaEnabled ? "Enabled" : "Not enabled"}
                  </div>
                  {mfaSetting ? <div className="mt-1 font-medium text-slate-500">{mfaSetting}</div> : null}
                </div>
              </div>

              <div className="rounded-2xl border border-black/5 bg-white/60 p-4">
                <div className="text-sm font-semibold text-slate-900">Session</div>
                <div className="mt-1 text-sm text-slate-600">Log out to clear local Cognito cookies on this device.</div>
                <div className="mt-3">
                  <LogoutButton variant="secondary" size="md" className="w-full justify-center" label="Log Out" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Storage Plan */}
          <Card className="overflow-hidden">
            <CardHeader>
              <div>
                <CardTitle>Storage plan</CardTitle>
                <CardDescription>Your Savings Drive usage.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start justify-between gap-3 rounded-2xl border border-black/5 bg-white/60 p-4">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl border border-black/5 bg-white/70">
                    <HardDrive className="h-5 w-5 text-[#0066FF]" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-900">Savings Drive</div>
                    <div className="mt-0.5 text-sm text-slate-600">
                      {formatGB(usedBytes)} of {formatGB(planBytes)} used
                    </div>
                  </div>
                </div>
                <div className="text-xs font-semibold text-slate-700">{usedPct.toFixed(0)}%</div>
              </div>

              <div className="space-y-2">
                <div className="h-3 w-full overflow-hidden rounded-full bg-black/5">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#0066FF] to-[#6EA8FF]"
                    style={{ width: `${usedPct}%` }}
                  />
                </div>
                <div className="text-xs text-slate-500">
                  Usage is shown as an estimate until we wire real-time S3 totals.
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}


