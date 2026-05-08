// T4 R002 — real /resources/site-speed (replaces catch-all stub).

import Link from "next/link";
import dynamic from "next/dynamic";
import { SiteShell } from "@/components/SiteShell";

// T4 perf-3 — code-split (see seo-audit/page.tsx for the rationale).
const SiteSpeedTool = dynamic(
  () => import("@/components/resource-tools/SiteSpeedTool").then((m) => m.SiteSpeedTool),
  { loading: () => <div className="mm-tool-loading">Loading speed tool…</div> },
);

export const metadata = {
  title: "Site speed test · Milesy Media",
  description:
    "Browser-side rough estimate of homepage round-trip time, total bytes, image and script counts. Directional read, not a Lighthouse verdict.",
};

export default function SiteSpeedPage() {
  return (
    <SiteShell>
      <main className="mm-tool-shell">
        <div className="container">
          <Link href="/resources" className="mm-auth-back">
            ← All resources
          </Link>
          <header className="mm-tool-head">
            <span className="eyebrow">Audit</span>
            <h1>Site speed test</h1>
            <p>
              Rough estimate from this device + this network. Useful as a
              directional read; real cross-region numbers come from a
              server-side scanner (post-ship).
            </p>
          </header>
          <SiteSpeedTool />
          <p className="mm-tool-footer">
            Want a full performance audit alongside the rest of your funnel?
            The <Link href="/health-check">Health Check</Link> Website pillar
            covers conversion clarity, trust signals and the 5-second test.
          </p>
        </div>
      </main>
    </SiteShell>
  );
}
