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
