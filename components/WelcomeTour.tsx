"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, Sparkles, X } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { getTourStatus, markTourSeen } from "@/lib/onboardingApi";

type Step = {
  target: string; // CSS selector
  title: string;
  body: string;
};

const STEPS: Step[] = [
  {
    target: '[data-tour="search"]',
    title: "Search fast",
    body: "Use the search bar to quickly find files, notes, or contacts—it's the fastest way to navigate Unity Saving.",
  },
  {
    target: '[data-tour="card-folders"]',
    title: "Folders / Drive",
    body: "Upload and manage your financial documents securely in AWS S3 using Folders.",
  },
  {
    target: '[data-tour="card-calculator"]',
    title: "Calculator",
    body: "Project savings growth with compound interest—then save projections to S3.",
  },
  {
    target: '[data-tour="card-notes"]',
    title: "Notes & Contacts",
    body: "Keep secure records: notes for key details and contacts for your trusted people and providers.",
  },
];

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function getRect(el: Element) {
  const r = el.getBoundingClientRect();
  return {
    left: r.left,
    top: r.top,
    width: r.width,
    height: r.height,
    right: r.right,
    bottom: r.bottom,
  };
}

export function WelcomeTour(props: { onCloseTour?: () => void }) {
  const { onCloseTour } = props;

  const [ready, setReady] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [stepIdx, setStepIdx] = React.useState(0);
  const [targetRect, setTargetRect] = React.useState<null | ReturnType<typeof getRect>>(null);

  const step = STEPS[clamp(stepIdx, 0, STEPS.length - 1)]!;

  // Load tour status once.
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const st = await getTourStatus();
        if (cancelled) return;
        setReady(true);
        if (!st.seen) setOpen(true);
      } catch {
        // If the status call fails, don't block the app; just skip the tour.
        if (cancelled) return;
        setReady(true);
        setOpen(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Locate target and keep rect updated.
  React.useEffect(() => {
    if (!open) return;
    const el = document.querySelector(step.target);
    if (el) {
      // Smoothly ensure it's visible.
      try {
        (el as HTMLElement).scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
      } catch {
        // ignore
      }
      setTargetRect(getRect(el));
    } else {
      setTargetRect(null);
    }

    function recalc() {
      const el2 = document.querySelector(step.target);
      if (!el2) return setTargetRect(null);
      setTargetRect(getRect(el2));
    }

    window.addEventListener("resize", recalc);
    window.addEventListener("scroll", recalc, true);
    const t = window.setInterval(recalc, 350);
    return () => {
      window.removeEventListener("resize", recalc);
      window.removeEventListener("scroll", recalc, true);
      window.clearInterval(t);
    };
  }, [open, step.target]);

  async function close(action: "completed" | "skipped") {
    setOpen(false);
    try {
      await markTourSeen(action);
    } catch {
      // non-fatal
    }
    onCloseTour?.();
  }

  if (!ready || !open) return null;

  const hasPrev = stepIdx > 0;
  const hasNext = stepIdx < STEPS.length - 1;

  const pad = 10;
  const spotlight = targetRect
    ? {
        left: Math.max(8, targetRect.left - pad),
        top: Math.max(8, targetRect.top - pad),
        width: Math.max(24, targetRect.width + pad * 2),
        height: Math.max(24, targetRect.height + pad * 2),
      }
    : null;

  // Tooltip positioning: prefer right, then left, then below.
  const tip = (() => {
    const w = 360;
    const h = 180;
    const margin = 14;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    if (!spotlight) {
      return { left: clamp(vw / 2 - w / 2, margin, vw - w - margin), top: clamp(vh / 2 - h / 2, margin, vh - h - margin) };
    }

    const rightLeft = spotlight.left + spotlight.width + margin;
    const leftLeft = spotlight.left - w - margin;
    const belowTop = spotlight.top + spotlight.height + margin;
    const aboveTop = spotlight.top - h - margin;

    // Right side fits
    if (rightLeft + w + margin <= vw) {
      return { left: rightLeft, top: clamp(spotlight.top + spotlight.height / 2 - h / 2, margin, vh - h - margin) };
    }
    // Left side fits
    if (leftLeft >= margin) {
      return { left: leftLeft, top: clamp(spotlight.top + spotlight.height / 2 - h / 2, margin, vh - h - margin) };
    }
    // Below fits
    if (belowTop + h + margin <= vh) {
      return { left: clamp(spotlight.left + spotlight.width / 2 - w / 2, margin, vw - w - margin), top: belowTop };
    }
    // Above fallback
    return { left: clamp(spotlight.left + spotlight.width / 2 - w / 2, margin, vw - w - margin), top: clamp(aboveTop, margin, vh - h - margin) };
  })();

  return (
    <div className="fixed inset-0 z-[90]" role="dialog" aria-modal="true" aria-label="Welcome tour">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Spotlight */}
      {spotlight ? (
        <div
          className="absolute rounded-[28px] ring-2 ring-[#0066FF]/45 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]"
          style={{
            left: spotlight.left,
            top: spotlight.top,
            width: spotlight.width,
            height: spotlight.height,
          }}
        />
      ) : null}

      {/* Tooltip */}
      <div
        className="absolute w-[360px] overflow-hidden rounded-3xl border border-[#0066FF]/18 bg-white/90 shadow-[0_30px_120px_-40px_rgba(2,6,23,0.45)] backdrop-blur-xl"
        style={{ left: tip.left, top: tip.top }}
      >
        <div className="flex items-start justify-between gap-3 border-b border-black/10 px-5 py-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-2xl border border-[#0066FF]/15 bg-[#0066FF]/10">
                <Sparkles className="h-4 w-4 text-[#0066FF]" />
              </span>
              Welcome Tour
            </div>
            <div className="mt-1 text-xs text-slate-500">
              Step {stepIdx + 1} of {STEPS.length}
            </div>
          </div>
          <button
            type="button"
            onClick={() => void close("skipped")}
            className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-black/10 bg-white/70 text-slate-700 hover:bg-white"
            aria-label="Skip tour"
            title="Skip"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 py-4">
          <div className="text-base font-semibold tracking-tight text-slate-900">{step.title}</div>
          <div className="mt-2 text-sm leading-relaxed text-slate-600">{step.body}</div>

          <div className="mt-5 flex items-center justify-between gap-3">
            <Button variant="ghost" size="sm" onClick={() => void close("skipped")}>
              Skip
            </Button>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={() => setStepIdx((i) => Math.max(0, i - 1))} disabled={!hasPrev}>
                <ChevronLeft className="h-4 w-4" />
                Back
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  if (hasNext) setStepIdx((i) => i + 1);
                  else void close("completed");
                }}
                className={cn(
                  "border border-[#0066FF]/25 bg-[#0066FF] text-white hover:bg-[#005AE0] active:bg-[#004FC6]",
                )}
              >
                {hasNext ? (
                  <>
                    Next <ChevronRight className="h-4 w-4" />
                  </>
                ) : (
                  "Finish"
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

