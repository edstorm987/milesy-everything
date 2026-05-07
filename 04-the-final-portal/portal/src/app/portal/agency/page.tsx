// Ed's home — /portal/agency.
//
// Welcome banner + single primary CTA ("New client"). Below: a card grid
// of every client in the agency, each card showing brand mark, name,
// phase chip, last-activity timestamp, and a hover footer with three
// quick actions (Open · Edit website · View portal). Empty state when
// no clients yet.

import Link from "next/link";
import { ensureHydrated } from "@/server/storage";
import { requireRole } from "@/lib/server/auth";
import { AGENCY_ROLES } from "@/server/types";
import { getAgency, listClients } from "@/server/tenants";
import { listInstalledFor } from "@/server/pluginInstalls";
import { listActivity } from "@/server/activity";
import { phaseLabel } from "@/server/phases";
import { NewClientButton } from "./_NewClientButton";
import { FounderTodosWidget } from "./_FounderTodosWidget";

function formatRelative(ts: number): string {
  const delta = Date.now() - ts;
  if (delta < 60_000) return "just now";
  if (delta < 3_600_000) return `${Math.round(delta / 60_000)}m ago`;
  if (delta < 86_400_000) return `${Math.round(delta / 3_600_000)}h ago`;
  if (delta < 7 * 86_400_000) return `${Math.round(delta / 86_400_000)}d ago`;
  return new Date(ts).toLocaleDateString();
}

export default async function AgencyHome() {
  await ensureHydrated();
  const session = await requireRole([...AGENCY_ROLES]);
  const agency = getAgency(session.agencyId)!;
  const clients = listClients(agency.id);
  const allActivity = listActivity({ agencyId: agency.id, limit: 1000 });
  const lastByClient = new Map<string, number>();
  for (const a of allActivity) {
    if (!a.clientId) continue;
    if (!lastByClient.has(a.clientId)) lastByClient.set(a.clientId, a.ts);
  }

  const firstName = (session.email.split("@")[0] || "there").replace(/[^a-z]/gi, "");
  const greet = firstName ? firstName[0]!.toUpperCase() + firstName.slice(1) : "there";

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-black/90">
            Welcome back, {greet}.
          </h1>
          <p className="mt-1 text-sm italic text-[var(--brand-primary)]/80">
            Where Healing Meets Revolution.
          </p>
          <p className="mt-1 text-sm text-black/60">
            {clients.length === 0
              ? "Onboard your first therapist to begin the Aqua Incubator."
              : <>{clients.length} therapist{clients.length === 1 ? "" : "s"} active in {agency.name}.</>}
          </p>
        </div>
        {clients.length > 0 && <NewClientButton />}
      </section>

      <FounderTodosWidget isFounder={session.role === "agency-owner"} />

      {clients.length === 0 ? (
        <section className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-black/15 bg-white/50 px-6 py-16 text-center">
          <div className="text-4xl" aria-hidden="true">🌱</div>
          <h2 className="text-lg font-medium text-black/85">No therapists onboarded yet</h2>
          <p className="max-w-md text-sm text-black/60">
            Add your first therapist client to begin the Aqua Incubator. The starting phase decides which plugins install automatically — you can change anything later.
          </p>
          <NewClientButton />
        </section>
      ) : (
        <section>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {clients.map(client => {
              const installs = listInstalledFor({ agencyId: agency.id, clientId: client.id });
              const enabledCount = installs.filter(i => i.enabled).length;
              const last = lastByClient.get(client.id);
              const initials = client.name
                .split(/\s+/).filter(Boolean).slice(0, 2)
                .map(w => w[0]!.toUpperCase()).join("") || "·";
              const websiteHref = `/portal/clients/${client.id}?tab=website`;
              const portalHref = `/portal/clients/${client.id}?tab=portal`;
              return (
                <div
                  key={client.id}
                  className="group relative overflow-hidden rounded-xl border border-black/10 bg-white shadow-sm transition hover:shadow-md"
                >
                  <Link
                    href={`/portal/clients/${client.id}`}
                    className="block p-4"
                  >
                    <div className="flex items-center gap-3">
                      {client.brand.logoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={client.brand.logoUrl}
                          alt=""
                          className="h-10 w-10 rounded-md object-cover"
                        />
                      ) : (
                        <div
                          aria-hidden="true"
                          className="flex h-10 w-10 items-center justify-center rounded-md text-sm font-semibold text-white"
                          style={{ backgroundColor: client.brand.primaryColor }}
                        >
                          {initials}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-base font-medium text-black/90">{client.name}</div>
                        <div className="mt-0.5 flex items-center gap-2 text-[11px] text-black/55">
                          <span
                            className="rounded-full px-2 py-0.5 font-medium uppercase tracking-wide text-white"
                            style={{ backgroundColor: client.brand.primaryColor }}
                          >
                            {phaseLabel(client.stage)}
                          </span>
                          <span>· {enabledCount} plugin{enabledCount === 1 ? "" : "s"}</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 text-[11px] text-black/45">
                      {last ? `Last activity ${formatRelative(last)}` : "No activity yet"}
                    </div>
                  </Link>
                  <div className="flex items-center gap-1 border-t border-black/5 bg-black/[0.015] px-2 py-1.5 text-[11px] opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100">
                    <Link href={`/portal/clients/${client.id}`} className="rounded px-2 py-1 hover:bg-black/5">Open</Link>
                    <Link href={websiteHref} className="rounded px-2 py-1 hover:bg-black/5">Edit website</Link>
                    <Link href={portalHref} className="rounded px-2 py-1 hover:bg-black/5">View portal</Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
