// T4 unify-fix — shared marketing chrome (top sticky bar + nav +
// footer) wrapping any "site"-tier route (marketing pages,
// Health Check, Incubator surface, etc). Static React markup; no
// client interaction beyond <a> links. Asset paths are absolute so
// they survive any rewrite.

import Link from "next/link";
import type { ReactNode } from "react";

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <>
      <link
        rel="preconnect"
        href="https://fonts.googleapis.com"
      />
      <link
        rel="preconnect"
        href="https://fonts.gstatic.com"
        crossOrigin=""
      />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;800&display=swap"
      />
      <link rel="stylesheet" href="/_marketing/styles.css" />

      <div className="mm-stickybar">
        <div className="container mm-stickybar-row">
          <span className="mm-stickybar-icon">🩺</span>
          <span className="mm-stickybar-text">
            Where is your business <strong>quietly leaking</strong> customers?
          </span>
          <Link href="/health-check" className="mm-stickybar-cta">
            Take the free Health Check →
          </Link>
        </div>
      </div>

      <header className="nav">
        <div className="container nav-row">
          <Link href="/" className="brand">
            <span className="mark">M</span>
            <span className="brand-name">
              Milesy<span className="a">Media</span>
            </span>
          </Link>
          <nav className="nav-links">
            <Link href="/#process">How we work</Link>
            <Link href="/#services">Services</Link>
            <span className="nav-dropdown">
              <Link href="/#industries" className="nav-dropdown-toggle">
                Industries ▾
              </Link>
              <div className="nav-dropdown-menu">
                <Link href="/for-skincare">🌿 Skincare brands</Link>
                <Link href="/for-coaching">✍️ Coaches &amp; consultants</Link>
                <Link href="/for-agencies">💼 Agencies</Link>
                <Link href="/for-fitness">💪 Fitness studios</Link>
              </div>
            </span>
            <Link href="/health-check">Health Check</Link>
            <Link href="/business-os">Business OS</Link>
            <Link href="/incubator">Incubator</Link>
          </nav>
          <div className="nav-cta">
            <Link href="/login" className="btn btn-ghost">
              Sign in
            </Link>
            <Link href="/signup" className="btn btn-primary">
              Get started
            </Link>
          </div>
        </div>
      </header>

      {children}

      <footer>
        <div className="container foot-row">
          <span>© 2026 Milesy Media · All rights reserved.</span>
          <span>
            <Link href="/health-check">Health Check</Link> ·{" "}
            <Link href="/business-os">Business OS</Link> ·{" "}
            <Link href="/incubator">Incubator</Link> ·{" "}
            <Link href="/login">Client portal</Link> ·{" "}
            <a href="mailto:hello@milesymedia.co">hello@milesymedia.co</a>
          </span>
        </div>
      </footer>
    </>
  );
}
