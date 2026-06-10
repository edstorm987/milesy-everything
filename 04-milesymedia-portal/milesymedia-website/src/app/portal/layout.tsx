// /portal/* root layout. Requires session; redirects to /login when
// missing. Per-scope chrome lives one layer down — agency in
// /portal/agency/layout.tsx, client in /portal/clients/[clientId]/layout.tsx,
// end-customer in /portal/customer/layout.tsx.
//
// When the session is a sandboxed demo (`isDemo: true`) we render the
// DemoBanner across every portal surface so the POV toggle is always
// reachable.

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import type { ReactNode } from "react";
import { ensureHydrated } from "@/server/storage";
import { getSession } from "@/lib/server/auth";
import { getDemoSnapshot } from "@/lib/server/demoSeed";
import { DemoBanner } from "@/components/chrome/DemoBanner";

export default async function PortalLayout({ children }: { children: ReactNode }) {
  await ensureHydrated();
  const session = await getSession();
  if (!session) redirect("/login?next=/portal");

  let demoSnapshot = null;
  if (session.isDemo) {
    demoSnapshot = getDemoSnapshot();
    // Defensive: if the demo tenant was wiped under our feet (reset
    // endpoint), don't render a half-broken banner — the inner layout
    // will detect the missing agency and redirect to /login.
    if (demoSnapshot && demoSnapshot.agency.id !== session.agencyId) {
      demoSnapshot = null;
    }
  }

  const pov: "agency" | "client" | "customer" =
    session.role === "client-owner" ? "client" :
    session.role === "end-customer" ? "customer" :
    "agency";

  // Iframe embed mode (T1 R13 Goal D): `/demo?embed=1` sets the
  // `lk_demo_embed` cookie; while it's present we suppress the demo
  // banner. Sidebar/Topbar suppression is read by the inner layouts —
  // they consult the same cookie.
  const cookieStore = await cookies();
  const embed = cookieStore.get("lk_demo_embed")?.value === "1";

  return (
    <>
      {demoSnapshot && !embed && (
        <DemoBanner
          pov={pov}
          agencyName={demoSnapshot.agency.name}
          clientName={demoSnapshot.client.name}
          customerEmail={demoSnapshot.customerUser.email}
        />
      )}
      {children}
    </>
  );
}
