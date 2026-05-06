// SkipToContent — keyboard shortcut to jump past the chrome to <main>.
// Mirrors the foundation portal's primitive (kept in-repo per
// per-client-portal-is-its-own-Next.js-app architecture). T2 R11's
// generator should drop this same file shape into every new client.

import Link from "next/link";

export function SkipToContent({ targetId = "main-content" }: { targetId?: string }) {
  return (
    <Link
      href={`#${targetId}`}
      className="sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:left-2 focus-visible:top-2 focus-visible:z-[100] focus-visible:rounded-md focus-visible:bg-[var(--brand-primary)] focus-visible:px-3 focus-visible:py-2 focus-visible:text-sm focus-visible:font-medium focus-visible:text-white"
    >
      Skip to content
    </Link>
  );
}
