#!/usr/bin/env node
// scripts/check-ci-yaml.mjs — sanity-check workflow YAML shape.
// NOT a CI prerequisite; runs locally / on demand to catch obvious shape
// regressions in `.github/workflows/*.yml`. Prefers a real yaml lib if
// installed; falls back to shape regex.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const wfDir = path.join(root, ".github", "workflows");

const files = fs
  .readdirSync(wfDir)
  .filter((f) => f.endsWith(".yml") || f.endsWith(".yaml"))
  .map((f) => path.join(wfDir, f));

if (files.length === 0) {
  console.error("no workflow files in", wfDir);
  process.exit(1);
}

let yaml = null;
try {
  yaml = (await import("yaml")).default;
} catch {
  /* fall through to regex */
}

let failed = 0;
for (const f of files) {
  const src = fs.readFileSync(f, "utf8");
  const rel = path.relative(root, f);
  if (yaml) {
    try {
      const doc = yaml.parse(src);
      if (!doc || typeof doc !== "object") throw new Error("empty/non-object root");
      if (!doc.name) throw new Error("missing name");
      if (!doc.on) throw new Error("missing on:");
      if (!doc.jobs || typeof doc.jobs !== "object")
        throw new Error("missing jobs:");
      for (const [jid, j] of Object.entries(doc.jobs)) {
        if (!j["runs-on"] && !j.uses) throw new Error(`job ${jid}: missing runs-on/uses`);
      }
      console.log("ok ", rel);
    } catch (e) {
      failed++;
      console.error("FAIL", rel, "—", e.message);
    }
  } else {
    // regex shape: must contain name:, on:, jobs:, at least one runs-on:
    const checks = [
      [/^name:\s*\S/m, "name:"],
      [/^on:\s*$|^on:\s*\S/m, "on:"],
      [/^jobs:\s*$/m, "jobs:"],
      [/runs-on:\s*\S/, "runs-on:"],
    ];
    const missing = checks.filter(([rx]) => !rx.test(src)).map(([, l]) => l);
    if (missing.length) {
      failed++;
      console.error("FAIL", rel, "— missing", missing.join(", "));
    } else {
      console.log("ok ", rel, "(regex mode — install `yaml` for full parse)");
    }
  }
}

if (failed > 0) {
  console.error(`\n${failed} workflow file(s) failed shape check`);
  process.exit(1);
}
console.log(`\nall ${files.length} workflow file(s) ok`);
