// Growth workspace dashboard — memberships, affiliates, store, retention.

import { ensureHydrated } from "@/server/storage";
import { requireRole } from "@/lib/server/auth";
import { AGENCY_ROLES } from "@/server/types";
import { redirect } from "next/navigation";
import { findWorkspace } from "@/lib/chrome/workspaces";
import { WorkspaceHeader, Stat, Section, Row } from "../_shared";

export default async function GrowthWorkspace() {
  await ensureHydrated();
  try { await requireRole([...AGENCY_ROLES]); } catch { redirect("/portal"); }
  const ws = findWorkspace("growth")!;

  return (
    <div className="mx-auto max-w-6xl">
      <WorkspaceHeader label={ws.label} hint={ws.hint} color={ws.color} eyebrow="Growth · acquisition & retention" />

      <section className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Active members"     value="186"   sub="Aqua Incubator tier" accent={ws.color} />
        <Stat label="Net new (30d)"      value="+24"   sub="−6 churned"           accent={ws.color} />
        <Stat label="Affiliate signups"  value="11"    sub="3 paid out this mo"   accent={ws.color} />
        <Stat label="LTV / CAC"          value="6.2×"  sub="Trending up"          accent={ws.color} />
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Section title="Top affiliates">
          <Row left="Tash @ The Hub"        right="6 referrals" hint="£900 owed" />
          <Row left="James · Compass"        right="3 referrals" hint="£450 owed" />
          <Row left="Felicia · Luv & Ker"    right="2 referrals" hint="£300 paid" />
        </Section>

        <Section title="Memberships">
          <Row left="Foundational Flow"     right="118 members" hint="Entry tier" />
          <Row left="Expansion Plan"         right="46 members"  hint="Mid tier" />
          <Row left="Mastery & Ascension"    right="22 members"  hint="Top tier" />
        </Section>
      </div>

      <Section title="Retention signals">
        <Row left="Logged in this week"         right="148 / 186" hint="80%" />
        <Row left="Completed Health Check"      right="92 / 186"  hint="49%" />
        <Row left="At-risk (no login 14d)"      right="14"        hint="Outreach queued" />
      </Section>
    </div>
  );
}
