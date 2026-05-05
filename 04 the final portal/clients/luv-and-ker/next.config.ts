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
  // Workspace plugin packages ship TypeScript source — Next compiles
  // them rather than treating them as pre-built node_modules. Only the
  // plugins this client actually uses are listed; agency-side plugins
  // (fulfillment / agency-* / email-sender) are deliberately omitted.
  transpilePackages: [
    "@aqua/plugin-affiliates",
    "@aqua/plugin-client-crm",
    "@aqua/plugin-ecommerce",
    "@aqua/plugin-forms",
    "@aqua/plugin-memberships",
    "@aqua/plugin-website-editor",
  ],
  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },
};

export default nextConfig;
