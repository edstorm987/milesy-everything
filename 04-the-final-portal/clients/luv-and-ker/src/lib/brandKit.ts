import "server-only";
import type { BrandKit } from "./portalConfig";

// Mirrors `portal/src/lib/chrome/brandKit.ts` (shared portal). The
// per-client portal injects these CSS variables at the document root so
// every block, chrome component, and storefront section reads
// `var(--brand-primary)` etc. without baking colours into source.

export interface BrandCssVars {
  vars: Record<string, string>;
  customCSS?: string;
}

export function brandToCss(brand: BrandKit): BrandCssVars {
  const vars: Record<string, string> = {
    "--brand-primary": brand.primaryColor,
    "--brand-secondary": brand.secondaryColor,
    "--brand-accent": brand.accentColor,
    "--brand-font-heading": brand.fontHeading,
    "--brand-font-body": brand.fontBody,
    "--brand-radius": brand.borderRadius,
  };
  if (brand.logoUrl) vars["--brand-logo"] = `url(${JSON.stringify(brand.logoUrl)})`;
  return { vars, customCSS: brand.customCSS || undefined };
}

export function brandToStyleString(brand: BrandKit): string {
  const { vars, customCSS } = brandToCss(brand);
  const decls = Object.entries(vars)
    .map(([k, v]) => `  ${k}: ${v};`)
    .join("\n");
  const root = `:root {\n${decls}\n}`;
  return customCSS ? `${root}\n${customCSS}` : root;
}
