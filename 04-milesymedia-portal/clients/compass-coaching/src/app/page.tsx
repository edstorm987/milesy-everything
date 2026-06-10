import { Header } from "@/components/chrome/Header";
import { Footer } from "@/components/chrome/Footer";
import { Hero } from "@/components/storefront/Hero";
import { PricingTiers } from "@/components/storefront/PricingTiers";
import { Newsletter } from "@/components/storefront/Newsletter";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";

export default function CoachingLanding() {
  return (
    <>
      <Header />
      <main id="main-content">
        <ErrorBoundary label="storefront">
          <Hero />
          <PricingTiers />
          <Newsletter />
        </ErrorBoundary>
      </main>
      <Footer />
    </>
  );
}
