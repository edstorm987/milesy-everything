// DemoBanner — sticky top bar shown only when the session is a sandboxed
// demo (`session.isDemo === true`). Surfaces the current POV (agency or
// client), the demo agency/client labels, and a button to flip POV via
// `/demo/toggle`. Also exposes a "Leave demo" link that signs out so the
// visitor can return to the marketing site.
//
// Rendered from `/portal/layout.tsx` so the banner spans both
// `/portal/agency/*` and `/portal/clients/[clientId]/*` surfaces.

import Link from "next/link";

interface Props {
  pov: "agency" | "client";
  agencyName: string;
  clientName: string;
  source?: string;
}

const NEXT_LABEL = {
  agency: "Switch to client view →",
  client: "← Switch to agency view",
} as const;

export function DemoBanner({ pov, agencyName, clientName, source }: Props) {
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
        <span className="font-medium">
          You&apos;re viewing the {pov === "agency" ? "agency" : "client"} side of a sandboxed
          {" "}
          <strong>{pov === "agency" ? agencyName : clientName}</strong>.
        </span>
        <span className="text-amber-900/70">
          Data resets nightly · changes won&apos;t persist past the next cycle.
        </span>
      </div>

      <div className="flex items-center gap-3">
        <Link
          href="/demo/toggle"
          className="rounded-md bg-amber-900 px-3 py-1 text-[11px] font-medium text-amber-50 hover:bg-amber-950"
        >
          {NEXT_LABEL[pov]}
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
