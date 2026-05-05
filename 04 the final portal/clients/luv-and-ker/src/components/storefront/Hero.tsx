import Link from "next/link";
import { getPortalConfig } from "@/lib/portalConfig";

export function Hero() {
  const cfg = getPortalConfig();
  const eyebrow = cfg.content["hero.eyebrow"] ?? "Heritage skincare";
  const headline1 = cfg.content["hero.headline1"] ?? "Pure. Sacred.";
  const headline2 = cfg.content["hero.headline2"] ?? "Alive.";
  const body = cfg.content["hero.body"] ?? "";
  const ctaPrimary = cfg.content["hero.ctaPrimary"] ?? "Shop the ritual";
  const ctaSecondary = cfg.content["hero.ctaSecondary"] ?? "Read the story";
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-6 py-20 md:grid-cols-2 md:py-28">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--brand-primary)]">
            {eyebrow}
          </p>
          <h1 className="mt-4 font-[family-name:var(--brand-font-heading)] text-5xl font-semibold leading-[1.05] tracking-tight md:text-6xl">
            {headline1}
            <span className="block text-[var(--brand-accent)]">{headline2}</span>
          </h1>
          <p className="mt-6 max-w-md text-base leading-relaxed text-[var(--brand-ink)]/75">
            {body}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/shop" className="btn-primary">
              {ctaPrimary}
            </Link>
            <Link href="/" className="btn-ghost">
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
              "radial-gradient(circle at 30% 20%, color-mix(in oklab, var(--brand-primary) 40%, transparent) 0%, transparent 60%), radial-gradient(circle at 70% 80%, color-mix(in oklab, var(--brand-accent) 35%, transparent) 0%, transparent 55%), linear-gradient(135deg, color-mix(in oklab, var(--brand-secondary) 80%, white) 0%, color-mix(in oklab, var(--brand-secondary) 95%, white) 100%)",
          }}
        >
          <div className="absolute inset-0 grid place-items-center">
            <div className="text-center">
              <p className="font-[family-name:var(--brand-font-heading)] text-7xl font-semibold text-[var(--brand-ink)]/85">
                Odo
              </p>
              <p className="mt-3 text-sm tracking-[0.3em] text-[var(--brand-ink)]/55">
                THE TWI WORD FOR LOVE
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
