// T4 R006 — Marketing home, JSX-rendered through SiteShell.
//
// Replaces the static `_marketing/index.html` + `/` rewrite with a
// real Next.js route. The mega-menu now lives in SiteShell only — the
// chapter #123 gotcha #6 sync rule retires for the home page (niche
// pages keep static-HTML for v1).
//
// Body content is loaded from `src/app/_home/home.html` at module
// load (server component, runs once per cold start) and injected via
// `dangerouslySetInnerHTML`. This is a deliberate Q-ASSUMED choice
// over hand-converting 340 lines of section markup to JSX components:
// it preserves R005's polished copy byte-for-byte, makes future copy
// edits a one-file diff, and avoids drift between the static and JSX
// surfaces during the rewrite cycle. Componentisation (per-section
// React components with typed props) is a follow-up round once we
// know which sections move next.
//
// The leading underscore on `_home/` keeps Next.js's app router from
// trying to route the directory.

import fs from "node:fs";
import path from "node:path";
import { SiteShell } from "@/components/SiteShell";

const HOME_BODY = fs.readFileSync(
  path.join(process.cwd(), "src/app/_home/home.html"),
  "utf8",
);

export const metadata = {
  title: "Milesy Media — A platform and a process",
  description:
    "We surface where your business is leaking customers with a free Health Check, then walk you through a four-phase Incubator that turns the diagnosis into a real, owned operating system.",
};

export default function Home() {
  return (
    <SiteShell>
      <div dangerouslySetInnerHTML={{ __html: HOME_BODY }} />
    </SiteShell>
  );
}
