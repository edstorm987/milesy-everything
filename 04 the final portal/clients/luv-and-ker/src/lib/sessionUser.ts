import "server-only";
import { cookies } from "next/headers";
import { getAuthOrigin, getPortalConfig } from "./portalConfig";

export interface SessionUser {
  userId: string;
  email: string;
  name?: string;
  role: string;
  agencyId?: string;
  clientId?: string;
}

// Server-component helper: forwards the lk_session_v1 cookie to the
// shared portal's /api/auth/me and returns whatever the shared portal
// reports about the current member. Returns null when nobody is signed
// in or when the upstream is unreachable in dev.

export async function getSessionUser(): Promise<SessionUser | null> {
  const cfg = getPortalConfig();
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(cfg.auth.cookieName);
  if (!sessionCookie) return null;
  const origin = getAuthOrigin();
  try {
    const res = await fetch(`${origin}/api/auth/me`, {
      headers: {
        cookie: `${cfg.auth.cookieName}=${sessionCookie.value}`,
      },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { user?: SessionUser };
    return data.user ?? null;
  } catch {
    return null;
  }
}
