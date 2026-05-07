// T4 R002 — real /resources/seo-audit (replaces catch-all stub).
// SiteShell-wrapped; client tool does the actual scan. Honest A-F
// bands only (chapter #68). No email capture in this round — T2 R023
// rank-my-website plugin owns that integration later.

import Link from "next/link";
import { SiteShell } from "@/components/SiteShell";
import { SeoAuditTool } from "@/components/resource-tools/SeoAuditTool";

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
