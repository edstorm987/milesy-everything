import Link from "next/link";
import { LoginPanel } from "@/app/login/LoginPanel";
import { getPortalConfig } from "@/lib/portalConfig";

export const metadata = { title: "Sign in" };

interface SearchParams {
  return?: string;
}

export default async function EmbedLoginPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const cfg = getPortalConfig();
  const params = await searchParams;
  void params.return;
  return (
    <main id="main-content" className="flex min-h-screen flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-xs">
        <div className="mb-5 text-center">
          <Link href="/" target="_top" className="font-[family-name:var(--brand-font-heading)] text-xl font-semibold tracking-tight text-[var(--brand-accent)]">
            {cfg.client.name}
          </Link>
          <h1 className="mt-3 text-base font-semibold tracking-tight text-[var(--brand-ink)]">
            Sign in to {cfg.client.name}
          </h1>
          <p className="mt-1 text-xs text-[var(--brand-ink)]/65">Members access</p>
        </div>
        <LoginPanel />
      </div>
    </main>
  );
}
