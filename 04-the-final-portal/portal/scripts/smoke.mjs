#!/usr/bin/env node
// Round-6 portal smoke harness.
//
// Walks the post-R6 9-plugin demo:
//   1. /demo cold issues an isDemo agency-owner cookie.
//   2. POST /api/dev/seed-demo verifies the seeded scope (5 client +
//      3 explicit agency installs + fulfillment auto-installed = 9).
//   3. Sample one nav URL per installed plugin (client + agency).
//   4. Sample one API endpoint per installed plugin.
//   5. Hit /demo/toggle three times; verify three POVs land 200.
//
// Usage:
//   node scripts/smoke.mjs                  # default base http://localhost:3050
//   AQUA_BASE=https://… node scripts/smoke.mjs

import { writeFile, readFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { tmpdir } from "node:os";
import { join } from "node:path";

const BASE = process.env.AQUA_BASE || "http://localhost:3050";
const JAR = join(tmpdir(), `aqua-r6-smoke-${process.pid}.json`);

const failures = [];
let total = 0;

function record(label, ok, detail = "") {
  total += 1;
  const tag = ok ? "✓" : "✗";
  console.log(`  ${tag} ${label}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failures.push(label);
}

async function loadCookies() {
  try { return JSON.parse(await readFile(JAR, "utf8")); }
  catch { return {}; }
}
async function saveCookies(jar) {
  await mkdir(dirname(JAR), { recursive: true }).catch(() => {});
  await writeFile(JAR, JSON.stringify(jar));
}
function cookieHeader(jar) {
  return Object.entries(jar).map(([k, v]) => `${k}=${v}`).join("; ");
}
function captureSetCookie(res, jar) {
  const raw = res.headers.getSetCookie?.() ?? [];
  for (const c of raw) {
    const [pair] = c.split(";");
    const eq = pair.indexOf("=");
    if (eq <= 0) continue;
    jar[pair.slice(0, eq).trim()] = pair.slice(eq + 1).trim();
  }
}

async function go(method, path, opts = {}) {
  const jar = await loadCookies();
  const headers = { ...(opts.headers ?? {}) };
  const cookie = cookieHeader(jar);
  if (cookie) headers["cookie"] = cookie;
  if (opts.body && !headers["content-type"]) headers["content-type"] = "application/json";
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    redirect: "manual",
  });
  captureSetCookie(res, jar);
  await saveCookies(jar);
  return res;
}

async function main() {
  console.log(`R6 smoke against ${BASE}\n`);

  console.log("§ Demo entry");
  let res = await go("GET", "/demo?source=smoke");
  record("/demo cold → 307", res.status === 307, `status=${res.status}`);

  console.log("\n§ Seed inspection");
  res = await go("POST", "/api/dev/seed-demo");
  let seed;
  try { seed = await res.json(); } catch { seed = null; }
  record("seed-demo POST", seed?.ok === true);
  const installed = seed?.installedScope ?? [];
  const installedIds = new Set(installed.map(i => i.pluginId));
  const expected = [
    "fulfillment", "website-editor", "ecommerce", "memberships", "affiliates", "client-crm",
    "agency-hr", "agency-finance", "agency-marketing",
  ];
  for (const id of expected) {
    record(`install present: ${id}`, installedIds.has(id));
  }
  const clientId = seed?.client?.id;
  record("demo client id present", typeof clientId === "string" && clientId.length > 0);

  if (!clientId) {
    console.log("\n✗ Aborting — no demo client id.");
    process.exit(1);
  }

  console.log("\n§ Plugin nav URLs");
  const NAV = [
    ["agency", "/portal/agency"],
    ["fulfillment", "/portal/agency/fulfillment"],
    ["agency-hr", "/portal/agency/agency-hr/staff"],
    ["agency-finance", "/portal/agency/agency-finance/invoices"],
    ["agency-marketing", "/portal/agency/agency-marketing/campaigns"],
    ["client home", `/portal/clients/${clientId}`],
    ["website-editor", `/portal/clients/${clientId}/editor`],
    ["ecommerce", `/portal/clients/${clientId}/ecommerce/products`],
    ["memberships", `/portal/clients/${clientId}/memberships/plans`],
    ["affiliates", `/portal/clients/${clientId}/affiliates`],
    ["client-crm", `/portal/clients/${clientId}/client-crm/contacts`],
  ];
  for (const [label, path] of NAV) {
    const r = await go("GET", path);
    record(`${label} ${path}`, r.status === 200, `status=${r.status}`);
  }

  console.log("\n§ Plugin API surfaces");
  const APIS = [
    ["agency-hr", "/api/portal/agency-hr/staff"],
    ["agency-finance", "/api/portal/agency-finance/invoices"],
    ["agency-marketing", "/api/portal/agency-marketing/campaigns"],
    ["memberships", `/api/portal/memberships/plans?clientId=${clientId}`],
    ["affiliates", `/api/portal/affiliates/affiliates?clientId=${clientId}`],
    ["client-crm", `/api/portal/client-crm/contacts?clientId=${clientId}`],
  ];
  for (const [label, path] of APIS) {
    const r = await go("GET", path);
    record(`${label} ${path.split("?")[0]}`, r.status === 200, `status=${r.status}`);
  }

  console.log("\n§ POV cycle");
  res = await go("GET", "/demo/toggle"); // a → c
  record("toggle agency→client 307", res.status === 307);
  let r = await go("GET", `/portal/clients/${clientId}`);
  record("client surface 200", r.status === 200);
  res = await go("GET", "/demo/toggle"); // c → customer
  record("toggle client→customer 307", res.status === 307);
  r = await go("GET", "/portal/customer");
  record("customer surface 200", r.status === 200);
  res = await go("GET", "/demo/toggle"); // customer → a
  record("toggle customer→agency 307", res.status === 307);
  r = await go("GET", "/portal/agency");
  record("agency surface 200", r.status === 200);

  console.log("\n§ Agency shell");
  // Home renders 200 in populated state.
  r = await go("GET", "/portal/agency");
  record("agency home 200 (populated)", r.status === 200);
  const homeBody = await r.text();
  record("home shows 'Welcome back'", homeBody.includes("Welcome back"));
  record("home shows 'New client' CTA", homeBody.includes("New client"));

  // Per-client overview tab routing.
  const tabs = ["overview", "website", "portal", "kanban", "finance", "assets", "tools"];
  for (const t of tabs) {
    const path = t === "overview"
      ? `/portal/clients/${clientId}`
      : `/portal/clients/${clientId}?tab=${t}`;
    const tr = await go("GET", path);
    record(`overview tab=${t} 200`, tr.status === 200, `status=${tr.status}`);
  }

  // Add-client happy path via fulfillment marketplace API.
  const created = await go("POST", "/api/portal/fulfillment/clients", {
    body: JSON.stringify({
      name: `Smoke Client ${Date.now()}`,
      stage: "discovery",
      brand: { primaryColor: "#8b5cf6" },
    }),
  });
  record("add-client POST 200/201", created.status === 200 || created.status === 201, `status=${created.status}`);
  const createdJson = created.status < 300 ? await created.json().catch(() => null) : null;
  const newId = createdJson?.client?.id ?? createdJson?.clientId;
  record("add-client returned id", typeof newId === "string" && newId.length > 0);
  if (newId) {
    const overview = await go("GET", `/portal/clients/${newId}`);
    record("new client overview 200", overview.status === 200);
  }

  console.log(`\n${failures.length === 0 ? "✓" : "✗"} ${total - failures.length}/${total} checks passed`);
  if (failures.length > 0) {
    console.log("Failures:");
    for (const f of failures) console.log(`  - ${f}`);
    process.exit(1);
  }
}

main().catch(err => {
  console.error("smoke crashed:", err);
  process.exit(2);
});
