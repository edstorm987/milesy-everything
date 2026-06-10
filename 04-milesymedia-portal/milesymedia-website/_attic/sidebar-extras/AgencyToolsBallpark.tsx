"use client";

// "More tools" — collapsible secondary plugin list pinned below the
// main nav. Aqua HQ's canonical rows now live inside the main panel
// (sidebarLayout.ts) so this component is just the secondary list.

import Link from "next/link";
import { useState } from "react";

interface MoreToolEntry { id: string; label: string; href: string }
interface MoreToolGroup { id: string; label: string; items: MoreToolEntry[] }
const MORE_TOOLS_GROUPS: MoreToolGroup[] = [
  {
    id: "operations", label: "Operations",
    items: [
      { id: "kanban",    label: "Tasks & Kanban", href: "/portal/agency/kanban" },
      { id: "hr",        label: "HR",             href: "/portal/agency/agency-hr" },
      { id: "ops",       label: "Ops",            href: "/portal/agency/agency-ops" },
      { id: "marketing", label: "Marketing ops",  href: "/portal/agency/agency-marketing" },
    ],
  },
  {
    id: "communications", label: "Communications",
    items: [
      { id: "forms", label: "Forms",        href: "/portal/agency/forms" },
      { id: "email", label: "Email sender", href: "/portal/agency/email-sender" },
    ],
  },
  {
    id: "growth", label: "Growth",
    items: [
      { id: "domains",     label: "Domains",     href: "/portal/agency/agency-domains" },
      { id: "affiliates",  label: "Affiliates",  href: "/portal/agency/affiliates" },
      { id: "memberships", label: "Memberships", href: "/portal/agency/memberships" },
    ],
  },
];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function AgencyToolsBallpark(_props: { permissions?: readonly string[]; isFounder?: boolean }) {
  const [moreOpen, setMoreOpen] = useState(false);
  return (
    <section aria-labelledby="nav-more-tools" className="border-t border-black/10 pt-3">
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
        <div className="mt-1 flex flex-col gap-3">
          {MORE_TOOLS_GROUPS.map(group => (
            <div key={group.id}>
              <h3 className="px-2 pt-1 text-[10px] font-semibold uppercase tracking-wide text-black/40">
                {group.label}
              </h3>
              <ul className="flex flex-col">
                {group.items.map(t => (
                  <li key={t.id}>
                    <Link
                      href={t.href}
                      title={t.label}
                      className="block rounded-md px-2 py-1.5 text-sm text-black/70 hover:bg-black/5"
                    >
                      {t.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
