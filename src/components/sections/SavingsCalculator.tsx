"use client";

import * as React from "react";
import { LineChart, Percent, PiggyBank } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";

function toNumber(value: string) {
  const n = Number(value.replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function formatMoney(n: number) {
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function SavingsCalculator() {
  const [principal, setPrincipal] = React.useState("10000");
  const [monthly, setMonthly] = React.useState("250");
  const [rate, setRate] = React.useState("6.5");
  const [years, setYears] = React.useState("10");

  const result = React.useMemo(() => {
    const P = clamp(toNumber(principal), 0, 10_000_000_000);
    const PMT = clamp(toNumber(monthly), 0, 10_000_000_000);
    const r = clamp(toNumber(rate), 0, 100) / 100;
    const y = clamp(toNumber(years), 0, 100);

    const n = Math.round(y * 12);
    const i = r / 12;
    if (n === 0) {
      const total = P;
      return { total, contributed: P, interest: 0, n };
    }

    const growth = Math.pow(1 + i, n);
    const fvPrincipal = P * growth;
    const fvContrib = i === 0 ? PMT * n : PMT * ((growth - 1) / i);
    const total = fvPrincipal + fvContrib;
    const contributed = P + PMT * n;
    const interest = total - contributed;
    return { total, contributed, interest, n };
  }, [principal, monthly, rate, years]);

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div>
          <CardTitle className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[#0066FF]/15 bg-[#0066FF]/10">
              <PiggyBank className="h-5 w-5 text-[#0066FF]" />
            </div>
            Savings & Interest Growth
          </CardTitle>
          <CardDescription>Estimate future value with monthly compounding and monthly contributions.</CardDescription>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <LabeledInput
            label="Starting amount"
            value={principal}
            onChange={setPrincipal}
            leading="$"
            inputMode="decimal"
            placeholder="10000"
          />
          <LabeledInput
            label="Monthly contribution"
            value={monthly}
            onChange={setMonthly}
            leading="$"
            inputMode="decimal"
            placeholder="250"
          />
          <LabeledInput
            label="Annual interest rate"
            value={rate}
            onChange={setRate}
            trailing="%"
            inputMode="decimal"
            placeholder="6.5"
          />
          <LabeledInput
            label="Years"
            value={years}
            onChange={setYears}
            inputMode="numeric"
            placeholder="10"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <Stat
            title="Projected balance"
            value={formatMoney(result.total)}
            icon={<LineChart className="h-4 w-4" />}
            tone="primary"
          />
          <Stat title="Total contributed" value={formatMoney(result.contributed)} icon={<PiggyBank className="h-4 w-4" />} />
          <Stat title="Estimated interest" value={formatMoney(result.interest)} icon={<Percent className="h-4 w-4" />} />
        </div>

        <p className="text-xs text-slate-500">
          Assumes monthly contributions at the end of each month and constant interest. This is an estimate for planning.
        </p>
      </CardContent>
    </Card>
  );
}

function LabeledInput(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  leading?: string;
  trailing?: string;
}) {
  const { label, value, onChange, placeholder, inputMode, leading, trailing } = props;
  return (
    <div className="space-y-1.5">
      <div className="text-sm font-medium text-slate-700">{label}</div>
      <div className="relative">
        {leading ? (
          <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
            {leading}
          </div>
        ) : null}
        {trailing ? (
          <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
            {trailing}
          </div>
        ) : null}
        <Input
          value={value}
          inputMode={inputMode}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn(leading && "pl-7", trailing && "pr-7")}
        />
      </div>
    </div>
  );
}

function Stat(props: {
  title: string;
  value: string;
  icon: React.ReactNode;
  tone?: "primary" | "neutral";
}) {
  const { title, value, icon, tone = "neutral" } = props;
  return (
    <div
      className={cn(
        "rounded-3xl border bg-white/60 px-5 py-4 shadow-sm backdrop-blur-xl",
        tone === "primary" ? "border-[#0066FF]/20 bg-[#0066FF]/5" : "border-black/5",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</div>
        <div
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-2xl border",
            tone === "primary"
              ? "border-[#0066FF]/15 bg-white/60 text-[#0066FF]"
              : "border-black/5 bg-white/60 text-slate-600",
          )}
        >
          {icon}
        </div>
      </div>
      <div className="mt-2 truncate text-2xl font-semibold tracking-tight text-slate-900">{value}</div>
    </div>
  );
}


