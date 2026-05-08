// T4 R002 — real /resources/seo-audit (replaces catch-all stub).
// SiteShell-wrapped; client tool does the actual scan. Honest A-F
// bands only (chapter #68). No email capture in this round — T2 R023
// rank-my-website plugin owns that integration later.

import Link from "next/link";
import dynamic from "next/dynamic";
import { SiteShell } from "@/components/SiteShell";

// T4 perf-3 — code-split the audit tool out of the initial page bundle.
// The form + scan logic is below the hero header (not LCP-critical) and
// only runs after a user action. Lazy-loading shaves the resource-tool
// JS off the first paint of every other resources/* route too because
// the chunk no longer joins the shared layout split.
// `ssr: false` requires a client component in Next 16 — we keep this
// page server-rendered for SEO + use plain dynamic() for client-bundle
// code-split. The component still SSRs on first paint, but its JS
// chunk no longer joins the layout split, so siblings (other resource
// pages) don't pay for it.
const SeoAuditTool = dynamic(
  () => import("@/components/resource-tools/SeoAuditTool").then((m) => m.SeoAuditTool),
  { loading: () => <div className="mm-tool-loading">Loading audit tool…</div> },
);

export const metadata = {
  title: "SEO audit · Milesy Media",
  description:
    "Honest, browser-side SEO smoke test — title, meta, headings, canonical, OG, robots, sitemap. A–F band, no fabricated scores.",
};

export default function SeoAuditPage() {
  return (
    <SiteShell>
      <main className="mm-tool-shell">
        <div className="container">
          <Link href="/resources" className="mm-auth-back">
            ← All resources
          </Link>
          <header className="mm-tool-head">
            <span className="eyebrow">Audit</span>
            <h1>SEO audit</h1>
            <p>
              A focused browser-side scan: title length, meta description,
              H1 count, canonical, OpenGraph, robots/sitemap reachability.
              You get an A–F band — never a fabricated score.
            </p>
          </header>
          <SeoAuditTool />
          <p className="mm-tool-footer">
            Need a deeper read with real Search Console + GBP signals? The
            full <Link href="/health-check">Health Check</Link> covers the
            visibility pillar with your own data.
          </p>
        </div>
      </main>
    </SiteShell>
  );
}
