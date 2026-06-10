// T4 R007 — Niche page (skincare) ported to JSX. Same fs.readFileSync
// + dangerouslySetInnerHTML pattern as R006 home rewrite. Body chunk
// at src/app/_niches/for-skincare.html. SiteShell provides nav +
// sticky bar + footer.

import fs from "node:fs";
import path from "node:path";
import { SiteShell } from "@/components/SiteShell";

const BODY = fs.readFileSync(
  path.join(process.cwd(), "src/app/_niches/for-skincare.html"),
  "utf8",
);

export const metadata = {
  title: "Aqua for Skincare brands — Milesy Media",
  description:
    "Aqua for skincare — ingredient storytelling, conversion-first product pages, repeat-purchase rituals, UGC + creator referrals. Built for brands that treat skin as a craft.",
};

export default function ForSkincarePage() {
  return (
    <SiteShell>
      <div dangerouslySetInnerHTML={{ __html: BODY }} />
    </SiteShell>
  );
}
