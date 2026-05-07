// Sidebar — server-rendered navigation. Reads NavPanel[] from
// buildSidebar(); each panel is a labelled section with NavItems.
//
// A11y: the wrapping <nav aria-label="Primary"> identifies this as the
// primary navigation landmark. Each <Link> on the active path gets
// `aria-current="page"` so screen readers announce "current page".
// Each panel renders as a <section aria-labelledby> for clean
// landmark navigation (NVDA/JAWS/VoiceOver list view).
//
// Mobile: the sidebar hides at `<md` breakpoints; <MobileNav> renders
// the same panels inside a slide-over drawer, controlled by a
// hamburger button in the Topbar.
//
// T1 R035 — Collapse toggle. Desktop sidebar carries
// `data-collapsed="true|false"` (set synchronously by the hydration
// script in <head>, then mutated by <SidebarCollapseToggle>). When
// collapsed: width shrinks to ~56px, panel headings + link labels
// hide, rows show first-letter avatar + native title= tooltip. Nav
// link clicks NEVER mutate the attribute — only the toggle button.
// Mobile slide-over (`mobile=true`) opts out of the collapsed mode.

import Link from "next/link";
import type { ReactNode } from "react";
import type { NavPanel } from "@/lib/chrome/sidebarLayout";
import { SidebarCollapseToggle } from "./SidebarCollapseToggle";

interface Props {
  panels: NavPanel[];
  tenantLabel: string;
  currentPath: string;
  // When true, render in mobile slide-over mode (no `hidden md:flex`,
  // no border-right). Default false → desktop sticky sidebar.
  mobile?: boolean;
  // Extra content rendered at the bottom of the sidebar (e.g. agency
  // shell's collapsible "Tools" ballpark capability list).
  extra?: ReactNode;
}

export function Sidebar({ panels, tenantLabel, currentPath, mobile = false, extra }: Props) {
  return (
    <aside
      aria-label="Primary navigation"
      data-collapsed="false"
      data-sidebar-mobile={mobile ? "true" : "false"}
      // Hydration script in <head> reads localStorage + flips
      // data-collapsed BEFORE React paints, so the rendered HTML
      // can legitimately differ from server. Suppress the warning
      // (chapter #153 R035 — `data-collapsed` change is the only
      // attribute that can drift; nested children stay consistent).
      suppressHydrationWarning
      className={[
        "shrink-0 bg-white/60 p-4 text-sm",
        // Width is driven by [data-collapsed] (see globals.css). Mobile
        // slide-over is always full-width.
        mobile ? "w-60" : "hidden md:block border-r border-black/10 mm-sidebar-collapsible",
      ].join(" ")}
    >
      {!mobile && <SidebarCollapseToggle />}

      <div className="mb-6 mm-sidebar-tenant">
        <div className="text-[11px] uppercase tracking-wide text-black/50">Tenant</div>
        <div className="text-base font-semibold text-black/90">{tenantLabel}</div>
      </div>

      <nav aria-label="Primary" className="flex flex-col gap-5">
        {panels.map(panel => {
          const headingId = `nav-panel-${panel.id}`;
          return (
            <section key={panel.id} aria-labelledby={headingId}>
              <h2
                id={headingId}
                className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-black/50 mm-sidebar-heading"
              >
                {panel.label}
              </h2>
              <ul className="flex flex-col">
                {panel.items.map(item => {
                  const active = currentPath === item.href || currentPath.startsWith(item.href + "/");
                  const initial = item.label.trim().charAt(0).toUpperCase() || "•";
                  return (
                    <li key={item.id}>
                      <Link
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        title={item.label}
                        data-sidebar-nav-link
                        className={[
                          "mm-sidebar-link flex items-center justify-between rounded-md px-2 py-1.5",
                          active ? "bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] font-medium" : "text-black/80 hover:bg-black/5",
                        ].join(" ")}
                      >
                        <span className="mm-sidebar-link-label">{item.label}</span>
                        <span aria-hidden="true" className="mm-sidebar-link-initial hidden">
                          {initial}
                        </span>
                        {item.badge !== undefined && (
                          <span
                            aria-label={`${item.badge}`}
                            className="mm-sidebar-link-badge rounded-full bg-black/10 px-1.5 py-0.5 text-[10px] text-black/70"
                          >
                            {String(item.badge)}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </nav>
      {extra && <div className="mt-6 mm-sidebar-extra">{extra}</div>}
    </aside>
  );
}
