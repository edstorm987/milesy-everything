"use client";
// Top-level error boundary (T1 R030 — chapter `04-observability.md`).
//
// Catches render errors anywhere in the App Router tree. Reports to
// Sentry via `captureError` (lazy-loaded; safe when DSN unset) and
// renders a fallback UI with a reset action.

import { useEffect } from "react";

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: Props) {
  useEffect(() => {
    // Lazy-import so the client bundle doesn't pull observability into
    // every page. Safe: `captureError` no-ops when Sentry isn't loaded.
    void import("@/lib/server/observability").then(({ captureError }) => {
      captureError(error, { extra: { digest: error.digest, surface: "app/error.tsx" } });
    }).catch(() => { /* observability is best-effort */ });
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center gap-4 px-6 py-12 text-center">
      <h1 className="text-2xl font-semibold text-black/80">Something went wrong</h1>
      <p className="text-sm text-black/60">
        We&apos;ve logged the issue. You can try again or head back to the homepage.
      </p>
      {error.digest && (
        <p className="text-xs text-black/40">Reference: {error.digest}</p>
      )}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={reset}
          className="rounded-md bg-[var(--brand-primary,#06B6D4)] px-4 py-2 text-sm font-medium text-white"
        >
          Try again
        </button>
        <a
          href="/"
          className="rounded-md border border-black/10 bg-white px-4 py-2 text-sm font-medium text-black/70 hover:bg-black/5"
        >
          Back to homepage
        </a>
      </div>
    </main>
  );
}
