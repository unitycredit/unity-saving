"use client";

import * as React from "react";

export function AuthShell(props: { children: React.ReactNode }) {
  const { children } = props;

  return (
    <main className="relative flex min-h-dvh items-center justify-center bg-[#F9FAFB] px-4 py-10">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(0,102,255,0.18),transparent_42%),radial-gradient(circle_at_90%_10%,rgba(0,102,255,0.10),transparent_40%),radial-gradient(circle_at_55%_100%,rgba(2,6,23,0.06),transparent_45%)]" />
      <div className="relative w-full max-w-lg">{children}</div>
    </main>
  );
}


