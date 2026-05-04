// GET /demo/toggle — flip the demo session between agency POV and client POV.
//
// Behaviour:
//   • Requires a session with `isDemo: true`. Anything else → /demo (which
//     re-seeds and grants a fresh demo session).
//   • If currently agency-owner → re-issue as the demo client-owner (Felicia
//     mirror) and redirect to `/portal/clients/<demoClientId>`.
//   • If currently client-owner → re-issue as the demo agency-owner and
//     redirect to `/portal/agency`.
//
// The cookie payload always carries `isDemo: true` so the banner + toggle
// keep showing across both POVs.

import { NextResponse, type NextRequest } from "next/server";
import { ensureHydrated } from "@/server/storage";
import { getSessionFromRequest, issueSession, sessionCookie } from "@/lib/server/auth";
import { logActivity } from "@/server/activity";
import { getDemoSnapshot } from "@/lib/server/demoSeed";

export async function GET(req: NextRequest) {
  await ensureHydrated();

  const session = await getSessionFromRequest(req);
  const snapshot = getDemoSnapshot();

  // Not a demo session, or demo tenant missing → bounce to /demo and
  // start fresh. /demo will seed (if needed) and issue a new cookie.
  if (!session || !session.isDemo || !snapshot) {
    const fresh = req.nextUrl.clone();
    fresh.pathname = "/demo";
    fresh.search = "?source=toggle";
    return NextResponse.redirect(fresh);
  }

  // Defense in depth: a demo session must belong to the demo agency.
  if (session.agencyId !== snapshot.agency.id) {
    const fresh = req.nextUrl.clone();
    fresh.pathname = "/demo";
    fresh.search = "?source=toggle-foreign";
    return NextResponse.redirect(fresh);
  }

  const currentlyAgency = session.role === "agency-owner";
  const nextUser = currentlyAgency ? snapshot.clientUser : snapshot.ownerUser;
  const nextClientId = currentlyAgency ? snapshot.client.id : undefined;
  const nextPath = currentlyAgency
    ? `/portal/clients/${snapshot.client.id}`
    : "/portal/agency";

  const token = issueSession({
    userId: nextUser.id,
    email: nextUser.email,
    role: nextUser.role,
    agencyId: snapshot.agency.id,
    clientId: nextClientId,
    isDemo: true,
  });
  const cookie = sessionCookie(token);

  logActivity({
    agencyId: snapshot.agency.id,
    clientId: nextClientId,
    actorUserId: nextUser.id,
    actorEmail: nextUser.email,
    category: "auth",
    action: "demo.pov.toggled",
    message: `Demo POV switched (${currentlyAgency ? "agency" : "client"} → ${currentlyAgency ? "client" : "agency"}).`,
    metadata: { from: currentlyAgency ? "agency" : "client", to: currentlyAgency ? "client" : "agency", isDemo: true },
  });

  const target = req.nextUrl.clone();
  target.pathname = nextPath;
  target.search = "";
  const res = NextResponse.redirect(target);
  res.cookies.set(cookie.name, cookie.value, cookie.options);
  return res;
}
