"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { LockKeyhole } from "lucide-react";

import { AuthShell } from "@/components/AuthShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { setAuthCookies, signIn } from "@/lib/auth";
import {
  COGNITO_ID_TOKEN_COOKIE,
  getCookieFromString,
  isJwtExpired,
} from "@/lib/auth/cognitoCookies";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";

  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    const existing = getCookieFromString(document.cookie, COGNITO_ID_TOKEN_COOKIE);
    if (existing && !isJwtExpired(existing)) router.replace(redirectTo);
  }, [router, redirectTo]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const tokens = await signIn({ username, password });
      setAuthCookies(tokens);
      router.replace(redirectTo);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthShell>
      <Card className="overflow-hidden">
        <CardHeader className="flex-col items-start gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-3xl border border-black/5 bg-white/70">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0066FF] to-[#6EA8FF]">
                <LockKeyhole className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold tracking-wider text-slate-500">Unity Saving</div>
              <CardTitle className="mt-1 text-2xl leading-tight">Sign in</CardTitle>
              <CardDescription>Access your secure financial drive.</CardDescription>
            </div>
          </div>

          <p className="text-xs text-slate-500">
            Uses AWS Cognito. Your session is stored in a short-lived cookie on this device.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700" htmlFor="username">
                Email or username
              </label>
              <Input
                id="username"
                name="username"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-3">
                <label className="text-sm font-medium text-slate-700" htmlFor="password">
                  Password
                </label>
                <button
                  type="button"
                  className="text-xs font-medium text-slate-500 hover:text-slate-700"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-pressed={showPassword}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            {error ? (
              <p
                role="alert"
                className="rounded-2xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-700"
              >
                {error}
              </p>
            ) : null}

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Signing in…" : "Sign in"}
            </Button>

            <p className="text-xs text-slate-500">
              Tip: if you were redirected here, you’ll be sent back to{" "}
              <span className="font-medium text-slate-700">{redirectTo}</span> after sign-in.
            </p>

            <p className="text-xs text-slate-500 text-center">
              New here?{" "}
              <Link href="/signup" className="font-medium text-slate-900 hover:underline">
                Create an account
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </AuthShell>
  );
}


