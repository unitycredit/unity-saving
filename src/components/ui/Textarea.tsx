"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "w-full rounded-2xl border border-black/10 bg-white/70 px-4 py-3 text-sm text-slate-900 shadow-sm",
        "placeholder:text-slate-400",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066FF]/30 focus-visible:ring-offset-2 focus-visible:ring-offset-[#F9FAFB]",
        className,
      )}
      {...props}
    />
  );
}


