"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md";

export function Button({
  className,
  variant = "secondary",
  size = "md",
  type = "button",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-2xl text-sm font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066FF]/30 focus-visible:ring-offset-2 focus-visible:ring-offset-[#F9FAFB]",
        "disabled:pointer-events-none disabled:opacity-50",
        size === "sm" ? "h-9 px-3" : "h-11 px-5",
        variant === "primary" &&
          "bg-[#0066FF] text-white shadow-sm hover:bg-[#005AE0] active:bg-[#004FC6]",
        variant === "secondary" &&
          "border border-black/10 bg-white/70 text-slate-900 hover:bg-white active:bg-white",
        variant === "ghost" &&
          "bg-transparent text-slate-700 hover:bg-black/5 active:bg-black/10",
        className,
      )}
      {...props}
    />
  );
}


