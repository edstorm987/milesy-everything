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

  console.log("\n§ Aqua reskin");
  // Phase preset list returns Aqua's six.
  const presetsRes = await go("GET", "/api/portal/fulfillment/presets");
  record("presets endpoint 200", presetsRes.status === 200);
  const presetsJson = presetsRes.status === 200 ? await presetsRes.json().catch(() => null) : null;
  const presets = presetsJson?.presets ?? [];
  const aquaIds = ["aqua-epic-intro", "aqua-blueprint", "aqua-diagnostics", "aqua-brand-builder", "aqua-traffic", "aqua-mastery"];
  for (const id of aquaIds) {
    record(`preset ${id} present`, presets.some(p => p.stage === id));
  }

  // Welcome copy includes the Aqua tagline.
  const homeRes = await go("GET", "/portal/agency");
  const homeBodyAqua = homeRes.status === 200 ? await homeRes.text() : "";
  record("home shows tagline 'Where Healing Meets Revolution'", homeBodyAqua.includes("Where Healing Meets Revolution"));
  record("home sidebar shows 'Aqua HQ'", homeBodyAqua.includes("Aqua HQ"));

  // Add-client with metadata fields persists.
  const aquaCreate = await go("POST", "/api/portal/fulfillment/clients", {
    body: JSON.stringify({
      name: "Smoke Therapist · Aqua Practice",
      stage: "aqua-blueprint",
      brand: { primaryColor: "#9333EA" },
      metadata: {
        therapistName: "Smoke Therapist",
        practiceName:  "Aqua Practice",
        planTier:      "expansion",
        whatsappLink:  "https://chat.whatsapp.com/aqua-smoke",
        stripeLink:    "https://buy.stripe.com/aqua-smoke",
        lockInPaid:    true,
      },
    }),
  });
  record("aqua add-client POST 200/201", aquaCreate.status === 200 || aquaCreate.status === 201, `status=${aquaCreate.status}`);
  const aquaCreateJson = aquaCreate.status < 300 ? await aquaCreate.json().catch(() => null) : null;
  const aquaId = aquaCreateJson?.client?.id ?? aquaCreateJson?.clientId;
  record("aqua client returned id", typeof aquaId === "string");
  if (aquaId) {
    const ovr = await go("GET", `/portal/clients/${aquaId}`);
    record("aqua client overview 200", ovr.status === 200);
    const ovrBody = ovr.status === 200 ? await ovr.text() : "";
    record("overview shows plan tier", ovrBody.includes("Expansion Plan"));
    record("overview shows WhatsApp action", ovrBody.includes("Open WhatsApp group"));
    record("overview shows Lock-in chip", ovrBody.includes("Lock-in paid"));
  }

  console.log("\n§ Effective role");
  // Smoke runs as agency-owner via /demo bootstrap → Founder POV.
  // Agency home renders for Founder; Tools + Finance tabs allowed.
  if (clientId) {
    const finance = await go("GET", `/portal/clients/${clientId}?tab=finance`);
    record("founder finance tab 200", finance.status === 200);
    const fbody = finance.status === 200 ? await finance.text() : "";
    record("founder sees finance content (no 403 panel)", !fbody.includes("Permission denied"));
    const tools = await go("GET", `/portal/clients/${clientId}?tab=tools`);
    const tbody = tools.status === 200 ? await tools.text() : "";
    record("founder sees tools content", !tbody.includes("Permission denied"));
  }

  console.log("\n§ Onboarding dashboard");
  // Aqua-stage client → overview shows the dashboard panel.
  const aquaClient = await go("POST", "/api/portal/fulfillment/clients", {
    body: JSON.stringify({
      name: `Smoke Onboarding ${Date.now()}`,
      stage: "aqua-blueprint",
      brand: { primaryColor: "#0ea5e9" },
    }),
  });
  const aquaClientJson = aquaClient.status < 300 ? await aquaClient.json().catch(() => null) : null;
  const aquaClientId = aquaClientJson?.client?.id ?? aquaClientJson?.clientId;
  if (aquaClientId) {
    const ovr = await go("GET", `/portal/clients/${aquaClientId}`);
    const body = ovr.status === 200 ? await ovr.text() : "";
    record("aqua client overview shows onboarding panel", body.includes("onboarding-dashboard"));
    record("onboarding panel shows phase strip header", body.includes("Onboarding journey"));
    // Tick a milestone via the foundation route.
    const tickRes = await go("POST", "/api/tenants/onboarding-tick", {
      body: JSON.stringify({
        clientId: aquaClientId,
        phaseStage: "aqua-blueprint",
        milestoneId: "brand-audit",
        done: true,
      }),
    });
    record("onboarding-tick POST 200", tickRes.status === 200, `status=${tickRes.status}`);
    // Bad payload → 400.
    const bad = await go("POST", "/api/tenants/onboarding-tick", {
      body: JSON.stringify({ clientId: aquaClientId, phaseStage: "aqua-blueprint", milestoneId: "nope", done: true }),
    });
    record("onboarding-tick rejects unknown milestoneId", bad.status === 400);
  }
  // Non-Aqua client → no dashboard panel.
  const legacyClient = await go("POST", "/api/portal/fulfillment/clients", {
    body: JSON.stringify({
      name: `Smoke Legacy ${Date.now()}`,
      stage: "discovery",
      brand: { primaryColor: "#999" },
    }),
  });
  const legacyJson = legacyClient.status < 300 ? await legacyClient.json().catch(() => null) : null;
  const legacyId = legacyJson?.client?.id ?? legacyJson?.clientId;
  if (legacyId) {
    const ovr = await go("GET", `/portal/clients/${legacyId}`);
    const body = ovr.status === 200 ? await ovr.text() : "";
    record("legacy client overview omits onboarding panel", !body.includes("onboarding-dashboard"));
  }

  console.log("\n§ Founder todos widget");
  // Smoke runs as agency-owner via /demo bootstrap → Founder POV.
  const homeFounder = await go("GET", "/portal/agency");
  record("agency home 200 (founder)", homeFounder.status === 200);
  const homeFounderBody = homeFounder.status === 200 ? await homeFounder.text() : "";
  record("home shows Today's Quests", homeFounderBody.includes("Today's Quests"));
  record("home shows founder-todos widget testid", homeFounderBody.includes("founder-todos-widget"));
  // Boards endpoint with founder role surfaces the founder-todos board (auto-create if missing).
  const boardsList = await go("GET", "/api/portal/kanban/boards?role=founder");
  record("kanban boards 200", boardsList.status === 200);

  console.log("\n§ SOPs surfacing");
  // SOPs list endpoint is reachable (sops plugin installed in seed-demo).
  const sopsList = await go("GET", "/api/portal/sops/list");
  record("sops list 200", sopsList.status === 200, `status=${sopsList.status}`);
  // Per-client SOPs sub-tab renders for an agency-role session.
  // (smoke runs as agency-owner via /demo bootstrap → Founder fallback passes.)
  if (clientId) {
    const sopsTab = await go("GET", `/portal/clients/${clientId}?tab=sops`);
    record("client sops tab 200", sopsTab.status === 200, `status=${sopsTab.status}`);
    const sopsBody = sopsTab.status === 200 ? await sopsTab.text() : "";
    record("client sops tab shows family heading", sopsBody.includes("SOPs for"));
    record("client sops tab links to agency shelf", sopsBody.includes("/portal/agency/sops"));
  }

  console.log("\n§ Live phase gateway");
  // Create a fresh aqua-mastery (Live) client and verify the per-client
  // header surfaces the Live badge + the "Build custom portal" CTA.
  const liveCreate = await go("POST", "/api/portal/fulfillment/clients", {
    body: JSON.stringify({
      name: `Smoke Live ${Date.now()}`,
      stage: "aqua-mastery",
      brand: { primaryColor: "#f59e0b" },
    }),
  });
  record("live add-client POST 200/201", liveCreate.status === 200 || liveCreate.status === 201, `status=${liveCreate.status}`);
  const liveJson = liveCreate.status < 300 ? await liveCreate.json().catch(() => null) : null;
  const liveId = liveJson?.client?.id ?? liveJson?.clientId;
  if (liveId) {
    const ovr = await go("GET", `/portal/clients/${liveId}`);
    record("live client overview 200", ovr.status === 200);
    const body = ovr.status === 200 ? await ovr.text() : "";
    record("overview shows 'Live' badge", body.includes(">Live<"));
    record("overview shows Build custom portal CTA", body.includes("Build custom portal"));
    // Tools tab carries the Recommended-for-Live callout.
    const toolsR = await go("GET", `/portal/clients/${liveId}?tab=tools`);
    record("live tools tab 200", toolsR.status === 200);
    const toolsBody = toolsR.status === 200 ? await toolsR.text() : "";
    record("tools tab shows 'Recommended for Live'", toolsBody.includes("Recommended for Live"));
    record("tools tab shows 'Install Live recommended'", toolsBody.includes("Install Live recommended"));
  }
  // Non-Live clients shouldn't carry the Live badge / CTA.
  const nonLiveCreate = await go("POST", "/api/portal/fulfillment/clients", {
    body: JSON.stringify({
      name: `Smoke Non-Live ${Date.now()}`,
      stage: "aqua-blueprint",
      brand: { primaryColor: "#9333EA" },
    }),
  });
  const nonLiveJson = nonLiveCreate.status < 300 ? await nonLiveCreate.json().catch(() => null) : null;
  const nonLiveId = nonLiveJson?.client?.id ?? nonLiveJson?.clientId;
  if (nonLiveId) {
    const ovr = await go("GET", `/portal/clients/${nonLiveId}`);
    const body = ovr.status === 200 ? await ovr.text() : "";
    record("non-live overview omits Build custom portal CTA", !body.includes("Build custom portal"));
  }

  console.log("\n§ Employee HQ");
  // List default seeded roles via the agency-hr API.
  const rolesRes = await go("GET", "/api/portal/agency-hr/roles");
  record("roles endpoint 200", rolesRes.status === 200);
  const rolesJson = rolesRes.status === 200 ? await rolesRes.json().catch(() => null) : null;
  const roles = rolesJson?.roles ?? [];
  for (const expected of ["Founder", "Admin", "Designer", "Copywriter", "Ops"]) {
    record(`seed role ${expected} present`, roles.some(r => r.label === expected && r.seed === true));
  }
  // Roles page renders.
  const rolesPage = await go("GET", "/portal/agency/agency-hr/roles");
  record("roles page 200", rolesPage.status === 200);
  // Employees page renders.
  const empPage = await go("GET", "/portal/agency/agency-hr/employees");
  record("employees page 200", empPage.status === 200);
  // Cloning a seed role produces an editable role.
  const founder = roles.find(r => r.label === "Founder");
  if (founder) {
    const clone = await go("POST", "/api/portal/agency-hr/roles", {
      body: JSON.stringify({ label: `Founder (clone ${Date.now()})`, permissions: founder.permissions }),
    });
    record("clone role POST 200/201", clone.status === 200 || clone.status === 201);
  }
  // Inviting an employee with agencyEmployee:true persists.
  const empCreate = await go("POST", "/api/portal/agency-hr/staff", {
    body: JSON.stringify({
      name: `Smoke Employee ${Date.now()}`,
      email: `smoke.${Date.now()}@example.com`,
      role: "agency-staff",
      title: "Smoke Designer",
      joinedAt: new Date().toISOString().slice(0, 10),
      agencyEmployee: true,
      customRoleId: founder?.id,
      metadata: { ndaSigned: true, payrollLink: "https://example.com/payroll" },
    }),
  });
  record("invite employee POST 200/201", empCreate.status === 200 || empCreate.status === 201, `status=${empCreate.status}`);

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
