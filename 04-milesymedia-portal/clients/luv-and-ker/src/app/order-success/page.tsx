import Link from "next/link";
import { Header } from "@/components/chrome/Header";
import { Footer } from "@/components/chrome/Footer";

export const metadata = { title: "Order confirmed" };

export default function OrderSuccessPage() {
  return (
    <>
      <Header />
      <main id="main-content" className="mx-auto max-w-2xl px-6 py-24 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--brand-primary)]">
          Thank you
        </p>
        <h1 className="mt-3 font-[family-name:var(--brand-font-heading)] text-5xl font-semibold tracking-tight">
          Your order is on its way.
        </h1>
        <p className="mt-4 text-base text-[var(--brand-ink)]/75">
          A confirmation is on its way to your inbox. We&apos;ll send tracking the moment your
          package leaves the studio.
        </p>
        <div className="mt-10 flex justify-center gap-3">
          <Link href="/orders" className="btn-primary">
            View orders
          </Link>
          <Link href="/" className="btn-ghost">
            Back to shop
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
