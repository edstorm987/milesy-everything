import Link from "next/link";
import { Header } from "@/components/chrome/Header";
import { Footer } from "@/components/chrome/Footer";

export const metadata = { title: "Product" };

interface Params { id: string }

export default async function ProductPage({ params }: { params: Promise<Params> }) {
  const { id } = await params;
  return (
    <>
      <Header />
      <main className="mx-auto max-w-6xl px-6 py-16">
        <Link href="/shop" className="text-xs uppercase tracking-[0.2em] text-[var(--brand-ink)]/60 hover:text-[var(--brand-primary)]">
          ← Shop
        </Link>
        <div className="mt-6 grid gap-12 md:grid-cols-2">
          <div
            aria-hidden
            className="aspect-square w-full"
            style={{
              borderRadius: "var(--brand-radius)",
              background:
                "linear-gradient(135deg, color-mix(in oklab, var(--brand-primary) 18%, white) 0%, color-mix(in oklab, var(--brand-accent) 10%, white) 100%)",
            }}
          />
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--brand-primary)]">
              Product
            </p>
            <h1 className="mt-3 font-[family-name:var(--brand-font-heading)] text-5xl font-semibold tracking-tight capitalize">
              {id.replace(/-/g, " ")}
            </h1>
            <p className="mt-4 text-base leading-relaxed text-[var(--brand-ink)]/80">
              Detailed product copy ships when the ecommerce plugin&apos;s
              storefront block (`product-detail`) lands. Until then this stub
              proves the route shape so the export-to-repo generator
              (T2 R11) has a target to mirror.
            </p>
            <Link href="/cart" className="btn-primary mt-8 inline-block">
              Add to cart
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
