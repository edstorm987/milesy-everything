// Admin page for the domains plugin.
//
// V1 surface (per prompt — UI can be a follow-up round): server-
// rendered list of attached domains with their status + the DNS
// records the operator must add. Add-domain form is a plain HTML
// `<form>` POSTing to `/api/portal/domains/attach`. Verify + remove
// are also plain forms — no client-side JS required for the v1 path.
//
// Looks intentionally plain — T4's UX polish round will refine.

import type { PluginPageProps } from "../lib/aquaPluginTypes";
import { containerFor } from "../server/foundationAdapter";
import type { DomainRecord } from "../lib/domain";

export default async function DomainsPage(props: PluginPageProps): Promise<React.JSX.Element> {
  const c = containerFor({
    agencyId: props.agencyId,
    ...(props.clientId !== undefined ? { clientId: props.clientId } : {}),
    storage: props.storage,
  });
  const configured = c.domains.isConfigured();
  const domains = await c.domains.list();

  const apiBase = props.clientId
    ? `/api/portal/domains?clientId=${encodeURIComponent(props.clientId)}`
    : `/api/portal/domains`;

  return (
    <div className="p-6">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Custom domains</h1>
        <p className="text-sm text-black/60">
          Attach a domain to this {props.clientId ? "client" : "agency"}'s Vercel project. The
          plugin uses the Vercel REST API to register the domain and surfaces the DNS records
          you must add at your registrar.
        </p>
      </header>

      <ConfiguredBanner configured={configured} />

      <section className="mb-6 rounded-md border border-black/10 bg-white/70 p-4">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-black/60">
          Attach a new domain
        </h2>
        <form
          action="/api/portal/domains/attach"
          method="post"
          className="grid grid-cols-1 gap-3 md:grid-cols-3"
        >
          <input
            name="hostname"
            type="text"
            required
            placeholder="example.com"
            className="rounded-md border border-black/15 px-3 py-2 text-sm"
          />
          <input
            name="vercelProjectId"
            type="text"
            required
            placeholder="prj_xxxxxxxxxxxxxxxx"
            className="rounded-md border border-black/15 px-3 py-2 text-sm"
          />
          <input
            name="vercelTeamId"
            type="text"
            placeholder="team_xxxxxxxxxxxxxxxx (optional)"
            className="rounded-md border border-black/15 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:opacity-90 md:col-span-3"
          >
            Attach
          </button>
        </form>
        <p className="mt-2 text-xs text-black/50">
          The form submits as JSON via the runbook helper script today; T4 will polish to an
          inline-fetch flow. See chapter 04-deployment-domains-observability.md §"Custom domain
          runbook".
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-black/60">
          Attached ({domains.length})
        </h2>
        {domains.length === 0 ? (
          <p className="text-sm text-black/60">No domains attached yet.</p>
        ) : (
          <ul className="space-y-3">
            {domains.map((d) => (
              <DomainRow key={d.id} domain={d} apiBase={apiBase} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function ConfiguredBanner({ configured }: { configured: boolean }): React.JSX.Element {
  if (configured) {
    return (
      <div className="mb-6 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
        VERCEL_TOKEN is set — attach + verify hit Vercel's REST API.
      </div>
    );
  }
  return (
    <div className="mb-6 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      VERCEL_TOKEN is not set — attach captures the hostname locally and skips the Vercel call.
      Add the token in Vercel → Project Settings → Environment Variables and re-deploy to enable
      auto-attach. The manual-DNS runbook still applies; see chapter
      <code className="mx-1 rounded bg-amber-100 px-1 py-0.5">
        04-deployment-domains-observability.md
      </code>
      §"Custom domain runbook".
    </div>
  );
}

function DomainRow({ domain, apiBase: _apiBase }: { domain: DomainRecord; apiBase: string }): React.JSX.Element {
  return (
    <li className="rounded-md border border-black/10 bg-white/70 p-4">
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <h3 className="font-medium">{domain.hostname}</h3>
          <p className="text-xs text-black/50">
            Vercel project <code>{domain.vercelProjectId}</code>
            {domain.vercelTeamId ? <> · team <code>{domain.vercelTeamId}</code></> : null}
          </p>
        </div>
        <StatusBadge status={domain.status} />
      </div>
      {domain.lastError ? (
        <p className="mt-2 text-xs text-rose-700">last error: {domain.lastError}</p>
      ) : null}
      {domain.pending.length > 0 ? (
        <div className="mt-3 rounded border border-black/10 bg-black/5 p-3 text-xs">
          <p className="mb-1 font-medium">DNS records to add at your registrar:</p>
          <ul className="space-y-1 font-mono">
            {domain.pending.map((r, idx) => (
              <li key={idx}>
                <strong>{r.type}</strong> <code>{r.name}</code> →{" "}
                <code>{r.value}</code>
                {r.reason ? <span className="text-black/50"> ({r.reason})</span> : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <div className="mt-3 flex gap-2">
        <form action="/api/portal/domains/verify" method="post" className="contents">
          <input type="hidden" name="id" value={domain.id} />
          <button
            type="submit"
            className="rounded-md border border-black/15 bg-white px-3 py-1.5 text-xs hover:bg-black/5"
          >
            Re-check verify
          </button>
        </form>
        <form action={`/api/portal/domains?id=${encodeURIComponent(domain.id)}`} method="post" className="contents">
          <input type="hidden" name="_method" value="DELETE" />
          <button
            type="submit"
            className="rounded-md border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs text-rose-700 hover:bg-rose-100"
          >
            Remove
          </button>
        </form>
      </div>
    </li>
  );
}

function StatusBadge({ status }: { status: DomainRecord["status"] }): React.JSX.Element {
  const tone =
    status === "verified"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : status === "error"
        ? "border-rose-200 bg-rose-50 text-rose-800"
        : "border-amber-200 bg-amber-50 text-amber-800";
  return (
    <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${tone}`}>
      {status}
    </span>
  );
}
