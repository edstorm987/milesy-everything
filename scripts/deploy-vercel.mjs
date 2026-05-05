#!/usr/bin/env node
// Deploy orchestration for the multi-app Aqua portal monorepo.
//
// Usage:
//   node scripts/deploy-vercel.mjs --target=portal           [--prod]
//   node scripts/deploy-vercel.mjs --target=clients/<slug>   [--prod]
//
// Assumes the operator has run `vercel login` locally. This script
// only orchestrates the CLI calls; it does NOT manage credentials,
// env vars, or domain attachment. Custom-domain attach happens via
// the @aqua/plugin-domains runbook (chapter
// 04-deployment-domains-observability.md §"Custom domain runbook").
//
// On first deploy of a target, run with `vercel link` interactively
// once to bind the local folder to a Vercel project. Subsequent
// deploys reuse the link.

import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, "..");

function parseArgs(argv) {
  const out = { target: null, prod: false };
  for (const a of argv.slice(2)) {
    if (a.startsWith("--target=")) out.target = a.slice("--target=".length);
    else if (a === "--prod") out.prod = true;
    else if (a === "-h" || a === "--help") out.help = true;
  }
  return out;
}

function help() {
  console.log(`
deploy-vercel.mjs — deploy a portal target to Vercel.

  --target=portal              deploy the shared Aqua portal (the agency
                                 + pre-Live client surface + editor).
  --target=clients/<slug>      deploy a per-Live-client custom portal.
  --prod                       promote to production (default: preview).
  --help                       show this message.

Per the architecture extension, EACH target above is a separate Vercel
project. The shared portal's vercel.json lives at the repo root; the
per-client portals each carry their own vercel.json under
clients/<slug>/.
`);
}

function resolveTargetDir(target) {
  if (target === "portal") {
    return resolve(REPO_ROOT, "04 the final portal", "portal");
  }
  if (target.startsWith("clients/")) {
    const slug = target.slice("clients/".length);
    if (!slug || slug.includes("..") || slug.includes("/")) {
      throw new Error(`invalid client slug: ${slug}`);
    }
    return resolve(REPO_ROOT, "04 the final portal", "clients", slug);
  }
  throw new Error(`unknown --target=${target}. Use 'portal' or 'clients/<slug>'.`);
}

function run(cmd, args, cwd) {
  console.log(`\n▶ ${cmd} ${args.join(" ")}\n  cwd: ${cwd}`);
  const r = spawnSync(cmd, args, { cwd, stdio: "inherit" });
  if (r.status !== 0) {
    console.error(`  ✗ exited ${r.status}`);
    process.exit(r.status ?? 1);
  }
}

const args = parseArgs(process.argv);
if (args.help || !args.target) {
  help();
  process.exit(args.help ? 0 : 1);
}

let cwd;
try {
  cwd = resolveTargetDir(args.target);
} catch (e) {
  console.error(`error: ${e instanceof Error ? e.message : e}`);
  process.exit(2);
}

if (!existsSync(cwd)) {
  console.error(`error: target directory not found: ${cwd}`);
  console.error(`(if this is a new client, generate it first via T2 R11's export-to-repo flow)`);
  process.exit(2);
}

const vercelArgs = ["--cwd", cwd];
if (args.prod) vercelArgs.push("--prod");

console.log(`Aqua portal deploy → ${args.target}`);
console.log(`  prod: ${args.prod}`);
console.log(`  cwd : ${cwd}`);

// First-deploy bootstrap reminder — `vercel link` must already exist
// in cwd/.vercel/project.json or the CLI will prompt interactively.
const linkPath = resolve(cwd, ".vercel", "project.json");
if (!existsSync(linkPath)) {
  console.log(`\n⚠ ${linkPath} missing — running 'vercel link' first.`);
  console.log(`  This is interactive; pick the right team + project (or create one).`);
  run("vercel", ["link", ...vercelArgs], cwd);
}

run("vercel", ["deploy", ...vercelArgs], cwd);
