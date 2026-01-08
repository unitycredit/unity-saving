"use client";

import * as React from "react";

import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

type Operator = "+" | "-" | "×" | "÷";

function compute(a: number, b: number, op: Operator) {
  switch (op) {
    case "+":
      return a + b;
    case "-":
      return a - b;
    case "×":
      return a * b;
    case "÷":
      return b === 0 ? NaN : a / b;
  }
}

function trimFloat(n: number) {
  if (!n.toString().includes(".")) return n;
  return Number(n.toFixed(10));
}

export function CalculatorCard({ icon }: { icon: React.ReactNode }) {
  const [display, setDisplay] = React.useState("0");
  const [acc, setAcc] = React.useState<number | null>(null);
  const [op, setOp] = React.useState<Operator | null>(null);
  const [waiting, setWaiting] = React.useState(false);

  const inputNumber = (n: string) => {
    setDisplay((d) => {
      if (waiting) {
        setWaiting(false);
        return n;
      }
      if (d === "0") return n;
      if (d.length > 16) return d;
      return d + n;
    });
  };

  const inputDot = () => {
    setDisplay((d) => {
      if (waiting) {
        setWaiting(false);
        return "0.";
      }
      if (d.includes(".")) return d;
      return d + ".";
    });
  };

  const clearAll = () => {
    setDisplay("0");
    setAcc(null);
    setOp(null);
    setWaiting(false);
  };

  const backspace = () => {
    setDisplay((d) => {
      if (waiting) return d;
      if (d.length <= 1) return "0";
      return d.slice(0, -1);
    });
  };

  const chooseOperator = (next: Operator) => {
    const current = Number(display);
    if (acc == null) {
      setAcc(current);
      setOp(next);
      setWaiting(true);
      return;
    }
    if (op && !waiting) {
      const result = compute(acc, current, op);
      setAcc(result);
      setDisplay(Number.isFinite(result) ? String(trimFloat(result)) : "Error");
    }
    setOp(next);
    setWaiting(true);
  };

  const equals = () => {
    if (acc == null || op == null) return;
    const current = Number(display);
    const result = compute(acc, current, op);
    setAcc(null);
    setOp(null);
    setWaiting(true);
    setDisplay(Number.isFinite(result) ? String(trimFloat(result)) : "Error");
  };

  const onKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
    const k = e.key;
    if (k >= "0" && k <= "9") return void (e.preventDefault(), inputNumber(k));
    if (k === ".") return void (e.preventDefault(), inputDot());
    if (k === "Backspace") return void (e.preventDefault(), backspace());
    if (k === "Escape") return void (e.preventDefault(), clearAll());
    if (k === "Enter" || k === "=") return void (e.preventDefault(), equals());
    if (k === "+" || k === "-" || k === "*" || k === "/") {
      e.preventDefault();
      chooseOperator(k === "*" ? "×" : k === "/" ? "÷" : (k as Operator));
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-2xl border border-white/10 bg-white/5 p-2.5 text-white">
            {icon}
          </div>
          <div>
            <CardTitle>Calculator</CardTitle>
            <CardDescription>Logic-based, sleek calculator.</CardDescription>
          </div>
        </div>
        <Button variant="secondary" size="sm" onClick={clearAll}>
          Clear
        </Button>
      </CardHeader>
      <CardContent>
        <div
          tabIndex={0}
          onKeyDown={onKeyDown}
          className="rounded-2xl border border-white/10 bg-black/20 p-4 shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-white/15"
        >
          <div className="flex items-center justify-end rounded-xl bg-zinc-950/70 px-3 py-2 text-right font-mono text-2xl text-white">
            <span className={cn(display === "Error" && "text-red-300")}>{display}</span>
          </div>

          <div className="mt-4 grid grid-cols-4 gap-2">
            <CalcKey label="7" onClick={() => inputNumber("7")} />
            <CalcKey label="8" onClick={() => inputNumber("8")} />
            <CalcKey label="9" onClick={() => inputNumber("9")} />
            <CalcKey label="÷" tone="op" onClick={() => chooseOperator("÷")} />

            <CalcKey label="4" onClick={() => inputNumber("4")} />
            <CalcKey label="5" onClick={() => inputNumber("5")} />
            <CalcKey label="6" onClick={() => inputNumber("6")} />
            <CalcKey label="×" tone="op" onClick={() => chooseOperator("×")} />

            <CalcKey label="1" onClick={() => inputNumber("1")} />
            <CalcKey label="2" onClick={() => inputNumber("2")} />
            <CalcKey label="3" onClick={() => inputNumber("3")} />
            <CalcKey label="-" tone="op" onClick={() => chooseOperator("-")} />

            <CalcKey label="0" className="col-span-2" onClick={() => inputNumber("0")} />
            <CalcKey label="." onClick={inputDot} />
            <CalcKey label="+" tone="op" onClick={() => chooseOperator("+")} />

            <CalcKey label="⌫" tone="soft" onClick={backspace} />
            <CalcKey label="C" tone="soft" onClick={clearAll} />
            <CalcKey label="=" className="col-span-2" tone="primary" onClick={equals} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CalcKey({
  label,
  onClick,
  tone = "num",
  className,
}: {
  label: React.ReactNode;
  onClick: () => void;
  tone?: "num" | "op" | "primary" | "soft";
  className?: string;
}) {
  const base =
    "h-10 rounded-xl border text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/15 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950";
  const styles =
    tone === "primary"
      ? "border-white/10 bg-white text-zinc-950 hover:bg-zinc-200 active:bg-zinc-300"
      : tone === "op"
        ? "border-white/10 bg-white/10 text-white hover:bg-white/15 active:bg-white/20"
        : tone === "soft"
          ? "border-white/10 bg-white/5 text-zinc-200 hover:bg-white/10 active:bg-white/15"
          : "border-white/10 bg-white/5 text-white hover:bg-white/10 active:bg-white/15";

  return (
    <button type="button" onClick={onClick} className={cn(base, styles, className)}>
      {label}
    </button>
  );
}


