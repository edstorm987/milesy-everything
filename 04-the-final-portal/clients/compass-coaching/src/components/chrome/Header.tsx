import Link from "next/link";
import { getContent, getPortalConfig } from "@/lib/portalConfig";

const NAV_ITEMS: { href: string; label: string }[] = [
  { href: "/#pricing", label: "Pricing" },
  { href: "/members", label: "Members" },
  { href: "/contact", label: "Contact" },
];

export function Header() {
  const cfg = getPortalConfig();
  const subtitle = getContent("navbar.subtitle", cfg.client.tagline);
  return (
    <header className="sticky top-0 z-30 w-full border-b border-black/5 bg-[var(--brand-secondary)]/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-3">
          <span aria-hidden className="grid h-9 w-9 place-items-center rounded-full border-2 border-[var(--brand-accent)]">
            <span className="block h-3 w-1 -translate-y-0.5 bg-[var(--brand-primary)]" style={{ clipPath: "polygon(50% 0, 100% 100%, 0 100%)" }} />
          </span>
          <span className="flex flex-col leading-tight">
            <span className="font-[family-name:var(--brand-font-heading)] text-xl font-semibold tracking-tight text-[var(--brand-accent)]">
              {cfg.client.name}
            </span>
            <span className="text-[10px] uppercase tracking-[0.18em] text-[var(--brand-ink-soft)]">
              {subtitle}
            </span>
          </span>
        </Link>
        <nav aria-label="Primary" className="hidden items-center gap-6 md:flex">
          {NAV_ITEMS.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-[var(--brand-ink)]/80 transition hover:text-[var(--brand-primary)]"
            >
              {item.label}
            </Link>
          ))}
          <Link href="/login" className="btn-primary text-sm">
            Sign in
          </Link>
        </nav>
        <Link href="/login" className="btn-primary text-sm md:hidden">
          Sign in
        </Link>
      </div>
    </header>
  );
}
