// People workspace dashboard — team count, roles, time off, recent
// HR activity. Stub data until agency-hr plugin lands.

import { ensureHydrated } from "@/server/storage";
import { requireRole } from "@/lib/server/auth";
import { AGENCY_ROLES } from "@/server/types";
import { listUsersForAgency } from "@/server/users";
import { redirect } from "next/navigation";
import { findWorkspace } from "@/lib/chrome/workspaces";
import { WorkspaceHeader, Stat, Section, Row } from "../_shared";

export default async function PeopleWorkspace() {
  await ensureHydrated();
  let session; try { session = await requireRole([...AGENCY_ROLES]); } catch { redirect("/portal"); }
  const ws = findWorkspace("people")!;
  const team = listUsersForAgency(session.agencyId);

  return (
    <div className="mx-auto max-w-6xl">
      <WorkspaceHeader label={ws.label} hint={ws.hint} color={ws.color} eyebrow="People · team & roles" />

      <section className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Team members"       value={String(team.length)} sub="Across all roles" accent={ws.color} />
        <Stat label="Open roles"         value="2"                   sub="VA · Designer"    accent={ws.color} />
        <Stat label="On leave today"     value="0"                   sub="Next: 3 in Oct"   accent={ws.color} />
        <Stat label="Avg tenure"         value="14 mo"               sub="Trend stable"     accent={ws.color} />
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Section title="Team">
          {team.length === 0 ? (
            <p className="text-sm text-black/55">No teammates seeded yet.</p>
          ) : (
            team.slice(0, 8).map(u => (
              <Row key={u.id} left={u.name || u.email} right={u.role.replace(/-/g, " ")} hint={u.email} />
            ))
          )}
        </Section>

        <Section title="Hiring pipeline">
          <Row left="Designer · Aqua brand work"  right="2 candidates" hint="Stage: interview" />
          <Row left="VA · client comms"            right="5 candidates" hint="Stage: screen" />
        </Section>
      </div>

      <Section title="Recent activity">
        <Row left="Sasha completed onboarding"    right="2d ago" />
        <Row left="Jules switched to part-time"   right="6d ago" />
        <Row left="Quarterly review · Q3"         right="12d ago" />
      </Section>
    </div>
  );
}
