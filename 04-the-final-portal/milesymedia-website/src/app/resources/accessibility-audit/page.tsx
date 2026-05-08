// T4 R002 — real /resources/accessibility-audit (replaces catch-all stub).

import Link from "next/link";
import dynamic from "next/dynamic";
import { SiteShell } from "@/components/SiteShell";

// T4 perf-3 — code-split (see seo-audit/page.tsx for the rationale).
const AccessibilityAuditTool = dynamic(
  () =>
    import("@/components/resource-tools/AccessibilityAuditTool").then(
      (m) => m.AccessibilityAuditTool,
    ),
  { loading: () => <div className="mm-tool-loading">Loading a11y tool…</div> },
);

export const metadata = {
  title: "Accessibility audit · Milesy Media",
  description:
    "Static-HTML smoke test for the most common WCAG 2.1 AA misses — alt coverage, heading hierarchy, landmarks, lang, inline contrast. A–F band.",
};

export default function AccessibilityAuditPage() {
  return (
    <SiteShell>
      <main className="mm-tool-shell">
        <div className="container">
          <Link href="/resources" className="mm-auth-back">
            ← All resources
          </Link>
          <header className="mm-tool-head">
            <span className="eyebrow">Audit</span>
            <h1>Accessibility audit</h1>
            <p>
              Lightweight WCAG smoke test from your browser — alt-tag
              coverage, heading hierarchy, landmarks, <code>&lt;html
              lang&gt;</code>, inline-style contrast. Not a substitute for
              a real audit with assistive tech.
            </p>
          </header>
          <AccessibilityAuditTool />
          <p className="mm-tool-footer">
            Building from the ground up?{" "}
            <Link href="/incubator">The Incubator</Link> bakes a11y in from
            phase one — every component reviewed against the same checks.
          </p>
        </div>
      </main>
    </SiteShell>
  );
}
