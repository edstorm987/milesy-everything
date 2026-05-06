// ImageService — R9 Goal A. Pluggable image-gen provider with a stub
// default (picsum.photos placeholder URLs keyed by a deterministic
// hash of the prompt) and a real-provider injection point for OpenAI
// gpt-image-1. Foundation wires the real port via setImageProviderPort
// at boot when an OpenAI key is configured.
//
// The service mirrors GenerationService's ceiling pattern: consults the
// monthly usage roll-up before each call, returns a typed
// CeilingReachedError when over budget, otherwise bumps the image
// counter by `result.images.length`.

import type { PluginCtx, PluginStorage } from "../lib/aquaPluginTypes";
import type { AgencyId, ClientId, UserId } from "../lib/tenancy";
import {
  DEFAULT_CONFIG,
  type AiBuilderConfig,
  monthKeyForDate,
  nextMonthResetIso,
  type MonthlyUsage,
} from "../lib/domain";

export interface GeneratedImage {
  url: string;
  width: number;
  height: number;
}

export interface ImageProviderPort {
  id: "stub" | "openai" | (string & {});
  generate(input: { prompt: string; size: string; count: number; apiKey?: string }): Promise<GeneratedImage[]>;
}

let injected: ImageProviderPort | null = null;
export function setImageProviderPort(port: ImageProviderPort | null): void { injected = port; }
export function getImageProviderPort(): ImageProviderPort | null { return injected; }

// ─── Stub provider (default) ───────────────────────────────────────────────
// picsum.photos returns a deterministic image keyed by a seed. We hash
// the prompt so identical prompts surface the same placeholder — useful
// when the operator wants to A/B prompts.
export const stubImageProvider: ImageProviderPort = {
  id: "stub",
  async generate(input) {
    const [w, h] = parseSize(input.size);
    const out: GeneratedImage[] = [];
    for (let i = 0; i < Math.max(1, Math.min(input.count, 8)); i++) {
      const seed = stableHash(`${input.prompt}::${i}`);
      out.push({ url: `https://picsum.photos/seed/${seed}/${w}/${h}`, width: w, height: h });
    }
    return out;
  },
};

function parseSize(size: string): [number, number] {
  const m = /^(\d+)x(\d+)$/.exec(size.trim());
  if (m) return [Number(m[1]), Number(m[2])];
  if (size === "square") return [1024, 1024];
  if (size === "landscape") return [1536, 1024];
  if (size === "portrait") return [1024, 1536];
  return [1024, 1024];
}

function stableHash(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h) ^ s.charCodeAt(i);
  return Math.abs(h).toString(36);
}

// ─── Service ───────────────────────────────────────────────────────────────

export interface GenerateImageInput {
  prompt: string;
  size?: string;       // "1024x1024" | "square" | "landscape" | "portrait"
  count?: number;      // default 1, capped at 8
  // Smoke / SSR injection.
  providerOverride?: ImageProviderPort;
}

export class CeilingReachedError extends Error {
  override name = "CeilingReachedError";
  constructor(public readonly kind: "tokens" | "images", public readonly resetsOn: string) {
    super(`${kind} ceiling reached for current month`);
  }
}

export interface ImageServiceDeps {
  agencyId: AgencyId;
  clientId?: ClientId;
  actor: UserId;
  storage: PluginStorage;
  config: AiBuilderConfig;
}

export class ImageService {
  constructor(private readonly deps: ImageServiceDeps) {}

  async generate(input: GenerateImageInput): Promise<GeneratedImage[]> {
    const config = { ...DEFAULT_CONFIG, ...this.deps.config };
    const count = Math.max(1, Math.min(input.count ?? 1, 8));

    const usage = await this.usageThisMonth();
    const ceiling = config.monthlyImageCeiling ?? DEFAULT_CONFIG.monthlyImageCeiling!;
    if (usage.images + count > ceiling) {
      throw new CeilingReachedError("images", nextMonthResetIso());
    }

    const provider =
      input.providerOverride ??
      (config.imageProvider === "openai" && injected?.id === "openai" ? injected : stubImageProvider);

    const images = await provider.generate({
      prompt: input.prompt,
      size: input.size ?? "1024x1024",
      count,
      ...(config.openaiApiKey ? { apiKey: config.openaiApiKey } : {}),
    });

    await this.bumpUsage({ images: images.length });
    return images;
  }

  // ─── Usage roll-ups (R9) ────────────────────────────────────────────────
  // Stored under `metrics/usage/<YYYY-MM>` so a new month naturally rolls
  // a fresh counter — old months are kept for historical lookup.

  async usageThisMonth(): Promise<MonthlyUsage> {
    const monthKey = monthKeyForDate();
    const cur = await this.deps.storage.get<MonthlyUsage>(this.usageKey(monthKey));
    return cur ?? { monthKey, tokens: 0, images: 0 };
  }

  async bumpUsage(by: { tokens?: number; images?: number }): Promise<MonthlyUsage> {
    const cur = await this.usageThisMonth();
    const next: MonthlyUsage = {
      monthKey: cur.monthKey,
      tokens: cur.tokens + (by.tokens ?? 0),
      images: cur.images + (by.images ?? 0),
    };
    await this.deps.storage.set(this.usageKey(cur.monthKey), next);
    return next;
  }

  private get tenantPrefix(): string {
    return `t/${this.deps.agencyId}/${this.deps.clientId ?? "_agency"}/ai-builder`;
  }
  private usageKey(monthKey: string): string { return `${this.tenantPrefix}/metrics/usage/${monthKey}`; }
}

export function buildImageContainer(ctx: PluginCtx): { images: ImageService } {
  const config = (ctx.install.config as AiBuilderConfig | undefined) ?? {};
  return {
    images: new ImageService({
      agencyId: ctx.agencyId,
      ...(ctx.clientId ? { clientId: ctx.clientId } : {}),
      actor: ctx.actor,
      storage: ctx.storage,
      config,
    }),
  };
}
