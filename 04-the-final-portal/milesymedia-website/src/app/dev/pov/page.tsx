// T4 unify-fix — Dev bypass POV picker. Lets Ed jump straight into
// any persona without typing credentials, so he can spot UX gaps
// across the agency / client / end-customer surfaces and report
// back to the implementer. Each option fires a server action that
// seeds (idempotent) and issues a session cookie for that user.
//
// Behind a thin "dev only" gate — visible whenever NODE_ENV !== prod.
// Replace with a stricter gate before any public deploy.

import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteShell } from "@/components/SiteShell";
import { seedFounder, seedFounderForDevBypass, FOUNDER_EMAIL } from "@/lib/server/founderSeed";
import {
  seedDemoAgency,
  DEMO_OWNER_EMAIL,
  DEMO_STAFF_EMAIL,
  DEMO_CLIENT_EMAIL,
  DEMO_CUSTOMER_EMAIL,
} from "@/lib/server/demoSeed";
import { getUser } from "@/server/users";
import { issueSession, sessionCookie } from "@/lib/server/auth";
import { resolvePostLoginPath } from "@/lib/server/postLoginRedirect";
import { cookies } from "next/headers";

// `seedFounder()` runs inside the `signInAs` server action below and
// reads FOUNDER_PASSWORD from process.env. When `next build` static-
// prerenders this page, it never invokes the action — so the page
// itself is safe to prerender. But we force dynamic anyway because
// /dev/pov is a non-prod surface and keeping it consistent with
// /login simplifies prerender behaviour.
export const dynamic = "force-dynamic";

type Persona = "founder" | "demo-owner" | "demo-employee" | "demo-client" | "demo-customer";

async function signInAs(persona: Persona) {
  "use server";
  // ensureHydrated() runs inside seedFounder/seedDemoAgency — don't
  // double-call here. Both seeds memoize after first run, so repeat
  // POV clicks short-circuit (~10× faster than re-walking installs).

  let email: string;
  let isDemo = false;

  if (persona === "founder") {
    // Use the dev-bypass seed (hardcoded dev password, no env req).
    // Regular `seedFounder()` skips when FOUNDER_PASSWORD is unset
    // (R024 fail-closed policy in dev = warn+skip), which used to
    // throw "POV user not seeded" downstream. seedFounderForDevBypass
    // hard-throws in production, so this stays dev-only.
    await seedFounderForDevBypass();
    // Fallback: also try the env-driven seed (idempotent) so an
    // operator who DID set FOUNDER_PASSWORD doesn't double-seed.
    await seedFounder().catch(() => {});
    email = FOUNDER_EMAIL;
  } else {
    await seedDemoAgency("dev-pov");
    isDemo = true;
    if (persona === "demo-owner") {
      email = DEMO_OWNER_EMAIL;
    } else if (persona === "demo-employee") {
      email = DEMO_STAFF_EMAIL;
    } else if (persona === "demo-client") {
      email = DEMO_CLIENT_EMAIL;
    } else {
      email = DEMO_CUSTOMER_EMAIL;
    }
  }

  const user = getUser(email);
  if (!user) throw new Error(`POV user ${email} not seeded`);
  // R022: same resolver production users go through, so POV personas
  // exercise the real route mapping.
  const landing = resolvePostLoginPath(null, user);

  const token = issueSession({
    userId: user.id,
    email: user.email,
    role: user.role,
    agencyId: user.agencyId,
    clientId: user.clientId,
    isDemo,
    sessionRev: user.sessionRev ?? 0,
  });
  const cookie = sessionCookie(token);
  const jar = await cookies();
  jar.set(cookie.name, cookie.value, cookie.options);

  redirect(landing);
}

const POVS: Array<{ id: Persona; title: string; sub: string; sees: string; landing: string }> = [
  {
    id: "founder",
    title: "Ed — Founder (agency-owner)",
    sub: "edwardhallam07@gmail.com · Milesy Media",
    sees: "All agencies in the switcher, every plugin admin, full activity inbox.",
    landing: "/portal/agency",
  },
  {
    id: "demo-owner",
    title: "Demo agency-owner",
    sub: "demo@aqua.dev · Demo · Aqua",
    sees: "One agency dashboard, the demo client roster, plugin admins for that agency only.",
    landing: "/portal/agency",
  },
  {
    id: "demo-employee",
    title: "Demo employee (agency-staff)",
    sub: "staff@aqua.dev · Demo · Aqua",
    sees: "Same agency surface as the owner but with the staff permission grid — no admin levers.",
    landing: "/portal/agency",
  },
  {
    id: "demo-client",
    title: "Demo client-owner (Felicia)",
    sub: "felicia@luvandker.demo · Luv & Ker",
    sees: "Their own client portal — onboarding, kanban, reports — scoped to one client.",
    landing: "/portal/clients/<slug>",
  },
  {
    id: "demo-customer",
    title: "Demo end-customer (shopper)",
    sub: "demo-shopper@aqua.test",
    sees: "The storefront face — only what a paying customer of one client sees.",
    landing: "/portal/customer",
  },
];

export const metadata = {
  title: "Dev bypass · Milesy Media",
};

export default function DevPovPage() {
  return (
    <SiteShell>
      <main className="mm-auth-shell">
        <div className="mm-auth-card mm-dev-card">
          <div className="mm-auth-card-head">
            <span className="mm-dev-eyebrow">⚡ Dev bypass</span>
            <h1>Sign in as…</h1>
            <p>
              Pick a persona and we&apos;ll issue a real session for them.
              Use this to spot UX gaps across agency, client and
              end-customer surfaces, then report back.
            </p>
          </div>
          <div className="mm-pov-list">
            {POVS.map(p => (
              <form key={p.id} action={signInAs.bind(null, p.id)}>
                <button type="submit" className="mm-pov-btn">
                  <span className="mm-pov-btn-title">{p.title}</span>
                  <span className="mm-pov-btn-sub">{p.sub}</span>
                  <span className="mm-pov-btn-sees">{p.sees}</span>
                  <span className="mm-pov-btn-landing">→ {p.landing}</span>
                </button>
              </form>
            ))}
          </div>
          <div className="mm-auth-foot">
            <Link href="/login">← Back to normal sign in</Link>
          </div>
        </div>
      </main>
    </SiteShell>
  );
}
