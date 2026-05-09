import Link from "next/link";
import { SiteShell } from "@/components/SiteShell";

export const metadata = {
  title: "Not found · Milesy Media",
};

const SUGGESTED = [
  { href: "/", label: "Marketing home", hint: "Start over" },
  { href: "/health-check", label: "Free Health Check", hint: "60-second audit" },
  { href: "/resources", label: "Resources hub", hint: "Tools + templates" },
  { href: "/login", label: "Sign in to portal", hint: "Existing account" },
];

export default function NotFound() {
  return (
    <SiteShell>
      <main className="mm-404">
        <div className="mm-404-inner" data-mm-reveal>
          <div className="mm-404-eyebrow">
            <span className="mm-404-dot" aria-hidden />
            Page not found
          </div>

          <div className="mm-404-numerals" aria-hidden>
            <span>4</span>
            <span className="mm-404-zero">
              <span className="mm-404-ring" />
              <span className="mm-404-ring mm-404-ring-2" />
            </span>
            <span>4</span>
          </div>

          <h1 className="mm-404-title">
            We couldn&apos;t find that page.
          </h1>
          <p className="mm-404-sub">
            The link may have moved, the URL has a typo, or the page never existed.
            Try one of these — all working, all worth your time.
          </p>

          <ul className="mm-404-grid">
            {SUGGESTED.map((s) => (
              <li key={s.href}>
                <Link href={s.href} className="mm-404-card">
                  <span className="mm-404-card-label">{s.label}</span>
                  <span className="mm-404-card-hint">{s.hint}</span>
                  <span className="mm-404-card-arrow" aria-hidden>→</span>
                </Link>
              </li>
            ))}
          </ul>

          <p className="mm-404-foot">
            Still stuck? <Link href="/contact">Drop us a line</Link> and we&apos;ll
            point you to the right place.
          </p>
        </div>
      </main>
    </SiteShell>
  );
}
