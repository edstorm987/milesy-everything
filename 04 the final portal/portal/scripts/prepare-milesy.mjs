#!/usr/bin/env node
// Local-dev parity with Vercel build (R8): copy `04 the final portal/
// milesymedia website/*` → `04 the final portal/portal/public/_milesy/`
// before `next dev` starts.
//
// In production the repo-root `scripts/build-portal.mjs` does this as
// part of `vercel-build`. In dev we want the same files visible to
// Next.js so the rewrites in `next.config.ts` (`/` → `/_milesy/index.html`,
// etc.) land on real assets — same surface as Vercel.
//
// Idempotent: deletes + re-copies on every invocation. Cheap enough
// that wiring it as `predev` doesn't slow the dev loop.
//
// CLI:
//   node scripts/prepare-milesy.mjs           # copy + log
//   node scripts/prepare-milesy.mjs --quiet   # log only on error
//   node scripts/prepare-milesy.mjs --once    # skip if dest already populated

import { cpSync, mkdirSync, existsSync, readdirSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));            // portal/scripts
const PORTAL_DIR = resolve(HERE, "..");                          // portal/
const MILESY_SRC = resolve(PORTAL_DIR, "..", "milesymedia website");
const MILESY_DEST = resolve(PORTAL_DIR, "public", "_milesy");

const args = new Set(process.argv.slice(2));
const QUIET = args.has("--quiet");
const ONCE = args.has("--once");

function log(...a) { if (!QUIET) console.log("[prepare-milesy]", ...a); }

if (!existsSync(MILESY_SRC)) {
  console.error(`[prepare-milesy] milesymedia source not found at ${MILESY_SRC}`);
  process.exit(1);
}

if (ONCE && existsSync(MILESY_DEST) && readdirSync(MILESY_DEST).length > 0) {
  log("dest already populated, skipping (--once)");
  process.exit(0);
}

if (existsSync(MILESY_DEST)) rmSync(MILESY_DEST, { recursive: true, force: true });
mkdirSync(MILESY_DEST, { recursive: true });
cpSync(MILESY_SRC, MILESY_DEST, { recursive: true });

const fileCount = readdirSync(MILESY_DEST, { recursive: true }).length;
log(`copied ${fileCount} entries → ${MILESY_DEST}`);
