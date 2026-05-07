"use client";

// R006 — Template Gallery modal. Shown from the editor's "+ New page"
// / "+ New site" CTAs. Lists builtin starters + per-agency operator-
// saved templates with search + tag filter; clicking a card surfaces
// a preview pane and a "Use this template" CTA that fires the
// caller's `onPick(id)` so the host page can run its own
// applyStarterVariant flow.
//
// Operator-saved templates ship a `kind: "saved"` flag so the UI
// shows a Delete affordance.

import { useEffect, useMemo, useState } from "react";

export interface TemplateCardData {
  id: string;
  label: string;
  description: string;
  tags: string[];
  coverUrl?: string;
  kind: "builtin" | "saved";
  blocks?: unknown[];
  savedAt?: string;
  savedBy?: string;
}

interface Props {
  onClose: () => void;
  onPick: (id: string, kind: "builtin" | "saved") => void;
  // Optional override for tests / SSR — defaults to the live API.
  fetchImpl?: typeof fetch;
}

export default function TemplateGallery({ onClose, onPick, fetchImpl }: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [templates, setTemplates] = useState<TemplateCardData[]>([]);
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const f = fetchImpl ?? fetch;
    f("/api/portal/website-editor/templates")
      .then(r => r.json() as Promise<{ ok: boolean; templates?: TemplateCardData[]; error?: string }>)
      .then(data => {
        if (!data.ok) { setError(data.error ?? "request failed"); return; }
        setTemplates(data.templates ?? []);
      })
      .catch(e => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false));
  }, [fetchImpl]);

  const tags = useMemo(() => {
    const set = new Set<string>();
    for (const t of templates) for (const tag of t.tags) set.add(tag);
    return [...set].sort();
  }, [templates]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return templates.filter(t => {
      if (activeTag && !t.tags.includes(activeTag)) return false;
      if (q && !`${t.label} ${t.description} ${t.tags.join(" ")}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [templates, query, activeTag]);

  const active = activeId ? filtered.find(t => t.id === activeId) ?? templates.find(t => t.id === activeId) : null;

  return (
    <div role="dialog" aria-label="Template gallery" className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-brand-black-soft border border-white/10 rounded-lg w-[1100px] max-w-[96vw] h-[80vh] flex flex-col">
        <header className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
          <div>
            <h2 className="text-[15px] text-brand-cream font-medium">Template marketplace</h2>
            <p className="text-[11px] text-brand-cream/55">Pick a starter — built-in or saved by your team.</p>
          </div>
          <button onClick={onClose} className="text-brand-cream/55 hover:text-brand-cream text-2xl leading-none" aria-label="Close gallery">×</button>
        </header>

        <div className="px-6 py-3 border-b border-white/5 flex items-center gap-3">
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search templates…"
            className="flex-1 bg-white/5 border border-white/10 rounded-md px-3 py-1.5 text-[12px] text-brand-cream placeholder:text-brand-cream/30 focus:outline-none focus:border-cyan-400/40"
          />
          <button
            onClick={() => setActiveTag(null)}
            className={`px-2 py-1 rounded text-[10px] border ${activeTag === null ? "bg-cyan-500/15 text-cyan-200 border-cyan-400/30" : "bg-white/5 text-brand-cream/65 border-white/10"}`}
          >All</button>
          {tags.map(t => (
            <button
              key={t}
              onClick={() => setActiveTag(t === activeTag ? null : t)}
              className={`px-2 py-1 rounded text-[10px] border ${activeTag === t ? "bg-cyan-500/15 text-cyan-200 border-cyan-400/30" : "bg-white/5 text-brand-cream/65 border-white/10 hover:text-brand-cream"}`}
            >{t}</button>
          ))}
        </div>

        <div className="flex-1 flex min-h-0">
          <div className="flex-1 overflow-y-auto p-6">
            {loading && <p className="text-[12px] text-brand-cream/55">Loading…</p>}
            {error && <p className="text-[12px] text-red-300">{error}</p>}
            {!loading && !error && filtered.length === 0 && (
              <p className="text-[12px] text-brand-cream/55">No templates match.</p>
            )}
            <div className="grid grid-cols-3 gap-4">
              {filtered.map(t => (
                <button
                  key={t.id}
                  onClick={() => setActiveId(t.id)}
                  onMouseEnter={() => setActiveId(t.id)}
                  className={`text-left rounded-md overflow-hidden border ${activeId === t.id ? "border-cyan-400/50 bg-cyan-500/5" : "border-white/10 bg-white/[0.02] hover:border-white/20"}`}
                >
                  <div className="aspect-video bg-black/40 flex items-center justify-center text-brand-cream/40 text-[11px]">
                    {t.coverUrl
                      /* eslint-disable-next-line @next/next/no-img-element */
                      ? <img src={t.coverUrl} alt="" className="w-full h-full object-cover" />
                      : <span>{t.label}</span>}
                  </div>
                  <div className="p-3">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="text-[12px] text-brand-cream font-medium truncate">{t.label}</p>
                      {t.kind === "saved" && <span className="text-[9px] text-cyan-300 uppercase tracking-wider">Saved</span>}
                    </div>
                    <p className="text-[10px] text-brand-cream/55 line-clamp-2">{t.description}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {t.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="text-[9px] text-brand-cream/55 bg-white/5 px-1.5 py-0.5 rounded">{tag}</span>
                      ))}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <aside className="w-[340px] border-l border-white/5 p-5 overflow-y-auto bg-black/20">
            {active ? (
              <div>
                <div className="aspect-video bg-black/40 rounded-md mb-3 flex items-center justify-center border border-white/10 text-brand-cream/40 text-[11px]">
                  {active.coverUrl
                    /* eslint-disable-next-line @next/next/no-img-element */
                    ? <img src={active.coverUrl} alt="" className="w-full h-full object-cover rounded-md" />
                    : <span>Preview</span>}
                </div>
                <h3 className="text-[14px] text-brand-cream font-medium mb-1">{active.label}</h3>
                <p className="text-[11px] text-brand-cream/65 mb-3">{active.description}</p>
                <div className="flex flex-wrap gap-1 mb-4">
                  {active.tags.map(tag => (
                    <span key={tag} className="text-[10px] text-brand-cream/65 bg-white/5 px-1.5 py-0.5 rounded">{tag}</span>
                  ))}
                </div>
                {active.kind === "saved" && active.savedBy && (
                  <p className="text-[10px] text-brand-cream/45 mb-3">Saved by {active.savedBy} · {active.savedAt?.slice(0, 10)}</p>
                )}
                <button
                  onClick={() => onPick(active.id, active.kind)}
                  className="w-full px-3 py-2 rounded-md text-[12px] bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-200 border border-cyan-400/20"
                >
                  Use this template
                </button>
              </div>
            ) : (
              <p className="text-[11px] text-brand-cream/45">Hover or click a card to preview.</p>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
