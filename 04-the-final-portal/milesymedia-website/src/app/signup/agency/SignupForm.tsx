"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface Props {
  googleEnabled?: boolean;
}

export function SignupForm({ googleEnabled = false }: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const fromDemo = params.get("from") === "demo";

  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devVerifyUrl, setDevVerifyUrl] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ companyName, email, password }),
      });
      const json = (await res.json()) as {
        ok: boolean;
        error?: string;
        redirect?: string;
        devVerifyUrl?: string;
      };
      if (!res.ok || !json.ok) {
        setError(json.error ?? `Signup failed (${res.status}).`);
        setBusy(false);
        return;
      }
      if (json.devVerifyUrl) setDevVerifyUrl(json.devVerifyUrl);
      router.push(json.redirect ?? "/portal/agency");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} data-testid="signup-form" className="flex flex-col gap-4">
      {fromDemo && (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
          Convert your sandbox into a real agency. Your demo data won&rsquo;t carry over.
        </p>
      )}

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-black/70">Company name</span>
        <input
          type="text"
          required
          value={companyName}
          onChange={e => setCompanyName(e.target.value)}
          autoComplete="organization"
          className="rounded-md border border-black/15 bg-white px-3 py-2 text-sm shadow-sm focus:border-[color:var(--brand-primary,#0EA5A4)] focus:outline-none"
          data-testid="signup-company"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-black/70">Email</span>
        <input
          type="email"
          required
          value={email}
          onChange={e => setEmail(e.target.value)}
          autoComplete="email"
          className="rounded-md border border-black/15 bg-white px-3 py-2 text-sm shadow-sm focus:border-[color:var(--brand-primary,#0EA5A4)] focus:outline-none"
          data-testid="signup-email"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-black/70">Password (≥8 characters)</span>
        <input
          type="password"
          required
          minLength={8}
          value={password}
          onChange={e => setPassword(e.target.value)}
          autoComplete="new-password"
          className="rounded-md border border-black/15 bg-white px-3 py-2 text-sm shadow-sm focus:border-[color:var(--brand-primary,#0EA5A4)] focus:outline-none"
          data-testid="signup-password"
        />
      </label>

      {error && (
        <p data-testid="signup-error" className="rounded-md bg-rose-50 px-3 py-2 text-xs text-rose-800">
          {error}
        </p>
      )}

      {devVerifyUrl && (
        <p className="rounded-md bg-amber-50 px-3 py-2 text-[11px] text-amber-800">
          Dev mode — verify your email:{" "}
          <a className="underline" href={devVerifyUrl}>{devVerifyUrl}</a>
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="rounded-md bg-[color:var(--brand-primary,#0EA5A4)] px-4 py-2 text-sm font-medium text-white shadow-sm hover:opacity-90 disabled:opacity-50"
        data-testid="signup-submit"
      >
        {busy ? "Creating…" : "Create agency →"}
      </button>

      {googleEnabled && (
        <a
          href="/api/auth/oauth/google/start?next=/portal/agency"
          className="rounded-md border border-black/15 bg-white px-4 py-2 text-center text-sm font-medium text-black/80 shadow-sm hover:bg-black/5"
          data-testid="signup-google"
        >
          Continue with Google
        </a>
      )}

      <p className="text-center text-xs text-black/60">
        Already have an account?{" "}
        <a href="/login" className="text-[color:var(--brand-primary,#0EA5A4)] hover:underline">
          Sign in →
        </a>
      </p>
    </form>
  );
}
