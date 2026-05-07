// Foundation middleware. Two surfaces today:
//
//   1. T1 R16 — `/embed/[clientSlug]/[variant]` Content-Security-Policy.
//      Reads the resolved client's `getEmbedAllowList` (T3 R013) and
//      emits `Content-Security-Policy: frame-ancestors <list>`. Empty
//      list / unknown slug → `frame-ancestors 'none'` (default deny).
//
//   2. T1 R031 — BOS auth-gate. T2 R022 (chapter #137) ships the pure
//      decision engine; this round translates its outcomes into
//      Next.js responses. Pulls helpers via relative imports from
//      `plugins/bos-auth-gate/` — same pattern as `effectiveRole.ts`
//      reads `DEFAULT_ROLES` from `agency-hr`.
//
// Runs on the Node.js runtime so resolvers can read foundation state +
// plugin storage (file-backed in dev, Postgres-backed in production).

import { NextResponse, type NextRequest } from "next/server";
import { resolveEmbedAllowList, frameAncestorsValue } from "@/lib/server/embedAllowResolver";
import { getSessionFromRequest } from "@/lib/server/auth";
// Pure helpers — domain + services carry no `server-only` shim.
import {
  matchesBosPath,
  isBosAsset,
} from "../plugins/bos-auth-gate/src/lib/domain";
import { evaluate as evaluateBosGate } from "../plugins/bos-auth-gate/src/server/services";

export const config = {
  matcher: [
    "/embed/:slug/:variant",
    "/business-os/:path*",
    "/api/portal/business-os/:path*",
  ],
  runtime: "nodejs",
};

// BOS dev-banner cookie — T2 R022 contract. Plugin's BOS surface reads
// this on render and shows the "DEV MODE — BOS is open" banner.
const BOS_DEV_BANNER_COOKIE = "bos_dev_banner";

export async function middleware(req: NextRequest) {
  const url = new URL(req.url);
  const pathname = url.pathname;

  // BOS auth-gate — runs first so /business-os routes don't fall
  // through to the embed CSP arm.
  if (matchesBosPath(pathname)) {
    return await handleBosGate(req, pathname);
  }

  // Embed CSP — pre-existing R16 logic.
  return await handleEmbedCsp(url);
}

async function handleBosGate(req: NextRequest, pathname: string): Promise<NextResponse> {
  // Static asset short-circuit — never redirect mid-asset-load. The
  // engine returns "allow" for these too, but checking here avoids the
  // session decode for high-volume paths.
  if (isBosAsset(pathname)) return NextResponse.next();

  const session = await getSessionFromRequest(req);
  const decision = evaluateBosGate(
    {
      pathname,
      signedIn: session !== null,
      role: session?.role,
    },
    {
      loginPath: "/login",
      devBypass: process.env.NEXT_PUBLIC_DEV_BYPASS === "1",
    },
  );

  switch (decision.outcome) {
    case "allow":
      return NextResponse.next();
    case "redirect": {
      const target = new URL(decision.redirect ?? "/login", req.url);
      return NextResponse.redirect(target);
    }
    case "dev-bypass": {
      const res = NextResponse.next();
      // HttpOnly off so BOS-side JS can read the banner flag without
      // a server roundtrip. SameSite=Lax + Secure-in-prod close most
      // vectors; the cookie carries no secret, just a "show banner"
      // flag.
      res.cookies.set({
        name: BOS_DEV_BANNER_COOKIE,
        value: "1",
        path: "/",
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      });
      return res;
    }
    default: {
      // Type-system exhaustiveness — never hit unless plugin adds a
      // new outcome before middleware catches up.
      return NextResponse.next();
    }
  }
}

async function handleEmbedCsp(url: URL): Promise<NextResponse> {
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
  return res;
}
