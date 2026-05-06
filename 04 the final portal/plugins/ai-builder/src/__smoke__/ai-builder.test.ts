// AI builder smoke. Mock-LLM path (no network):
//   1. Generate with mocked raw response → BlockTree validates + persists.
//   2. Invalid block triggers retry on the fallback model.
//   3. Cache-hit metric increments when usage.cacheReadInputTokens > 0.

import { test } from "node:test";
import assert from "node:assert/strict";

import { GenerationService, type GenerationServiceDeps } from "../server/generationService";
import type { PluginStorage } from "../lib/aquaPluginTypes";

function memStorage(): PluginStorage {
  const m = new Map<string, unknown>();
  return {
    async get<T>(k: string) { return m.get(k) as T | undefined; },
    async set(k, v) { m.set(k, v); },
    async del(k) { m.delete(k); },
    async list(prefix = "") { return [...m.keys()].filter(k => k.startsWith(prefix)); },
  };
}

function deps(over: Partial<GenerationServiceDeps> = {}): GenerationServiceDeps {
  return {
    agencyId: "ag_smoke" as GenerationServiceDeps["agencyId"],
    actor: "u_smoke" as GenerationServiceDeps["actor"],
    storage: memStorage(),
    config: {
      anthropicApiKey: "sk-fake",
      defaultModel: "claude-haiku-4-5-20251001",
      fallbackModel: "claude-sonnet-4-6",
      cacheSystemPrompt: true,
      maxTokens: 1024,
    },
    ...over,
  };
}

const VALID_TREE = JSON.stringify([
  {
    id: "s1",
    type: "section",
    props: { fullWidth: true },
    children: [
      { id: "h1", type: "heading", props: { text: "Hello", level: 1 } },
      { id: "b1", type: "button", props: { label: "Go", href: "#" } },
    ],
  },
]);

test("generate: mocked raw response → completed + persisted", async () => {
  const d = deps();
  const svc = new GenerationService(d);
  const out = await svc.generate({
    prompt: "a hero with a heading and a button",
    fakeRawResponse: VALID_TREE,
    fakeUsage: { inputTokens: 100, outputTokens: 50 },
  });
  assert.equal(out.status, "completed", `unexpected status ${out.status}: ${out.validationError ?? ""}`);
  assert.ok(Array.isArray(out.blockTree));
  assert.equal(out.blockTree!.length, 1);
  assert.equal(out.blockTree![0]!.type, "section");

  const persisted = await svc.get(out.id);
  assert.ok(persisted, "record persisted");
  assert.equal(persisted!.id, out.id);

  const list = await svc.list();
  assert.equal(list.length, 1);
});

test("generate: invalid block → rejected then retried on fallback model", async () => {
  const d = deps();
  const svc = new GenerationService(d);
  // Patch the service's runOnce indirectly by feeding a bad first response —
  // the service's retry path replays runOnce with the fallback model. The
  // fakeRawResponse on input applies to BOTH attempts (smoke harness limit),
  // so we exercise retry by giving a response that's invalid on attempt 1
  // and passes on attempt 2 via a model-aware mock.
  let attempt = 0;
  const original = (svc as unknown as { runOnce: Function }).runOnce.bind(svc);
  (svc as unknown as { runOnce: Function }).runOnce = async function patched(
    record: { modelId: string; retryCount?: number },
    input: { fakeRawResponse?: string },
    model: string,
    extraHint: string | undefined,
  ) {
    attempt++;
    const fake = attempt === 1 ? `[{"type":"unknown-block-xyz"}]` : VALID_TREE;
    return original(record, { ...input, fakeRawResponse: fake }, model, extraHint);
  };

  const out = await svc.generate({ prompt: "anything" });
  assert.equal(attempt, 2, "retried exactly once on invalid block");
  assert.equal(out.status, "completed");
  assert.equal(out.modelId, "claude-sonnet-4-6", "retry used fallback model");
  assert.equal(out.retryCount, 1);
});

test("metrics: cache-hit counter increments on cacheReadInputTokens > 0", async () => {
  const d = deps();
  const svc = new GenerationService(d);
  await svc.generate({
    prompt: "x",
    fakeRawResponse: VALID_TREE,
    fakeUsage: { inputTokens: 200, outputTokens: 50, cacheReadInputTokens: 1500 },
  });
  let m = await svc.metrics();
  assert.equal(m.cacheHits, 1);

  await svc.generate({
    prompt: "x",
    fakeRawResponse: VALID_TREE,
    fakeUsage: { inputTokens: 50, outputTokens: 25, cacheReadInputTokens: 1500 },
  });
  m = await svc.metrics();
  assert.equal(m.cacheHits, 2, "second cached call increments");

  await svc.generate({
    prompt: "y",
    fakeRawResponse: VALID_TREE,
    fakeUsage: { inputTokens: 200, outputTokens: 50 },
  });
  m = await svc.metrics();
  assert.equal(m.cacheHits, 2, "no-cache call doesn't bump");
});
