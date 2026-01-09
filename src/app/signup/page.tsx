"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BadgeCheck, Mail, ShieldCheck } from "lucide-react";

import { AuthShell } from "@/components/AuthShell";
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
    score <= 2
      ? "bg-red-400/70"
      : score === 3
        ? "bg-amber-300/80"
        : score === 4
          ? "bg-[#0066FF]/60"
          : "bg-[#0066FF]";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-500">Password strength</span>
        <span className="font-medium text-slate-700">{label}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-black/5">
        <div className={`h-full ${bar}`} style={{ width: `${(score / 5) * 100}%` }} />
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className={c.hasMin ? "text-[#0066FF]" : "text-slate-500"}>8+ chars</div>
        <div className={c.hasUpper ? "text-[#0066FF]" : "text-slate-500"}>Uppercase</div>
        <div className={c.hasLower ? "text-[#0066FF]" : "text-slate-500"}>Lowercase</div>
        <div className={c.hasNum ? "text-[#0066FF]" : "text-slate-500"}>Number</div>
        <div className={c.hasSym ? "text-[#0066FF]" : "text-slate-500"}>Symbol</div>
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
    <AuthShell>
      <Card className="overflow-hidden">
        <CardHeader className="flex-col items-start gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-3xl border border-black/5 bg-white/70">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0066FF] to-[#6EA8FF]">
                <ShieldCheck className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold tracking-wider text-slate-500">Unity Saving</div>
              <CardTitle className="mt-1 text-2xl leading-tight">
                {step === "signup" ? "Create your account" : "Verify your email"}
              </CardTitle>
              <CardDescription>
                {step === "signup"
                  ? "A secure signup for your Unity Saving drive (AWS Cognito)."
                  : "Enter the 6-digit code we sent to your email."}
              </CardDescription>
            </div>
          </div>

          <p className="text-xs text-slate-500">
            Uses AWS Cognito. Your session is stored in a short-lived cookie on this device.
          </p>
        </CardHeader>

        <CardContent>
          {step === "signup" ? (
            <form onSubmit={onSubmitSignup} className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700" htmlFor="firstName">
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
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700" htmlFor="lastName">
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

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700" htmlFor="email">
                  Email
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
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
                <label className="text-sm font-medium text-slate-700" htmlFor="password">
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
                  className="rounded-2xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-700"
                >
                  {error}
                </p>
              ) : null}

              <Button type="submit" variant="primary" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Creating…" : "Create account"}
              </Button>

              <p className="text-xs text-slate-500 text-center">
                Already have an account?{" "}
                <Link href="/login" className="font-medium text-slate-900 hover:underline">
                  Sign in
                </Link>
              </p>
            </form>
          ) : (
            <form onSubmit={onSubmitConfirm} className="space-y-4">
              <div className="rounded-2xl border border-black/5 bg-white/60 px-4 py-3 text-sm text-slate-700">
                <div className="flex items-center gap-2 font-semibold text-slate-900">
                  <BadgeCheck className="h-4 w-4 text-[#0066FF]" />
                  Verify your email
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  Enter the 6-digit code sent to <span className="font-medium text-slate-700">{email}</span>.
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700" htmlFor="code">
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
                  className="rounded-2xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-700"
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

              <p className="text-xs text-slate-500 text-center">
                Prefer to sign in instead?{" "}
                <Link href="/login" className="font-medium text-slate-900 hover:underline">
                  Sign in
                </Link>
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </AuthShell>
  );
}


