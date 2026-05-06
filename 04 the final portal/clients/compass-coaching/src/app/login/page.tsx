import Link from "next/link";
import { Header } from "@/components/chrome/Header";
import { Footer } from "@/components/chrome/Footer";
import { LoginPanel } from "./LoginPanel";
import { getPortalConfig } from "@/lib/portalConfig";

export const metadata = { title: "Sign in" };

export default function LoginPage() {
  const cfg = getPortalConfig();
  return (
    <>
      <Header />
      <main id="main-content" className="mx-auto flex max-w-6xl flex-col items-center px-6 py-20">
        <div className="w-full max-w-md">
          <div className="mb-6 text-center">
            <Link href="/" className="text-xs uppercase tracking-[0.2em] text-[var(--brand-ink)]/60 hover:text-[var(--brand-primary)]">
              ← {cfg.client.name}
            </Link>
            <h1 className="mt-3 font-[family-name:var(--brand-font-heading)] text-3xl font-semibold tracking-tight text-[var(--brand-accent)]">
              Welcome back
            </h1>
            <p className="mt-1 text-sm text-[var(--brand-ink)]/70">
              Sign in to your {cfg.client.name} account.
            </p>
          </div>
          <LoginPanel />
        </div>
      </main>
      <Footer />
    </>
  );
}
