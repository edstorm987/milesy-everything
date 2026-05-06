import Link from "next/link";
import { getContent, getPricingTiers } from "@/lib/portalConfig";

export function PricingTiers() {
  const eyebrow = getContent("pricing.eyebrow", "Membership");
  const headline = getContent("pricing.headline", "Pick your altitude.");
  const tagline = getContent("pricing.tagline", "");
  const tiers = getPricingTiers();
  return (
    <section id="pricing" className="mx-auto max-w-6xl px-6 py-20">
      <div className="mb-10 max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--brand-primary)]">
          {eyebrow}
        </p>
        <h2 className="mt-3 font-[family-name:var(--brand-font-heading)] text-4xl font-semibold tracking-tight text-[var(--brand-accent)]">
          {headline}
        </h2>
        <p className="mt-2 text-sm text-[var(--brand-ink)]/70">{tagline}</p>
      </div>
      <ul className="grid gap-6 md:grid-cols-3">
        {tiers.map(tier => (
          <li
            key={tier.id}
            className={[
              "relative flex h-full flex-col overflow-hidden border bg-white p-6 shadow-sm",
              tier.featured
                ? "border-[var(--brand-primary)] ring-1 ring-[var(--brand-primary)]/30"
                : "border-black/10",
            ].join(" ")}
            style={{ borderRadius: "var(--brand-radius)" }}
          >
            {tier.featured && (
              <span className="absolute right-3 top-3 rounded-full bg-[var(--brand-primary)] px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white">
                Most picked
              </span>
            )}
            <h3 className="font-[family-name:var(--brand-font-heading)] text-2xl font-semibold tracking-tight text-[var(--brand-accent)]">
              {tier.name}
            </h3>
            <p className="mt-2 text-3xl font-semibold text-[var(--brand-ink)]">
              {tier.price}
            </p>
            <p className="mt-4 flex-1 text-sm text-[var(--brand-ink)]/75">
              {tier.summary}
            </p>
            <Link
              href="/login"
              className={[
                "mt-6 inline-block text-sm font-medium",
                tier.featured ? "btn-primary" : "btn-ghost",
              ].join(" ")}
            >
              {tier.cta}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
