import { redirect } from "next/navigation";
import { Header } from "@/components/chrome/Header";
import { Footer } from "@/components/chrome/Footer";
import { MemberDrawer } from "@/components/chrome/MemberDrawer";
import { getSessionUser } from "@/lib/sessionUser";
import { getAuthOrigin, getPortalConfig, hasPlugin } from "@/lib/portalConfig";

export const metadata = { title: "Refer & earn" };

interface AffiliateSummary {
  code?: string;
  shareUrl?: string;
  referrals?: number;
  unpaidEarningsCents?: number;
  paidEarningsCents?: number;
  currency?: string;
}

async function fetchAffiliateSummary(cookieValue: string): Promise<AffiliateSummary | null> {
  const cfg = getPortalConfig();
  const origin = getAuthOrigin();
  try {
    const res = await fetch(`${origin}/api/portal/affiliates/me`, {
      headers: { cookie: `${cfg.auth.cookieName}=${cookieValue}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as AffiliateSummary;
  } catch {
    return null;
  }
}

function formatMoney(cents: number | undefined, currency: string | undefined): string {
  if (cents == null) return "£0";
  const amount = cents / 100;
  try {
    return new Intl.NumberFormat("en-GB", { style: "currency", currency: currency ?? "GBP" }).format(amount);
  } catch {
    return `£${amount.toFixed(2)}`;
  }
}

export default async function AffiliatesPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!hasPlugin("affiliates")) {
    return (
      <>
        <Header />
        <main className="mx-auto max-w-3xl px-6 py-20 text-center">
          <h1 className="font-[family-name:var(--brand-font-heading)] text-3xl font-semibold tracking-tight">
            Refer & earn coming soon.
          </h1>
        </main>
        <Footer />
      </>
    );
  }

  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  const cfg = getPortalConfig();
  const cookieVal = cookieStore.get(cfg.auth.cookieName)?.value ?? "";
  const summary = cookieVal ? await fetchAffiliateSummary(cookieVal) : null;

  return (
    <>
      <Header />
      <main className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-8 md:grid-cols-12">
          <MemberDrawer email={user.email} />
          <section className="md:col-span-9 space-y-6">
            <header>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--brand-primary)]">
                Refer
              </p>
              <h1 className="mt-2 font-[family-name:var(--brand-font-heading)] text-4xl font-semibold tracking-tight">
                Refer &amp; earn
              </h1>
              <p className="mt-2 text-sm text-[var(--brand-ink)]/70">
                Share your code. We&apos;ll thank you with credit on every order it brings in.
              </p>
            </header>

            <article className="rounded-[var(--brand-radius)] border border-black/10 bg-white p-6 shadow-sm">
              <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand-ink)]/60">
                Your link
              </h2>
              <p className="mt-2 break-all text-base font-medium text-[var(--brand-ink)]">
                {summary?.shareUrl ?? "(generated when affiliates plugin is reachable)"}
              </p>
              {summary?.code && (
                <p className="mt-1 text-xs uppercase tracking-wider text-[var(--brand-ink)]/55">
                  Code: {summary.code}
                </p>
              )}
            </article>

            <ul className="grid gap-4 md:grid-cols-3">
              <li className="rounded-[var(--brand-radius)] border border-black/10 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand-ink)]/60">
                  Referrals
                </p>
                <p className="mt-2 font-[family-name:var(--brand-font-heading)] text-3xl font-semibold">
                  {summary?.referrals ?? 0}
                </p>
              </li>
              <li className="rounded-[var(--brand-radius)] border border-black/10 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand-ink)]/60">
                  Unpaid
                </p>
                <p className="mt-2 font-[family-name:var(--brand-font-heading)] text-3xl font-semibold">
                  {formatMoney(summary?.unpaidEarningsCents, summary?.currency)}
                </p>
              </li>
              <li className="rounded-[var(--brand-radius)] border border-black/10 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand-ink)]/60">
                  Paid out
                </p>
                <p className="mt-2 font-[family-name:var(--brand-font-heading)] text-3xl font-semibold">
                  {formatMoney(summary?.paidEarningsCents, summary?.currency)}
                </p>
              </li>
            </ul>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
