// Operations workspace dashboard — tasks, SOPs, system health, tooling.

import { ensureHydrated } from "@/server/storage";
import { requireRole } from "@/lib/server/auth";
import { AGENCY_ROLES } from "@/server/types";
import { listInstalledFor } from "@/server/pluginInstalls";
import { redirect } from "next/navigation";
import { findWorkspace } from "@/lib/chrome/workspaces";
import { WorkspaceHeader, Stat, Section, Row } from "../_shared";

export default async function OpsWorkspace() {
  await ensureHydrated();
  let session; try { session = await requireRole([...AGENCY_ROLES]); } catch { redirect("/portal"); }
  const ws = findWorkspace("ops")!;
  const installs = listInstalledFor({ agencyId: session.agencyId });

  return (
    <div className="mx-auto max-w-6xl">
      <WorkspaceHeader label={ws.label} hint={ws.hint} color={ws.color} eyebrow="Operations · the plumbing" />

      <section className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Open tasks"      value="23"  sub="6 overdue"            accent={ws.color} />
        <Stat label="SOPs"            value="38"  sub="4 updated this week"  accent={ws.color} />
        <Stat label="Plugins installed" value={String(installs.length)} sub="Across workspaces" accent={ws.color} />
        <Stat label="Incidents (7d)"  value="0"   sub="All systems normal"   accent={ws.color} />
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Section title="Today's tasks">
          <Row left="Felicia · approve flowers page"   right="due 17:00"  hint="Owner: Ed" />
          <Row left="Stripe webhook · retry queue"     right="due today"  hint="Owner: VA" />
          <Row left="Onboarding kit · v2 review"       right="due Fri"    hint="Owner: Sasha" />
          <Row left="Quarterly SOP audit"              right="due Mon"    hint="Recurring" />
        </Section>

        <Section title="Recent SOPs">
          <Row left="Client onboarding · v8"     right="updated 1d ago" />
          <Row left="Health Check intake"         right="updated 3d ago" />
          <Row left="Stripe refund process"       right="updated 5d ago" />
          <Row left="Founder daily sequence"      right="updated 6d ago" />
        </Section>
      </div>

      <Section title="System health">
        <Row left="Vercel · production"      right="green"  hint="p95 240ms" />
        <Row left="Stripe webhooks"          right="green"  hint="last event 2m ago" />
        <Row left="Activity inbox queue"     right="green"  hint="0 pending" />
      </Section>
    </div>
  );
}
