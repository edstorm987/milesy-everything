"use client";

// SettingsPage — per-install Anthropic API key + model preferences.
// Round-7.

import { useEffect, useState } from "react";

interface Settings {
  anthropicApiKey?: string;
  hasApiKey?: boolean;
  defaultModel?: string;
  fallbackModel?: string;
  cacheSystemPrompt?: boolean;
  maxTokens?: number;
}

export default function SettingsPage(_props: unknown) {
  const [settings, setSettings] = useState<Settings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/portal/ai-builder/settings", { cache: "no-store", credentials: "include" })
      .then(r => (r.ok ? r.json() as Promise<{ ok: boolean; settings?: Settings }> : Promise.resolve({ ok: false } as { ok: boolean; settings?: Settings })))
      .then(data => { if (!cancelled && data.ok && data.settings) setSettings(data.settings); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  function patch<K extends keyof Settings>(key: K, value: Settings[K]) {
    setSettings(s => ({ ...s, [key]: value }));
    setSaved(false);
  }

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/portal/ai-builder/settings", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        setSaved(true);
        // Re-fetch to pick up the masked API key.
        const next = await fetch("/api/portal/ai-builder/settings", { cache: "no-store", credentials: "include" });
        const data = await next.json() as { ok: boolean; settings?: Settings };
        if (data.ok && data.settings) setSettings(data.settings);
      }
    } finally { setSaving(false); }
  }

  if (loading) return <div className="p-6 text-brand-cream/45">Loading…</div>;

  return (
    <div className="p-6 sm:p-8 lg:p-10 max-w-3xl space-y-6">
      <header>
        <p className="text-[11px] tracking-[0.28em] uppercase text-brand-amber mb-2">AI</p>
        <h1 className="font-display text-3xl sm:text-4xl text-brand-cream">Settings</h1>
        <p className="text-brand-cream/45 text-sm mt-1">Per-install configuration. The API key never leaves the server.</p>
      </header>

      <section className="rounded-xl border border-white/8 bg-white/[0.02] p-4 space-y-3">
        <h2 className="text-sm font-semibold text-brand-cream">Anthropic API</h2>
        <label className="block">
          <span className="block text-[11px] uppercase tracking-[0.18em] text-brand-amber mb-1">API key</span>
          <input
            type="password"
            value={settings.anthropicApiKey ?? ""}
            onChange={e => patch("anthropicApiKey", e.target.value)}
            placeholder={settings.hasApiKey ? "•••••••••••• (replace to update)" : "sk-ant-..."}
            className="w-full bg-brand-black border border-white/10 rounded-lg px-3 py-2 text-sm text-brand-cream font-mono"
          />
          <span className="block text-[11px] text-brand-cream/45 mt-1">
            {settings.hasApiKey ? "A key is configured. Leave the masked value to keep it." : "No key set yet."}
          </span>
        </label>
      </section>

      <section className="rounded-xl border border-white/8 bg-white/[0.02] p-4 space-y-3">
        <h2 className="text-sm font-semibold text-brand-cream">Models</h2>
        <Field label="Default model">
          <select
            value={settings.defaultModel ?? "claude-haiku-4-5-20251001"}
            onChange={e => patch("defaultModel", e.target.value)}
            className="w-full bg-brand-black border border-white/10 rounded-lg px-3 py-2 text-sm text-brand-cream"
          >
            <option value="claude-haiku-4-5-20251001">Claude Haiku 4.5 (recommended)</option>
            <option value="claude-sonnet-4-6">Claude Sonnet 4.6</option>
            <option value="claude-opus-4-7">Claude Opus 4.7</option>
          </select>
        </Field>
        <Field label="Fallback model (used after schema-validation failure)">
          <select
            value={settings.fallbackModel ?? "claude-sonnet-4-6"}
            onChange={e => patch("fallbackModel", e.target.value)}
            className="w-full bg-brand-black border border-white/10 rounded-lg px-3 py-2 text-sm text-brand-cream"
          >
            <option value="claude-sonnet-4-6">Claude Sonnet 4.6</option>
            <option value="claude-opus-4-7">Claude Opus 4.7</option>
          </select>
        </Field>
        <Field label="Max output tokens per generation">
          <input
            type="number"
            value={settings.maxTokens ?? 4096}
            onChange={e => patch("maxTokens", Number(e.target.value))}
            className="w-full bg-brand-black border border-white/10 rounded-lg px-3 py-2 text-sm text-brand-cream"
          />
        </Field>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={settings.cacheSystemPrompt !== false}
            onChange={e => patch("cacheSystemPrompt", e.target.checked)}
          />
          Enable prompt caching (huge cost saver — keep on unless debugging)
        </label>
      </section>

      <div className="flex items-center gap-3">
        <button
          onClick={() => void save()}
          disabled={saving}
          className="text-sm px-5 py-2 rounded-lg bg-brand-orange hover:bg-brand-orange-light text-white font-semibold disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save settings"}
        </button>
        {saved && <span className="text-xs text-green-300">✓ Saved</span>}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[11px] uppercase tracking-[0.18em] text-brand-amber mb-1">{label}</span>
      {children}
    </label>
  );
}
