"use client";

// AffiliatePayoutMeterBlock — visual gauge of earnings + next payout
// date. Reads `/api/portal/affiliates/me` (or returns empty for
// anonymous visitors). Editor mode renders a structural placeholder.
//
// T2's @aqua/plugin-affiliates declares this block id; rendering is
// delegated to T3 per architecture.

import { useEffect, useState } from "react";
import type { BlockRenderProps } from "../blockRegistry";
import { blockStylesToCss } from "../blockStyles";

interface AffiliateSummary {
  status: string;
  pendingCents: number;
  approvedCents: number;
  paidCents: number;
  currency?: string;
  nextPayoutAt?: number;
  totalReferred?: number;
}

export default function AffiliatePayoutMeterBlock({ block, editorMode }: BlockRenderProps) {
  const [summary, setSummary] = useState<AffiliateSummary | null>(null);

  useEffect(() => {
    if (editorMode) return;
    let cancelled = false;
    void fetch("/api/portal/affiliates/me", { cache: "no-store", credentials: "include" })
      .then(r => r.ok ? r.json() as Promise<{ affiliate?: AffiliateSummary | null; attributions?: { status: string; commissionCents: number }[]; payouts?: { status: string; amountCents: number; scheduledFor?: number }[] }> : { affiliate: null })
      .then(data => {
        if (cancelled) return;
        if (!data?.affiliate) { setSummary(null); return; }
        // Roll up attribution + payout totals into the meter snapshot.
        const pendingCents = (data.attributions ?? []).filter(a => a.status === "pending").reduce((acc, a) => acc + (a.commissionCents ?? 0), 0);
        const approvedCents = (data.attributions ?? []).filter(a => a.status === "approved").reduce((acc, a) => acc + (a.commissionCents ?? 0), 0);
        const paidCents = (data.payouts ?? []).filter(p => p.status === "completed").reduce((acc, p) => acc + (p.amountCents ?? 0), 0);
        const nextScheduledPayout = (data.payouts ?? []).filter(p => p.status === "scheduled" || p.status === "in_progress").sort((a, b) => (a.scheduledFor ?? 0) - (b.scheduledFor ?? 0))[0];
        setSummary({
          ...data.affiliate,
          pendingCents,
          approvedCents,
          paidCents,
          nextPayoutAt: nextScheduledPayout?.scheduledFor,
        });
      })
      .catch(() => { /* silent */ });
    return () => { cancelled = true; };
  }, [editorMode]);

  const fmt = (cents: number, currency = "GBP") =>
    new Intl.NumberFormat("en-GB", { style: "currency", currency }).format(cents / 100);

  const containerStyle: React.CSSProperties = {
    padding: 24,
    background: "rgba(255,255,255,0.02)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 16,
    ...blockStylesToCss(block.styles),
  };

  if (editorMode || !summary) {
    return (
      <section data-block-type="affiliate-payout-meter" style={containerStyle}>
        <p style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.18em", color: "var(--brand-orange, #ff6b35)", margin: "0 0 8px" }}>
          Payout meter
        </p>
        <p style={{ fontSize: 13, opacity: 0.6, margin: 0 }}>
          {editorMode ? "Live earnings render here when published" : "Sign in to see your earnings."}
        </p>
      </section>
    );
  }

  const total = summary.pendingCents + summary.approvedCents;
  const approvedPct = total > 0 ? Math.round((summary.approvedCents / total) * 100) : 0;
  const currency = summary.currency ?? "GBP";

  return (
    <section data-block-type="affiliate-payout-meter" style={containerStyle}>
      <p style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.18em", color: "var(--brand-orange, #ff6b35)", margin: "0 0 8px" }}>
        Your earnings
      </p>
      <p style={{ fontSize: 28, fontWeight: 700, margin: "0 0 4px" }}>
        {fmt(summary.approvedCents, currency)}
        <span style={{ fontSize: 13, opacity: 0.55, fontWeight: 400, marginLeft: 6 }}>
          approved
        </span>
      </p>
      <p style={{ fontSize: 13, opacity: 0.65, margin: "0 0 16px" }}>
        + {fmt(summary.pendingCents, currency)} pending · {fmt(summary.paidCents, currency)} paid lifetime
      </p>
      {/* Approved-vs-pending bar */}
      <div style={{ height: 8, borderRadius: 4, background: "rgba(255,255,255,0.06)", overflow: "hidden", marginBottom: 12 }}>
        <div style={{ width: `${approvedPct}%`, height: "100%", background: "var(--brand-orange, #ff6b35)" }} />
      </div>
      {summary.nextPayoutAt && (
        <p style={{ fontSize: 12, opacity: 0.55, margin: 0 }}>
          Next payout: {new Date(summary.nextPayoutAt).toLocaleDateString()}
        </p>
      )}
      {summary.totalReferred !== undefined && (
        <p style={{ fontSize: 12, opacity: 0.55, margin: "4px 0 0" }}>
          Total referred: {summary.totalReferred}
        </p>
      )}
    </section>
  );
}
