// T4 R009 (chapter #159) — Incubator is now the setup phase of
// Business OS. The canonical path is `/business-os/incubator` and
// the static app continues to live at `public/incubator/` (exposed
// via a next.config rewrite). This route stays in place so any
// inbound links to `/incubator` redirect cleanly to the canonical
// BOS-namespaced URL — no SiteShell wrap, no iframe, just a 307.
//
// Prior shape (chapter #123 fix-6) iframed the static app inside
// SiteShell. That wrapper is retired now that the Incubator lives
// inside BOS — the static app already has its own header/footer
// and the BOS "back to website" pill replaces marketing chrome.

import { redirect } from "next/navigation";

export const metadata = {
  title: "The Opulence Incubator · Milesy Media",
};

export default function IncubatorPage() {
  redirect("/business-os/incubator");
}
