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
import { seedFounder, FOUNDER_EMAIL } from "@/lib/server/founderSeed";
import {
  seedDemoAgency,
  DEMO_OWNER_EMAIL,
  DEMO_CLIENT_EMAIL,
  DEMO_CUSTOMER_EMAIL,
} from "@/lib/server/demoSeed";
import { ensureHydrated } from "@/server/storage";
import { getUser } from "@/server/users";
import { issueSession, sessionCookie } from "@/lib/server/auth";
import { cookies } from "next/headers";

type Persona = "founder" | "demo-owner" | "demo-client" | "demo-customer";

async function signInAs(persona: Persona) {
  "use server";
  await ensureHydrated();

  let email: string;
  let landing: string;
  let isDemo = false;

  if (persona === "founder") {
    await seedFounder();
    email = FOUNDER_EMAIL;
    landing = "/portal/agency";
  } else {
    const seed = await seedDemoAgency("dev-pov");
    isDemo = true;
    if (persona === "demo-owner") {
      email = DEMO_OWNER_EMAIL;
      landing = "/portal/agency";
    } else if (persona === "demo-client") {
      email = DEMO_CLIENT_EMAIL;
      landing = `/portal/clients/${seed.client.slug}`;
    } else {
      email = DEMO_CUSTOMER_EMAIL;
      landing = "/portal/customer";
    }
  }

  const user = getUser(email);
  if (!user) throw new Error(`POV user ${email} not seeded`);

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

const POVS: Array<{ id: Persona; title: string; sub: string; landing: string }> = [
  {
    id: "founder",
    title: "Ed — Founder (agency-owner)",
    sub: "edwardhallam07@gmail.com · Milesy Media",
    landing: "/portal/agency",
  },
  {
    id: "demo-owner",
    title: "Demo agency-owner",
    sub: "demo@aqua.dev · Demo · Aqua",
    landing: "/portal/agency",
  },
  {
    id: "demo-client",
    title: "Demo client-owner (Felicia)",
    sub: "felicia@luvandker.demo · Luv & Ker",
    landing: "/portal/clients/<slug>",
  },
  {
    id: "demo-customer",
    title: "Demo end-customer (shopper)",
    sub: "demo-shopper@aqua.test",
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
