import Link from "next/link";
import { Header } from "@/components/chrome/Header";
import { Footer } from "@/components/chrome/Footer";
import { getContent } from "@/lib/portalConfig";
import { getSessionUser } from "@/lib/sessionUser";
import { getAuthOrigin, getPortalConfig } from "@/lib/portalConfig";

export const metadata = { title: "Members library" };

interface MembershipState {
  status?: string;
  planId?: string;
  planName?: string;
  benefits?: { id: string; label: string; kind?: string }[];
}

const PREVIEW_ARTICLES: { id: string; title: string; description: string; gated: boolean }[] = [
  { id: "five-why-trap", title: "The five-why trap", description: "Why root-cause analysis stalls on ambiguous projects — and the four-question replacement.", gated: false },
  { id: "wip-review", title: "How to review your own WIP without lying to yourself", description: "A 20-minute weekly drill for solo operators.", gated: true },
  { id: "calm-week", title: "Designing the calm week", description: "Engineering deep-work blocks when meetings own your calendar.", gated: true },
  { id: "compass-checks", title: "Three compass checks for big bets", description: "How to know whether a strategic pivot is courage or cowardice.", gated: true },
];

async function fetchMembership(cookieValue: string): Promise<MembershipState | null> {
  const cfg = getPortalConfig();
  const origin = getAuthOrigin();
  try {
    const res = await fetch(`${origin}/api/portal/memberships/me`, {
      headers: { cookie: `${cfg.auth.cookieName}=${cookieValue}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as MembershipState;
  } catch {
    return null;
  }
}

export default async function MembersLibraryPage() {
  const eyebrow = getContent("members.eyebrow", "Members");
  const headline = getContent("members.headline", "The library.");
  const body = getContent("members.body", "");
  const user = await getSessionUser();

  let membership: MembershipState | null = null;
  if (user) {
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    const cfg = getPortalConfig();
    const cookieVal = cookieStore.get(cfg.auth.cookieName)?.value ?? "";
    if (cookieVal) membership = await fetchMembership(cookieVal);
  }
  const isMember = membership?.status === "active" || membership?.status === "trialing";

  return (
    <>
      <Header />
      <main id="main-content" className="mx-auto max-w-6xl px-6 py-16">
        <header className="mb-12 max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--brand-primary)]">
            {eyebrow}
          </p>
          <h1 className="mt-3 font-[family-name:var(--brand-font-heading)] text-5xl font-semibold tracking-tight text-[var(--brand-accent)]">
            {headline}
          </h1>
          <p className="mt-3 text-base leading-relaxed text-[var(--brand-ink)]/75">
            {body}
          </p>
          {!user && (
            <Link href="/login" className="btn-primary mt-6 inline-block text-sm">
              Sign in to read everything
            </Link>
          )}
          {user && !isMember && (
            <div className="mt-6 rounded-[var(--brand-radius)] border border-[var(--brand-primary)]/40 bg-[var(--brand-secondary)] p-5 text-sm text-[var(--brand-ink)]/80">
              You&apos;re signed in as <span className="font-medium">{user.email}</span>, but no active
              tier was found. <Link href="/#pricing" className="font-medium text-[var(--brand-primary)] hover:underline">Pick a plan</Link> to unlock everything.
            </div>
          )}
        </header>

        <ul className="grid gap-6 md:grid-cols-2">
          {PREVIEW_ARTICLES.map(article => {
            const locked = article.gated && !isMember;
            return (
              <li
                key={article.id}
                className="rounded-[var(--brand-radius)] border border-black/10 bg-white p-6 shadow-sm"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--brand-primary)]">
                    {locked ? "Members only" : "Free preview"}
                  </span>
                  {locked && (
                    <span aria-hidden className="text-[var(--brand-ink)]/40">🔒</span>
                  )}
                </div>
                <h3 className="font-[family-name:var(--brand-font-heading)] text-2xl font-semibold tracking-tight text-[var(--brand-accent)]">
                  {article.title}
                </h3>
                <p className="mt-2 text-sm text-[var(--brand-ink)]/75">{article.description}</p>
                {locked ? (
                  <Link href="/#pricing" className="mt-4 inline-block text-sm font-medium text-[var(--brand-primary)] hover:underline">
                    Unlock with membership →
                  </Link>
                ) : (
                  <Link href={`/members/${article.id}`} className="mt-4 inline-block text-sm font-medium text-[var(--brand-primary)] hover:underline">
                    Read →
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </main>
      <Footer />
    </>
  );
}
