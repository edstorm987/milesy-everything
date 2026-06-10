// Marketing workspace dashboard — pipeline, channels, campaigns,
// content output. Stub metrics; tie into the agency-marketing plugin
// when it lands.

import { ensureHydrated } from "@/server/storage";
import { requireRole } from "@/lib/server/auth";
import { AGENCY_ROLES } from "@/server/types";
import { redirect } from "next/navigation";
import { findWorkspace } from "@/lib/chrome/workspaces";
import { WorkspaceHeader, Stat, Section, Row } from "../_shared";

export default async function MarketingWorkspace() {
  await ensureHydrated();
  try { await requireRole([...AGENCY_ROLES]); } catch { redirect("/portal"); }
  const ws = findWorkspace("marketing")!;

  return (
    <div className="mx-auto max-w-6xl">
      <WorkspaceHeader label={ws.label} hint={ws.hint} color={ws.color} eyebrow="Marketing · attention & conversion" />

      <section className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Active campaigns"  value="4"        sub="2 paused · 1 ended"  accent={ws.color} />
        <Stat label="Leads (7d)"        value="142"      sub="+18% wow"            accent={ws.color} />
        <Stat label="Email sent (7d)"   value="1,860"    sub="3 broadcasts"        accent={ws.color} />
        <Stat label="Top channel"       value="Organic"  sub="38% of leads"        accent={ws.color} />
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Section title="Campaigns">
          <Row left="Health Check funnel"           right="68 leads"  hint="Top of pipeline" />
          <Row left="Aqua Incubator nurture"        right="42 leads"  hint="Email · 4 emails sent" />
          <Row left="LinkedIn outbound · therapists" right="18 leads"  hint="Manual sequence" />
          <Row left="Referral lock-in"              right="14 leads"  hint="Paid · £100 deposit" />
        </Section>

        <Section title="Channels (7d)">
          <Row left="Organic search" right="54" />
          <Row left="LinkedIn"       right="28" />
          <Row left="Direct"         right="22" />
          <Row left="Referral"       right="19" />
          <Row left="Email"          right="11" />
        </Section>
      </div>

      <Section title="Content output">
        <Row left="Blog · '12-min Health Check'"      right="published" hint="2,140 reads / wk" />
        <Row left="Playbook · 'Brand Builder gate'"   right="draft"     hint="3 sections left" />
        <Row left="Case study · Luv & Ker"            right="in review" hint="awaiting screenshots" />
      </Section>
    </div>
  );
}
