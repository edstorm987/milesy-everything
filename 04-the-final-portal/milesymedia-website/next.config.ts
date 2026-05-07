import type { NextConfig } from "next";

// Strict by default. We do NOT use `eslint.ignoreDuringBuilds` or
// `typescript.ignoreBuildErrors` — every build runs the full ESLint +
// TS gate. If a warning needs suppressing, fix the code or carve out a
// scoped override in eslint.config.mjs.

const SECURITY_HEADERS = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:",
      "style-src 'self' 'unsafe-inline' https:",
      "img-src 'self' data: blob: https:",
      "media-src 'self' blob: https:",
      "font-src 'self' data: https:",
      "connect-src 'self' https: wss:",
      // /embed/login must be iframe-able by client-owned domains.
      "frame-src 'self' https:",
      "frame-ancestors 'self' https:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
];

// T4 unify-1 — the portal Next.js project now lives inside the
// milesymedia website folder. The previous `_milesy` static-stitch
// rewrites are obsolete; marketing/HC/BOS/Incubator will be served
// from `public/` directly (Step 2) or rendered by `app/` routes
// after conversion.

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // T4 unify-2 — let static apps in `public/` (health-check, business-os,
  // incubator) be reached at `/health-check`, `/business-os`,
  // `/incubator` and serve their index.html. Next.js doesn't auto-resolve
  // directory paths to index.html in `public/`; rewrites do.
  async rewrites() {
    return {
      // T4 unify-4 — marketing surface used to live in public/_marketing/.
      // T4 R006 ported the home to JSX (`src/app/page.tsx`) and retired
      // the `/` rewrite. T4 R007 ported the 4 niche pages to JSX
      // (`src/app/for-*/page.tsx`) and retired their rewrites. The
      // mega-menu sync rule (chapter #123 gotcha #6) is fully retired —
      // SiteShell is the single source for nav + footer chrome.
      beforeFiles: [
        // /health-check + /incubator are now owned by app/ routes
        // (SiteShell wrap). Only /business-os keeps the rewrite —
        // it stays a standalone app per Ed's call (separate
        // application; just gets a "Back to website" pill).
        { source: "/business-os",     destination: "/business-os/index.html" },
        // T4 R009 (chapter #159) — Incubator becomes the BOS setup
        // flow. `/business-os/incubator` is the canonical path; the
        // existing static incubator app at `public/incubator/`
        // stays in place (avoids touching every internal asset
        // path) and is exposed under the BOS namespace via this
        // rewrite. `/incubator` keeps working — the React route at
        // src/app/incubator/page.tsx now redirects to the canonical
        // path so external links don't break.
        { source: "/business-os/incubator",            destination: "/incubator/index.html" },
        { source: "/business-os/incubator/:path*",     destination: "/incubator/:path*" },
        // T4 R005 — privacy + terms stubs (final-copy-pass).
        { source: "/privacy",         destination: "/_marketing/privacy.html" },
        { source: "/terms",           destination: "/_marketing/terms.html" },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
  // T4 R009 (chapter #159) — keep deep `/incubator/<asset>` URLs
  // reachable for external links, redirecting to canonical
  // `/business-os/incubator/<asset>`. The bare `/incubator` route
  // is owned by `src/app/incubator/page.tsx` which server-redirects
  // to `/business-os/incubator` (so the redirect appears in the
  // single SiteShell-wrap source of truth).
  async redirects() {
    return [
      { source: "/incubator/:path+", destination: "/business-os/incubator/:path+", permanent: false },
    ];
  },
  // T4 unify-1 — anchor Turbopack + output-file tracing one level up
  // (at `04-the-final-portal/`) so the sibling `../plugins/*` source
  // files are inside the traced workspace. Plugins install via
  // `--install-links` (configured in `.npmrc`) as real copies in
  // node_modules, but several Next.js source files import directly
  // from the plugin source paths and need filesystem reachability.
  outputFileTracingRoot: new URL("..", import.meta.url).pathname,
  turbopack: {
    root: new URL("..", import.meta.url).pathname,
  },
  // Local workspace plugin packages ship TypeScript source (no build
  // step). transpilePackages tells Next/Turbopack to compile them rather
  // than treat them as pre-built node_modules.
  transpilePackages: [
    "@aqua/plugin-affiliates",
    "@aqua/plugin-agency-finance",
    "@aqua/plugin-agency-hr",
    "@aqua/plugin-agency-marketing",
    "@aqua/plugin-client-crm",
    "@aqua/plugin-ecommerce",
    "@aqua/plugin-email-sender",
    "@aqua/plugin-fulfillment",
    "@aqua/plugin-leads-pipeline",
    "@aqua/plugin-memberships",
    "@aqua/plugin-public-funnel",
    "@aqua/plugin-website-editor",
  ],
  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },
};

export default nextConfig;
