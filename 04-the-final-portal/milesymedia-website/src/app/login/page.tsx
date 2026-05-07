import Link from "next/link";
import dynamic from "next/dynamic";
import { isGoogleOAuthConfigured } from "@/lib/server/oauthGoogle";
import { seedFounder } from "@/lib/server/founderSeed";
import { SiteShell } from "@/components/SiteShell";

// Code-split: form bundle only ships when /login renders, and the
// nav + card chrome paint without waiting for it.
const LoginForm = dynamic(() => import("./LoginForm").then(m => m.LoginForm), {
  loading: () => <div className="h-40" aria-hidden />,
});

export const metadata = {
  title: "Sign in · Milesy Media",
};

export default async function LoginPage() {
  // T4 unify-3 — make sure the founder user is seeded before the
  // form renders, so a fresh `npm run dev` can sign in immediately.
  await seedFounder();
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
