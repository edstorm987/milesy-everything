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
    "@aqua/plugin-fulfillment",
    "@aqua/plugin-memberships",
    "@aqua/plugin-website-editor",
  ],
  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },
};

export default nextConfig;
