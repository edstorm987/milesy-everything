#!/usr/bin/env node
// CLI helper for the Vercel domain attach / verify / remove flow.
//
// Pure JS — does NOT import the portal's TS modules so it runs without
// a build step. Same Vercel REST surface as
// `04 the final portal/portal/src/lib/server/vercelDomain.ts` and
// `04 the final portal/plugins/domains/src/server/vercelClient.ts`.
//
// Usage:
//
//   VERCEL_TOKEN=... VERCEL_PROJECT_ID=prj_... \
//   [VERCEL_TEAM_ID=team_...] \
//   node scripts/attach-domain.mjs --hostname=<host> [--verify | --remove]
//
// Defaults to attach when neither --verify nor --remove is passed.
//
// Reference runbook: 01 development/runbooks/deploy.md §6c.

const API_BASE = "https://api.vercel.com";

function parseArgs(argv) {
  const args = { hostname: null, mode: "attach", help: false };
  for (const raw of argv.slice(2)) {
    if (raw === "-h" || raw === "--help") { args.help = true; continue; }
    if (raw === "--verify") { args.mode = "verify"; continue; }
    if (raw === "--remove") { args.mode = "remove"; continue; }
    if (raw.startsWith("--hostname=")) {
      args.hostname = raw.slice("--hostname=".length);
      continue;
    }
  }
  return args;
}

function help() {
  console.log(`
attach-domain.mjs — Vercel domain attach / verify / remove via the REST API.

  --hostname=<host>     domain to manage (required)
  --verify              re-check DNS verification (default: attach)
  --remove              detach the domain
  -h, --help            show this message

Required env:
  VERCEL_TOKEN          domain-attach scope token from Vercel
  VERCEL_PROJECT_ID     prj_xxxxxxxxxxxxxxxx — target project

Optional env:
  VERCEL_TEAM_ID        team_xxxxxxxxxxxxxxxx — when token is multi-team

Output: JSON on stdout. Exit 0 on ok, 1 on configuration / network /
HTTP error, 2 on usage error.

See 01 development/runbooks/deploy.md §6c for the runbook.
`);
}

function normaliseHostname(raw) {
  return (raw ?? "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "");
}

function getEnv() {
  const token = process.env.VERCEL_TOKEN;
  const projectId = process.env.VERCEL_PROJECT_ID;
  const teamId = process.env.VERCEL_TEAM_ID;
  return {
    token: token && token.length > 0 ? token : null,
    projectId: projectId && projectId.length > 0 ? projectId : null,
    teamId: teamId && teamId.length > 0 ? teamId : undefined,
  };
}

function teamScope(teamId) {
  return teamId ? `?teamId=${encodeURIComponent(teamId)}` : "";
}

async function call(cfg, path, init) {
  return fetch(`${API_BASE}${path}${teamScope(cfg.teamId)}`, {
    ...init,
    headers: {
      authorization: `Bearer ${cfg.token}`,
      "content-type": "application/json",
      ...(init.headers ?? {}),
    },
    cache: "no-store",
  });
}

function projectVerification(arr) {
  return (arr ?? []).map((r) => ({
    type: r.type,
    name: r.domain,
    value: r.value,
    ...(r.reason ? { reason: r.reason } : {}),
  }));
}

async function attach(cfg, hostname) {
  const res = await call(cfg, `/v10/projects/${encodeURIComponent(cfg.projectId)}/domains`, {
    method: "POST",
    body: JSON.stringify({ name: hostname }),
  });
  const data = await res.json().catch(() => ({}));
  const alreadyAttached =
    res.status === 409 || data?.error?.code === "domain_already_in_use";
  if (!res.ok && !alreadyAttached) {
    return {
      ok: false,
      hostname,
      error: data?.error?.message ?? `Vercel ${res.status}`,
      pending: [],
    };
  }
  return {
    ok: true,
    hostname: data.name ?? hostname,
    verified: !!data.verified,
    pending: projectVerification(data.verification),
  };
}

async function verify(cfg, hostname) {
  const res = await call(
    cfg,
    `/v9/projects/${encodeURIComponent(cfg.projectId)}/domains/${encodeURIComponent(hostname)}/verify`,
    { method: "POST" },
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return {
      ok: false,
      hostname,
      error: data?.error?.message ?? `Vercel ${res.status}`,
      pending: [],
    };
  }
  return {
    ok: true,
    hostname: data.name ?? hostname,
    verified: !!data.verified,
    pending: projectVerification(data.verification),
  };
}

async function remove(cfg, hostname) {
  const res = await call(
    cfg,
    `/v9/projects/${encodeURIComponent(cfg.projectId)}/domains/${encodeURIComponent(hostname)}`,
    { method: "DELETE" },
  );
  if (!res.ok) {
    let message = `Vercel ${res.status}`;
    try {
      const data = await res.json();
      if (data?.error?.message) message = data.error.message;
    } catch { /* keep status */ }
    return { ok: false, hostname, error: message };
  }
  return { ok: true, hostname };
}

async function main() {
  const args = parseArgs(process.argv);
  if (args.help) { help(); process.exit(0); }
  if (!args.hostname) {
    console.error("error: --hostname=<host> is required");
    help();
    process.exit(2);
  }
  const env = getEnv();
  if (!env.token) {
    console.error("error: VERCEL_TOKEN env is required");
    process.exit(1);
  }
  if (!env.projectId) {
    console.error("error: VERCEL_PROJECT_ID env is required");
    process.exit(1);
  }
  const cfg = { token: env.token, projectId: env.projectId, teamId: env.teamId };
  const hostname = normaliseHostname(args.hostname);
  if (!hostname) {
    console.error("error: hostname is empty after normalisation");
    process.exit(2);
  }

  let result;
  try {
    if (args.mode === "verify") result = await verify(cfg, hostname);
    else if (args.mode === "remove") result = await remove(cfg, hostname);
    else result = await attach(cfg, hostname);
  } catch (e) {
    console.error(`error: ${e instanceof Error ? e.message : e}`);
    process.exit(1);
  }

  console.log(JSON.stringify({ mode: args.mode, ...result }, null, 2));
  process.exit(result.ok ? 0 : 1);
}

main();
