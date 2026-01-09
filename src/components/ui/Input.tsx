"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-2xl border border-black/10 bg-white/70 px-4 text-sm text-slate-900",
        "placeholder:text-slate-400",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066FF]/30 focus-visible:ring-offset-2 focus-visible:ring-offset-[#F9FAFB]",
        className,
      )}
      {...props}
    />
  );
}


