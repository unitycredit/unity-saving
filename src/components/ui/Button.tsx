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
        "inline-flex items-center justify-center gap-2 rounded-xl text-sm font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/15 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950",
        "disabled:pointer-events-none disabled:opacity-50",
        size === "sm" ? "h-9 px-3" : "h-10 px-4",
        variant === "primary" &&
          "bg-white text-zinc-950 hover:bg-zinc-200 active:bg-zinc-300",
        variant === "secondary" &&
          "border border-white/10 bg-white/5 text-white hover:bg-white/10 active:bg-white/15",
        variant === "ghost" &&
          "bg-transparent text-white hover:bg-white/10 active:bg-white/15",
        className,
      )}
      {...props}
    />
  );
}


