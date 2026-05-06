"use client";

import { useState } from "react";

// Posts to /api/portal/forms/submit (the per-client portal proxy
// forwards to the shared portal's forms plugin). The shared portal's
// cross-plugin event router fans the submission into client-CRM as a
// new contact + into email-sender for the notification email.

interface FormState { name: string; email: string; topic: string; body: string }

const INITIAL: FormState = { name: "", email: "", topic: "general", body: "" };

export function ContactForm() {
  const [data, setData] = useState<FormState>(INITIAL);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/portal/forms/submit", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          formId: "contact",
          fields: data,
          source: "compasscoaching.com",
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: "Submission failed" }));
        throw new Error(body?.error || "Submission failed");
      }
      setDone(true);
      setData(INITIAL);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Submission failed");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-[var(--brand-radius)] border border-[var(--brand-primary)]/30 bg-white p-8 text-center shadow-sm">
        <h2 className="font-[family-name:var(--brand-font-heading)] text-2xl font-semibold tracking-tight text-[var(--brand-accent)]">
          Thanks — we&apos;ve got it.
        </h2>
        <p className="mt-2 text-sm text-[var(--brand-ink)]/70">
          A reply lands in your inbox within two business days.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="rounded-[var(--brand-radius)] border border-black/10 bg-white p-6 shadow-sm">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block text-xs font-medium uppercase tracking-wider text-[var(--brand-ink)]/70">
          Name
          <input
            type="text"
            required
            value={data.name}
            onChange={e => setData(d => ({ ...d, name: e.target.value }))}
            className="mt-1.5 block w-full rounded-[var(--brand-radius)] border border-black/15 bg-white px-3 py-2 text-sm text-[var(--brand-ink)] outline-none focus:border-[var(--brand-primary)]"
          />
        </label>
        <label className="block text-xs font-medium uppercase tracking-wider text-[var(--brand-ink)]/70">
          Email
          <input
            type="email"
            required
            value={data.email}
            onChange={e => setData(d => ({ ...d, email: e.target.value }))}
            className="mt-1.5 block w-full rounded-[var(--brand-radius)] border border-black/15 bg-white px-3 py-2 text-sm text-[var(--brand-ink)] outline-none focus:border-[var(--brand-primary)]"
          />
        </label>
      </div>
      <label className="mt-4 block text-xs font-medium uppercase tracking-wider text-[var(--brand-ink)]/70">
        Topic
        <select
          value={data.topic}
          onChange={e => setData(d => ({ ...d, topic: e.target.value }))}
          className="mt-1.5 block w-full rounded-[var(--brand-radius)] border border-black/15 bg-white px-3 py-2 text-sm text-[var(--brand-ink)] outline-none focus:border-[var(--brand-primary)]"
        >
          <option value="general">General question</option>
          <option value="captain">Captain tier application</option>
          <option value="speaking">Speaking / partnership</option>
          <option value="press">Press</option>
        </select>
      </label>
      <label className="mt-4 block text-xs font-medium uppercase tracking-wider text-[var(--brand-ink)]/70">
        What are you working on?
        <textarea
          required
          rows={5}
          value={data.body}
          onChange={e => setData(d => ({ ...d, body: e.target.value }))}
          className="mt-1.5 block w-full rounded-[var(--brand-radius)] border border-black/15 bg-white px-3 py-2 text-sm text-[var(--brand-ink)] outline-none focus:border-[var(--brand-primary)]"
        />
      </label>
      {error && <p className="mt-3 text-xs text-red-600">{error}</p>}
      <button type="submit" disabled={busy} className="btn-primary mt-5 w-full text-sm md:w-auto md:px-8">
        {busy ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
