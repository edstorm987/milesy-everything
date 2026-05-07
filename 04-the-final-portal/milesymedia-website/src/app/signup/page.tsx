// T4 unify-fix — Signup role selector. Whoever lands here picks
// what kind of account they need; each card routes to the right
// onboarding flow. The page replaces the old "create your agency"
// default that assumed everyone signing up wanted to spin up an
// agency.
//
// Today: agency-owner flow exists (/signup/agency). Lead /
// business-os and end-customer flows are stubbed as "coming soon"
// — Step 6+ in the unification roadmap.

import Link from "next/link";
import { SiteShell } from "@/components/SiteShell";

export const metadata = {
  title: "Get started · Milesy Media",
};

const ROLES = [
  {
    id: "agency",
    title: "I run an agency",
    sub: "Spin up a Milesy-powered agency portal. Invite your team, your clients, and their end-customers.",
    cta: "Start an agency",
    href: "/signup/agency",
    badge: "Available",
    available: true,
  },
  {
    id: "lead",
    title: "I'm a business owner",
    sub: "Take the free Health Check, get your honest leak diagnosis, and unlock the Business OS to start fixing things.",
    cta: "Take the Health Check",
    href: "/health-check",
    badge: "Available",
    available: true,
  },
  {
    id: "client",
    title: "My agency invited me",
    sub: "Open the link in your invitation email or ask your agency for it. Your portal is configured under their account.",
    cta: "Where's my link?",
    href: "/login",
    badge: "Invite-only",
    available: false,
  },
  {
    id: "customer",
    title: "I'm a customer of a business",
    sub: "If a business invited you to their portal (orders, bookings, memberships), they'll have sent you a sign-in link.",
    cta: "Sign in instead",
    href: "/login",
    badge: "Invite-only",
    available: false,
  },
];

export default function SignupPage() {
  return (
    <SiteShell>
      <main className="mm-auth-shell">
        <div className="mm-auth-card mm-signup-picker">
          <div className="mm-auth-card-head">
            <h1>Who are you?</h1>
            <p>Pick the option that fits and we&apos;ll route you to the right place.</p>
          </div>
          <div className="mm-role-grid">
            {ROLES.map(r => (
              <Link
                key={r.id}
                href={r.href}
                className={`mm-role-card${r.available ? " is-available" : ""}`}
              >
                <span className="mm-role-badge">{r.badge}</span>
                <span className="mm-role-title">{r.title}</span>
                <span className="mm-role-sub">{r.sub}</span>
                <span className="mm-role-cta">{r.cta} →</span>
              </Link>
            ))}
          </div>
          <div className="mm-auth-foot">
            <span>
              Already have an account? <Link href="/login">Sign in →</Link>
            </span>
          </div>
        </div>
      </main>
    </SiteShell>
  );
}
