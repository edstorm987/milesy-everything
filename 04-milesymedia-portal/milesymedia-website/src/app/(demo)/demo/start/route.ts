// GET /demo/start?as=<persona>[&embed=1][&source=…] — start a demo
// session as the chosen persona. The `/demo` page is the chooser
// surface; this route handles the actual seed + cookie-issuance.
//
// Personas (all hit seedDemoAgency, idempotent):
//   agency   → demo agency-owner (demo@aqua.dev)        → /portal/agency
//   client   → demo client-owner Felicia                → /portal/clients/<slug>
//   customer → demo end-customer (shopper)              → /portal/customer
//
// Defaults to agency for back-compat with old "Try the demo" links
// that just hit /demo without a persona.
//
// Architecture §8 — sandboxed agency, header toggle between POVs,
// nightly reset.

import { NextResponse, type NextRequest } from "next/server";
import { ensureHydrated } from "@/server/storage";
import { issueSession, sessionCookie } from "@/lib/server/auth";
import { logActivity } from "@/server/activity";
import { seedDemoAgency } from "@/lib/server/demoSeed";
import type { ServerUser } from "@/server/types";

type Persona = "agency" | "client" | "customer";

function pickPersona(raw: string | null): Persona {
  if (raw === "client" || raw === "customer") return raw;
  return "agency";
}

export async function GET(req: NextRequest) {
  await ensureHydrated();

  const seed = await seedDemoAgency("demo-entry");
  const persona = pickPersona(req.nextUrl.searchParams.get("as"));

  let user: ServerUser;
  let landing: string;
  if (persona === "client") {
    user = seed.clientUser;
    landing = `/portal/clients/${seed.client.slug}`;
  } else if (persona === "customer") {
    user = seed.customerUser;
    landing = "/portal/customer";
  } else {
    user = seed.ownerUser;
    landing = "/portal/agency";
  }

  const token = issueSession({
    userId: user.id,
    email: user.email,
    role: user.role,
    agencyId: user.agencyId,
    clientId: user.clientId,
    isDemo: true,
    sessionRev: user.sessionRev ?? 0,
  });
  const cookie = sessionCookie(token);

  const source = req.nextUrl.searchParams.get("source") ?? "direct";
  logActivity({
    agencyId: seed.agency.id,
    actorUserId: user.id,
    actorEmail: user.email,
    category: "auth",
    action: "demo.session.issued",
    message: `Demo session issued (POV: ${persona}, source: ${source}).`,
    metadata: { source, pov: persona, isDemo: true },
  });

  const embed = req.nextUrl.searchParams.get("embed") === "1";

  const target = req.nextUrl.clone();
  target.pathname = landing;
  target.search = embed ? "?embed=1" : "";
  const res = NextResponse.redirect(target);
  res.cookies.set(cookie.name, cookie.value, cookie.options);
  if (embed) {
    // Iframe-friendly cookie — portal layouts read this and skip
    // sidebar + topbar + demo banner. 1-hour TTL keeps the embedding
    // page in sync if the visitor follows internal links.
    res.cookies.set("lk_demo_embed", "1", {
      httpOnly: false,
      sameSite: "none",
      secure: true,
      path: "/",
      maxAge: 60 * 60,
    });
  } else {
    res.cookies.set("lk_demo_embed", "", { maxAge: 0, path: "/" });
  }
  return res;
}
