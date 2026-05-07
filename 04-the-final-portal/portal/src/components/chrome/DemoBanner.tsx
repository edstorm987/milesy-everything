// DemoBanner — sticky top bar shown only when the session is a sandboxed
// demo (`session.isDemo === true`). Surfaces the current POV (agency,
// client, or end-customer), the matching tenant label, and a "Next view"
// button that cycles through the three POVs via `/demo/toggle`. Also
// exposes a "Leave demo" link that signs out so the visitor returns to
// the marketing site.
//
// Rendered from `/portal/layout.tsx` so the banner spans every portal
// surface — agency / client / customer.

import Link from "next/link";

export type DemoPov = "agency" | "client" | "customer";

interface Props {
  pov: DemoPov;
  agencyName: string;
  clientName: string;
  customerEmail?: string;
  source?: string;
}

const POV_LABEL: Record<DemoPov, string> = {
  agency: "Agency view",
  client: "Client view",
  customer: "Customer view",
};

const POV_NEXT_LABEL: Record<DemoPov, string> = {
  agency: "Next view → Client",
  client: "Next view → Customer",
  customer: "Next view → Agency",
};

function describe(pov: DemoPov, agencyName: string, clientName: string, customerEmail?: string): string {
  if (pov === "agency") return `agency operator of ${agencyName}`;
  if (pov === "client") return `client owner of ${clientName}`;
  return `${customerEmail ?? "an end-customer"} of ${clientName}`;
}

export function DemoBanner({ pov, agencyName, clientName, customerEmail, source }: Props) {
  return (
    <div
      role="region"
      aria-label="Demo banner"
      className="sticky top-0 z-50 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-amber-300 bg-amber-100 px-4 py-2 text-xs text-amber-950 shadow-sm"
    >
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
        <span className="rounded-full bg-amber-300 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-950">
          Demo
        </span>
        <span className="rounded-md bg-amber-200/70 px-2 py-0.5 text-[11px] font-medium text-amber-950">
          {POV_LABEL[pov]}
        </span>
        <span className="font-medium">
          You&apos;re acting as the {describe(pov, agencyName, clientName, customerEmail)}.
        </span>
        <span className="text-amber-900/70">
          Sandboxed · resets nightly · changes won&apos;t persist past the next cycle.
        </span>
      </div>

      <div className="flex items-center gap-3">
        <Link
          href="/demo/toggle"
          className="rounded-md bg-amber-900 px-3 py-1 text-[11px] font-medium text-amber-50 hover:bg-amber-950"
        >
          {POV_NEXT_LABEL[pov]}
        </Link>
        <Link
          href="/login?from=demo"
          className="rounded-md bg-emerald-700 px-3 py-1 text-[11px] font-semibold text-emerald-50 hover:bg-emerald-800"
        >
          Sign up →
        </Link>
        <form action="/api/auth/logout" method="post">
          <button
            type="submit"
            className="rounded-md border border-amber-400 bg-amber-50 px-2 py-1 text-[11px] font-medium text-amber-900 hover:bg-amber-200"
            title={source ? `Demo entered via ${source}` : undefined}
          >
            Leave demo
          </button>
        </form>
      </div>
    </div>
  );
}
