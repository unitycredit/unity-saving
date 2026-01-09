"use client";

import * as React from "react";

type ToastItem = {
  id: string;
  title: string;
  message?: string;
  variant?: "success" | "info" | "error";
};

type ToastContextValue = {
  toast: (t: Omit<ToastItem, "id"> & { durationMs?: number }) => void;
};

const ToastContext = React.createContext<ToastContextValue | null>(null);

function toastColors(variant: ToastItem["variant"]) {
  if (variant === "success") return "border-emerald-500/20 bg-emerald-500/5";
  if (variant === "error") return "border-red-500/20 bg-red-500/5";
  return "border-black/10 bg-white/70";
}

export function ToastProvider(props: { children: React.ReactNode }) {
  const { children } = props;
  const [items, setItems] = React.useState<ToastItem[]>([]);

  const toast = React.useCallback((t: Omit<ToastItem, "id"> & { durationMs?: number }) => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const durationMs = typeof t.durationMs === "number" ? t.durationMs : 3200;

    const item: ToastItem = {
      id,
      title: t.title,
      message: t.message,
      variant: t.variant ?? "info",
    };

    setItems((prev) => [item, ...prev].slice(0, 4));
    window.setTimeout(() => {
      setItems((prev) => prev.filter((x) => x.id !== id));
    }, durationMs);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}

      <div
        className="fixed right-4 top-4 z-[100] flex w-[min(420px,calc(100vw-2rem))] flex-col gap-3"
        aria-live="polite"
        aria-relevant="additions"
      >
        {items.map((t) => (
          <div
            key={t.id}
            className={[
              "rounded-3xl border shadow-[0_18px_50px_-30px_rgba(2,6,23,0.35)] backdrop-blur-xl",
              toastColors(t.variant),
            ].join(" ")}
            role="status"
          >
            <div className="px-5 py-4">
              <div className="text-sm font-semibold text-slate-900">{t.title}</div>
              {t.message ? <div className="mt-1 text-sm text-slate-600">{t.message}</div> : null}
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider />");
  return ctx;
}


