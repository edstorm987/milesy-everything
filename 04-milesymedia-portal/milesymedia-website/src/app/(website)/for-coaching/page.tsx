// T4 R007 — Niche page (coaching) ported to JSX (see for-skincare for
// pattern notes).

import fs from "node:fs";
import path from "node:path";
import { SiteShell } from "@/components/SiteShell";

const BODY = fs.readFileSync(
  path.join(process.cwd(), "src/app/_niches/for-coaching.html"),
  "utf8",
);

export const metadata = {
  title: "Aqua for Coaches & consultants — Milesy Media",
  description:
    "Aqua for coaches and consultants — leverage without losing intimacy. Niche down, high-ticket sales call frame, retention rituals.",
};

export default function ForCoachingPage() {
  return (
    <SiteShell>
      <div dangerouslySetInnerHTML={{ __html: BODY }} />
    </SiteShell>
  );
}
