import Link from "next/link";
import { getPortalConfig } from "@/lib/portalConfig";

export function Footer() {
  const cfg = getPortalConfig();
  const tagline = cfg.content["footer.tagline"] ?? cfg.client.tagline;
  const description = cfg.content["footer.description"] ?? cfg.content["site.description"] ?? "";
  return (
    <footer className="mt-24 border-t border-black/10 bg-[var(--brand-ink)] text-[var(--brand-secondary)]">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-12 md:grid-cols-3">
        <div>
          <div className="font-[family-name:var(--brand-font-heading)] text-2xl font-semibold">
            {cfg.client.name}
          </div>
          <p className="mt-1 text-xs uppercase tracking-[0.2em] text-[var(--brand-secondary)]/70">
            {tagline}
          </p>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-[var(--brand-secondary)]/80">
            {description}
          </p>
        </div>
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand-secondary)]/60">
            Shop
          </h3>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link href="/shop">All products</Link></li>
            <li><Link href="/cart">Cart</Link></li>
            <li><Link href="/checkout">Checkout</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand-secondary)]/60">
            Account
          </h3>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link href="/login">Sign in</Link></li>
            <li><Link href="/account">My account</Link></li>
            <li><Link href="/orders">Order history</Link></li>
            <li><Link href="/affiliates">Affiliate dashboard</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5 text-xs text-[var(--brand-secondary)]/60">
          <span>© {new Date().getFullYear()} {cfg.client.name}</span>
          <span>Powered by <span className="text-[var(--brand-primary)]">Aqua portal</span></span>
        </div>
      </div>
    </footer>
  );
}
