"use client";

// WorkspaceSwitcher — the "custom sidebar" entry-point. When NO
// workspace is active, renders 6 tiles at the top of the sidebar
// (Aqua HQ, Finance, Marketing, People, Ops, Growth). When ONE is
// active, renders a "← Back to main" row + the workspace label badge.
//
// Active workspace lives in localStorage and is mirrored to the
// <aside data-workspace="<id>"> attribute. CSS rules in globals.css
// hide non-matching panels and recolor `--brand-primary`. The
// hydration script ensures the attribute is set BEFORE paint so
// there's no flash of the wrong sidebar.

import { useEffect, useState } from "react";
import { WORKSPACES, WORKSPACE_STORAGE_KEY, findWorkspace } from "@/lib/chrome/workspaces";

function applyWorkspaceToDom(id: string | null) {
  const aside = document.querySelector<HTMLElement>('aside[aria-label="Primary navigation"]');
  if (!aside) return;
  if (id) aside.setAttribute("data-workspace", id);
  else aside.removeAttribute("data-workspace");
  const ws = findWorkspace(id);
  if (ws) document.documentElement.style.setProperty("--brand-primary", ws.color);
  else document.documentElement.style.removeProperty("--brand-primary");
}

export function WorkspaceSwitcher() {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = window.localStorage.getItem(WORKSPACE_STORAGE_KEY);
    } catch { /* ignore */ }
    const resolved = stored && findWorkspace(stored) ? stored : null;
    setActive(resolved);
    // Re-apply to the DOM in case React hydration wiped the attribute
    // that the head hydration script set before paint.
    applyWorkspaceToDom(resolved);
  }, []);

  function pick(id: string | null) {
    setActive(id);
    try {
      if (id) window.localStorage.setItem(WORKSPACE_STORAGE_KEY, id);
      else window.localStorage.removeItem(WORKSPACE_STORAGE_KEY);
    } catch { /* ignore */ }
    applyWorkspaceToDom(id);
    // Navigate to that workspace's dashboard (or back to agency root
    // when clearing). The sidebar restyle has already applied — this
    // just lands the viewport on the matching surface.
    const target = id ? findWorkspace(id)?.dashboardHref : "/portal/agency";
    if (target && typeof window !== "undefined") {
      window.location.href = target;
    }
  }

  const ws = findWorkspace(active);

  if (ws) {
    return (
      <div className="mb-2 flex items-center gap-2 rounded-lg border border-black/10 bg-white/70 px-2 py-1.5 shadow-sm">
        <button
          type="button"
          onClick={() => pick(null)}
          aria-label="Back to main sidebar"
          title="Back to main sidebar"
          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-black/55 hover:bg-black/5"
        >
          <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
          </svg>
        </button>
        <span aria-hidden className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white" style={{ background: ws.color }}>
          {ws.label.charAt(0)}
        </span>
        <span className="mm-sidebar-link-label min-w-0 flex-1 truncate text-[12px] font-semibold uppercase tracking-wider text-black/80" style={{ color: ws.color }}>
          {ws.label}
        </span>
      </div>
    );
  }

  return (
    <div className="mb-3 mm-sidebar-link-label">
      <div className="mb-1 px-1 text-[10px] font-semibold uppercase tracking-wider text-black/45">Workspaces</div>
      <ul className="flex flex-col">
        {WORKSPACES.map(w => (
          <li key={w.id}>
            <button
              type="button"
              onClick={() => pick(w.id)}
              title={w.hint}
              className="mm-sidebar-link flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-black/80 hover:bg-black/5"
            >
              <span aria-hidden className="mm-sidebar-link-icon inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white" style={{ background: w.color }}>
                {w.label.charAt(0)}
              </span>
              <span className="mm-sidebar-link-label flex-1 truncate">{w.label}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Synchronous head script — runs before paint to apply
// data-workspace + the brand-primary color override so the active
// workspace's sidebar/theme show immediately on reload.
export const WORKSPACE_HYDRATION_SCRIPT = `(function(){try{var v=localStorage.getItem(${JSON.stringify(WORKSPACE_STORAGE_KEY)});var palette=${JSON.stringify(Object.fromEntries(WORKSPACES.map(w => [w.id, w.color])))};function apply(){if(!v||!palette[v])return;var n=document.querySelector('aside[aria-label="Primary navigation"]');if(n)n.setAttribute('data-workspace',v);document.documentElement.style.setProperty('--brand-primary',palette[v]);}if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',apply);}else{apply();}}catch(e){}})();`;

export function WorkspaceHydrationScript() {
  return (
    <script
      data-workspace-hydration
      dangerouslySetInnerHTML={{ __html: WORKSPACE_HYDRATION_SCRIPT }}
    />
  );
}
