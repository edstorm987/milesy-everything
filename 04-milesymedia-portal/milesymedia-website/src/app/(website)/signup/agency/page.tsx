import Link from "next/link";
import dynamic from "next/dynamic";
import { isGoogleOAuthConfigured } from "@/lib/server/oauthGoogle";
import { SiteShell } from "@/components/SiteShell";

const SignupForm = dynamic(
  () => import("./SignupForm").then(m => m.SignupForm),
  { loading: () => <div className="h-40" aria-hidden /> },
);

export const metadata = {
  title: "Start an agency · Milesy Media",
};

export default function SignupAgencyPage() {
  return (
    <SiteShell>
      <main className="mm-auth-shell">
        <div className="mm-auth-card">
          <div className="mm-auth-card-head">
            <Link href="/signup" className="mm-auth-back">
              ← Back
            </Link>
            <h1>Start an agency</h1>
            <p>
              Spin up your own Milesy-powered agency portal. You become the
              owner; clients and end-customers join via invitation.
            </p>
          </div>
          <SignupForm googleEnabled={isGoogleOAuthConfigured()} />
          <div className="mm-auth-foot">
            <span>
              Already have one? <Link href="/login">Sign in →</Link>
            </span>
          </div>
        </div>
      </main>
    </SiteShell>
  );
}
