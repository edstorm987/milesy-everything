"use client";

// LivePreview — R8 Goal B. Side-by-side iframe panel that renders the
// active page's storefront output while the operator works in Block
// or Code mode. The iframe uses the same storefront URL the existing
// Live mode already uses (PortalPageRenderer, with previewMode=1 so
// analytics suppress + editor-only handles surface).
//
// postMessage channel:
//   iframe → host: { source: "live-preview", type: "select", blockId }
//                  { source: "live-preview", type: "ready" }
//   host → iframe: { source: "editor-host", type: "highlight", blockId }
//
// The block-selection sync is opt-in: parent passes onSelectBlock +
// `selectedBlockId` to receive / push selections. When the iframe's
// PortalPageRenderer doesn't respond, this still degrades to a plain
// preview pane so operators see the page.
//
// The prompt mentions a `/portal/clients/[clientId]/preview/[pageId]`
// route. We don't add that as a new file in R8 — the existing
// storefront URL with `?preview=1` covers the same surface (same-
// origin, cookies flow, sandbox attributes match Live mode). Q-ASSUMED:
// when foundation R9 ships a dedicated preview route we point `src` at
// it via a single resolver swap.

import { useEffect, useRef } from "react";

export interface LivePreviewProps {
  pageSlug: string;
  selectedBlockId?: string | null;
  onSelectBlock?: (blockId: string) => void;
  onReady?: () => void;
  onClose?: () => void;
  reloadKey?: number;
  height?: number | string;
}

export function LivePreview({
  pageSlug,
  selectedBlockId,
  onSelectBlock,
  onReady,
  onClose,
  reloadKey = 0,
  height = "calc(100vh - 200px)",
}: LivePreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const src = `${pageSlug}${pageSlug.includes("?") ? "&" : "?"}preview=1`;

  useEffect(() => {
    function onMessage(e: MessageEvent) {
      const data = e.data as { source?: string; type?: string; blockId?: string } | null;
      if (!data || data.source !== "live-preview") return;
      if (data.type === "ready") onReady?.();
      if (data.type === "select" && data.blockId && onSelectBlock) onSelectBlock(data.blockId);
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [onReady, onSelectBlock]);

  // Push the host-driven selection into the iframe so it can highlight.
  useEffect(() => {
    if (!selectedBlockId) return;
    iframeRef.current?.contentWindow?.postMessage(
      { source: "editor-host", type: "highlight", blockId: selectedBlockId },
      "*",
    );
  }, [selectedBlockId, reloadKey]);

  return (
    <div className="border-l border-white/5 bg-[#050505] flex flex-col" style={{ width: 380, minWidth: 320 }}>
      <div className="px-3 py-2 border-b border-white/5 flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-brand-cream/55">
        <span>Live preview</span>
        <div className="flex-1" />
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close live preview"
            className="text-brand-cream/55 hover:text-brand-cream text-base leading-none"
          >
            ×
          </button>
        )}
      </div>
      <iframe
        key={`live-preview-${reloadKey}`}
        ref={iframeRef}
        src={src}
        title={`Live preview — ${pageSlug}`}
        sandbox="allow-same-origin allow-scripts"
        style={{
          flex: 1,
          width: "100%",
          height,
          border: 0,
          background: "#0a0a0a",
          display: "block",
        }}
      />
    </div>
  );
}
