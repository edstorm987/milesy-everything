import Link from "next/link";
import { getContent } from "@/lib/portalConfig";

export function Hero() {
  const eyebrow = getContent("hero.eyebrow", "Coaching that ships");
  const headline1 = getContent("hero.headline1", "Map the work.");
  const headline2 = getContent("hero.headline2", "Move the needle.");
  const body = getContent("hero.body", "");
  const ctaPrimary = getContent("hero.ctaPrimary", "View pricing");
  const ctaSecondary = getContent("hero.ctaSecondary", "Members library");
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-6 py-20 md:grid-cols-2 md:py-28">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--brand-primary)]">
            {eyebrow}
          </p>
          <h1 className="mt-4 font-[family-name:var(--brand-font-heading)] text-5xl font-semibold leading-[1.05] tracking-tight md:text-6xl text-[var(--brand-accent)]">
            {headline1}
            <span className="block text-[var(--brand-primary)]">{headline2}</span>
          </h1>
          <p className="mt-6 max-w-md text-base leading-relaxed text-[var(--brand-ink)]/80">
            {body}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/#pricing" className="btn-primary">
              {ctaPrimary}
            </Link>
            <Link href="/members" className="btn-ghost">
              {ctaSecondary}
            </Link>
          </div>
        </div>
        <div
          aria-hidden
          className="relative h-72 w-full overflow-hidden md:h-[28rem]"
          style={{
            borderRadius: "var(--brand-radius)",
            background:
              "radial-gradient(circle at 25% 20%, color-mix(in oklab, var(--brand-primary) 35%, transparent) 0%, transparent 60%), radial-gradient(circle at 75% 80%, color-mix(in oklab, var(--brand-accent) 45%, transparent) 0%, transparent 55%), linear-gradient(135deg, color-mix(in oklab, var(--brand-secondary) 80%, white) 0%, color-mix(in oklab, var(--brand-secondary) 95%, white) 100%)",
          }}
        >
          <div className="absolute inset-0 grid place-items-center">
            <div className="text-center">
              <div className="mx-auto grid h-32 w-32 place-items-center rounded-full border-2 border-[var(--brand-accent)]/40">
                <div className="grid h-24 w-24 place-items-center rounded-full border border-[var(--brand-accent)]/30">
                  <span aria-hidden className="block h-12 w-3 bg-[var(--brand-primary)]" style={{ clipPath: "polygon(50% 0, 100% 100%, 0 100%)" }} />
                </div>
              </div>
              <p className="mt-6 text-sm tracking-[0.3em] text-[var(--brand-ink)]/60">
                NORTH BY HONEST WORK
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
