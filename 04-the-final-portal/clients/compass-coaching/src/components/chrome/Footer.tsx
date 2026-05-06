import Link from "next/link";
import { getContent, getPortalConfig } from "@/lib/portalConfig";

export function Footer() {
  const cfg = getPortalConfig();
  const tagline = getContent("footer.tagline", cfg.client.tagline);
  const description = getContent("footer.description", getContent("site.description"));
  return (
    <footer className="mt-24 border-t border-black/10 bg-[var(--brand-accent)] text-[var(--brand-secondary)]">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-12 md:grid-cols-3">
        <div>
          <div className="font-[family-name:var(--brand-font-heading)] text-2xl font-semibold">
            {cfg.client.name}
          </div>
          <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[var(--brand-secondary)]/80">
            {tagline}
          </p>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-[var(--brand-secondary)]/85">
            {description}
          </p>
        </div>
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand-secondary)]/60">
            Programme
          </h3>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link href="/#pricing">Pricing</Link></li>
            <li><Link href="/members">Members library</Link></li>
            <li><Link href="/contact">Contact</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand-secondary)]/60">
            Account
          </h3>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link href="/login">Sign in</Link></li>
            <li><Link href="/account">My account</Link></li>
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
