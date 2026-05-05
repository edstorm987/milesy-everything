import { Header } from "@/components/chrome/Header";
import { Footer } from "@/components/chrome/Footer";
import { Hero } from "@/components/storefront/Hero";
import { FeaturedProducts } from "@/components/storefront/FeaturedProducts";
import { BrandStory } from "@/components/storefront/BrandStory";
import { Newsletter } from "@/components/storefront/Newsletter";
import { getPortalConfig } from "@/lib/portalConfig";

export default function StorefrontLanding() {
  const cfg = getPortalConfig();
  return (
    <>
      <Header />
      <main>
        <Hero />
        <FeaturedProducts />
        <BrandStory />
        <Newsletter
          headline={cfg.content["newsletter.headline"]}
          body={cfg.content["newsletter.body"]}
        />
      </main>
      <Footer />
    </>
  );
}
