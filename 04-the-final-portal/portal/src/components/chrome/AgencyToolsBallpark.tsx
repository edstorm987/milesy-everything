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

const AQUA_HQ: { id: string; label: string; href: string; hint: string }[] = [
  { id: "leads",      label: "Leads & Clients HQ",       href: "/portal/agency",                    hint: "Pipeline + per-client CRM cards." },
  { id: "billing",    label: "Client Billing & Finance", href: "/portal/agency/agency-finance",     hint: "Income · Expenses Recurring · Expenses Other." },
  { id: "tasks",      label: "Tasks & To-Do's",          href: "/portal/agency/kanban",             hint: "Cross-cutting boards — agency + per-client." },
  { id: "sops",       label: "SOPs, Docs & Templates",   href: "/portal/agency/sops",               hint: "Sales · Service · Standards · Internal." },
  { id: "social",     label: "Social Media Planner",     href: "/portal/agency/agency-marketing",   hint: "Content · Calendar · Library · Ads." },
  { id: "passwords",  label: "Passwords & Access",       href: "/portal/agency/passwords",          hint: "Owner access + per-client credential vault." },
];

const MORE_TOOLS: { id: string; label: string; href: string }[] = [
  { id: "hr",         label: "HR",          href: "/portal/agency/agency-hr" },
  { id: "forms",      label: "Forms",       href: "/portal/agency/forms" },
  { id: "email",      label: "Email",       href: "/portal/agency/email-sender" },
  { id: "ops",        label: "Ops",         href: "/portal/agency/ops" },
  { id: "domains",    label: "Domains",     href: "/portal/agency/domains" },
  { id: "affiliates", label: "Affiliates",  href: "/portal/agency/affiliates" },
];

export function AgencyToolsBallpark() {
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
          {AQUA_HQ.map(s => (
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
    </>
  );
}
