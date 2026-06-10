import Link from "next/link";
import { Header } from "@/components/chrome/Header";
import { Footer } from "@/components/chrome/Footer";

export const metadata = { title: "Cart" };

export default function CartPage() {
  return (
    <>
      <Header />
      <main id="main-content" className="mx-auto max-w-4xl px-6 py-16">
        <h1 className="font-[family-name:var(--brand-font-heading)] text-5xl font-semibold tracking-tight">
          Your cart
        </h1>
        <p className="mt-4 text-sm text-[var(--brand-ink)]/70">
          Cart contents render via the ecommerce plugin&apos;s cart block once it&apos;s wired
          to the per-client portal proxy. The shared portal owns the cart state.
        </p>
        <Link href="/checkout" className="btn-primary mt-8 inline-block">
          Proceed to checkout
        </Link>
      </main>
      <Footer />
    </>
  );
}
