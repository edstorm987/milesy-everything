// T4 unify-fix — shared marketing chrome (top sticky bar + nav +
// footer) wrapping any "site"-tier route (marketing pages,
// Health Check, Incubator surface, etc). Static React markup; no
// client interaction beyond <a> links. Asset paths are absolute so
// they survive any rewrite.

import Link from "next/link";
import type { ReactNode } from "react";
import dynamic from "next/dynamic";

// All chrome client islands lazy-loaded with no SSR — they're not
// critical to first paint and shouldn't block the marketing page from
// rendering for slow connections. Each ships in its own micro-bundle.
const ThemeSwitcher = dynamic(() => import("@/components/chrome/ThemeSwitcher").then(m => m.ThemeSwitcher));
const NavCollapseToggle = dynamic(() => import("@/components/chrome/NavCollapseToggle").then(m => m.NavCollapseToggle));
const NavExpandToggle = dynamic(() => import("@/components/chrome/NavCollapseToggle").then(m => m.NavExpandToggle));
const NavSideTab = dynamic(() => import("@/components/chrome/NavCollapseToggle").then(m => m.NavSideTab));
const NavAutoFold = dynamic(() => import("@/components/chrome/NavAutoFold").then(m => m.NavAutoFold));
const FloatingChat = dynamic(() => import("@/components/chrome/FloatingChat").then(m => m.FloatingChat));
const MarketingAuth = dynamic(() => import("@/components/chrome/MarketingAuth").then(m => m.MarketingAuth));

