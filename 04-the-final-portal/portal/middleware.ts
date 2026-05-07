// T1 R16 — `/embed/[clientSlug]/[variant]` Content-Security-Policy.
//
// Reads the resolved client's `getEmbedAllowList` (T3 R013) and emits
// `Content-Security-Policy: frame-ancestors <list>` so only allow-
// listed origins can iframe the embed surface. Empty list / unknown
// slug → `frame-ancestors 'none'` (default deny).
//
// Runs on the Node.js runtime so the resolver can read foundation
// state + plugin storage (file-backed in dev, Postgres-backed in
// production).

import { NextResponse, type NextRequest } from "next/server";
import { resolveEmbedAllowList, frameAncestorsValue } from "@/lib/server/embedAllowResolver";

export const config = {
  matcher: ["/embed/:slug/:variant"],
  runtime: "nodejs",
};

export async function middleware(req: NextRequest) {
  const url = new URL(req.url);
  // Defense-in-depth — only act on the structured `/embed/<slug>/<variant>`
  // shape; any extra segment skips this header so other embed routes
  // (e.g. `/embed/login`) keep their existing CSP.
  const parts = url.pathname.split("/").filter(Boolean);
  if (parts[0] !== "embed" || parts.length !== 3) return NextResponse.next();

  const slug = parts[1];
  let frameAncestors = "'none'";
  try {
    const allow = await resolveEmbedAllowList(slug);
    frameAncestors = frameAncestorsValue(allow.origins);
  } catch {
    // Fail closed — unknown error → 'none' so a misconfigured tenant
    // never accidentally exposes its embed surface.
    frameAncestors = "'none'";
  }
  const res = NextResponse.next();
  res.headers.set("content-security-policy", `frame-ancestors ${frameAncestors}`);
  // X-Frame-Options is a legacy guard some CDNs still enforce; only
  // emit it when the allow-list collapses to a single origin (the
  // header doesn't support multi-origin lists).
  return res;
}
