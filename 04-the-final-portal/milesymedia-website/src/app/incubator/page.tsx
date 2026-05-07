// T4 unify-fix — Incubator route wrapped in SiteShell, same iframe
// pattern as /health-check. Marketing chrome wraps the existing
// static Incubator app at public/incubator/index.html.
//
// Future round: rebuild as a real React surface that shares the
// brand-kit tokens directly, alongside Phase pages.

import { SiteShell } from "@/components/SiteShell";

export const metadata = {
  title: "The Opulence Incubator · Milesy Media",
};

export default function IncubatorPage() {
  return (
    <SiteShell>
      <main className="mm-hc-frame-shell">
        <iframe
          src="/incubator/index.html"
          title="Milesy Media Incubator"
          className="mm-hc-frame"
          loading="lazy"
        />
      </main>
    </SiteShell>
  );
}
