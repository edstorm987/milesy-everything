"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface Props {
  embedded?: boolean;
  // When provided, the form posts to /api/auth/login with a `clientId`
  // body field so the auth lookup hits the end-customer pool first.
  // Also unlocks the "Create one" signup toggle (when allowSignup).
  clientId?: string;
  // When true, renders the "Don't have an account? Create one" toggle
  // and lets visitors POST /api/auth/end-customer/signup. Set by the
  // embed page after reading `client.endCustomers.signupsEnabled`.
  allowSignup?: boolean;
}

type Mode = "signin" | "signup";

export function LoginForm({ embedded = false, clientId, allowSignup = false }: Props) {
  const router = useRouter();
  const params = useSearchParams();
  // Default success destination. Embed surfaces respect `?return=<url>`
  // so the parent site can land the visitor wherever they came from.
  const nextParam = params.get("next");
  const returnParam = params.get("return");
  const success = embedded
    ? returnParam ?? `${typeof window !== "undefined" ? window.location.origin : ""}/portal/customer`
    : nextParam ?? "/portal";

  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function navigate(url: string) {
    if (embedded && typeof window !== "undefined" && window.parent !== window) {
      // Embedded: drive the *parent* frame so the visitor lands on the
      // embedding site, not inside the iframe.
      window.parent.location.href = url;
    } else if (typeof window !== "undefined" && /^https?:\/\//i.test(url)) {
      window.location.href = url;
    } else {
      router.replace(url);
      router.refresh();
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      let res: Response;
      if (mode === "signup") {
        if (!clientId) throw new Error("Sign-up requires an embedding client.");
        res = await fetch("/api/auth/end-customer/signup", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ clientId, email, password, name: name.trim() || undefined }),
        });
      } else {
        res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email, password, clientId }),
        });
      }
      const data = (await res.json()) as { ok: boolean; error?: string; returnUrl?: string };
      if (!res.ok || !data.ok) {
        setError(data.error ?? `${mode === "signup" ? "Sign-up" : "Sign-in"} failed.`);
        setBusy(false);
        return;
      }
      // Server may suggest a return URL via the client's
      // `endCustomers.postLoginReturnUrl` config; otherwise honour the
      // page-level success destination computed above.
      navigate(data.returnUrl ?? success);
    } catch {
      setError("Network error. Try again.");
      setBusy(false);
    }
  }

  const submitLabel = busy
    ? (mode === "signup" ? "Creating account…" : "Signing in…")
    : (mode === "signup" ? "Create account" : "Sign in");

  return (
    <form onSubmit={onSubmit} className="flex w-full max-w-sm flex-col gap-3">
      {mode === "signup" && (
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-black/70">Name <span className="text-black/40">(optional)</span></span>
          <input
            type="text"
            autoComplete="name"
            value={name}
            onChange={e => setName(e.target.value)}
            className="rounded-md border border-black/15 bg-white px-3 py-2 outline-none focus:border-[var(--brand-primary)]"
          />
        </label>
      )}
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-black/70">Email</span>
        <input
          type="email"
          autoComplete={mode === "signup" ? "email" : "email"}
          required
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="rounded-md border border-black/15 bg-white px-3 py-2 outline-none focus:border-[var(--brand-primary)]"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-black/70">Password</span>
        <input
          type="password"
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          required
          minLength={mode === "signup" ? 8 : undefined}
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="rounded-md border border-black/15 bg-white px-3 py-2 outline-none focus:border-[var(--brand-primary)]"
        />
      </label>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={busy}
        className="mt-2 rounded-md bg-[var(--brand-primary)] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {submitLabel}
      </button>
      {clientId && allowSignup && (
        <p className="mt-2 text-center text-xs text-black/60">
          {mode === "signin" ? (
            <>
              Don&apos;t have an account?{" "}
              <button
                type="button"
                onClick={() => { setMode("signup"); setError(null); }}
                className="underline underline-offset-2 hover:text-black/80"
              >
                Create one
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => { setMode("signin"); setError(null); }}
                className="underline underline-offset-2 hover:text-black/80"
              >
                Sign in
              </button>
            </>
          )}
        </p>
      )}
    </form>
  );
}
