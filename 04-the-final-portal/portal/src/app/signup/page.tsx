import Link from "next/link";
import { Suspense } from "react";
import { SignupForm } from "./SignupForm";
import { isGoogleOAuthConfigured } from "@/lib/server/oauthGoogle";

export const metadata = {
  title: "Create your agency · Aqua portal",
};

export default function SignupPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <Link href="/" className="text-xs uppercase tracking-wide text-black/50 hover:text-black/80">
            ← Aqua portal
          </Link>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-black/90">
            Create your agency
          </h1>
          <p className="mt-1 text-sm text-black/60">
            Spin up your own Aqua portal. Where Healing Meets Revolution.
          </p>
        </div>
        <Suspense fallback={<div className="h-40" aria-hidden />}>
          <SignupForm googleEnabled={isGoogleOAuthConfigured()} />
        </Suspense>
      </div>
    </main>
  );
}
