import Link from "next/link";
import { getPortalConfig } from "@/lib/portalConfig";

interface FeaturedItem {
  id: string;
  name: string;
  tagline: string;
  price: string;
}

// v1 placeholder while T3's ecommerce 'product-grid' block + the
// ecommerce API are still warming up. The real fetch happens via the
// API proxy (see src/app/shop/page.tsx) — this is the curated landing
// trio Felicia chose for the homepage.
const FEATURED: FeaturedItem[] = [
  { id: "black-soap-bar", name: "Black soap bar", tagline: "The original ritual.", price: "£14" },
  { id: "shea-butter-tub", name: "Shea butter tub", tagline: "Wild-harvested. Hand-pressed.", price: "£22" },
  { id: "ginger-clay-mask", name: "Ginger clay mask", tagline: "Heat. Honesty. Glow.", price: "£18" },
];

export function FeaturedProducts() {
  const cfg = getPortalConfig();
  const eyebrow = cfg.content["featured.eyebrow"] ?? "Featured";
  const headline = cfg.content["featured.headline"] ?? "Start your ritual.";
  const tagline = cfg.content["featured.tagline"] ?? "Three products. One for every skin need.";
  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <div className="mb-10">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--brand-primary)]">
          {eyebrow}
        </p>
        <h2 className="mt-3 font-[family-name:var(--brand-font-heading)] text-4xl font-semibold tracking-tight text-[var(--brand-ink)]">
          {headline}
        </h2>
        <p className="mt-2 text-sm text-[var(--brand-ink)]/65">{tagline}</p>
      </div>
      <ul className="grid gap-6 md:grid-cols-3">
        {FEATURED.map(item => (
          <li key={item.id}>
            <Link
              href={`/shop/${item.id}`}
              className="group block overflow-hidden border border-black/10 bg-white"
              style={{ borderRadius: "var(--brand-radius)" }}
            >
              <div
                className="aspect-[4/5] w-full"
                aria-hidden
                style={{
                  background:
                    "linear-gradient(135deg, color-mix(in oklab, var(--brand-primary) 14%, white) 0%, color-mix(in oklab, var(--brand-accent) 8%, white) 100%)",
                }}
              />
              <div className="px-5 py-4">
                <h3 className="font-[family-name:var(--brand-font-heading)] text-xl font-semibold tracking-tight text-[var(--brand-ink)] group-hover:text-[var(--brand-primary)]">
                  {item.name}
                </h3>
                <p className="mt-1 text-sm text-[var(--brand-ink)]/65">{item.tagline}</p>
                <p className="mt-3 text-sm font-semibold tracking-wide text-[var(--brand-ink)]">
                  {item.price}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
