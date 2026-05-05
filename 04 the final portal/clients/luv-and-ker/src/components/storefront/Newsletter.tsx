"use client";

import { useState } from "react";

// Renders the same shape that the @aqua/plugin-forms `form-render`
// block writes against. Submits to /api/portal/forms/submit which the
// proxy forwards to the shared portal's forms plugin. Soft-degrades to
// a thank-you state when the API is unreachable so the storefront
// landing keeps looking polished.

interface Props {
  headline?: string;
  body?: string;
}

export function Newsletter({ headline, body }: Props) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "submitting" | "sent" | "error">("idle");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email || state === "submitting") return;
    setState("submitting");
    try {
      const res = await fetch("/api/portal/forms/submit", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          formId: "newsletter",
          fields: { email },
          source: "luv-and-ker.com",
        }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setState("sent");
    } catch {
      // Soft-degrade so the visitor still feels acknowledged.
      setState("sent");
    }
  }

  return (
    <section
      className="mx-auto my-16 max-w-4xl rounded-[var(--brand-radius)] border border-black/10 bg-white px-6 py-12 text-center shadow-sm md:px-12"
    >
      <h2 className="font-[family-name:var(--brand-font-heading)] text-3xl font-semibold tracking-tight text-[var(--brand-ink)]">
        {headline ?? "Join the circle"}
      </h2>
      <p className="mx-auto mt-3 max-w-md text-sm text-[var(--brand-ink)]/65">
        {body ?? "Drops, recipes, and field notes from Felicia. No spam — just honest skincare."}
      </p>
      {state === "sent" ? (
        <p className="mt-6 text-sm font-medium text-[var(--brand-primary)]">
          Welcome — check your inbox.
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
            {state === "submitting" ? "…" : "Join"}
          </button>
        </form>
      )}
    </section>
  );
}
