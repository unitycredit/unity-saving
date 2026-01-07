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
        "h-10 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white",
        "placeholder:text-zinc-500",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/15 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950",
        className,
      )}
      {...props}
    />
  );
}


