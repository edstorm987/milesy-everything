"use client";

import { useState } from "react";

interface Initial {
  name: string;
  description: string;
  ordering: number;
  customCss: string;
  customJs: string;
}

export function PhaseEditorForm({ phaseId, initial }: { phaseId: string; initial: Initial }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true); setErr(null); setSaved(false);
    const fd = new FormData(e.currentTarget);
    const body = {
      phaseId,
      name: String(fd.get("name") ?? "").trim(),
      description: String(fd.get("description") ?? ""),
      ordering: Number(fd.get("ordering") ?? 0),
      customCss: String(fd.get("customCss") ?? ""),
      customJs: String(fd.get("customJs") ?? ""),
    };
    const res = await fetch("/api/portal/phases/upsert", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    setBusy(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setErr(j.error ?? `${res.status}`);
      return;
    }
    setSaved(true);
  }

  return (
    <form onSubmit={onSubmit} className="flex max-w-2xl flex-col gap-4">
      <label className="flex flex-col text-xs font-medium text-black/70">
        Name
        <input name="name" defaultValue={initial.name} required className="mt-1 rounded border border-black/15 px-2 py-1 text-sm text-black/90" />
      </label>
      <label className="flex flex-col text-xs font-medium text-black/70">
        Description
        <textarea name="description" rows={2} defaultValue={initial.description} className="mt-1 rounded border border-black/15 px-2 py-1 text-sm text-black/90" />
      </label>
      <label className="flex flex-col text-xs font-medium text-black/70">
        Ordering
        <input name="ordering" type="number" defaultValue={initial.ordering} className="mt-1 w-32 rounded border border-black/15 px-2 py-1 text-sm text-black/90" />
      </label>

      <fieldset className="rounded-md border border-amber-300 bg-amber-50 p-3">
        <legend className="px-1 text-xs font-semibold text-amber-800">⚠️ Code injection</legend>
        <p className="text-[11px] text-amber-800">
          Pasted JS runs at customer scope when previewing this phase. There is NO sanitisation
          (v1). Only paste from sources you trust — treat this surface like deploying a brand-kit
          override.
        </p>
        <label className="mt-2 flex flex-col text-xs font-medium text-black/70">
          customCss
          <textarea name="customCss" rows={6} defaultValue={initial.customCss} className="mt-1 rounded border border-black/15 px-2 py-1 font-mono text-[12px] text-black/90" />
        </label>
        <label className="mt-2 flex flex-col text-xs font-medium text-black/70">
          customJs
          <textarea name="customJs" rows={6} defaultValue={initial.customJs} className="mt-1 rounded border border-black/15 px-2 py-1 font-mono text-[12px] text-black/90" />
        </label>
      </fieldset>

      {err && <p className="text-xs text-red-600">Error: {err}</p>}
      {saved && <p className="text-xs text-green-700">Saved.</p>}
      <div className="flex gap-2">
        <button disabled={busy} type="submit" className="rounded-md bg-black/85 px-3 py-1.5 text-xs font-medium text-white hover:bg-black disabled:opacity-50">
          {busy ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
