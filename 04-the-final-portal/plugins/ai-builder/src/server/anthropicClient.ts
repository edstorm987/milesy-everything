// Minimal Anthropic Messages API client. Round-7.
//
// Why a hand-rolled fetch wrapper instead of the SDK:
//   - The plugin is install-linked; bundling `@anthropic-ai/sdk` here
//     would force the SDK on every plugin's dependency tree.
//   - We need a single tight surface (POST /messages) with prompt
//     caching + streaming control + injectable fetchImpl for smoke
//     tests. The SDK's wider surface isn't worth the cost.
//
// Prompt caching is enabled by setting `cache_control: { type: "ephemeral" }`
// on the system block. The Messages API returns
// `usage.cache_creation_input_tokens` + `usage.cache_read_input_tokens`
// the pipeline accumulates into the per-generation cost.
//
// **Reference**: docs.anthropic.com/en/api/messages — payload shape
// matches the Messages API v1 contract.

import type { ModelId, CacheUsage } from "../lib/domain";

export interface AnthropicMessage {
  role: "user" | "assistant";
  content: string | AnthropicContentBlock[];
}

export type AnthropicContentBlock =
  | { type: "text"; text: string; cache_control?: { type: "ephemeral" } }
  | { type: "image"; source: { type: "base64"; media_type: string; data: string } };

export interface AnthropicSystemBlock {
  type: "text";
  text: string;
  cache_control?: { type: "ephemeral" };
}

export interface CreateMessageInput {
  model: ModelId;
  apiKey: string;
  // System prompt — pass an array of blocks to opt into prompt
  // caching on the static portion (we always cache the block-library
  // section since it's huge + reused across every generation).
  system: AnthropicSystemBlock[];
  messages: AnthropicMessage[];
  maxTokens: number;
  temperature?: number;
  // For non-streaming use. Streaming is handled separately to keep
  // the smoke test simple.
  stream?: false;
  // Optional override — smoke tests inject a mocked fetch.
  fetchImpl?: typeof fetch;
  // Optional override — caller can switch the API base URL (defaults
  // to https://api.anthropic.com).
  baseUrl?: string;
}

export interface CreateMessageResult {
  id: string;
  modelId: ModelId;
  // Concatenated text from every text block in `content`.
  text: string;
  stopReason: "end_turn" | "max_tokens" | "stop_sequence" | "tool_use" | (string & {});
  usage: CacheUsage;
}

export interface AnthropicErrorEnvelope {
  type: "error";
  error: { type: string; message: string };
}

interface AnthropicMessageResponse {
  id: string;
  model: ModelId;
  content: Array<{ type: "text"; text: string } | { type: string }>;
  stop_reason: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
    cache_creation_input_tokens?: number;
    cache_read_input_tokens?: number;
  };
}

export async function createMessage(input: CreateMessageInput): Promise<CreateMessageResult> {
  if (!input.apiKey) {
    throw new Error("Anthropic API key not configured. Set install.config.anthropicApiKey.");
  }
  const fetchFn = input.fetchImpl ?? fetch;
  const url = `${input.baseUrl ?? "https://api.anthropic.com"}/v1/messages`;
  const body = {
    model: input.model,
    max_tokens: input.maxTokens,
    temperature: input.temperature ?? 0.6,
    system: input.system,
    messages: input.messages,
  };
  const res = await fetchFn(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": input.apiKey,
      "anthropic-version": "2023-06-01",
      // Prompt caching is a generally-available feature on the
      // Messages API. No beta header needed for ephemeral caching as
      // of model 4-x. (Per docs.anthropic.com.)
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    let message = `status ${res.status}`;
    try {
      const err = await res.json() as AnthropicErrorEnvelope;
      if (err.error?.message) message = err.error.message;
    } catch { /* fall through */ }
    throw new AnthropicCallError(message, res.status);
  }
  const data = await res.json() as AnthropicMessageResponse;
  const text = data.content
    .filter((b): b is { type: "text"; text: string } => b.type === "text")
    .map(b => b.text)
    .join("");
  const usage: CacheUsage = {
    inputTokens: data.usage.input_tokens,
    outputTokens: data.usage.output_tokens,
    ...(data.usage.cache_creation_input_tokens !== undefined ? { cacheCreationInputTokens: data.usage.cache_creation_input_tokens } : {}),
    ...(data.usage.cache_read_input_tokens !== undefined ? { cacheReadInputTokens: data.usage.cache_read_input_tokens } : {}),
  };
  return {
    id: data.id,
    modelId: data.model,
    text,
    stopReason: data.stop_reason,
    usage,
  };
}

export class AnthropicCallError extends Error {
  override name = "AnthropicCallError";
  constructor(message: string, public readonly status: number) {
    super(message);
  }
}
