"use client";
// AgencySwitcher — Topbar dropdown to flip the session's active agency.
// T1 R026 (chapter `04-topbar-agency-switcher.md`).
//
// Hidden when only one agency is in scope (single-agency operators
// see no UI noise). Multi-agency: <details> dropdown lists each
// agency with its brand swatch; clicking POSTs /api/auth/agency-switch
// then navigates to the response's `redirect` (role-aware).

import { useState } from "react";

export interface AgencyOption {
  id: string;
  name: string;
  swatch?: string;          // hex; falls back to a neutral chip
  isActive?: boolean;
}

interface Props {
  agencies: AgencyOption[];
  activeAgencyId: string;
}

export function AgencySwitcher({ agencies, activeAgencyId }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!agencies || agencies.length <= 1) return null;

  const active = agencies.find(a => a.id === activeAgencyId) ?? agencies[0];

  async function onPick(agencyId: string) {
    if (agencyId === activeAgencyId) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/agency-switch", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ agencyId }),
      });
      const data = (await res.json()) as { ok: boolean; redirect?: string; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Couldn't switch.");
        setBusy(false);
        return;
      }
      const target = data.redirect ?? "/portal";
      // Hard navigate so server-rendered chrome (Topbar / Sidebar) re-fetches
      // the new agency's data.
      if (typeof window !== "undefined") {
        window.location.href = target;
      }
    } catch {
      setError("Network error. Try again.");
      setBusy(false);
    }
  }

  return (
    <details
      className="relative"
      data-testid="agency-switcher"
    >
      <summary
        className="flex cursor-pointer list-none items-center gap-2 rounded-md border border-black/10 bg-white px-2 py-1 text-xs text-black/80 hover:bg-black/[0.03]"
        aria-label={`Active agency: ${active.name}. Click to switch.`}
      >
        <span
          aria-hidden
          className="inline-block h-3 w-3 rounded-sm border border-black/10"
          style={{ background: active.swatch ?? "#e5e7eb" }}
        />
        <span className="max-w-[10ch] truncate">{active.name}</span>
        <span aria-hidden className="text-black/40">▾</span>
      </summary>
      <div
        role="menu"
        className="absolute right-0 z-20 mt-1 w-56 rounded-md border border-black/10 bg-white p-1 text-xs shadow-lg"
      >
        {agencies.map(a => (
          <button
            key={a.id}
            type="button"
            role="menuitem"
            onClick={() => onPick(a.id)}
            disabled={busy}
            data-agency-id={a.id}
            data-active={a.id === activeAgencyId ? "true" : undefined}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-black/[0.04] disabled:opacity-50"
          >
            <span
              aria-hidden
              className="inline-block h-3 w-3 rounded-sm border border-black/10"
              style={{ background: a.swatch ?? "#e5e7eb" }}
            />
            <span className="flex-1 truncate">{a.name}</span>
            {a.id === activeAgencyId && (
              <span aria-label="Currently active" className="text-black/40">✓</span>
            )}
          </button>
        ))}
        {error && (
          <p role="alert" className="mt-1 px-2 py-1 text-[11px] text-red-600">{error}</p>
        )}
      </div>
    </details>
  );
}
