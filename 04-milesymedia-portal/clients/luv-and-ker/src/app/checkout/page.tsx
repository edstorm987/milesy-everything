import { Header } from "@/components/chrome/Header";
import { Footer } from "@/components/chrome/Footer";

export const metadata = { title: "Checkout" };

export default function CheckoutPage() {
  return (
    <>
      <Header />
      <main id="main-content" className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="font-[family-name:var(--brand-font-heading)] text-5xl font-semibold tracking-tight">
          Checkout
        </h1>
        <p className="mt-4 text-sm text-[var(--brand-ink)]/70">
          Stripe-hosted checkout opens via the ecommerce plugin&apos;s
          `checkout/start` endpoint. The browser is redirected to the
          Stripe-hosted page; on success Stripe redirects back to /order-success.
        </p>
        <form action="/api/portal/ecommerce/checkout/start" method="POST" className="mt-8">
          <button type="submit" className="btn-primary">
            Start checkout
          </button>
        </form>
      </main>
      <Footer />
    </>
  );
}
