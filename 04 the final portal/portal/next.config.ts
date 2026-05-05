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

// R8 — milesymedia ↔ portal stitch. Static milesymedia files live at
// `04 the final portal/milesymedia website/` in the repo and get
// copied to `portal/public/_milesy/` by `scripts/prepare-milesy.mjs`
// (run as `predev` in dev + as part of `build-portal.mjs` on Vercel).
// These rewrites then expose the static files at root paths so the
// dev server matches the production Vercel surface 1:1 — visiting
// `localhost:3030/` shows the marketing landing, `/login.html` shows
// the static login mock, `/styles.css` resolves the relative reference,
// and Next.js handlers (`/login`, `/demo`, `/portal/*`, `/embed/*`,
// `/api/*`) keep their normal routes.
const MILESYMEDIA_REWRITES = [
  { source: "/",            destination: "/_milesy/index.html" },
  { source: "/index.html",  destination: "/_milesy/index.html" },
  { source: "/login.html",  destination: "/_milesy/login.html" },
  { source: "/admin.html",  destination: "/_milesy/admin.html" },
  { source: "/styles.css",  destination: "/_milesy/styles.css" },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Pin the Turbopack root so a parent-folder lockfile doesn't get
  // auto-detected. Workspace plugins (`@aqua/plugin-fulfillment`,
  // `@aqua/plugin-website-editor`) install through `npm install
  // --install-links` (configured in `.npmrc`) so they materialise as
  // real copies inside `node_modules` rather than symlinks — Turbopack
  // resolves those happily.
  turbopack: {
    root: import.meta.dirname,
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
    "@aqua/plugin-fulfillment",
    "@aqua/plugin-memberships",
    "@aqua/plugin-website-editor",
  ],
  async rewrites() {
    return {
      // `beforeFiles` fires before Next's filesystem static-file matching,
      // so `/` rewrites to /_milesy/index.html cleanly even when there's
      // no app/page.tsx for `/`. (This portal uses app/page.tsx today
      // for a placeholder landing — `beforeFiles` lets the milesymedia
      // marketing page win.)
      beforeFiles: MILESYMEDIA_REWRITES,
      afterFiles: [],
      fallback: [],
    };
  },
  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },
};

export default nextConfig;
