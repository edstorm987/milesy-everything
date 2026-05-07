import Link from "next/link";
// Renamed to avoid clashing with the route-level `dynamic` const below.
import nextDynamic from "next/dynamic";
import { isGoogleOAuthConfigured } from "@/lib/server/oauthGoogle";
import { seedFounder } from "@/lib/server/founderSeed";
import { SiteShell } from "@/components/SiteShell";

// Code-split: form bundle only ships when /login renders, and the
// nav + card chrome paint without waiting for it.
const LoginForm = nextDynamic(() => import("./LoginForm").then(m => m.LoginForm), {
  loading: () => <div className="h-40" aria-hidden />,
});

export const metadata = {
  title: "Sign in · Milesy Media",
};

// `seedFounder()` runs at request-time and reads FOUNDER_PASSWORD from
// process.env (R024 / chapter #129). When `next build` static-prerenders
// this page, the env may be unset and seedFounder throws. Force dynamic
// so the page is never prerendered — it renders per-request.
export const dynamic = "force-dynamic";

export default async function LoginPage() {
  // T4 unify-3 — make sure the founder user is seeded before the
  // form renders, so a fresh `npm run dev` can sign in immediately.
  // Wrapped: in prod with no FOUNDER_PASSWORD env, the seed throws
  // (per chapter #129 fail-closed policy). The login page itself
  // still renders so visitors can sign in with their own accounts.
  try {
    await seedFounder();
  } catch (e) {
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.warn("[/login] seedFounder skipped:", e instanceof Error ? e.message : e);
    }
  }
  return (
    <SiteShell>
      <main className="mm-auth-shell">
        <div className="mm-auth-split">
          <aside className="mm-auth-brand-panel" aria-hidden="true">
            <span className="mm-auth-brand-eyebrow">Milesy Media</span>
            <h2 className="mm-auth-brand-headline">
              One sign-in.<br />
              Three audiences.<br />
              Your whole agency.
            </h2>
            <p className="mm-auth-brand-tagline">
              Agency · client · end-customer — the same engine, branded
              for whoever&apos;s using it.
            </p>
            <ul className="mm-auth-brand-points">
              <li>Founders run the agency.</li>
              <li>Clients run their own branded portal.</li>
              <li>Their customers sign in, shop, book.</li>
            </ul>
            <span className="mm-auth-brand-foot">milesymedia.com</span>
          </aside>

          <div className="mm-auth-card">
            <div className="mm-auth-card-head">
              <h1>Welcome back</h1>
              <p>Sign in to your agency, Business OS or client portal.</p>
            </div>
            <LoginForm googleEnabled={isGoogleOAuthConfigured()} />
            <div className="mm-auth-foot">
              <span>
                New here? <Link href="/signup">Get started →</Link>
              </span>
              <Link href="/dev/pov" className="mm-dev-bypass" prefetch={false}>
                ⚡ Dev bypass
              </Link>
            </div>
          </div>
        </div>
      </main>
    </SiteShell>
  );
}
