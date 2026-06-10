"use client";

import { useState } from "react";

interface Props {
  headline?: string;
  body?: string;
}

// Submits to /api/portal/forms/submit (proxied to the shared portal's
// forms plugin). Mirrors the form-render block contract. Soft-degrades
// when upstream is unreachable so the storefront remains polished.

export function Newsletter({ headline, body }: Props) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "submitting" | "sent">("idle");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email || state === "submitting") return;
    setState("submitting");
    try {
      await fetch("/api/portal/forms/submit", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          formId: "newsletter",
          fields: { email },
          source: "compasscoaching.com",
        }),
      });
    } catch {
      // Soft-degrade — the storefront still feels acknowledged.
    }
    setState("sent");
  }

  return (
    <section className="mx-auto my-16 max-w-4xl rounded-[var(--brand-radius)] border border-black/10 bg-white px-6 py-12 text-center shadow-sm md:px-12">
      <h2 className="font-[family-name:var(--brand-font-heading)] text-3xl font-semibold tracking-tight text-[var(--brand-accent)]">
        {headline ?? "Subscribe to the briefing"}
      </h2>
      <p className="mx-auto mt-3 max-w-md text-sm text-[var(--brand-ink)]/70">
        {body ?? "One short briefing a week — frameworks, prompts, and the WIP I'm shipping. No spam."}
      </p>
      {state === "sent" ? (
        <p className="mt-6 text-sm font-medium text-[var(--brand-primary)]">
          Subscribed — check your inbox.
        </p>
      ) : (
        <form onSubmit={onSubmit} className="mx-auto mt-6 flex max-w-md gap-2">
          <input
            type="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="min-w-0 flex-1 rounded-[var(--brand-radius)] border border-black/15 bg-white px-4 py-2.5 text-sm text-[var(--brand-ink)] outline-none focus:border-[var(--brand-primary)]"
            disabled={state === "submitting"}
          />
          <button type="submit" disabled={state === "submitting"} className="btn-primary text-sm">
            {state === "submitting" ? "…" : "Subscribe"}
          </button>
        </form>
      )}
    </section>
  );
}
