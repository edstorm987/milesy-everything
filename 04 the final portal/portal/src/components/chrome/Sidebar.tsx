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

import Link from "next/link";
import type { NavPanel } from "@/lib/chrome/sidebarLayout";

interface Props {
  panels: NavPanel[];
  tenantLabel: string;
  currentPath: string;
  // When true, render in mobile slide-over mode (no `hidden md:flex`,
  // no border-right). Default false → desktop sticky sidebar.
  mobile?: boolean;
}

export function Sidebar({ panels, tenantLabel, currentPath, mobile = false }: Props) {
  return (
    <aside
      aria-label="Primary navigation"
      className={[
        "w-60 shrink-0 bg-white/60 p-4 text-sm",
        mobile ? "" : "hidden md:block border-r border-black/10",
      ].join(" ")}
    >
      <div className="mb-6">
        <div className="text-[11px] uppercase tracking-wide text-black/50">Tenant</div>
        <div className="text-base font-semibold text-black/90">{tenantLabel}</div>
      </div>

      <nav aria-label="Primary" className="flex flex-col gap-5">
        {panels.map(panel => {
          const headingId = `nav-panel-${panel.id}`;
          return (
            <section key={panel.id} aria-labelledby={headingId}>
              <h2 id={headingId} className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-black/50">
                {panel.label}
              </h2>
              <ul className="flex flex-col">
                {panel.items.map(item => {
                  const active = currentPath === item.href || currentPath.startsWith(item.href + "/");
                  return (
                    <li key={item.id}>
                      <Link
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        className={[
                          "flex items-center justify-between rounded-md px-2 py-1.5",
                          active ? "bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] font-medium" : "text-black/80 hover:bg-black/5",
                        ].join(" ")}
                      >
                        <span>{item.label}</span>
                        {item.badge !== undefined && (
                          <span
                            aria-label={`${item.badge}`}
                            className="rounded-full bg-black/10 px-1.5 py-0.5 text-[10px] text-black/70"
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
    </aside>
  );
}
