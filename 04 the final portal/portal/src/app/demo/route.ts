// GET /demo — public demo entry point.
//
// Lifecycle:
//   1. Ensure the demo agency + Felicia mirror exist (idempotent seed).
//   2. Issue an `lk_session_v1` cookie for the demo agency-owner with
//      `isDemo: true` baked into the payload — that flag drives the
//      banner + POV toggle in the portal chrome.
//   3. Redirect to `/portal/agency`.
//
// Linked from the static marketing site's "Try the demo" CTA via
// `<meta name="aqua-portal-base">` (see `04 the final portal/milesymedia website/`).
//
// Architecture §8 — sandboxed agency, header toggle between agency POV
// and client POV, nightly reset.

import { NextResponse, type NextRequest } from "next/server";
import { ensureHydrated } from "@/server/storage";
import { issueSession, sessionCookie } from "@/lib/server/auth";
import { logActivity } from "@/server/activity";
import { seedDemoAgency } from "@/lib/server/demoSeed";

export async function GET(req: NextRequest) {
  await ensureHydrated();

  const seed = await seedDemoAgency("demo-entry");

  const token = issueSession({
    userId: seed.ownerUser.id,
    email: seed.ownerUser.email,
    role: seed.ownerUser.role,
    agencyId: seed.agency.id,
    isDemo: true,
  });
  const cookie = sessionCookie(token);

  const source = req.nextUrl.searchParams.get("source") ?? "direct";
  logActivity({
    agencyId: seed.agency.id,
    actorUserId: seed.ownerUser.id,
    actorEmail: seed.ownerUser.email,
    category: "auth",
    action: "demo.session.issued",
    message: `Demo session issued (POV: agency-owner, source: ${source}).`,
    metadata: { source, pov: "agency", isDemo: true },
  });

  const target = req.nextUrl.clone();
  target.pathname = "/portal/agency";
  target.search = "";
  const res = NextResponse.redirect(target);
  res.cookies.set(cookie.name, cookie.value, cookie.options);
  return res;
}
