// T4 unify-fix — Resources hub. Catalogue of every tool the site
// offers, grouped. Most tools are stubs ("Coming soon") today; the
// HC is the only real one. The grid lets us add new tools as we
// build them without rearchitecting the nav.

import Link from "next/link";
import { SiteShell } from "@/components/SiteShell";

export const metadata = {
  title: "Resources · Milesy Media",
};

interface Tool {
  href: string;
  icon: string;
  title: string;
  sub: string;
  status: "live" | "soon";
}

const GROUPS: Array<{ heading: string; tools: Tool[] }> = [
  {
    heading: "Audits & diagnostics",
    tools: [
      {
        href: "/health-check",
        icon: "🩺",
        title: "Health Check",
        sub: "The flagship 12-minute audit. Five honest pillars, dollar-anchored opportunities, no fabricated numbers.",
        status: "live",
      },
      {
        href: "/resources/seo-audit",
        icon: "🔎",
        title: "SEO audit",
        sub: "Targeted scan of where you rank, what's indexed, and what's missing. Drops you into the Visibility section of the Health Check.",
        status: "soon",
      },
      {
        href: "/resources/site-speed",
        icon: "⚡",
        title: "Site speed test",
        sub: "Lighthouse-style read of your homepage. Performance, accessibility, SEO, best-practices.",
        status: "soon",
      },
      {
        href: "/resources/accessibility-audit",
        icon: "♿",
        title: "Accessibility audit",
        sub: "WCAG 2.1 AA quick scan. Contrast, keyboard, screen-reader signals.",
        status: "soon",
      },
    ],
  },
  {
    heading: "Operating tools",
    tools: [
      {
        href: "/business-os",
        icon: "🧭",
        title: "Business OS",
        sub: "The free operating layer that sits above your CRM, inbox and calendar. Lessons, modules, niche packs, plus an honest Health Check that drives the rest of the portal.",
        status: "live",
      },
      {
        href: "/incubator",
        icon: "🌱",
        title: "Incubator",
        sub: "Four-phase build engagement: Diagnose → Blueprint → Build → Launch. Owned-output at every stage.",
        status: "live",
      },
      {
        href: "/resources/ux-orchestration",
        icon: "🎯",
        title: "UX orchestration",
        sub: "Map your customer journey end-to-end. Surface the friction points where revenue leaks.",
        status: "soon",
      },
      {
        href: "/resources/copy-clinic",
        icon: "✍️",
        title: "Copy clinic",
        sub: "5-second-test your homepage hero. Get a one-paragraph rewrite that leads with the buyer's outcome, not your features.",
        status: "soon",
      },
    ],
  },
  {
    heading: "Reading & playbooks",
    tools: [
      {
        href: "/resources/playbooks",
        icon: "📖",
        title: "Playbooks",
        sub: "Honest write-ups of how we actually run engagements. Templates, decision trees, the bits we'd normally only share inside the Incubator.",
        status: "soon",
      },
      {
        href: "/resources/case-studies",
        icon: "📊",
        title: "Case studies",
        sub: "What moved the needle for real clients. With actual numbers and the parts that didn't work.",
        status: "soon",
      },
    ],
  },
];

export default function ResourcesHub() {
  return (
    <SiteShell>
      <main className="mm-resources-shell">
        <header className="mm-resources-hero">
          <div className="container">
            <span className="eyebrow">Resources</span>
            <h1>Tools, audits and playbooks.</h1>
            <p>
              Every diagnostic and operating tool we&apos;ve built into the
              site. Most start free; the deeper ones unlock from inside
              the Business OS once you take the Health Check.
            </p>
          </div>
        </header>

        <div className="container">
          {GROUPS.map(group => (
            <section key={group.heading} className="mm-resources-group">
              <h2>{group.heading}</h2>
              <div className="mm-resources-grid">
                {group.tools.map(t => (
                  <Link
                    key={t.href}
                    href={t.href}
                    className={`mm-resource-card${t.status === "live" ? " is-live" : ""}`}
                  >
                    <span className="mm-resource-icon">{t.icon}</span>
                    <span className="mm-resource-status">
                      {t.status === "live" ? "Available" : "Coming soon"}
                    </span>
                    <span className="mm-resource-title">{t.title}</span>
                    <span className="mm-resource-sub">{t.sub}</span>
                    <span className="mm-resource-cta">
                      {t.status === "live" ? "Open →" : "Get notified →"}
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>
    </SiteShell>
  );
}
