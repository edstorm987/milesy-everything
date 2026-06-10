// Finance workspace dashboard — MRR, AR, outstanding invoices, recent
// transactions. Stub metrics for now (no live billing source wired
// up); replace `loadFinanceSnapshot` with the real query when the
// agency-finance plugin gets persistence.

import { ensureHydrated } from "@/server/storage";
import { requireRole } from "@/lib/server/auth";
import { AGENCY_ROLES } from "@/server/types";
import { listClients } from "@/server/tenants";
import { redirect } from "next/navigation";
import { findWorkspace } from "@/lib/chrome/workspaces";
import { WorkspaceHeader, Stat, Section, Row } from "../_shared";

export default async function FinanceWorkspace() {
  await ensureHydrated();
  let session; try { session = await requireRole([...AGENCY_ROLES]); } catch { redirect("/portal"); }
  const ws = findWorkspace("finance")!;
  const clients = listClients(session.agencyId);
  const activeClients = clients.filter(c => c.status === "active").length;
  const mrr = activeClients * 750; // £750 ARPU stub until billing is wired

  return (
    <div className="mx-auto max-w-6xl">
      <WorkspaceHeader label={ws.label} hint={ws.hint} color={ws.color} eyebrow="Finance · cash & receivables" />

      <section className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="MRR"               value={`£${mrr.toLocaleString()}`} sub="Active client base × ARPU" accent={ws.color} />
        <Stat label="Outstanding AR"    value="£3,420"                    sub="Across 4 invoices"          accent={ws.color} />
        <Stat label="Cash on hand"      value="£18,945"                   sub="Stripe + bank combined"     accent={ws.color} />
        <Stat label="Expenses (mo)"     value="£4,210"                    sub="Tracked categories"         accent={ws.color} />
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Section title="Outstanding invoices">
          <Row left="Luv & Ker · Sep retainer"    right="£1,200"  hint="Sent 12d ago" />
          <Row left="The Foundational Flow"        right="£950"    hint="Overdue 4d" />
          <Row left="AquaOasis · Diagnostics"      right="£820"    hint="Sent 2d ago" />
          <Row left="Compass Coaching"             right="£450"    hint="Sent 6d ago" />
        </Section>

        <Section title="Recent transactions">
          <Row left="Stripe payout"               right="+£2,140" hint="Today" />
          <Row left="Vercel · Pro"                 right="−£240"   hint="Yesterday" />
          <Row left="Anthropic API"                right="−£186"   hint="Yesterday" />
          <Row left="Lock-in deposit · PiersDay"   right="+£100"   hint="3d ago" />
        </Section>
      </div>

      <Section title="Plan tier mix">
        <Row left="Foundational"  right={`${Math.max(0, activeClients - 2)} clients`} />
        <Row left="Expansion"      right="1 client" />
        <Row left="Mastery"        right="1 client" />
      </Section>
    </div>
  );
}
