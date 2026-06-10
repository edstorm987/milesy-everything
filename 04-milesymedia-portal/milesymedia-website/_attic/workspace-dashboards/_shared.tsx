// Workspace dashboard primitives — header tile + stat card + section
// + list-row. Shared by every /portal/agency/workspaces/<id> page so
// the five dashboards look like one family, but each one renders its
// own metrics underneath.

import Link from "next/link";
import type { ReactNode } from "react";

export function WorkspaceHeader({ label, hint, color, eyebrow }: {
  label: string; hint: string; color: string; eyebrow?: string;
}) {
  return (
    <header className="mb-8 flex items-start gap-4">
      <span aria-hidden className="inline-flex h-14 w-14 items-center justify-center rounded-2xl text-xl font-semibold text-white shadow-sm" style={{ background: color }}>
        {label.charAt(0)}
      </span>
      <div className="min-w-0">
        <div className="text-[11px] font-semibold uppercase tracking-wider" style={{ color }}>
          {eyebrow ?? `${label} workspace`}
        </div>
        <h1 className="text-3xl font-semibold text-black/90">{label} dashboard</h1>
        <p className="mt-1 text-sm text-black/55">{hint}</p>
      </div>
      <div className="ml-auto">
        <Link href="/portal/agency" className="rounded-md border border-black/10 bg-white px-3 py-1.5 text-xs text-black/60 hover:border-black/20 hover:bg-black/[0.02]">← Aqua HQ</Link>
      </div>
    </header>
  );
}

export function Stat({ label, value, accent, sub }: { label: string; value: string; accent: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-black/10 bg-white/70 px-4 py-3 shadow-sm">
      <div className="text-[10px] font-medium uppercase tracking-wider text-black/45">{label}</div>
      <div className="mt-1 text-2xl font-semibold" style={{ color: accent }}>{value}</div>
      {sub && <div className="mt-0.5 text-[11px] text-black/45">{sub}</div>}
    </div>
  );
}

export function Section({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="mb-5 rounded-xl border border-black/10 bg-white/60 shadow-sm">
      <div className="flex items-center justify-between border-b border-black/10 px-5 py-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-black/55">{title}</h2>
        {action}
      </div>
      <div className="px-5 py-4">{children}</div>
    </section>
  );
}

export function Row({ left, right, hint }: { left: string; right?: string; hint?: string }) {
  return (
    <div className="flex items-center justify-between border-b border-black/5 py-2 last:border-b-0">
      <div className="min-w-0">
        <div className="truncate text-sm text-black/85">{left}</div>
        {hint && <div className="truncate text-[11px] text-black/45">{hint}</div>}
      </div>
      {right && <div className="ml-3 shrink-0 text-sm tabular-nums text-black/65">{right}</div>}
    </div>
  );
}
