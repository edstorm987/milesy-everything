import Link from "next/link";
import { getPortalConfig } from "@/lib/portalConfig";

const NAV_ITEMS: { href: string; label: string }[] = [
  { href: "/shop", label: "Shop" },
  { href: "/account", label: "Account" },
  { href: "/orders", label: "Orders" },
  { href: "/affiliates", label: "Refer" },
];

export function Header() {
  const cfg = getPortalConfig();
  const wordmark1 = cfg.content["navbar.wordmark1"] ?? "LUV";
  const wordmark2 = cfg.content["navbar.wordmark2"] ?? "KER";
  const subtitle = cfg.content["navbar.subtitle"] ?? cfg.client.tagline;
  return (
    <header className="sticky top-0 z-30 w-full border-b border-black/5 bg-[var(--brand-secondary)]/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex flex-col leading-none">
          <span className="font-[family-name:var(--brand-font-heading)] text-2xl font-semibold tracking-tight">
            <span style={{ color: "var(--brand-primary)" }}>{wordmark1}</span>
            <span className="mx-1 text-[var(--brand-ink)]/60">&amp;</span>
            <span style={{ color: "var(--brand-accent)" }}>{wordmark2}</span>
          </span>
          <span className="mt-1 text-[10px] uppercase tracking-[0.2em] text-[var(--brand-ink)]/60">
            {subtitle}
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
