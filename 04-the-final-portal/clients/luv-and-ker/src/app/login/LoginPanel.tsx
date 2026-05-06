"use client";

import { useState } from "react";

// Calls /api/auth/login (proxied to milesymedia.com/api/auth/login). On
// success the cookie is set on the milesymedia.com origin (or the
// proxy's cookie passthrough rewrites it to the per-client origin in
// dev). The browser navigates to /account afterward.

export function LoginPanel() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: "Sign-in failed" }));
        throw new Error(body?.error || "Sign-in failed");
      }
      window.location.href = "/account";
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign-in failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="rounded-[var(--brand-radius)] border border-black/10 bg-white p-6 shadow-sm">
      <label className="block text-xs font-medium uppercase tracking-wider text-[var(--brand-ink)]/70">
        Email
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="mt-1.5 block w-full rounded-[var(--brand-radius)] border border-black/15 bg-white px-3 py-2 text-sm text-[var(--brand-ink)] outline-none focus:border-[var(--brand-primary)]"
        />
      </label>
      <label className="mt-4 block text-xs font-medium uppercase tracking-wider text-[var(--brand-ink)]/70">
        Password
        <input
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="mt-1.5 block w-full rounded-[var(--brand-radius)] border border-black/15 bg-white px-3 py-2 text-sm text-[var(--brand-ink)] outline-none focus:border-[var(--brand-primary)]"
        />
      </label>
      {error && <p className="mt-3 text-xs text-red-600">{error}</p>}
      <button type="submit" disabled={busy} className="btn-primary mt-5 w-full text-sm">
        {busy ? "Signing in…" : "Sign in"}
      </button>
      <p className="mt-4 text-center text-xs text-[var(--brand-ink)]/60">
        New here?{" "}
        <a href="/api/auth/signup" className="text-[var(--brand-primary)] hover:underline">
          Create an account
        </a>
      </p>
    </form>
  );
}
