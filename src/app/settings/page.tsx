"use client";

import * as React from "react";
import { KeyRound, UserRound } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { LogoutButton } from "@/components/LogoutButton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { COGNITO_ID_TOKEN_COOKIE, getCookieFromString, getJwtPayload } from "@/lib/auth/cognitoCookies";

type Claims = Record<string, unknown>;

function claimString(c: Claims | null, key: string) {
  const v = c?.[key];
  return typeof v === "string" ? v : undefined;
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
  const sub = claimString(claims, "sub");
  const fullName = [given, family].filter(Boolean).join(" ") || "—";

  return (
    <AppShell title="Settings" subtitle="Profile details and account preferences (AWS Cognito)." headerRight={<LogoutButton />}>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Profile</CardTitle>
              <CardDescription>Your Cognito user attributes (read from the ID token).</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                  <UserRound className="h-5 w-5 text-zinc-200" />
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-white">{fullName}</div>
                  <div className="truncate text-xs text-zinc-500">{email ?? "—"}</div>
                </div>
              </div>

              <div className="grid gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-zinc-400">First name</span>
                  <span className="text-white">{given ?? "—"}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-zinc-400">Last name</span>
                  <span className="text-white">{family ?? "—"}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-zinc-400">Email</span>
                  <span className="text-white">{email ?? "—"}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-zinc-400">User ID</span>
                  <span className="max-w-[60%] truncate font-mono text-xs text-zinc-300">{sub ?? "—"}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Account</CardTitle>
              <CardDescription>Security and session controls.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                <KeyRound className="mt-0.5 h-5 w-5 text-zinc-200" />
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-white">Password & MFA</div>
                  <div className="mt-1 text-sm text-zinc-400">
                    These are managed in AWS Cognito. Add MFA / password policies in your Cognito User Pool settings.
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="text-sm font-semibold text-white">Sign out</div>
                <div className="mt-1 text-sm text-zinc-400">
                  Clears the local session cookies on this device.
                </div>
                <div className="mt-3">
                  <LogoutButton />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}


