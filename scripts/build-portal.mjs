#!/usr/bin/env node
// Shim — Vercel project settings still pin `node scripts/build-portal.mjs`
// as the build command (overriding the `vercel.json` `buildCommand`).
// Until Ed clears those overrides in the dashboard, this script just
// delegates to the post-unification flow: cd into milesymedia-website,
// `npm install`, `next build`. The legacy "Copy milesymedia static →
// _milesy/" step that used to live here is retired (chapter #122
// unified the host; chapter #163 rewrote the deploy runbook).
//
// To remove this shim entirely, in the Vercel dashboard: Project →
// Settings → Build & Development → toggle OFF the Override on "Build
// Command" + "Install Command" + "Output Directory". After that, the
// project falls back to the in-repo vercel.json which already has
// the right values.

import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const projectRoot = path.join(repoRoot, "04-milesymedia-portal", "milesymedia-website");

function step(label, fn) {
  process.stdout.write(`\n▶ ${label}\n`);
  try {
    fn();
    process.stdout.write(`  ✓ ${label}\n`);
  } catch (e) {
    process.stdout.write(`  ✗ ${label} — ${e instanceof Error ? e.message : e}\n`);
    process.exit(1);
  }
}

step("Sanity-check post-unification project root exists", () => {
  if (!existsSync(projectRoot)) {
    throw new Error(
      `milesymedia-website not found at ${projectRoot}. ` +
      `Repo layout may have drifted from chapter #122.`,
    );
  }
});

step(`npm install --legacy-peer-deps in ${projectRoot}`, () => {
  execSync("npm install --legacy-peer-deps --no-fund --no-audit", {
    cwd: projectRoot,
    stdio: "inherit",
  });
});

step(`next build in ${projectRoot}`, () => {
  execSync("npm run build", { cwd: projectRoot, stdio: "inherit" });
});

process.stdout.write("\n✓ build-portal.mjs (shim) — done.\n");
