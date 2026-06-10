// T4 R007 — Niche page (agencies) ported to JSX (see for-skincare for
// pattern notes).

import fs from "node:fs";
import path from "node:path";
import { SiteShell } from "@/components/SiteShell";

const BODY = fs.readFileSync(
  path.join(process.cwd(), "src/app/_niches/for-agencies.html"),
  "utf8",
);

export const metadata = {
  title: "Aqua for Agencies — Milesy Media",
  description:
    "Aqua for agencies — multi-client architecture, plugin ecosystem, per-client portals. Run a portfolio without burning out.",
};

export default function ForAgenciesPage() {
  return (
    <SiteShell>
      <div dangerouslySetInnerHTML={{ __html: BODY }} />
    </SiteShell>
  );
}
