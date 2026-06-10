// `/health-check` route. Serves the original static HC app (rich dark
// theme + branching skipIf engine + sticky search embeds + lever-calc
// + mental-note steps from chapter #123) inside SiteShell via iframe.
//
// History: chapter #123 fix-2 introduced the iframe pattern. T4 R008
// (chapter #152) rebuilt the quiz as a React component sharing
// marketing brand-kit tokens — but the React port lost the rich
// visual design Ed had built into the static app. Reverted to iframe
// 2026-05-07. The React components (`_HCQuiz.tsx` + `_HCResults.tsx`
// + `lib/healthCheck/defaultPack.ts`) stay in the tree as a parity
// reference for any future rewrite.
//
// Outer scroll cap (chapter #123 follow-up) keeps only the iframe
// scrolling — no stacked-scrollbar regression.

import { SiteShell } from "@/components/SiteShell";

export const metadata = {
  title: "Free digital Health Check · Milesy Media",
};

export default function HealthCheckPage() {
  return (
    <SiteShell>
      <main className="mm-hc-frame-shell">
        <iframe
          src="/health-check/index.html"
          title="Milesy Media Health Check"
          className="mm-hc-frame"
          loading="lazy"
        />
      </main>
    </SiteShell>
  );
}
