#!/usr/bin/env node
// scripts/backup-postgres.mjs — nightly Postgres backup.
//
// Dumps the shared portal's Postgres state with `pg_dump`, writes a
// timestamped snapshot, retains the last 30 days, optionally
// uploads to S3 / Vercel Blob.
//
// Triggered manually:
//
//   DATABASE_URL=postgres://… node scripts/backup-postgres.mjs
//
// Or via Vercel cron (vercel.json `crons` block — wiring deferred
// per runbook §8). The script intentionally does NOT shell out to
// any provider CLI by default — local-disk snapshots are the v1
// behaviour. Set BACKUP_DEST=s3://bucket/path or
// BACKUP_DEST=vercel-blob to opt into uploads (R4+).
//
// Exit codes:
//   0  success
//   1  configuration error (no DATABASE_URL)
//   2  pg_dump failure
//   3  upload failure (when BACKUP_DEST set)

import { mkdir, readdir, stat, unlink } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";

const RETENTION_DAYS = Number(process.env["BACKUP_RETENTION_DAYS"] ?? 30);
const BACKUP_DIR = process.env["BACKUP_DIR"] ?? path.resolve("backups");
const BACKUP_DEST = process.env["BACKUP_DEST"]; // s3://… | vercel-blob | unset
const DATABASE_URL = process.env["DATABASE_URL"];

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function logJSON(obj) {
  process.stdout.write(JSON.stringify(obj) + "\n");
}

async function main() {
  if (!DATABASE_URL) {
    logJSON({ ok: false, error: "DATABASE_URL not set" });
    process.exit(1);
  }
  await mkdir(BACKUP_DIR, { recursive: true });

  const ts = timestamp();
  const filename = `aqua-portal-${ts}.sql.gz`;
  const filepath = path.join(BACKUP_DIR, filename);

  // pg_dump | gzip → file. We use `bash -c` for the pipe; if
  // pg_dump isn't installed the spawn fails synchronously with
  // ENOENT and we surface it.
  const cmd = `pg_dump --format=plain --no-owner --no-privileges "${DATABASE_URL}" | gzip -9 > "${filepath}"`;

  await new Promise((resolve, reject) => {
    const child = spawn("bash", ["-lc", cmd], { stdio: ["ignore", "inherit", "inherit"] });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolve(null);
      else reject(new Error(`pg_dump exited with code ${code}`));
    });
  }).catch((err) => {
    logJSON({ ok: false, step: "pg_dump", error: err.message });
    process.exit(2);
  });

  let bytes = 0;
  try {
    bytes = (await stat(filepath)).size;
  } catch {
    bytes = 0;
  }

  // Optional upload step. v1 ships the script without baking in
  // either an S3 or Vercel Blob SDK — stub-only. Wire the real
  // upload in R4 when each provider's creds + bucket land.
  if (BACKUP_DEST) {
    logJSON({ ok: true, step: "upload", dest: BACKUP_DEST, note: "v1 stub — wire R4+. snapshot kept on local disk." });
  }

  // Retention sweep — drop *.sql.gz older than RETENTION_DAYS.
  const cutoff = Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000;
  const entries = await readdir(BACKUP_DIR);
  let dropped = 0;
  for (const name of entries) {
    if (!name.endsWith(".sql.gz")) continue;
    const p = path.join(BACKUP_DIR, name);
    const s = await stat(p);
    if (s.mtimeMs < cutoff) {
      await unlink(p);
      dropped++;
    }
  }

  logJSON({
    ok: true,
    snapshot: filepath,
    bytes,
    retentionDays: RETENTION_DAYS,
    droppedOldSnapshots: dropped,
    dest: BACKUP_DEST ?? "local-disk-only",
  });
}

main().catch((err) => {
  logJSON({ ok: false, error: err instanceof Error ? err.message : String(err) });
  process.exit(2);
});
