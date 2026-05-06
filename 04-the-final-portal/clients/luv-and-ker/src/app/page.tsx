import { Header } from "@/components/chrome/Header";
import { Footer } from "@/components/chrome/Footer";
import { Hero } from "@/components/storefront/Hero";
import { FeaturedProducts } from "@/components/storefront/FeaturedProducts";
import { BrandStory } from "@/components/storefront/BrandStory";
import { Newsletter } from "@/components/storefront/Newsletter";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { getPortalConfig } from "@/lib/portalConfig";

export default function StorefrontLanding() {
  const cfg = getPortalConfig();
  return (
    <>
      <Header />
      <main id="main-content">
        <ErrorBoundary label="storefront">
          <Hero />
          <FeaturedProducts />
          <BrandStory />
          <Newsletter
            headline={cfg.content["newsletter.headline"]}
            body={cfg.content["newsletter.body"]}
          />
        </ErrorBoundary>
      </main>
      <Footer />
    </>
  );
}
