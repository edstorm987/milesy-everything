"use client";

// GenerateModal — thin client over @aqua/plugin-ai-builder's
// `/api/portal/ai-builder/generate`. Operator types a one-line
// description; on success the returned BlockTree is handed back via
// `onInsert` so the editor can append it to the active page.
//
// Round-7 Goal C. Lives in website-editor (not ai-builder) because
// only the editor knows the active page's block array. The endpoint
// itself + prompt-building + Anthropic call live in ai-builder.

import { useEffect, useRef, useState } from "react";

interface BlockNode {
  id: string;
  type: string;
  props?: Record<string, unknown>;
  children?: BlockNode[];
}

interface GenerateResponse {
  ok: boolean;
  generation?: {
    id: string;
    status: string;
    blockTree?: BlockNode[] | null;
    validationError?: string;
    modelId?: string;
    costCents?: number;
  };
  error?: string;
}

export function GenerateModal({
  open, onClose, onInsert,
}: {
  open: boolean;
  onClose: () => void;
  onInsert: (tree: BlockNode[]) => Promise<void> | void;
}) {
  const [prompt, setPrompt] = useState("");
  const [phase, setPhase] = useState<"idle" | "running" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<BlockNode[] | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (open) {
      setPrompt(""); setPhase("idle"); setError(null); setPreview(null);
      const t = setTimeout(() => inputRef.current?.focus(), 30);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [open]);

  if (!open) return null;

  async function generate() {
    if (!prompt.trim()) return;
    setPhase("running"); setError(null); setPreview(null);
    try {
      const res = await fetch("/api/portal/ai-builder/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ prompt: prompt.trim() }),
      });
      const data = await res.json() as GenerateResponse;
      if (!res.ok || !data.ok || !data.generation) {
        setError(data.error ?? `Generation failed (${res.status}).`);
        setPhase("error"); return;
      }
      const gen = data.generation;
      if (gen.status !== "completed" || !gen.blockTree) {
        setError(gen.validationError ?? `Generation status: ${gen.status}.`);
        setPhase("error"); return;
      }
      setPreview(gen.blockTree);
      setPhase("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setPhase("error");
    }
  }

  async function insert() {
    if (!preview) return;
    await onInsert(preview);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-2xl bg-brand-black-soft border border-white/10 rounded-2xl p-6 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xl">✨</span>
          <h2 className="font-display text-xl text-brand-cream">Generate page section</h2>
          <div className="flex-1" />
          <button onClick={onClose} className="text-brand-cream/55 hover:text-brand-cream text-lg leading-none">×</button>
        </div>

        <p className="text-sm text-brand-cream/55 mb-3">
          Describe what you want — Claude turns it into blocks from your library.
        </p>

        <textarea
          ref={inputRef}
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          disabled={phase === "running"}
          placeholder="a hero with our brand colours, a 3-column feature grid, a CTA"
          rows={3}
          className="w-full bg-[#0a0e1a] border border-white/10 rounded-lg p-3 text-brand-cream text-sm focus:outline-none focus:border-cyan-400/40 disabled:opacity-50"
        />

        {error && (
          <div className="mt-3 text-xs text-red-300 border border-red-400/30 rounded-md p-2 bg-red-500/5">{error}</div>
        )}

        {preview && phase === "done" && (
          <div className="mt-3 rounded-lg border border-emerald-400/20 bg-emerald-500/5 p-3">
            <p className="text-[11px] uppercase tracking-[0.18em] text-emerald-300 mb-2">Preview</p>
            <ul className="text-xs text-brand-cream/75 space-y-0.5 max-h-40 overflow-auto font-mono">
              {flatten(preview).map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-5 flex items-center gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-md text-[12px] text-brand-cream/65 hover:text-brand-cream"
          >
            Cancel
          </button>
          {phase === "done" && preview ? (
            <button
              onClick={insert}
              className="px-4 py-1.5 rounded-md text-[12px] font-medium bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-400/30"
            >
              Insert {preview.length} block{preview.length === 1 ? "" : "s"}
            </button>
          ) : (
            <button
              onClick={generate}
              disabled={phase === "running" || !prompt.trim()}
              className="px-4 py-1.5 rounded-md text-[12px] font-medium bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 border border-cyan-400/30 disabled:opacity-40"
            >
              {phase === "running" ? "Generating…" : "Generate"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function flatten(nodes: BlockNode[], depth = 0): string[] {
  const out: string[] = [];
  for (const n of nodes) {
    out.push(`${"  ".repeat(depth)}• ${n.type}${n.id ? `  (${n.id})` : ""}`);
    if (n.children?.length) out.push(...flatten(n.children, depth + 1));
  }
  return out;
}
