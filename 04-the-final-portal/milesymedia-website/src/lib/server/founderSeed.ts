import "server-only";
// T4 unify-3 — founder seed.
//
// On first server boot (empty users store), provisions a default
// "Milesy Media" agency plus the agency-owner user Ed uses to log in.
// Idempotent: subsequent calls noop.
//
// Bypasses `validatePassword` (which rejects passwords < 8 chars) so
// the documented dev login `edwardhallam07@gmail.com / 123` works
// without a longer ceremony. This is a dev-mode convenience, not a
// production policy — change FOUNDER_PASSWORD before any public
// deploy.

import crypto from "node:crypto";
import { ensureHydrated, getState, mutate } from "@/server/storage";
import { bootstrapAgency } from "@/server/agencyBootstrap";
import { getAgencyBySlug } from "@/server/tenants";
import { hashPassword, getUser } from "@/server/users";
import type { ServerUser } from "@/server/types";

export const FOUNDER_AGENCY_SLUG = "milesymedia";
export const FOUNDER_AGENCY_NAME = "Milesy Media";
export const FOUNDER_EMAIL = "edwardhallam07@gmail.com";
export const FOUNDER_PASSWORD = "123";
export const FOUNDER_NAME = "Ed Hallam";

let seedPromise: Promise<void> | null = null;

export function seedFounder(): Promise<void> {
  if (!seedPromise) seedPromise = run();
  return seedPromise;
}

async function run(): Promise<void> {
  await ensureHydrated();

  // Idempotent: if the founder user already exists, we're done. We key
  // off this specific user (not "any user") so seeding still kicks in
  // when other seeds have run but the founder hasn't.
  if (getUser(FOUNDER_EMAIL)) return;

  // Provision (or reuse) the Milesy Media agency.
  let agency = getAgencyBySlug(FOUNDER_AGENCY_SLUG);
  if (!agency) {
    const result = await bootstrapAgency({
      name: FOUNDER_AGENCY_NAME,
      slug: FOUNDER_AGENCY_SLUG,
      ownerEmail: FOUNDER_EMAIL,
    });
    agency = result.agency;
  }

  // Inject the founder user directly via mutate so we can keep the
  // documented `123` password without satisfying `validatePassword`.
  const now = Date.now();
  const user: ServerUser = {
    id: `usr_${crypto.randomBytes(8).toString("hex")}`,
    email: FOUNDER_EMAIL.toLowerCase(),
    name: FOUNDER_NAME,
    passwordHash: hashPassword(FOUNDER_PASSWORD),
    role: "agency-owner",
    agencyId: agency.id,
    emailVerifiedAt: now,
    createdAt: now,
    updatedAt: now,
  };
  mutate(state => {
    state.users[user.email] = user;
  });
}

// Test helper — purely for `scripts/smoke-founder-seed.test.ts` to
// reset the module-level cache between invocations. Not for prod use.
export function _resetFounderSeedForTests(): void {
  seedPromise = null;
}
