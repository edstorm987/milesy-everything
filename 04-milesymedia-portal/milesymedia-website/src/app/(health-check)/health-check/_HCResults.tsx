// T4 R008 — final HC step. Shows per-area scores, captures email,
// posts to the public-funnel endpoint (T2 R021); on success the
// server creates the lead, issues a session, and the response
// includes a redirect target (typically `/business-os`). Honesty
// contract: nothing here pretends an audit ran — scores are derived
// purely from the user's own answers.

"use client";

import { useState, type FormEvent } from "react";
import type { HCArea, HCSlot } from "@/lib/healthCheck/types";

type ScoreRow = { area: HCArea; score: number; state: { tier: HCSlot["tier"] | null; raw: Record<number, unknown> } };

export function HCResults({ scores }: { scores: ScoreRow[] }) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const overall = Math.round(scores.reduce((s, r) => s + r.score, 0) / Math.max(1, scores.length));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true); setErr(null);
    try {
      const slot = {
        overall,
        areas: scores.map((s) => ({ id: s.area.id, score: s.score, tier: s.state.tier, raw: s.state.raw })),
      };
      const res = await fetch("/api/portal/public-funnel/hc-complete", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, slot }),
      });
      if (!res.ok) throw new Error(`status ${res.status}`);
      const data = await res.json().catch(() => ({}));
      window.location.href = (data && data.redirect) || "/business-os";
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "submit failed");
      setBusy(false);
    }
  };

  return (
    <div className="hc-shell hc-results">
      <h1>Your Health Check</h1>
      <div className="hc-overall">
        <span>Overall</span><strong>{overall}</strong>
      </div>
      <ul className="hc-score-list">
        {scores.map((r) => (
          <li key={r.area.id}>
            <span aria-hidden>{r.area.icon}</span>
            <span className="hc-score-name">{r.area.name}</span>
            <strong>{r.score}</strong>
          </li>
        ))}
      </ul>

      <form onSubmit={submit} className="hc-capture">
        <label>Email me the full read-out
          <input type="email" required value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@yourbusiness.co.uk" />
        </label>
        <button className="hc-btn-primary" type="submit" disabled={busy}>
          {busy ? "Sending…" : "Send my results"}
        </button>
        {err && <p className="hc-err">Couldn&apos;t submit ({err}). Try again or email hello@milesymedia.co.</p>}
      </form>
    </div>
  );
}
