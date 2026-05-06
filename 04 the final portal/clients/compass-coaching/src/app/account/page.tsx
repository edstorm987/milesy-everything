import Link from "next/link";
import { redirect } from "next/navigation";
import { Header } from "@/components/chrome/Header";
import { Footer } from "@/components/chrome/Footer";
import { MemberDrawer } from "@/components/chrome/MemberDrawer";
import { getSessionUser } from "@/lib/sessionUser";
import { hasPlugin } from "@/lib/portalConfig";

export const metadata = { title: "My account" };

// /account is the member home for Compass Coaching. Shows the
// memberships block (active tier, renewal, billing portal) and
// a quick link into the members library. Variant
// `compass-account-v1` will replace this hand-coded version when
// the website-editor publishes the block tree.

export default async function AccountPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  return (
    <>
      <Header />
      <main id="main-content" className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-8 md:grid-cols-12">
          <MemberDrawer email={user.email} />
          <section className="md:col-span-9 space-y-6">
            <header>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--brand-primary)]">
                Member
              </p>
              <h1 className="mt-2 font-[family-name:var(--brand-font-heading)] text-4xl font-semibold tracking-tight text-[var(--brand-accent)]">
                Welcome back, {user.name ?? user.email.split("@")[0]}.
              </h1>
              <p className="mt-2 text-sm text-[var(--brand-ink)]/70">
                Manage your tier, browse the library, book a session.
              </p>
            </header>

            {hasPlugin("memberships") && (
              <article className="rounded-[var(--brand-radius)] border border-black/10 bg-white p-6 shadow-sm">
                <h2 className="font-[family-name:var(--brand-font-heading)] text-2xl font-semibold tracking-tight text-[var(--brand-accent)]">
                  Your tier
                </h2>
                <p className="mt-2 text-sm text-[var(--brand-ink)]/70">
                  Active plan + renewal date appear here once the memberships plugin returns
                  data for your account. The shared portal is the source of truth.
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Link href="/members" className="btn-primary text-sm">Open library</Link>
                  <Link href="/api/portal/memberships/me" className="btn-ghost text-sm">View raw</Link>
                </div>
              </article>
            )}

            <article className="rounded-[var(--brand-radius)] border border-black/10 bg-white p-6 shadow-sm">
              <h2 className="font-[family-name:var(--brand-font-heading)] text-2xl font-semibold tracking-tight text-[var(--brand-accent)]">
                Get in touch
              </h2>
              <p className="mt-2 text-sm text-[var(--brand-ink)]/70">
                Send Felicia&apos;s replacement coach a note via the contact form — it lands as a CRM contact + email notification.
              </p>
              <Link href="/contact" className="btn-ghost mt-4 inline-block text-sm">Open contact form</Link>
            </article>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
