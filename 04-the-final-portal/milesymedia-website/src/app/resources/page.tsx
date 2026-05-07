// T4 unify-fix — Resources hub, now powered by the unified search
// finder. Single input filters across tools / blogs / videos /
// FAQs in real time. Adding a new entry is one append in
// src/lib/resources/catalog.ts and it appears here automatically.

import { SiteShell } from "@/components/SiteShell";
import { ResourceFinder } from "@/components/ResourceFinder";

export const metadata = {
  title: "Resources · Milesy Media",
};

export default function ResourcesHub() {
  return (
    <SiteShell>
      <main className="mm-resources-shell">
        <header className="mm-resources-hero">
          <div className="container">
            <span className="eyebrow">Resources</span>
            <h1>Find every tool, playbook, video and FAQ.</h1>
            <p>
              One search box, four content types, all the tools we&apos;ve
              built (and are building) in one place. Type a topic, narrow
              by type, jump straight in.
            </p>
          </div>
        </header>

        <div className="container mm-finder-wrap">
          <ResourceFinder />
        </div>
      </main>
    </SiteShell>
  );
}
