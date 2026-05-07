// /login/reset?token=… — complete a password reset.
// T1 R038 — chapter #160.
//
// Server component renders SiteShell + brand chrome; ResetForm is a
// client island that reads `?token=` from the URL, drives the fetch,
// and redirects to `/login?reset=1` on success.

import Link from "next/link";
import { SiteShell } from "@/components/SiteShell";
import { ResetForm } from "./ResetForm";

export const metadata = {
  title: "Reset password · Milesy Media",
};

export default function ResetPage() {
  return (
    <SiteShell>
      <main className="mm-auth-shell">
        <div className="mm-auth-split">
          <aside className="mm-auth-brand-panel" aria-hidden="true">
            <span className="mm-auth-brand-eyebrow">Milesy Media</span>
            <h2 className="mm-auth-brand-headline">
              New password.<br />
              Same workspace.
            </h2>
            <p className="mm-auth-brand-tagline">
              Set a strong password — every existing session for this
              account will sign out automatically.
            </p>
            <span className="mm-auth-brand-foot">milesymedia.com</span>
          </aside>

          <div className="mm-auth-card">
            <div className="mm-auth-card-head">
              <h1>Reset password</h1>
              <p>Pick something at least 8 characters long.</p>
            </div>
            <ResetForm />
            <div className="mm-auth-foot">
              <span>
                Changed your mind? <Link href="/login">Sign in →</Link>
              </span>
            </div>
          </div>
        </div>
      </main>
    </SiteShell>
  );
}
