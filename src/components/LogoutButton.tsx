"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { clearAuthCookies } from "@/lib/auth";

export function LogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);

  function onLogout() {
    setBusy(true);
    clearAuthCookies();
    router.replace("/login");
  }

  return (
    <Button variant="ghost" size="sm" onClick={onLogout} disabled={busy} aria-label="Logout">
      <LogOut className="h-4 w-4" />
      <span>{busy ? "Signing out…" : "Logout"}</span>
    </Button>
  );
}


