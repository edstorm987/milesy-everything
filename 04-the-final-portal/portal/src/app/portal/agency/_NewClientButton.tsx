"use client";

// Inline modal for "New client" on the agency home. Calls the
// fulfillment plugin's POST /api/portal/fulfillment/clients endpoint
// (which creates the client + applies the chosen phase preset). On
// success, redirects to the new client's overview page.

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface PhasePreset {
  stage: string;
  label: string;
  pluginPreset: readonly string[];
}

interface FormState {
  name: string;
  slug: string;
  email: string;
  brandColor: string;
  logoUrl: string;
  stage: string;
}

const DEFAULT_STATE: FormState = {
  name: "",
  slug: "",
  email: "",
  brandColor: "#0EA5A4",
  logoUrl: "",
  stage: "discovery",
};

const FALLBACK_PRESETS: PhasePreset[] = [
  { stage: "discovery",   label: "Discovery",   pluginPreset: ["website-editor"] },
  { stage: "development", label: "Development", pluginPreset: ["website-editor", "ecommerce"] },
  { stage: "onboarding",  label: "Onboarding",  pluginPreset: ["website-editor", "ecommerce", "memberships"] },
  { stage: "live",        label: "Live",        pluginPreset: ["website-editor", "ecommerce", "memberships", "affiliates"] },
];

function slugify(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function NewClientButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<FormState>(DEFAULT_STATE);
  const [presets, setPresets] = useState<PhasePreset[]>(FALLBACK_PRESETS);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const slugTouched = useRef(false);

  useEffect(() => {
    if (!open) return;
    setState(DEFAULT_STATE);
    setError(null);
    slugTouched.current = false;
    fetch("/api/portal/fulfillment/presets")
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data && Array.isArray(data.presets) && data.presets.length > 0) {
          setPresets(data.presets);
        }
      })
      .catch(() => undefined);
  }, [open]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setState(s => {
      const next = { ...s, [key]: value };
      if (key === "name" && !slugTouched.current) next.slug = slugify(value as string);
      if (key === "slug") slugTouched.current = true;
      return next;
    });
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!state.name.trim()) {
      setError("Name is required.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/portal/fulfillment/clients", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: state.name.trim(),
          slug: state.slug.trim() || undefined,
          ownerEmail: state.email.trim() || undefined,
          stage: state.stage,
          brand: {
            primaryColor: state.brandColor,
            logoUrl: state.logoUrl.trim() || undefined,
          },
        }),
      });
      const data = await res.json() as { ok: boolean; error?: string; client?: { id: string }; clientId?: string };
      if (!data.ok) {
        setError(data.error ?? "Could not create client.");
        return;
      }
      const newId = data.client?.id ?? data.clientId;
      setOpen(false);
      router.push(newId ? `/portal/clients/${newId}` : "/portal/agency");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  const selectedPreset = presets.find(p => p.stage === state.stage);
  const isLive = state.stage === "live";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg bg-[var(--brand-primary)] px-4 py-2 text-sm font-medium text-white shadow hover:opacity-90"
      >
        <span aria-hidden="true">＋</span>
        New client
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="new-client-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <form
            onSubmit={submit}
            className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
          >
            <h3 id="new-client-title" className="text-lg font-semibold text-black/90">New client</h3>
            <p className="mt-1 text-xs text-black/60">A new tenant under your agency. The starting phase decides which plugins install automatically.</p>

            <div className="mt-4 flex flex-col gap-3 text-sm">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-black/70">Name</span>
                <input
                  value={state.name}
                  onChange={(e) => update("name", e.target.value)}
                  required autoFocus disabled={busy}
                  placeholder="e.g. Luv & Ker"
                  className="rounded-md border border-black/15 px-3 py-2"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-black/70">Slug</span>
                <input
                  value={state.slug}
                  onChange={(e) => update("slug", e.target.value)}
                  disabled={busy}
                  placeholder="auto from name"
                  className="rounded-md border border-black/15 px-3 py-2 font-mono text-xs"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-black/70">Owner email</span>
                <input
                  type="email"
                  value={state.email}
                  onChange={(e) => update("email", e.target.value)}
                  disabled={busy}
                  placeholder="optional"
                  className="rounded-md border border-black/15 px-3 py-2"
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-black/70">Brand colour</span>
                  <input
                    type="color"
                    value={state.brandColor}
                    onChange={(e) => update("brandColor", e.target.value)}
                    disabled={busy}
                    className="h-10 w-full rounded-md border border-black/15"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-black/70">Logo URL</span>
                  <input
                    type="url"
                    value={state.logoUrl}
                    onChange={(e) => update("logoUrl", e.target.value)}
                    disabled={busy}
                    placeholder="optional"
                    className="rounded-md border border-black/15 px-3 py-2 text-xs"
                  />
                </label>
              </div>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-black/70">Starting phase</span>
                <select
                  value={state.stage}
                  onChange={(e) => update("stage", e.target.value)}
                  disabled={busy}
                  className="rounded-md border border-black/15 px-3 py-2"
                >
                  {presets.map(p => (
                    <option key={p.stage} value={p.stage}>{p.label}</option>
                  ))}
                </select>
                {selectedPreset && !isLive && (
                  <small className="text-[11px] text-black/55">
                    {selectedPreset.pluginPreset.length > 0
                      ? <>Will install: {selectedPreset.pluginPreset.join(", ")}.</>
                      : <>No plugins auto-install for this phase.</>}
                  </small>
                )}
                {isLive && (
                  <small className="text-[11px] text-black/55">
                    Live skips presets — you’ll land in the custom-portal builder for this client.
                  </small>
                )}
              </label>

              {error && <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setOpen(false)} disabled={busy}
                className="rounded-md px-3 py-2 text-sm text-black/70 hover:bg-black/5">
                Cancel
              </button>
              <button type="submit" disabled={busy}
                className="rounded-md bg-[var(--brand-primary)] px-4 py-2 text-sm font-medium text-white shadow hover:opacity-90 disabled:opacity-60">
                {busy ? "Creating…" : "Create client"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
