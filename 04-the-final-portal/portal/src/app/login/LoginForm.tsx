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
  // R9: when true the page renders the "Continue with Google" button.
  // The login page server-fetches `isGoogleOAuthConfigured()` and
  // passes it down — env unset → button hidden.
  googleEnabled?: boolean;
  // R9: surfaces the magic-link button. Only meaningful when clientId
  // is set (magic-link is end-customer-scoped).
  magicLinkEnabled?: boolean;
}

type Mode = "signin" | "signup" | "magic";

export function LoginForm({
  embedded = false, clientId, allowSignup = false,
  googleEnabled = false, magicLinkEnabled = false,
}: Props) {
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
  const [magicSent, setMagicSent] = useState<{ devUrl?: string } | null>(null);

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
    setMagicSent(null);
    try {
      if (mode === "magic") {
        if (!clientId) throw new Error("Magic-link requires a client context.");
        const res = await fetch("/api/auth/magic/request", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email, clientId, returnUrl: success.startsWith("/") ? success : "/portal/customer" }),
        });
        const data = (await res.json()) as { ok: boolean; error?: string; sent?: boolean; devMagicUrl?: string };
        if (!res.ok || !data.ok) {
          setError(data.error ?? "Couldn't send magic link.");
          setBusy(false);
          return;
        }
        setMagicSent({ devUrl: data.devMagicUrl });
        setBusy(false);
        return;
      }
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

  const isMagic = mode === "magic";

  return (
    <form onSubmit={onSubmit} className="flex w-full max-w-sm flex-col gap-3">
      {googleEnabled && (
        <a
          href={`/api/auth/oauth/google/start?return=${encodeURIComponent(success)}`}
          className="flex items-center justify-center gap-2 rounded-md border border-black/15 bg-white px-4 py-2 text-sm font-medium text-black/80 hover:bg-black/[0.03]"
        >
          <span aria-hidden="true">🔐</span>
          Continue with Google
        </a>
      )}
      {googleEnabled && (
        <div className="my-1 flex items-center gap-2 text-[11px] uppercase tracking-wider text-black/35">
          <span className="h-px flex-1 bg-black/10" />
          <span>or</span>
          <span className="h-px flex-1 bg-black/10" />
        </div>
      )}
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
      {!isMagic && (
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
      )}
      {error && <p role="alert" className="text-xs text-red-600">{error}</p>}
      {magicSent && (
        <p role="status" className="rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
          Check your inbox — a magic sign-in link is on its way.
          {magicSent.devUrl && (
            <> <a className="underline" href={magicSent.devUrl}>Open it now</a> (dev only).</>
          )}
        </p>
      )}
      <button
        type="submit"
        disabled={busy}
        className="mt-2 rounded-md bg-[var(--brand-primary)] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {isMagic ? (busy ? "Sending…" : "Email me a magic link") : submitLabel}
      </button>
      {magicLinkEnabled && clientId && (
        <button
          type="button"
          onClick={() => { setMode(isMagic ? "signin" : "magic"); setError(null); setMagicSent(null); }}
          className="text-center text-xs text-black/55 underline underline-offset-2 hover:text-black/80"
        >
          {isMagic ? "Use a password instead" : "Email me a magic link instead"}
        </button>
      )}
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
