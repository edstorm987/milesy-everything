// GET /demo/toggle — cycle the demo session through three POVs.
//
// Cycle order: agency-owner → client-owner → end-customer → agency-owner.
// Each step re-issues `lk_session_v1` against the seeded demo user for
// that POV (with `isDemo: true` preserved) and redirects to the matching
// surface (`/portal/agency`, `/portal/clients/<id>`, `/portal/customer`).
//
// Anonymous or non-demo callers bounce to `/demo` (which re-seeds and
// issues a fresh agency-POV cookie). A demo session whose agencyId
// doesn't match the live demo tenant (the demo was reset under our
// feet) also bounces to `/demo`.

import { NextResponse, type NextRequest } from "next/server";
import { ensureHydrated } from "@/server/storage";
import { getSessionFromRequest, issueSession, sessionCookie } from "@/lib/server/auth";
import { logActivity } from "@/server/activity";
import { getDemoSnapshot } from "@/lib/server/demoSeed";

type DemoPov = "agency" | "client" | "customer";

function currentPov(role: string): DemoPov {
  if (role === "client-owner") return "client";
  if (role === "end-customer") return "customer";
  return "agency";
}

function nextPov(pov: DemoPov): DemoPov {
  if (pov === "agency") return "client";
  if (pov === "client") return "customer";
  return "agency";
}

export async function GET(req: NextRequest) {
  await ensureHydrated();

  const session = await getSessionFromRequest(req);
  const snapshot = getDemoSnapshot();

  if (!session || !session.isDemo || !snapshot) {
    const fresh = req.nextUrl.clone();
    fresh.pathname = "/demo";
    fresh.search = "?source=toggle";
    return NextResponse.redirect(fresh);
  }

  if (session.agencyId !== snapshot.agency.id) {
    const fresh = req.nextUrl.clone();
    fresh.pathname = "/demo";
    fresh.search = "?source=toggle-foreign";
    return NextResponse.redirect(fresh);
  }

  const fromPov = currentPov(session.role);
  const toPov = nextPov(fromPov);

  const nextUser =
    toPov === "agency"   ? snapshot.ownerUser :
    toPov === "client"   ? snapshot.clientUser :
                           snapshot.customerUser;
  const nextClientId = toPov === "agency" ? undefined : snapshot.client.id;
  const nextPath =
    toPov === "agency"   ? "/portal/agency" :
    toPov === "client"   ? `/portal/clients/${snapshot.client.id}` :
                           "/portal/customer";

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
    message: `Demo POV switched (${fromPov} → ${toPov}).`,
    metadata: { from: fromPov, to: toPov, isDemo: true },
  });

  const target = req.nextUrl.clone();
  target.pathname = nextPath;
  target.search = "";
  const res = NextResponse.redirect(target);
  res.cookies.set(cookie.name, cookie.value, cookie.options);
  return res;
}
