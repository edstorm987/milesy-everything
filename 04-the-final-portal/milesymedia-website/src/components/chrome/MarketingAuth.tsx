"use client";
// Marketing-nav auth widget. Replaces the "Sign in" link with a
// profile circle + dropdown when the user is logged in. Synced via
// `/api/auth/me`. Matches the portal's ProfileMenu pattern so the
// experience feels continuous across surfaces.

import Link from "next/link";
import { useEffect, useState } from "react";

interface Me {
  id: string;
  email: string;
  name?: string;
  role: string;
  agencyId?: string;
  clientId?: string;
}

function initials(seed: string): string {
  const s = (seed || "").trim();
  if (!s) return "?";
  const parts = s.split(/[\s@.]+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0]! + parts[1][0]!).toUpperCase();
  return parts[0]!.slice(0, 2).toUpperCase();
}

export function MarketingAuth() {
  const [me, setMe] = useState<Me | null | undefined>(undefined); // undefined = loading
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me", { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (!cancelled) setMe(d?.ok ? d.user : null); })
      .catch(() => { if (!cancelled) setMe(null); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (!t.closest(".mm-auth")) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Loading state — render placeholder so layout doesn't shift on hydration.
  if (me === undefined) {
    return <span className="mm-auth mm-auth-loading" aria-hidden />;
  }

  // Signed-out state — original "Sign in" link.
  if (!me) {
    return (
      <Link href="/login" className="btn btn-ghost mm-auth-signin">Sign in</Link>
    );
  }

  // Signed-in — profile circle with dropdown.
  const display = me.name?.trim() || me.email;
  const isClient = !!(me.agencyId || me.clientId);
  return (
    <div className="mm-auth" data-open={open ? "true" : undefined}>
      <button
        type="button"
        className="mm-auth-circle"
        aria-label={`Account for ${display}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {initials(display)}
      </button>
      {open && (
        <div className="mm-auth-pop" role="menu">
          <div className="mm-auth-pop-head">
            <div className="mm-auth-pop-name">{display}</div>
            <div className="mm-auth-pop-email">{me.email}</div>
            <div className="mm-auth-pop-role">{me.role.replace(/-/g, " ")}</div>
          </div>
          <div className="mm-auth-pop-list">
            <Link role="menuitem" href="/portal/account" className="mm-auth-pop-item" onClick={() => setOpen(false)}>
              <span aria-hidden>👤</span> My profile
            </Link>
            <a role="menuitem" href="/business-os/app.html" className="mm-auth-pop-item" onClick={() => setOpen(false)}>
              <span aria-hidden>🧭</span> Business OS
            </a>
            {isClient ? (
              <Link role="menuitem" href="/portal" className="mm-auth-pop-item mm-auth-pop-portal" onClick={() => setOpen(false)}>
                <span aria-hidden>▣</span> Open my portal
              </Link>
            ) : (
              <Link role="menuitem" href="/signup" className="mm-auth-pop-item mm-auth-pop-portal" onClick={() => setOpen(false)}>
                <span aria-hidden>★</span> Become a client
              </Link>
            )}
          </div>
          <form action="/api/auth/logout" method="post" className="mm-auth-pop-out">
            <button type="submit" className="mm-auth-pop-item mm-auth-pop-signout">
              <span aria-hidden>↗</span> Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
