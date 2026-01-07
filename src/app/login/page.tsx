"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
    <main className="min-h-screen px-4 flex items-center justify-center bg-gradient-to-b from-zinc-950 via-zinc-950 to-zinc-900">
      <Card className="w-full max-w-md border-zinc-800/60 bg-zinc-950/60 backdrop-blur">
        <CardHeader>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-indigo-500/30 to-fuchsia-500/20 border border-white/10" />
              <div>
                <CardTitle className="leading-tight">Sign in</CardTitle>
                <CardDescription>Continue to your dashboard.</CardDescription>
              </div>
            </div>
            <p className="text-xs text-zinc-400">
              Uses AWS Cognito. Your session is stored in a short-lived cookie on this device.
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm text-zinc-300" htmlFor="username">
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
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-3">
                <label className="text-sm text-zinc-300" htmlFor="password">
                  Password
                </label>
                <button
                  type="button"
                  className="text-xs text-zinc-400 hover:text-zinc-200"
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
                className="text-sm text-red-200 border border-red-500/30 bg-red-500/10 rounded-xl px-3 py-2"
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

            <p className="text-xs text-zinc-500">
              Tip: if you were redirected here, you’ll be sent back to{" "}
              <span className="text-zinc-300">{redirectTo}</span> after sign-in.
            </p>

            <p className="text-xs text-zinc-500 text-center">
              New here?{" "}
              <Link href="/signup" className="text-zinc-200 hover:underline">
                Create an account
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}


