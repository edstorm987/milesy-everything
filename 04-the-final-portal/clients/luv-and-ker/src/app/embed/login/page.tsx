// Iframe-able login surface, branded as Luv & Ker. The host page on
// luvandker.com embeds this at /embed/login?return=<url>. Auth still
// terminates on the milesymedia.com origin via the proxy — cookies
// stay where they belong.

import Link from "next/link";
import { LoginPanel } from "@/app/login/LoginPanel";
import { getPortalConfig } from "@/lib/portalConfig";

interface SearchParams {
  return?: string;
}

export const metadata = {
  title: "Sign in",
};

export default async function EmbedLoginPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const cfg = getPortalConfig();
  const params = await searchParams;
  void params.return;
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-xs">
        <div className="mb-5 text-center">
          <Link
            href="/"
            target="_top"
            className="font-[family-name:var(--brand-font-heading)] text-2xl font-semibold tracking-tight"
          >
            <span style={{ color: "var(--brand-primary)" }}>{cfg.content["navbar.wordmark1"] ?? "LUV"}</span>
            <span className="mx-1 text-[var(--brand-ink)]/60">&amp;</span>
            <span style={{ color: "var(--brand-accent)" }}>{cfg.content["navbar.wordmark2"] ?? "KER"}</span>
          </Link>
          <h1 className="mt-3 text-base font-semibold tracking-tight text-[var(--brand-ink)]">
            Sign in to {cfg.client.name}
          </h1>
          <p className="mt-1 text-xs text-[var(--brand-ink)]/65">Member access</p>
        </div>
        <LoginPanel />
      </div>
    </main>
  );
}
