// T4 unify-fix — Health Check route wrapped in the marketing
// SiteShell so /health-check stops looking like a separate site.
//
// Strategy: render the existing static quiz at /health-check/index.html
// (rich JS, sticky search embeds, branching skipIf flow) inside an
// iframe nested in SiteShell. Same-origin → no cookie/CSP friction.
// The marketing nav + footer wrap it so the page feels native to
// the site; the quiz's own dark theme stays inside the iframe.
//
// Future round: replace the iframe with a React-rewritten quiz that
// shares marketing brand-kit tokens directly.

import { SiteShell } from "@/components/SiteShell";

export const metadata = {
  title: "Free digital Health Check · Milesy Media",
};

export default function HealthCheckPage() {
  return (
    <SiteShell>
      <main className="mm-hc-frame-shell">
        <iframe
          src="/health-check/index.html"
          title="Milesy Media Health Check"
          className="mm-hc-frame"
          loading="lazy"
        />
      </main>
    </SiteShell>
  );
}
