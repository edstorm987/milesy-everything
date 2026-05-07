// T4 unify-fix — generic "coming soon" stub for resource subpages
// that don't have a real implementation yet (seo-audit,
// site-speed, accessibility-audit, ux-orchestration, copy-clinic,
// playbooks, case-studies). Captures interest and routes the
// visitor to the Health Check (the closest live equivalent) so
// the page isn't a dead end.
//
// As each tool ships, replace this catch-all with a real
// app/resources/<slug>/page.tsx.

import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteShell } from "@/components/SiteShell";

interface ToolStub {
  title: string;
  blurb: string;
  related: string;
  relatedHref: string;
}

const STUBS: Record<string, ToolStub> = {
  "seo-audit": {
    title: "SEO audit",
    blurb:
      "A focused scan of where your site ranks, what's indexed, and which keyword opportunities you're missing. Until the dedicated tool ships, the Visibility & Search section of the Health Check covers the same ground — your numbers, no fabricated benchmarks.",
    related: "Run the Visibility section of the Health Check",
    relatedHref: "/health-check",
  },
  "site-speed": {
    title: "Site speed test",
    blurb:
      "Lighthouse-style read of your homepage — performance, accessibility, SEO, best practices. The full scanner is in the queue. For now the Your Website section of the Health Check captures the impressions side: 5-second test, conversion clarity, trust signals.",
    related: "Run the Website section of the Health Check",
    relatedHref: "/health-check",
  },
  "accessibility-audit": {
    title: "Accessibility audit",
    blurb:
      "WCAG 2.1 AA quick scan: contrast, keyboard, screen-reader signals. The dedicated tool is being built; meanwhile we already use the same checks internally on every Incubator build, so audited sites bake a11y in from day one.",
    related: "Open the Incubator",
    relatedHref: "/incubator",
  },
  "ux-orchestration": {
    title: "UX orchestration",
    blurb:
      "Map your customer journey end-to-end — every touchpoint from first ad impression to repeat purchase — and surface the friction points where revenue leaks. Live-tool version coming; the Health Check today gives you the leak diagnosis without the journey map.",
    related: "Take the Health Check",
    relatedHref: "/health-check",
  },
  "copy-clinic": {
    title: "Copy clinic",
    blurb:
      "5-second test your homepage hero, then get a one-paragraph rewrite that leads with the buyer's outcome instead of your features. The standalone clinic is queued; until then, it's the first 5 minutes of the Incubator's Phase 2 / Blueprint stage.",
    related: "Peek at the Incubator",
    relatedHref: "/incubator",
  },
  "playbooks": {
    title: "Playbooks",
    blurb:
      "Honest write-ups of how we actually run engagements. Templates, decision trees, the bits we'd normally only share inside the Incubator. The library is being authored — drop in your email and we'll send the first three when they ship.",
    related: "Talk to us",
    relatedHref: "mailto:hello@milesymedia.co",
  },
  "case-studies": {
    title: "Case studies",
    blurb:
      "What actually moved the needle for real clients — with actual numbers and the bits that didn't work. We're getting permissions before publishing, so the public set is small for now. The Incubator preview shows live work-in-progress without the polish.",
    related: "See the Incubator",
    relatedHref: "/incubator",
  },
};

export default async function ResourceStub({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const stub = STUBS[slug];
  if (!stub) notFound();

  return (
    <SiteShell>
      <main className="mm-auth-shell">
        <div className="mm-auth-card">
          <div className="mm-auth-card-head">
            <Link href="/resources" className="mm-auth-back">
              ← All resources
            </Link>
            <span className="mm-dev-eyebrow">Coming soon</span>
            <h1>{stub.title}</h1>
            <p>{stub.blurb}</p>
          </div>
          <div className="mm-auth-foot" style={{ justifyContent: "center" }}>
            <Link href={stub.relatedHref} className="btn btn-primary">
              {stub.related} →
            </Link>
          </div>
        </div>
      </main>
    </SiteShell>
  );
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const stub = STUBS[params.slug];
  return {
    title: stub ? `${stub.title} · Milesy Media` : "Resource · Milesy Media",
  };
}
