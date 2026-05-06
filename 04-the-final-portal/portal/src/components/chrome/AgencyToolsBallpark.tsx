"use client";

// "Ballpark" capability list — discoverable but out of the way at the
// bottom of the agency sidebar. Each entry maps roughly to a plugin
// area; clicking goes to the agency's tools index for the capability.
// Collapsed by default so it doesn't compete with primary nav.

import Link from "next/link";
import { useState } from "react";

const TOOLS: { id: string; label: string; href: string }[] = [
  { id: "hr",         label: "HR",          href: "/portal/agency/agency-hr" },
  { id: "finance",    label: "Finance",     href: "/portal/agency/agency-finance" },
  { id: "marketing",  label: "Marketing",   href: "/portal/agency/agency-marketing" },
  { id: "forms",      label: "Forms",       href: "/portal/agency/forms" },
  { id: "email",      label: "Email",       href: "/portal/agency/email-sender" },
  { id: "ops",        label: "Ops",         href: "/portal/agency/ops" },
  { id: "domains",    label: "Domains",     href: "/portal/agency/domains" },
  { id: "affiliates", label: "Affiliates",  href: "/portal/agency/affiliates" },
];

export function AgencyToolsBallpark() {
  const [open, setOpen] = useState(false);
  return (
    <section aria-labelledby="nav-tools-ballpark" className="border-t border-black/10 pt-4">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        id="nav-tools-ballpark"
        className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-black/55 hover:bg-black/5"
      >
        <span>Tools</span>
        <span aria-hidden="true" className="text-black/40">{open ? "▾" : "▸"}</span>
      </button>
      {open && (
        <ul className="mt-1 flex flex-col">
          {TOOLS.map(t => (
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
  );
}
