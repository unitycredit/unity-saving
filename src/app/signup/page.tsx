"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BadgeCheck, Mail, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { confirmSignUp, resendSignUpCode, signUp } from "@/lib/auth";

function passwordChecks(pw: string) {
  const hasMin = pw.length >= 8;
  const hasUpper = /[A-Z]/.test(pw);
  const hasLower = /[a-z]/.test(pw);
  const hasNum = /\d/.test(pw);
  const hasSym = /[^A-Za-z0-9]/.test(pw);
  return { hasMin, hasUpper, hasLower, hasNum, hasSym };
}

function PasswordStrength({ value }: { value: string }) {
  const c = passwordChecks(value);
  const score = [c.hasMin, c.hasUpper, c.hasLower, c.hasNum, c.hasSym].filter(Boolean).length;
  const label = score <= 2 ? "Weak" : score === 3 ? "Good" : score === 4 ? "Strong" : "Excellent";
  const bar =
    score <= 2 ? "bg-red-400/60" : score === 3 ? "bg-amber-300/60" : score === 4 ? "bg-emerald-300/60" : "bg-emerald-300";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-zinc-500">Password strength</span>
        <span className="text-zinc-300">{label}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
        <div className={`h-full ${bar}`} style={{ width: `${(score / 5) * 100}%` }} />
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className={c.hasMin ? "text-emerald-300" : "text-zinc-500"}>8+ chars</div>
        <div className={c.hasUpper ? "text-emerald-300" : "text-zinc-500"}>Uppercase</div>
        <div className={c.hasLower ? "text-emerald-300" : "text-zinc-500"}>Lowercase</div>
        <div className={c.hasNum ? "text-emerald-300" : "text-zinc-500"}>Number</div>
        <div className={c.hasSym ? "text-emerald-300" : "text-zinc-500"}>Symbol</div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  const router = useRouter();

  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");

  const [step, setStep] = React.useState<"signup" | "confirm">("signup");
  const [code, setCode] = React.useState("");

  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  async function onSubmitSignup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await signUp({ firstName, lastName, email, password });
      setStep("confirm");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-up failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function onSubmitConfirm(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await confirmSignUp({ email, code });
      router.replace("/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Confirmation failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function onResend() {
    setError(null);
    setIsSubmitting(true);
    try {
      await resendSignUpCode({ email });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resend code");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen px-4 flex items-center justify-center bg-gradient-to-b from-zinc-950 via-zinc-950 to-zinc-900">
      <Card className="w-full max-w-lg border-zinc-800/60 bg-zinc-950/60 backdrop-blur">
        <CardHeader>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-emerald-500/25 to-indigo-500/20">
                <ShieldCheck className="h-5 w-5 text-zinc-100" />
              </div>
              <div>
                <CardTitle className="leading-tight">Create your account</CardTitle>
                <CardDescription>Secure signup powered by AWS Cognito.</CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {step === "signup" ? (
            <form onSubmit={onSubmitSignup} className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-sm text-zinc-300" htmlFor="firstName">
                    First name
                  </label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Chaim"
                    autoComplete="given-name"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm text-zinc-300" htmlFor="lastName">
                    Last name
                  </label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Levi"
                    autoComplete="family-name"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm text-zinc-300" htmlFor="email">
                  Email
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    required
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-zinc-300" htmlFor="password">
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a strong password"
                  autoComplete="new-password"
                  required
                />
                <PasswordStrength value={password} />
              </div>

              {error ? (
                <p
                  role="alert"
                  className="text-sm text-red-200 border border-red-500/30 bg-red-500/10 rounded-xl px-3 py-2"
                >
                  {error}
                </p>
              ) : null}

              <Button type="submit" variant="primary" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Creating…" : "Create account"}
              </Button>

              <p className="text-xs text-zinc-500 text-center">
                Already have an account?{" "}
                <Link href="/login" className="text-zinc-200 hover:underline">
                  Sign in
                </Link>
              </p>
            </form>
          ) : (
            <form onSubmit={onSubmitConfirm} className="space-y-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-300">
                <div className="flex items-center gap-2 font-medium text-white">
                  <BadgeCheck className="h-4 w-4 text-emerald-300" />
                  Verify your email
                </div>
                <div className="mt-1 text-xs text-zinc-400">
                  Enter the 6-digit code sent to <span className="text-zinc-200">{email}</span>.
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm text-zinc-300" htmlFor="code">
                  Verification code
                </label>
                <Input
                  id="code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="123456"
                  inputMode="numeric"
                  autoComplete="one-time-code"
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

              <div className="flex flex-col gap-2 sm:flex-row">
                <Button type="submit" variant="primary" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? "Verifying…" : "Verify & continue"}
                </Button>
                <Button type="button" variant="secondary" className="w-full" onClick={onResend} disabled={isSubmitting}>
                  Resend code
                </Button>
              </div>

              <p className="text-xs text-zinc-500 text-center">
                Prefer to sign in instead?{" "}
                <Link href="/login" className="text-zinc-200 hover:underline">
                  Sign in
                </Link>
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  );
}


