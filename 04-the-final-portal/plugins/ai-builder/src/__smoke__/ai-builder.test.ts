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

// ─── R8: streaming ──────────────────────────────────────────────────────────

function sseStreamFromAnthropicChunks(chunks: string[]): ReadableStream<Uint8Array> {
  // Mock Anthropic SSE: emit message_start, then a content_block_delta
  // per chunk, then message_delta + message_stop. Produces one or more
  // SSE frames that streamMessage() must parse.
  const enc = new TextEncoder();
  const frames: string[] = [];
  frames.push(`event: message_start\ndata: ${JSON.stringify({ type: "message_start", message: { id: "msg_smoke", model: "claude-haiku-4-5-20251001", usage: { input_tokens: 50, cache_read_input_tokens: 0 } } })}\n\n`);
  for (const c of chunks) {
    frames.push(`event: content_block_delta\ndata: ${JSON.stringify({ type: "content_block_delta", delta: { type: "text_delta", text: c } })}\n\n`);
  }
  frames.push(`event: message_delta\ndata: ${JSON.stringify({ type: "message_delta", delta: { stop_reason: "end_turn" }, usage: { output_tokens: 30 } })}\n\n`);
  frames.push(`event: message_stop\ndata: ${JSON.stringify({ type: "message_stop" })}\n\n`);

  return new ReadableStream<Uint8Array>({
    start(c) {
      for (const f of frames) c.enqueue(enc.encode(f));
      c.close();
    },
  });
}

function mockStreamFetch(chunks: string[]): typeof fetch {
  const responder = async () => new Response(sseStreamFromAnthropicChunks(chunks), {
    status: 200,
    headers: { "content-type": "text/event-stream" },
  });
  return responder as unknown as typeof fetch;
}

test("R8 stream: deltas accumulate + final tree validates + persists", async () => {
  const d = deps();
  const svc = new GenerationService(d);
  // Slice the valid tree into 4 chunks to simulate streaming.
  const c1 = VALID_TREE.slice(0, 20);
  const c2 = VALID_TREE.slice(20, 60);
  const c3 = VALID_TREE.slice(60, 110);
  const c4 = VALID_TREE.slice(110);
  const seenDeltas: string[] = [];
  const out = await svc.generateStream({
    prompt: "stream a hero",
    fetchImpl: mockStreamFetch([c1, c2, c3, c4]),
    onDelta: (chunk) => seenDeltas.push(chunk),
  });
  assert.equal(seenDeltas.length, 4, "received 4 delta callbacks");
  assert.equal(seenDeltas.join(""), VALID_TREE, "deltas concatenate to full text");
  assert.equal(out.status, "completed", `unexpected status ${out.status}: ${out.validationError ?? ""}`);
  assert.ok(Array.isArray(out.blockTree));
  assert.equal(out.blockTree![0]!.type, "section");
  const persisted = await svc.get(out.id);
  assert.ok(persisted, "stream record persisted");
});

test("R8 stream handler: SSE response emits delta + complete + DONE frames", async () => {
  // Hit the HTTP handler directly with a mocked Anthropic upstream.
  const { generateStreamHandler } = await import("../api/handlers");
  const installConfig = {
    anthropicApiKey: "sk-fake",
    defaultModel: "claude-haiku-4-5-20251001",
    fallbackModel: "claude-sonnet-4-6",
    cacheSystemPrompt: true,
    maxTokens: 1024,
  };
  const storage = memStorage();
  const ctx = {
    agencyId: "ag_smoke",
    actor: "u_smoke",
    install: { config: installConfig },
    storage,
    services: {} as Record<string, unknown>,
  } as unknown as Parameters<typeof generateStreamHandler>[1];

  // Patch global fetch for the duration of this test.
  const realFetch = globalThis.fetch;
  globalThis.fetch = mockStreamFetch([VALID_TREE.slice(0, 50), VALID_TREE.slice(50)]);
  try {
    const req = new Request("http://x/generate/stream", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ prompt: "stream me" }),
    });
    const res = await generateStreamHandler(req, ctx);
    assert.equal(res.status, 200);
    assert.equal(res.headers.get("content-type"), "text/event-stream");
    const text = await res.text();
    assert.ok(text.includes(`"type":"delta"`), "emitted at least one delta frame");
    assert.ok(text.includes(`"type":"complete"`), "emitted complete frame");
    assert.ok(text.includes("[DONE]"), "ended with [DONE] sentinel");
  } finally {
    globalThis.fetch = realFetch;
  }
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
