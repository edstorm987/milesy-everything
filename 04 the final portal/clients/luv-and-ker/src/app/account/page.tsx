import Link from "next/link";
import { redirect } from "next/navigation";
import { Header } from "@/components/chrome/Header";
import { Footer } from "@/components/chrome/Footer";
import { MemberDrawer } from "@/components/chrome/MemberDrawer";
import { getSessionUser } from "@/lib/sessionUser";
import { hasPlugin } from "@/lib/portalConfig";

export const metadata = {
  title: "My account",
};

// /account is the member home — it surfaces the memberships block
// (`my-membership`) plus quick links to /orders and /affiliates. When
// the visitor isn't signed in we route them through the login. The
// account experience is rendered via portal variants on the shared
// portal once the editor publishes them; until then we show this
// faithful hand-coded version (per the prompt's Phase C guidance).

export default async function AccountPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  return (
    <>
      <Header />
      <main className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-8 md:grid-cols-12">
          <MemberDrawer email={user.email} />
          <section className="md:col-span-9 space-y-6">
            <header>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--brand-primary)]">
                Member
              </p>
              <h1 className="mt-2 font-[family-name:var(--brand-font-heading)] text-4xl font-semibold tracking-tight">
                Welcome back, {user.name ?? user.email.split("@")[0]}.
              </h1>
              <p className="mt-2 text-sm text-[var(--brand-ink)]/70">
                Manage your subscription, view your orders, share your referral link.
              </p>
            </header>

            {hasPlugin("memberships") && (
              <article className="rounded-[var(--brand-radius)] border border-black/10 bg-white p-6 shadow-sm">
                <h2 className="font-[family-name:var(--brand-font-heading)] text-2xl font-semibold tracking-tight">
                  Your membership
                </h2>
                <p className="mt-2 text-sm text-[var(--brand-ink)]/70">
                  Active tier and renewal date appear here once the memberships plugin returns
                  data for your account. The shared portal is the source of truth.
                </p>
                <div className="mt-4 flex gap-3">
                  <Link href="/api/portal/memberships/me" className="btn-ghost text-sm">
                    View raw membership
                  </Link>
                </div>
              </article>
            )}

            {hasPlugin("affiliates") && (
              <article className="rounded-[var(--brand-radius)] border border-black/10 bg-white p-6 shadow-sm">
                <h2 className="font-[family-name:var(--brand-font-heading)] text-2xl font-semibold tracking-tight">
                  Refer & earn
                </h2>
                <p className="mt-2 text-sm text-[var(--brand-ink)]/70">
                  Share your code, track referrals, see your unpaid balance.
                </p>
                <Link href="/affiliates" className="btn-primary mt-4 inline-block text-sm">
                  Open dashboard
                </Link>
              </article>
            )}

            {hasPlugin("ecommerce") && (
              <article className="rounded-[var(--brand-radius)] border border-black/10 bg-white p-6 shadow-sm">
                <h2 className="font-[family-name:var(--brand-font-heading)] text-2xl font-semibold tracking-tight">
                  Recent orders
                </h2>
                <p className="mt-2 text-sm text-[var(--brand-ink)]/70">
                  Your recent orders, wishlists, and reorder shortcuts.
                </p>
                <Link href="/orders" className="btn-ghost mt-4 inline-block text-sm">
                  View orders
                </Link>
              </article>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
