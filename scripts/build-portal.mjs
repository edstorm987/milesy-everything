#!/usr/bin/env node
// Vercel build entrypoint for the unified milesymedia + portal deploy.
//
// Sequence:
//   1. Copy `04 the final portal/milesymedia website/*` →
//      `04 the final portal/portal/public/_milesy/`
//      so the static front-door files ship inside the Next.js bundle.
//   2. cd into `04 the final portal/portal/` and run `npm install`
//      (must happen here, NOT at repo root, so the file:.. workspace
//      plugin deps resolve against the right package-lock).
//   3. Run `npm run build` (next build) in the portal folder.
//
// The repo-root vercel.json wires `outputDirectory` to
// `04 the final portal/portal/.next` so Vercel picks up the build
// artefact from the subfolder.
//
// Same-origin stitching: the placed `_milesy/*` files are paired with
// rewrites in repo-root vercel.json (and T1 R8's next.config.ts) that
// map `/`, `/index.html`, `/login.html`, `/admin.html`, `/styles.css`
// → `/_milesy/<file>`. Cookies + auth share one origin per the
// architecture extension chapter.

import { spawnSync } from "node:child_process";
import { cpSync, mkdirSync, existsSync, rmSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, "..");
const PORTAL_DIR = resolve(REPO_ROOT, "04 the final portal", "portal");
const MILESY_DIR = resolve(REPO_ROOT, "04 the final portal", "milesymedia website");
const PUBLIC_MILESY = resolve(PORTAL_DIR, "public", "_milesy");

function step(label, fn) {
  const start = Date.now();
  console.log(`\n▶ ${label}`);
  try {
    fn();
    console.log(`  ✓ ${label} (${Date.now() - start}ms)`);
  } catch (e) {
    console.error(`  ✗ ${label} — ${e instanceof Error ? e.message : e}`);
    process.exit(1);
  }
}

function run(cmd, args, cwd) {
  const r = spawnSync(cmd, args, { cwd, stdio: "inherit", env: process.env });
  if (r.status !== 0) {
    throw new Error(`${cmd} ${args.join(" ")} exited ${r.status}`);
  }
}

step("Copy milesymedia static → portal/public/_milesy/", () => {
  if (!existsSync(MILESY_DIR)) {
    throw new Error(`milesymedia source not found at ${MILESY_DIR}`);
  }
  if (existsSync(PUBLIC_MILESY)) rmSync(PUBLIC_MILESY, { recursive: true, force: true });
  mkdirSync(PUBLIC_MILESY, { recursive: true });
  cpSync(MILESY_DIR, PUBLIC_MILESY, { recursive: true });
});

step("npm install in portal/", () => {
  run("npm", ["install", "--include=dev", "--no-audit", "--no-fund"], PORTAL_DIR);
});

step("next build in portal/", () => {
  run("npm", ["run", "build"], PORTAL_DIR);
});

console.log("\n✓ portal build complete — Vercel will serve from 04 the final portal/portal/.next");
