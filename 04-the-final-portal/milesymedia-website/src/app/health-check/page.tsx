// T4 R008 — Health Check is now a real React route sharing SiteShell
// + brand-kit tokens (was an iframe over `/health-check/index.html`,
// which caused the stacked-scrollbar + portal-tracking gaps flagged
// in chapter #123). The static app survives one cycle as a fallback
// at `/health-check/index.html` until parity is signed off.

import { SiteShell } from "@/components/SiteShell";
import { defaultPack } from "@/lib/healthCheck/defaultPack";
import { HCQuiz } from "./_HCQuiz";

export const metadata = {
  title: "Free digital Health Check · Milesy Media",
};

export default function HealthCheckPage() {
  return (
    <SiteShell>
      <link rel="stylesheet" href="/_marketing/health-check.css" />
      <main className="mm-hc-react">
        <HCQuiz pack={defaultPack} />
      </main>
    </SiteShell>
  );
}
