"use client";

// Aqua HQ — six canonical sidebar sections from chapter #59 §2.
//
// These are Ed's actual operating areas (mirroring Aqua's Obsidian HQ),
// NOT a generic SaaS plugin list. Each row is a Link to the agency-side
// surface for that area. A secondary collapsed "More tools" section
// keeps the lower-discoverability plugins one click away.

import Link from "next/link";
import { useEffect, useState } from "react";

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

// Aqua HQ canonical six (T1 R17 — chapter §1). Each row is a Link
// with an inline `requires` permission key (gated client-side; the
// sidebar layout's effective-role filter — R007 — also enforces).
// Founder bypasses every gate.
const AQUA_HQ: { id: string; label: string; href: string; hint: string; requires: string[] }[] = [
  { id: "dashboard", label: "Dashboard", href: "/portal/agency",                  hint: "Welcome + overview.",       requires: ["clients.view"] },
  { id: "pipelines", label: "Pipelines", href: "/portal/agency#clients",          hint: "Kanban — fulfilment, leads, anything.", requires: ["clients.view"] },
  { id: "inbox",     label: "Inbox",     href: "/portal/agency/activity-inbox",   hint: "Activity feed + comms.",     requires: ["clients.view"] },
  { id: "sops",      label: "SOPs",      href: "/portal/agency/sops",             hint: "Aqua System SOP shelf.",     requires: ["sops.view"] },
  { id: "finance",   label: "Finance",   href: "/portal/agency/agency-finance",   hint: "Invoices, expenses, MRR.",   requires: ["finance.view"] },
];

// Pinned to the bottom of the sidebar via `mt-auto` on its <section>.
// Lives separately so it always sits below "More tools" no matter how
// many entries the rest of the nav grows to.
const SETTINGS_ROW = {
  id: "settings", label: "Settings", href: "/portal/agency/settings",
  hint: "Brand, billing, team.", requires: ["clients.edit"],
};

const MORE_TOOLS: { id: string; label: string; href: string }[] = [
  { id: "kanban",     label: "Tasks & Kanban",   href: "/portal/agency/kanban" },
  { id: "marketing",  label: "Social Media",     href: "/portal/agency/agency-marketing" },
  { id: "hr",         label: "HR",               href: "/portal/agency/agency-hr" },
  { id: "forms",      label: "Forms",            href: "/portal/agency/forms" },
  { id: "email",      label: "Email",            href: "/portal/agency/email-sender" },
  { id: "ops",        label: "Ops",              href: "/portal/agency/ops" },
  { id: "domains",    label: "Domains",          href: "/portal/agency/domains" },
  { id: "affiliates", label: "Affiliates",       href: "/portal/agency/affiliates" },
];

export function AgencyToolsBallpark({
  permissions = [],
  isFounder = false,
}: {
  // T1 R17 — effective-role grid passed from the agency layout (R007
  // resolver). Founder bypasses; otherwise each Aqua HQ row is hidden
  // when its `requires` keys aren't all in the grid.
  permissions?: readonly string[];
  isFounder?: boolean;
}) {
  const grid = new Set<string>(permissions);
  const visibleAquaHq = isFounder
    ? AQUA_HQ
    : AQUA_HQ.filter(r => r.requires.every(p => grid.has(p)));
  const [moreOpen, setMoreOpen] = useState(false);
  const [recentSops, setRecentSops] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/portal/sops/list", { method: "GET" })
      .then(r => r.ok ? r.json() as Promise<{ ok: boolean; sops?: { updatedAt: number }[] }> : null)
      .then(data => {
        if (cancelled || !data?.sops) return;
        const cutoff = Date.now() - ONE_WEEK_MS;
        setRecentSops(data.sops.filter(s => s.updatedAt >= cutoff).length);
      })
      .catch(() => { /* sops plugin may not be installed; degrade silently */ });
    return () => { cancelled = true; };
  }, []);

  return (
    <>
      <section aria-labelledby="nav-aqua-hq" className="border-t border-black/10 pt-4">
        <h2
          id="nav-aqua-hq"
          className="mb-1 px-2 text-[11px] font-semibold uppercase tracking-wide text-black/55"
        >
          Aqua HQ
        </h2>
        <ul className="flex flex-col">
          {visibleAquaHq.map(s => (
            <li key={s.id}>
              <Link
                href={s.href}
                title={s.hint}
                className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm text-black/75 hover:bg-black/5"
              >
                <span className="truncate">{s.label}</span>
                {s.id === "sops" && recentSops !== null && recentSops > 0 && (
                  <span
                    aria-label={`${recentSops} SOP${recentSops === 1 ? "" : "s"} updated this week`}
                    className="shrink-0 rounded-full bg-emerald-100 px-1.5 py-px text-[10px] font-medium uppercase tracking-wide text-emerald-800"
                  >
                    {recentSops} new
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="nav-more-tools" className="mt-4 border-t border-black/10 pt-3">
        <button
          type="button"
          onClick={() => setMoreOpen(o => !o)}
          aria-expanded={moreOpen}
          id="nav-more-tools"
          className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-black/55 hover:bg-black/5"
        >
          <span>More tools</span>
          <span aria-hidden="true" className="text-black/40">{moreOpen ? "▾" : "▸"}</span>
        </button>
        {moreOpen && (
          <ul className="mt-1 flex flex-col">
            {MORE_TOOLS.map(t => (
              <li key={t.id}>
                <Link
                  href={t.href}
                  className="block rounded-md px-2 py-1.5 text-sm text-black/70 hover:bg-black/5"
                >
                  {t.label}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {(isFounder || SETTINGS_ROW.requires.every(p => grid.has(p))) && (
        <section className="mt-auto border-t border-black/10 pt-3">
          <Link
            href={SETTINGS_ROW.href}
            title={SETTINGS_ROW.hint}
            className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-black/75 hover:bg-black/5"
          >
            <span aria-hidden="true">⚙</span>
            <span>{SETTINGS_ROW.label}</span>
          </Link>
        </section>
      )}
    </>
  );
}
