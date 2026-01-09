"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { clearAuthCookies } from "@/lib/auth";

export function LogoutButton(props: {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md";
  className?: string;
  label?: string;
}) {
  const { variant = "ghost", size = "sm", className, label = "Log Out" } = props;
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);

  function onLogout() {
    setBusy(true);
    clearAuthCookies();
    router.replace("/login");
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={onLogout}
      disabled={busy}
      aria-label={label}
      className={className}
    >
      <LogOut className="h-4 w-4" />
      <span>{busy ? "Signing out…" : label}</span>
    </Button>
  );
}


