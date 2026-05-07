// R006 — Template marketplace registry.
//
// Lists all "builtin" starter templates (login starters, Aqua
// Incubator, brand-page presets + composite pack, generic
// PAGE_TEMPLATES) plus per-agency operator-saved templates. Surfaces
// metadata used by the gallery: id, label, description, tags, an
// optional cover image URL, and a `kind` that distinguishes builtin
// templates from operator-saved ones (so the UI can show a delete
// affordance only on the latter).
//
// Operator-saved templates live under
// `t/<agencyId>/_agency/website-editor/templates/<id>` so the same
// gallery surfaces across all clients of an agency without leaking
// to other agencies.

import type { PluginStorage } from "../lib/aquaPluginTypes";
import type { Block } from "../types/block";
import {
  PAGE_TEMPLATES,
  getTemplate,
  AQUA_INCUBATOR_TEMPLATE_IDS,
  BRAND_PAGE_TEMPLATE_IDS,
  BRAND_PAGE_PACK_ID,
} from "../components/pageTemplates";

export interface TemplateEntry {
  id: string;
  label: string;
  description: string;
  tags: string[];
  coverUrl?: string;
  kind: "builtin" | "saved";
  // For saved templates only — the captured BlockTree.
  // Builtins resolve their tree via starterLoader on demand.
  blocks?: Block[];
  savedAt?: string;
  savedBy?: string;
}

interface SavedTemplateRecord {
  id: string;
  label: string;
  description: string;
  tags: string[];
  coverUrl?: string;
  blocks: Block[];
  savedAt: string;
  savedBy: string;
}

const SAVED_PREFIX = (agencyId: string) =>
  `t/${agencyId}/_agency/website-editor/templates/`;

// ─── Tag derivation for builtins ────────────────────────────────────────────
// Tags are inferred from the template id so the gallery's filter chips
// stay in sync with whatever PAGE_TEMPLATES expands to over time.

function tagsForBuiltin(id: string): string[] {
  const tags: string[] = [];
  if (id.startsWith("login")) tags.push("Login");
  if (id.startsWith("aqua-incubator")) tags.push("Aqua Incubator");
  if (id.startsWith("brand-")) tags.push("Brand Pack");
  if (id === BRAND_PAGE_PACK_ID) tags.push("Brand Pack", "Composite");
  if (id === "affiliates-default") tags.push("Affiliate Site");
  if (id === "orders-default") tags.push("Service Portal");
  if (id === "account-default") tags.push("Service Portal");
  if (["homepage", "shop", "cart", "checkout", "order-confirmed"].includes(id)) tags.push("Storefront");
  if (["about", "contact", "faq", "services", "pricing", "blog"].includes(id)) tags.push("Generic page");
  if (id === "landing") tags.push("Marketing");
  if (tags.length === 0) tags.push("Generic page");
  return tags;
}

export function listBuiltinTemplates(): TemplateEntry[] {
  const out: TemplateEntry[] = [];
  // PAGE_TEMPLATES (generic + Aqua + brand presets + login etc).
  for (const t of PAGE_TEMPLATES) {
    out.push({
      id: t.id,
      label: t.label,
      description: t.description,
      tags: tagsForBuiltin(t.id),
      kind: "builtin",
    });
  }
  // brand-page-pack composite — surfaces as a single gallery card
  // even though it's a sibling-seeding meta-starter.
  const about = getTemplate("brand-about");
  if (about) {
    out.push({
      id: BRAND_PAGE_PACK_ID,
      label: "Brand Pack — full bundle",
      description: "Seeds About + Story + Philosophy + Sustainability + FAQ + Contact + Lab tests as siblings.",
      tags: ["Brand Pack", "Composite"],
      kind: "builtin",
    });
  }
  return out;
}

export function builtinTemplateIds(): string[] {
  return [
    ...PAGE_TEMPLATES.map(t => t.id),
    ...AQUA_INCUBATOR_TEMPLATE_IDS,
    ...BRAND_PAGE_TEMPLATE_IDS,
    BRAND_PAGE_PACK_ID,
  ];
}

// ─── Operator-saved templates (per-agency) ──────────────────────────────────

export async function listSavedTemplates(
  storage: PluginStorage,
  agencyId: string,
): Promise<TemplateEntry[]> {
  const keys = await storage.list(SAVED_PREFIX(agencyId));
  const out: TemplateEntry[] = [];
  for (const k of keys) {
    const rec = await storage.get<SavedTemplateRecord>(k);
    if (!rec) continue;
    out.push({
      id: rec.id,
      label: rec.label,
      description: rec.description,
      tags: rec.tags,
      ...(rec.coverUrl ? { coverUrl: rec.coverUrl } : {}),
      kind: "saved",
      blocks: rec.blocks,
      savedAt: rec.savedAt,
      savedBy: rec.savedBy,
    });
  }
  return out.sort((a, b) => (b.savedAt ?? "").localeCompare(a.savedAt ?? ""));
}

export async function listAllTemplates(
  storage: PluginStorage,
  agencyId: string,
): Promise<TemplateEntry[]> {
  const [builtin, saved] = await Promise.all([
    Promise.resolve(listBuiltinTemplates()),
    listSavedTemplates(storage, agencyId),
  ]);
  return [...saved, ...builtin];
}

export interface SaveTemplateInput {
  label: string;
  description?: string;
  tags?: string[];
  coverUrl?: string;
  blocks: Block[];
  savedBy: string;
}

export async function saveTemplate(
  storage: PluginStorage,
  agencyId: string,
  input: SaveTemplateInput,
): Promise<TemplateEntry> {
  const id = `saved-${slugify(input.label)}-${Date.now().toString(36)}`;
  const rec: SavedTemplateRecord = {
    id,
    label: input.label.trim() || "Untitled template",
    description: input.description?.trim() ?? "",
    tags: input.tags && input.tags.length > 0 ? input.tags : ["Operator template"],
    ...(input.coverUrl ? { coverUrl: input.coverUrl } : {}),
    blocks: input.blocks,
    savedAt: new Date().toISOString(),
    savedBy: input.savedBy,
  };
  await storage.set(`${SAVED_PREFIX(agencyId)}${id}`, rec);
  return {
    id: rec.id,
    label: rec.label,
    description: rec.description,
    tags: rec.tags,
    ...(rec.coverUrl ? { coverUrl: rec.coverUrl } : {}),
    kind: "saved",
    blocks: rec.blocks,
    savedAt: rec.savedAt,
    savedBy: rec.savedBy,
  };
}

export async function deleteSavedTemplate(
  storage: PluginStorage,
  agencyId: string,
  id: string,
): Promise<boolean> {
  const key = `${SAVED_PREFIX(agencyId)}${id}`;
  const cur = await storage.get(key);
  if (!cur) return false;
  await storage.del(key);
  return true;
}

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "template";
}
