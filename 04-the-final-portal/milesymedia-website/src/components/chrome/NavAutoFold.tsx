"use client";
// Marks the body with a route-aware class so per-route chrome rules
// can fire (e.g. on /health-check we hide the chevrons + the HC CTA
// in the stickybar — they're redundant when you're already on it).

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function NavAutoFold() {
  const pathname = usePathname();
  useEffect(() => {
    if (!pathname) return;
    const onHc = pathname === "/health-check" || pathname.startsWith("/health-check/");
    document.body.classList.toggle("mm-on-health-check", onHc);
  }, [pathname]);
  return null;
}
