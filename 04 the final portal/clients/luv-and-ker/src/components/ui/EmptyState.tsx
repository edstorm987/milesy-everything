import Link from "next/link";
import type { ReactNode } from "react";

export interface EmptyStateProps {
  heading: string;
  body?: ReactNode;
  icon?: ReactNode;
  cta?: { label: string; href?: string; onClick?: () => void };
  secondaryCta?: { label: string; href: string };
  className?: string;
}

export function EmptyState({ heading, body, icon, cta, secondaryCta, className }: EmptyStateProps) {
  return (
    <div className={["flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-black/15 bg-white/60 px-6 py-10 text-center", className ?? ""].join(" ")}>
      {icon && <div className="text-3xl text-black/40" aria-hidden>{icon}</div>}
      <h3 className="text-base font-semibold text-black/80">{heading}</h3>
      {body && <p className="max-w-md text-sm text-black/60">{body}</p>}
      {(cta || secondaryCta) && (
        <div className="mt-1 flex flex-wrap items-center justify-center gap-2">
          {cta?.href ? (
            <Link href={cta.href} className="rounded-md bg-[var(--brand-primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90">
              {cta.label}
            </Link>
          ) : cta?.onClick ? (
            <button type="button" onClick={cta.onClick} className="rounded-md bg-[var(--brand-primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90">
              {cta.label}
            </button>
          ) : null}
          {secondaryCta && (
            <Link href={secondaryCta.href} className="rounded-md border border-black/15 bg-white px-4 py-2 text-sm font-medium text-black/80 hover:bg-black/5">
              {secondaryCta.label}
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
