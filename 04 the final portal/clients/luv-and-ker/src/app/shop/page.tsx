import Link from "next/link";
import { Header } from "@/components/chrome/Header";
import { Footer } from "@/components/chrome/Footer";
import { getAuthOrigin } from "@/lib/portalConfig";

export const metadata = { title: "Shop" };

interface Product {
  id: string;
  slug?: string;
  name: string;
  tagline?: string;
  priceCents?: number;
  currency?: string;
  imageUrl?: string;
}

async function fetchProducts(): Promise<Product[]> {
  const origin = getAuthOrigin();
  try {
    const res = await fetch(`${origin}/api/portal/ecommerce/storefront/products`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { products?: Product[] };
    return data.products ?? [];
  } catch {
    return [];
  }
}

function formatMoney(cents: number | undefined, currency: string | undefined): string {
  if (cents == null) return "—";
  const amount = cents / 100;
  try {
    return new Intl.NumberFormat("en-GB", { style: "currency", currency: currency ?? "GBP" }).format(amount);
  } catch {
    return `£${amount.toFixed(2)}`;
  }
}

const PLACEHOLDER_PRODUCTS: Product[] = [
  { id: "black-soap-bar", name: "Black soap bar", tagline: "The original ritual.", priceCents: 1400, currency: "GBP" },
  { id: "shea-butter-tub", name: "Shea butter tub", tagline: "Wild-harvested. Hand-pressed.", priceCents: 2200, currency: "GBP" },
  { id: "ginger-clay-mask", name: "Ginger clay mask", tagline: "Heat. Honesty. Glow.", priceCents: 1800, currency: "GBP" },
  { id: "rose-hibiscus-toner", name: "Rose hibiscus toner", tagline: "Brightening daily mist.", priceCents: 1600, currency: "GBP" },
  { id: "shea-balm", name: "Shea balm", tagline: "Travel-size rescue.", priceCents: 900, currency: "GBP" },
  { id: "ritual-bundle", name: "Ritual bundle", tagline: "Three steps. One home.", priceCents: 4900, currency: "GBP" },
];

export default async function ShopPage() {
  const live = await fetchProducts();
  const products = live.length > 0 ? live : PLACEHOLDER_PRODUCTS;
  return (
    <>
      <Header />
      <main id="main-content" className="mx-auto max-w-6xl px-6 py-16">
        <header className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--brand-primary)]">
            Shop
          </p>
          <h1 className="mt-2 font-[family-name:var(--brand-font-heading)] text-5xl font-semibold tracking-tight">
            The full ritual.
          </h1>
          <p className="mt-3 max-w-xl text-sm text-[var(--brand-ink)]/70">
            Every bar, butter and mask in the Luv &amp; Ker line — sourced direct from Ghana,
            made for skin that demands honesty.
          </p>
        </header>
        <ul className="grid gap-6 md:grid-cols-3">
          {products.map(product => (
            <li key={product.id}>
              <Link
                href={`/shop/${product.slug ?? product.id}`}
                className="group block overflow-hidden border border-black/10 bg-white"
                style={{ borderRadius: "var(--brand-radius)" }}
              >
                <div
                  className="aspect-[4/5] w-full"
                  aria-hidden
                  style={{
                    background: product.imageUrl
                      ? `center/cover no-repeat url(${JSON.stringify(product.imageUrl)})`
                      : "linear-gradient(135deg, color-mix(in oklab, var(--brand-primary) 14%, white) 0%, color-mix(in oklab, var(--brand-accent) 8%, white) 100%)",
                  }}
                />
                <div className="px-5 py-4">
                  <h2 className="font-[family-name:var(--brand-font-heading)] text-xl font-semibold tracking-tight group-hover:text-[var(--brand-primary)]">
                    {product.name}
                  </h2>
                  {product.tagline && (
                    <p className="mt-1 text-sm text-[var(--brand-ink)]/65">{product.tagline}</p>
                  )}
                  <p className="mt-3 text-sm font-semibold text-[var(--brand-ink)]">
                    {formatMoney(product.priceCents, product.currency)}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </main>
      <Footer />
    </>
  );
}
