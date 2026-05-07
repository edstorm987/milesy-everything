import "server-only";
// Typed accessors for known secrets (T1 R029 — chapter
// `04-env-secrets-policy.md`).
//
// Replaces scattered `process.env.X` reads with named functions so
// the auth + storage + tenancy modules import a typed surface
// instead of poking at process.env directly. Refactor is incremental
// — existing direct reads in founderSeed/storage continue to work;
// new code should prefer these accessors.

import { requireEnv, optionalEnv } from "./env";

// Required-in-prod. `requireEnv` throws in production when missing,
// returns `undefined` in dev so devs can boot without setting one.
// Callers that absolutely need a value (auth.ts session secret, after
// the first request lands) layer their own dev fallback on top.

export function sessionSecret(): string | undefined {
  return requireEnv("PORTAL_SESSION_SECRET");
}

export function databaseUrl(): string | undefined {
  return requireEnv("DATABASE_URL");
}

export function portalBaseUrl(): string | undefined {
  return requireEnv("NEXT_PUBLIC_PORTAL_BASE_URL");
}

export function portalSecurity(): "strict" | "relaxed" {
  const v = optionalEnv("NEXT_PUBLIC_PORTAL_SECURITY", "relaxed");
  return v === "strict" ? "strict" : "relaxed";
}

export function founderEmail(): string | undefined {
  return requireEnv("FOUNDER_EMAIL");
}

export function founderPassword(): string | undefined {
  return requireEnv("FOUNDER_PASSWORD");
}

export function founderAgencyName(): string {
  return optionalEnv("FOUNDER_AGENCY_NAME", "Milesy Media");
}

// Optional / tunables.

export function portalBackend(): "file" | "memory" | "kv" | "postgres" | undefined {
  const v = optionalEnv("PORTAL_BACKEND", "");
  if (v === "file" || v === "memory" || v === "kv" || v === "postgres") return v;
  return undefined;
}

export function devBypass(): boolean {
  return optionalEnv("NEXT_PUBLIC_DEV_BYPASS", "0") === "1";
}

export function sentryDsn(): string | undefined {
  const v = optionalEnv("SENTRY_DSN", "");
  return v.length > 0 ? v : undefined;
}