const CONTACT_PHONE = "+44 7707 020250";
const CONTACT_PHONE_HREF = "tel:+447707020250";
const CONTACT_EMAIL = "hello@milesymedia.co";

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <>
      {/* ULTRA FAST mode — fonts load fully NON-BLOCKING via the
          media="print" → onload swap trick. The marketing CSS loads
          synchronously (it's actually critical for layout) but with a
          small inline hint to mark fonts-ready instantly so text isn't
          held back waiting for Playfair. */}
      <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      {/* Non-blocking font load. Stylesheet starts with media="print" so
          it doesn't block render; a tiny inline script flips it to
          media="all" once it's loaded. SiteShell is a server component,
          so we can't pass onLoad as a React prop — instead we attach
          the listener via a vanilla JS snippet. */}
      <link
        id="mm-pf-font"
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;800&display=swap"
        media="print"
        // suppressHydrationWarning — the inline script below flips
        // media to "all" before React hydrates, so SSR + client diverge
        // intentionally. This is a perf optimisation, not a bug.
        suppressHydrationWarning
      />
      <script
        dangerouslySetInnerHTML={{
          __html:
            "(function(){var l=document.getElementById('mm-pf-font');if(!l)return;function s(){l.media='all'}if(l.sheet){s()}else{l.addEventListener('load',s,{once:true})}})();",
        }}
      />
      <noscript
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html:
            '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;800&display=swap" />',
        }}
      />
      <link rel="stylesheet" href="/_marketing/styles.css" />

      <NavAutoFold />

      <div className="mm-stickybar">
        <NavCollapseToggle />
        <div className="container mm-stickybar-row">
          <span className="mm-stickybar-icon">🩺</span>
          <span className="mm-stickybar-text">
            Where is your business <strong>quietly leaking</strong> customers?
          </span>
          <Link href="/health-check" className="mm-stickybar-cta">
            Take the free Health Check →
          </Link>
          <span className="mm-stickybar-contacts" aria-label="Contact us directly">
            <a href={CONTACT_PHONE_HREF} className="mm-stickybar-contact" title={`Call ${CONTACT_PHONE}`} aria-label={`Call ${CONTACT_PHONE}`}>
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.86 19.86 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.86 19.86 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.37 1.9.72 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.35 1.85.59 2.81.72A2 2 0 0 1 22 16.92z"/>
              </svg>
            </a>
            <a href={`mailto:${CONTACT_EMAIL}`} className="mm-stickybar-contact" title={`Email ${CONTACT_EMAIL}`} aria-label={`Email ${CONTACT_EMAIL}`}>
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
            </a>
            <a href="https://www.linkedin.com/" target="_blank" rel="noopener noreferrer" className="mm-stickybar-contact" title="LinkedIn" aria-label="LinkedIn">
              <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor" aria-hidden="true">
                <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94v5.66H9.36V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.36-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45z"/>
              </svg>
            </a>
            <a href="https://instagram.com/" target="_blank" rel="noopener noreferrer" className="mm-stickybar-contact" title="Instagram" aria-label="Instagram">
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="2" y="2" width="20" height="20" rx="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
              </svg>
            </a>
          </span>
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
            <Link href="/projects">Projects</Link>
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
            <span className="nav-dropdown nav-dropdown-mega">
              <Link href="/resources" className="nav-dropdown-toggle">
                Resources ▾
              </Link>
              <div className="nav-dropdown-menu nav-mega-menu">
                <div className="nav-mega-col">
                  <span className="nav-mega-heading">Quick access</span>
                  <Link href="/business-os">
                    <strong>🧭 Business OS</strong>
                    <em>Free operating layer · Incubator setup built in</em>
                  </Link>
                  <Link href="/health-check">
                    <strong>🩺 Health Check</strong>
                    <em>The flagship 12-min audit</em>
                  </Link>
                </div>
                <div className="nav-mega-col">
                  <span className="nav-mega-heading">Audits & diagnostics</span>
                  <Link href="/resources/seo-audit">
                    <strong>🔎 SEO audit</strong>
                    <em>Where you rank, what&apos;s missing</em>
                  </Link>
                  <Link href="/resources/site-speed">
                    <strong>⚡ Site speed test</strong>
                    <em>Lighthouse-style read</em>
                  </Link>
                  <Link href="/resources/accessibility-audit">
                    <strong>♿ Accessibility audit</strong>
                    <em>WCAG quick scan</em>
                  </Link>
                  <Link href="/resources/ux-orchestration">
                    <strong>🎯 UX orchestration</strong>
                    <em>Map your customer journey</em>
                  </Link>
                </div>
                <div className="nav-mega-col">
                  <span className="nav-mega-heading">Reading & finder</span>
                  <Link href="/resources">
                    <strong>🔎 Resource finder</strong>
                    <em>Search every tool, blog, FAQ</em>
                  </Link>
                  <Link href="/resources/playbooks">
                    <strong>📖 Playbooks</strong>
                    <em>Honest write-ups, no fluff</em>
                  </Link>
                  <Link href="/resources/case-studies">
                    <strong>📊 Case studies</strong>
                    <em>What actually moved the needle</em>
                  </Link>
                  <Link href="/resources/copy-clinic">
                    <strong>✍️ Copy clinic</strong>
                    <em>5-second hero rewrite</em>
                  </Link>
                </div>
              </div>
            </span>
          </nav>
          <div className="nav-cta">
            <MarketingAuth />
            <Link href="/demo" className="btn btn-secondary">
              Try the demo
            </Link>
            <Link href="/signup" className="btn btn-primary">
              Get started
            </Link>
            <ThemeSwitcher />
            <NavExpandToggle />
          </div>
        </div>
        <NavSideTab />
      </header>

      <FloatingChat />
      <div className="mm-page-content">{children}</div>

      <footer>
        <div className="container foot-row">
          <span>© 2026 Milesy Media · All rights reserved.</span>
          <span>
            <Link href="/health-check">Health Check</Link> ·{" "}
            <Link href="/business-os">Business OS</Link> ·{" "}
            <Link href="/projects">Projects</Link> ·{" "}
            <Link href="/resources">Resources</Link> ·{" "}
            <Link href="/login">Client portal</Link> ·{" "}
            <Link href="/privacy">Privacy</Link> ·{" "}
            <Link href="/terms">Terms</Link> ·{" "}
            <a href="mailto:hello@milesymedia.co">hello@milesymedia.co</a>
          </span>
        </div>
      </footer>
    </>
  );
}
