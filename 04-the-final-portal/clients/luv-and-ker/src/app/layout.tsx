import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Playfair_Display, Inter } from "next/font/google";
import { getPortalConfig } from "@/lib/portalConfig";
import { brandToStyleString } from "@/lib/brandKit";
import { SkipToContent } from "@/components/ui/SkipToContent";
import { validatePalette } from "@/lib/a11y/contrastValidator";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export function generateMetadata(): Metadata {
  const cfg = getPortalConfig();
  return {
    title: {
      default: `${cfg.client.name} · ${cfg.client.tagline}`,
      template: `%s · ${cfg.client.name}`,
    },
    description: cfg.content["site.description"] ?? "",
    icons: { icon: "/favicon.svg" },
  };
}

export default function RootLayout({ children }: { children: ReactNode }) {
  const cfg = getPortalConfig();
  const brandStyle = brandToStyleString(cfg.brand);

  if (process.env.NODE_ENV !== "production") {
    const result = validatePalette({
      primary: cfg.brand.primaryColor,
      secondary: cfg.brand.secondaryColor,
      accent: cfg.brand.accentColor,
      ink: "#1A1A1A",
      bg: cfg.brand.secondaryColor ?? "#FFF7ED",
      surface: "#FFFFFF",
    });
    if (!result.ok && typeof console !== "undefined") {
      const summary = result.warnings.map(w => `${w.pair}: ${w.ratio} (need ≥${w.required})`).join("; ");
      console.warn(`[Luv & Ker brand kit] WCAG AA contrast warnings: ${summary}`);
    }
  }

  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable}`}>
      <head>
        <style dangerouslySetInnerHTML={{ __html: brandStyle }} />
      </head>
      <body className="min-h-screen">
        <SkipToContent />
        {children}
      </body>
    </html>
  );
}
