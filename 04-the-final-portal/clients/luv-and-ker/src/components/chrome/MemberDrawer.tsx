import Link from "next/link";

interface Props {
  email: string | null;
}

// Side rail used inside member-only pages (account / orders / affiliates).
// Renders a simple nav and signs the active member's email so they have
// a visual anchor on which client portal they're inside.
export function MemberDrawer({ email }: Props) {
  return (
    <aside className="md:col-span-3">
      <div className="rounded-[var(--brand-radius)] border border-black/10 bg-white p-5 shadow-sm">
        <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand-ink)]/60">
          Member
        </h2>
        <p className="mt-2 truncate text-sm font-medium text-[var(--brand-ink)]">
          {email ?? "Not signed in"}
        </p>
        <nav aria-label="Member" className="mt-5 flex flex-col gap-1 text-sm">
          <Link href="/account" className="rounded px-2 py-1 text-[var(--brand-ink)]/85 hover:bg-[var(--brand-secondary)]">
            My account
          </Link>
          <Link href="/orders" className="rounded px-2 py-1 text-[var(--brand-ink)]/85 hover:bg-[var(--brand-secondary)]">
            Orders
          </Link>
          <Link href="/affiliates" className="rounded px-2 py-1 text-[var(--brand-ink)]/85 hover:bg-[var(--brand-secondary)]">
            Refer & earn
          </Link>
          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="mt-2 rounded px-2 py-1 text-left text-sm text-[var(--brand-ink)]/70 hover:text-[var(--brand-primary)]"
            >
              Sign out
            </button>
          </form>
        </nav>
      </div>
    </aside>
  );
}
