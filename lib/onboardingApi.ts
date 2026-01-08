export async function getTourStatus() {
  const res = await fetch("/api/onboarding/tour", { method: "GET", cache: "no-store" });
  if (!res.ok) {
    const raw = await res.text().catch(() => "");
    throw new Error(raw || `Tour status failed: ${res.status}`);
  }
  return (await res.json()) as {
    ok: true;
    seen: boolean;
    version: number;
    requiredVersion: number;
    completedAt: string | null;
  };
}

export async function markTourSeen(action: "completed" | "skipped") {
  const res = await fetch("/api/onboarding/tour", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ action }),
  });
  if (!res.ok) {
    const raw = await res.text().catch(() => "");
    throw new Error(raw || `Mark tour failed: ${res.status}`);
  }
  return (await res.json()) as { ok: true; seen: true; version: number; completedAt: string };
}

