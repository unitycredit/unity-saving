"use client";

import * as React from "react";
import { BarChart3, Save, TrendingUp } from "lucide-react";
import Chart from "chart.js/auto";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";
import { saveProjection } from "@/lib/projectionsApi";

function clampNumber(n: number, min: number, max: number) {
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
}

function money(n: number) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

export function CalculatorSection() {
  const { toast } = useToast();

  const [initialDeposit, setInitialDeposit] = React.useState(5000);
  const [monthlyContribution, setMonthlyContribution] = React.useState(250);
  const [annualRatePct, setAnnualRatePct] = React.useState(6);
  const [years, setYears] = React.useState(20);

  const inputs = React.useMemo(() => {
    return {
      initialDeposit: clampNumber(initialDeposit, 0, 50_000_000),
      monthlyContribution: clampNumber(monthlyContribution, 0, 5_000_000),
      annualRatePct: clampNumber(annualRatePct, -50, 50),
      years: clampNumber(years, 0, 80),
    };
  }, [annualRatePct, initialDeposit, monthlyContribution, years]);

  const series = React.useMemo(() => {
    const months = Math.round(inputs.years * 12);
    const r = inputs.annualRatePct / 100 / 12;

    let balance = inputs.initialDeposit;
    const out: Array<{ month: number; balance: number; principal: number; interest: number }> = [];
    out.push({ month: 0, balance, principal: inputs.initialDeposit, interest: 0 });

    for (let m = 1; m <= months; m++) {
      balance = balance * (1 + r) + inputs.monthlyContribution;
      const principal = inputs.initialDeposit + inputs.monthlyContribution * m;
      const interest = balance - principal;
      out.push({ month: m, balance, principal, interest });
    }
    return out;
  }, [inputs]);

  const results = React.useMemo(() => {
    const last = series[series.length - 1] ?? { balance: 0, principal: 0, interest: 0 };
    return {
      totalBalance: last.balance,
      totalPrincipal: last.principal,
      totalInterest: last.interest,
    };
  }, [series]);

  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const chartRef = React.useRef<Chart | null>(null);

  React.useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;

    chartRef.current?.destroy();

    const labels = series.map((p) => (p.month / 12).toFixed(1));
    const data = series.map((p) => Math.max(0, p.balance));

    const ctx = el.getContext("2d");
    if (!ctx) return;

    const gradient = ctx.createLinearGradient(0, 0, 0, el.height || 240);
    gradient.addColorStop(0, "rgba(0,102,255,0.30)");
    gradient.addColorStop(1, "rgba(0,102,255,0.02)");

    chartRef.current = new Chart(ctx, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "Balance",
            data,
            borderColor: "#0066FF",
            backgroundColor: gradient,
            fill: true,
            tension: 0.25,
            pointRadius: 0,
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (c) => ` ${money(Number(c.parsed.y ?? 0))}`,
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              maxTicksLimit: 8,
              callback: (_v, idx) => {
                // Show fewer ticks for readability.
                const i = Number(idx);
                const month = series[i]?.month ?? 0;
                return month % 12 === 0 ? `${Math.round(month / 12)}y` : "";
              },
            },
          },
          y: {
            ticks: {
              callback: (v) => {
                const n = Number(v);
                if (!Number.isFinite(n)) return "";
                if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
                if (n >= 1_000) return `$${Math.round(n / 1000)}k`;
                return `$${Math.round(n)}`;
              },
            },
          },
        },
      },
    });

    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, [series]);

  const principalPct = results.totalBalance > 0 ? (results.totalPrincipal / results.totalBalance) * 100 : 0;
  const interestPct = results.totalBalance > 0 ? (results.totalInterest / results.totalBalance) * 100 : 0;

  const [saving, setSaving] = React.useState(false);

  async function onSave() {
    setSaving(true);
    try {
      const out = await saveProjection({
        inputs,
        results,
        series,
      });
      toast({ title: "Projection saved", message: out.key, variant: "success" });
    } catch (e) {
      toast({
        title: "Save failed",
        message: e instanceof Error ? e.message : "Could not save projection.",
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="overflow-hidden">
      <div className="p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm font-semibold tracking-wide text-[#0066FF]">Calculator</div>
            <div className="mt-1 text-xl font-semibold tracking-tight text-slate-900">Compound Interest (Savings Growth)</div>
            <div className="mt-1 text-sm text-slate-600">Estimate how your savings grows over time with contributions + interest.</div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => void onSave()}
              disabled={saving}
              className="border border-[#0066FF]/25 bg-[#0066FF] text-white shadow-[0_18px_45px_-25px_rgba(0,102,255,0.55)] hover:bg-[#005AE0] active:bg-[#004FC6]"
            >
              <Save className={cn("h-4 w-4", saving && "opacity-70")} />
              {saving ? "Saving…" : "Save Projection"}
            </Button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[360px_1fr]">
          {/* Inputs */}
          <div className="overflow-hidden rounded-3xl border border-[#0066FF]/10 bg-white shadow-sm">
            <div className="border-b border-[#0066FF]/10 px-5 py-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <BarChart3 className="h-4 w-4 text-[#0066FF]" />
                Inputs
              </div>
              <div className="mt-1 text-xs text-slate-500">All values are estimates. No financial advice.</div>
            </div>
            <div className="space-y-4 p-5">
              <Field
                label="Initial Deposit ($)"
                value={initialDeposit}
                onChange={setInitialDeposit}
                step="100"
                hint="One-time starting amount."
              />
              <Field
                label="Monthly Contribution ($)"
                value={monthlyContribution}
                onChange={setMonthlyContribution}
                step="50"
                hint="Added each month."
              />
              <Field
                label="Annual Interest Rate (%)"
                value={annualRatePct}
                onChange={setAnnualRatePct}
                step="0.1"
                hint="Compounded monthly."
              />
              <Field
                label="Time Period (Years)"
                value={years}
                onChange={setYears}
                step="1"
                hint="How long you plan to save."
              />
            </div>
          </div>

          {/* Chart + results */}
          <div className="space-y-4">
            <div className="overflow-hidden rounded-3xl border border-[#0066FF]/10 bg-white shadow-sm">
              <div className="border-b border-[#0066FF]/10 px-5 py-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <TrendingUp className="h-4 w-4 text-[#0066FF]" />
                  Growth Curve
                </div>
                <div className="mt-1 text-xs text-slate-500">Balance over time.</div>
              </div>
              <div className="h-[300px] p-4">
                <canvas ref={canvasRef} />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="overflow-hidden rounded-3xl border border-[#0066FF]/10 bg-white shadow-sm">
                <div className="px-5 py-4">
                  <div className="text-xs font-semibold tracking-wide text-slate-500">Total Balance</div>
                  <div className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">{money(results.totalBalance)}</div>
                  <div className="mt-1 text-xs text-slate-500">
                    After {inputs.years} year{inputs.years === 1 ? "" : "s"} at {inputs.annualRatePct}% APR
                  </div>
                </div>
              </div>

              <div className="overflow-hidden rounded-3xl border border-[#0066FF]/10 bg-white shadow-sm">
                <div className="px-5 py-4">
                  <div className="text-xs font-semibold tracking-wide text-slate-500">Breakdown</div>
                  <div className="mt-3 space-y-2 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-slate-600">Total Principal</div>
                      <div className="font-semibold text-slate-900">{money(results.totalPrincipal)}</div>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-slate-600">Total Interest Earned</div>
                      <div className="font-semibold text-slate-900">{money(results.totalInterest)}</div>
                    </div>
                  </div>

                  <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-black/5">
                    <div className="h-full bg-[#0066FF]/70" style={{ width: `${Math.max(0, Math.min(100, principalPct))}%` }} />
                    <div
                      className="h-full bg-[#6EA8FF]/80"
                      style={{ width: `${Math.max(0, Math.min(100, interestPct))}%` }}
                    />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Principal</span>
                    <span>Interest</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

function Field(props: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  step?: string;
  hint?: string;
}) {
  const { label, value, onChange, step, hint } = props;
  return (
    <label className="block">
      <div className="text-sm font-semibold text-slate-900">{label}</div>
      {hint ? <div className="mt-0.5 text-xs text-slate-500">{hint}</div> : null}
      <div className="mt-2">
        <Input
          type="number"
          inputMode="decimal"
          step={step}
          value={Number.isFinite(value) ? String(value) : ""}
          onChange={(e) => onChange(Number(e.target.value))}
          className="h-11 rounded-2xl border border-[#0066FF]/15 bg-white shadow-sm focus-visible:ring-[#0066FF]/25"
        />
      </div>
    </label>
  );
}

