import type { NextConfig } from "next";

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
      "connect-src 'self' https: wss: http://localhost:3030",
      "frame-src 'self' https: http://localhost:3030",
      "frame-ancestors 'self' https:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  turbopack: {
    root: import.meta.dirname,
  },
  // Slim plugin set vs Luv & Ker — no ecommerce, no affiliates.
  // Memberships still ships even though it `requires: ["ecommerce"]`
  // in agency-side install — at the per-client portal layer we just
  // import the manifest for block-catalogue purposes. Real recurring
  // billing flows for Compass go through the membership plugin's
  // free-tier plus its Stripe subscription mode (no shop UI).
  transpilePackages: [
    "@aqua/plugin-client-crm",
    "@aqua/plugin-forms",
    "@aqua/plugin-memberships",
    "@aqua/plugin-website-editor",
  ],
  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },
};

export default nextConfig;
