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
      </main>
    </SiteShell>
  );
}
