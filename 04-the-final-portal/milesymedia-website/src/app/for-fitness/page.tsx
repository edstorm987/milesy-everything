// T4 R007 — Niche page (fitness) ported to JSX (see for-skincare for
// pattern notes).

import fs from "node:fs";
import path from "node:path";
import { SiteShell } from "@/components/SiteShell";

const BODY = fs.readFileSync(
  path.join(process.cwd(), "src/app/_niches/for-fitness.html"),
  "utf8",
);

export const metadata = {
  title: "Aqua for Fitness studios & coaches — Milesy Media",
  description:
    "Aqua for fitness studios and coaches — programme architecture, trial conversion, retention rituals. From sessions to a practice.",
};

export default function ForFitnessPage() {
  return (
    <SiteShell>
      <div dangerouslySetInnerHTML={{ __html: BODY }} />
    </SiteShell>
  );
}
