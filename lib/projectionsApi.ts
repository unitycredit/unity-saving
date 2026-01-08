export async function saveProjection(payload: {
  inputs: {
    initialDeposit: number;
    monthlyContribution: number;
    annualRatePct: number;
    years: number;
  };
  results: {
    totalBalance: number;
    totalPrincipal: number;
    totalInterest: number;
  };
  series: Array<{ month: number; balance: number; principal: number; interest: number }>;
}) {
  const res = await fetch("/api/projections/save", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const raw = await res.text().catch(() => "");
    try {
      const parsed = JSON.parse(raw) as { error?: string };
      throw new Error(parsed.error || `Save projection failed: ${res.status}`);
    } catch {
      throw new Error(raw || `Save projection failed: ${res.status}`);
    }
  }
  return (await res.json()) as { ok: true; id: string; key: string };
}

