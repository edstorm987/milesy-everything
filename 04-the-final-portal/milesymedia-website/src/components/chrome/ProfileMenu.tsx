"use client";

// Topbar profile menu — replaces the old role-chip / email / sign-out
// trio with a single avatar pill that opens a popover. Menu carries:
//
//   · header — name + email + role
//   · "Edit profile"     → /portal/account
//   · "Preferences"      → /portal/account/preferences
//   · "Permissions"      → /portal/account/permissions  (read-only)
//   · "Sign out"         → POST /api/auth/logout
//
// Native <details>/<summary> for a11y + zero-JS-lib weight.

import Link from "next/link";
import type { Role } from "@/server/types";

const ROLE_LABEL: Record<Role, string> = {
  "agency-owner":   "Agency owner",
  "agency-manager": "Agency manager",
  "agency-staff":   "Agency staff",
  "client-owner":   "Client owner",
  "client-staff":   "Client staff",
  "freelancer":     "Freelancer",
  "end-customer":   "Customer",
  "lead":           "Lead",
};

interface Props {
  email: string;
  role: Role;
  name?: string;
  // R036: optional profile picture data URL (data:image/...;base64,...).
  // When present we render <img class="mm-profile-avatar-img">; falls back
  // to the initials chip when undefined.
  avatarUrl?: string;
}

function initials(seed: string): string {
  const trimmed = seed.trim();
  if (!trimmed) return "?";
  const parts = trimmed.split(/[\s@.]+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0]! + parts[1][0]!).toUpperCase();
  return parts[0]!.slice(0, 2).toUpperCase();
}

export function ProfileMenu({ email, role, name, avatarUrl }: Props) {
  const display = name?.trim() || email;
  return (
    <details className="mm-profile-menu">
      <summary aria-label={`Account for ${display}`}>
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            className="mm-profile-avatar-img"
            src={avatarUrl}
            alt=""
            aria-hidden="true"
            data-testid="mm-profile-avatar-img"
          />
        ) : (
          <span className="mm-profile-avatar" aria-hidden="true">{initials(display)}</span>
        )}
        <span className="mm-profile-display">{display}</span>
      </summary>
      <div className="mm-profile-pop" role="menu">
        <div className="mm-profile-pop-head">
          <div className="mm-profile-pop-name">{display}</div>
          <div className="mm-profile-pop-email">{email}</div>
          <div className="mm-profile-pop-role">{ROLE_LABEL[role] ?? role}</div>
        </div>
        <div className="mm-profile-pop-list">
          <Link role="menuitem" href="/portal/account" className="mm-profile-pop-item">
            <span aria-hidden="true">👤</span> Edit profile
          </Link>
          <Link role="menuitem" href="/portal/account/preferences" className="mm-profile-pop-item">
            <span aria-hidden="true">⚙️</span> Preferences
          </Link>
          <Link role="menuitem" href="/portal/account/permissions" className="mm-profile-pop-item">
            <span aria-hidden="true">🔐</span> Permissions
          </Link>
          <Link role="menuitem" href="/dev/pov" className="mm-profile-pop-item">
            <span aria-hidden="true">🔁</span> Switch user
          </Link>
        </div>
        <form action="/api/auth/logout" method="post" className="mm-profile-pop-out">
          <button type="submit" className="mm-profile-pop-item mm-profile-pop-signout">
            <span aria-hidden="true">↗</span> Sign out
          </button>
        </form>
      </div>
    </details>
  );
}
