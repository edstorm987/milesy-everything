import Link from "next/link";
import { SiteShell } from "@/components/SiteShell";
import { PROJECTS } from "@/lib/projects";

export const metadata = {
  title: "Projects · Milesy Media",
  description: "Case studies and active builds — what we've shipped and what's moving.",
};

const STATUS_LABEL: Record<string, string> = {
  live: "Live",
  completed: "Shipped",
  "in-progress": "In progress",
};

export default function ProjectsPage() {
  return (
    <SiteShell>
      <main className="mm-projects">
        <header className="mm-projects-hero" data-mm-reveal>
          <span className="eyebrow">Projects · case studies</span>
          <h1>What we&apos;ve actually built.</h1>
          <p>
            Honest write-ups of the work — what the brief was, what we shipped,
            what moved. No fabricated metrics. If a number is here, we can defend it.
          </p>
        </header>

        <section className="container mm-projects-grid">
          {PROJECTS.map((p) => (
            <article
              key={p.slug}
              className="mm-project-card"
              data-mm-reveal
              style={p.brandColor ? { ["--mm-project-accent" as string]: p.brandColor } : undefined}
            >
              <div className="mm-project-card-head">
                <div className="mm-project-meta">
                  <span className="mm-project-sector">{p.sector}</span>
                  <span className="mm-project-dot" aria-hidden>·</span>
                  <span className="mm-project-year">{p.year}</span>
                </div>
                <span className={`mm-project-status mm-project-status-${p.status}`}>
                  {STATUS_LABEL[p.status] ?? p.status}
                </span>
              </div>

              <h2 className="mm-project-title">{p.title}</h2>
              <p className="mm-project-client">
                <span className="mm-project-swatch" aria-hidden />
                {p.client}
              </p>
              <p className="mm-project-summary">{p.summary}</p>

              {p.outcomes.length > 0 && (
                <ul className="mm-project-outcomes">
                  {p.outcomes.map((o, i) => (
                    <li key={i}>
                      <span className="mm-project-delta">{o.delta}</span>
                      <span className="mm-project-metric">{o.metric}</span>
                      {o.detail && <span className="mm-project-detail">{o.detail}</span>}
                    </li>
                  ))}
                </ul>
              )}

              <div className="mm-project-services">
                {p.services.map((s) => (
                  <span key={s} className="mm-project-chip">{s}</span>
                ))}
              </div>

              {p.externalUrl && (
                <a
                  href={p.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mm-project-link"
                >
                  Visit live site →
                </a>
              )}
            </article>
          ))}
        </section>

        <section className="container mm-projects-cta" data-mm-reveal>
          <h2>Want to be the next one on this page?</h2>
          <p>Start with a free 12-min Health Check — we&apos;ll show you what&apos;s leaking before we pitch anything.</p>
          <div className="mm-projects-cta-row">
            <Link href="/health-check" className="btn btn-primary btn-lg">Take the Health Check →</Link>
            <Link href="/signup" className="btn btn-secondary btn-lg">Get started →</Link>
          </div>
        </section>
      </main>
    </SiteShell>
  );
}
