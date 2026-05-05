// Topbar — tenant title, role badge, sign-out. Server-rendered.
//
// Mobile: a hamburger button sits before the title and toggles the
// MobileNav drawer; on `md+` the hamburger hides via Tailwind. The
// role/email cluster collapses to two rows on `<sm` so nothing
// overflows.

import Link from "next/link";
import type { Role } from "@/server/types";
import { MobileNav } from "@/components/chrome/MobileNav";
import type { NavPanel } from "@/lib/chrome/sidebarLayout";

interface Props {
  title: string;
  subtitle?: string;
  role: Role;
  email: string;
  // When provided, renders the hamburger + drawer with these panels.
  // Each scope layout (agency / client / customer) already builds
  // these for the desktop Sidebar — we just pass the same payload
  // through.
  panels?: NavPanel[];
  tenantLabel?: string;
  currentPath?: string;
}

const ROLE_LABEL: Record<Role, string> = {
  "agency-owner":   "Agency owner",
  "agency-manager": "Agency manager",
  "agency-staff":   "Agency staff",
  "client-owner":   "Client owner",
  "client-staff":   "Client staff",
  "freelancer":     "Freelancer",
  "end-customer":   "Customer",
};

export function Topbar({ title, subtitle, role, email, panels, tenantLabel, currentPath }: Props) {
  return (
    <header className="flex min-h-14 flex-wrap items-center justify-between gap-2 border-b border-black/10 bg-white/40 px-4 py-2 md:px-6">
      <div className="flex items-center gap-3 min-w-0">
        {panels && tenantLabel && currentPath && (
          <MobileNav panels={panels} tenantLabel={tenantLabel} currentPath={currentPath} />
        )}
        <div className="min-w-0">
          <div className="truncate text-base font-semibold text-black/90">{title}</div>
          {subtitle && <div className="truncate text-xs text-black/50">{subtitle}</div>}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-xs sm:gap-3">
        <span className="rounded-full bg-black/5 px-2 py-1 text-black/70" aria-label={`Role ${ROLE_LABEL[role]}`}>{ROLE_LABEL[role]}</span>
        <span className="hidden text-black/60 sm:inline" aria-label={`Signed in as ${email}`}>{email}</span>
        <form action="/api/auth/logout" method="post">
          <button
            type="submit"
            className="rounded-md border border-black/10 bg-white px-2 py-1 text-black/70 hover:bg-black/5"
          >
            Sign out
          </button>
        </form>
        <Link
          href="/"
          aria-label="Open marketing site in a new view"
          className="text-black/40 hover:text-black/70"
        >
          <span aria-hidden>↗</span> Marketing
        </Link>
      </div>
    </header>
  );
}
