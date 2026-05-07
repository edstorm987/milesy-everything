// Loads starter trees from `src/starters/<variantId>.json` at runtime.
//
// In a Next.js context this resolves via dynamic import; in a Node smoke
// test it resolves via fs. Both paths share the same shape.

import type { Block } from "../types/block";
import type { PortalRole } from "../lib/portalRole";

export interface StarterTreeFile {
  variantId: string;
  role: PortalRole;
  title: string;
  description?: string;
  blocks: Block[];
}

// Statically import the round-1 set so the bundler picks them up.
// Round-2 grows the set; the loader walks `import.meta.glob` once T1
// confirms the bundler.
import loginDefault from "../starters/login-default.json" with { type: "json" };
import loginOnboarding from "../starters/login-onboarding.json" with { type: "json" };
import loginDesign from "../starters/login-design.json" with { type: "json" };
import affiliatesDefault from "../starters/affiliates-default.json" with { type: "json" };
import ordersDefault from "../starters/orders-default.json" with { type: "json" };
import accountDefault from "../starters/account-default.json" with { type: "json" };
import { getTemplate, AQUA_INCUBATOR_TEMPLATE_IDS } from "../components/pageTemplates";

const STARTERS: Record<string, StarterTreeFile> = {
  "login-default": loginDefault as StarterTreeFile,
  "login-onboarding": loginOnboarding as StarterTreeFile,
  "login-design": loginDesign as StarterTreeFile,
  "affiliates-default": affiliatesDefault as StarterTreeFile,
  "orders-default": ordersDefault as StarterTreeFile,
  "account-default": accountDefault as StarterTreeFile,
};

export async function loadStarterTree(variantId: string): Promise<StarterTreeFile | null> {
  if (STARTERS[variantId]) return STARTERS[variantId];
  // Aqua Incubator (and its 4 sibling sub-pages) build from PAGE_TEMPLATES
  // at runtime — no static JSON needed since the tree references shared
  // cover-image paths and is content-light.
  if (AQUA_INCUBATOR_TEMPLATE_IDS.includes(variantId)) {
    const tpl = getTemplate(variantId);
    if (!tpl) return null;
    return {
      variantId,
      // Q-ASSUMED: PortalRole has no "customer" — Aqua Incubator lives
      // under the "account" role for v1 (closest match: client-landing
      // portal). Future round adds a dedicated "incubator" role.
      role: "account",
      title: tpl.defaultTitle,
      description: tpl.description,
      blocks: tpl.build(),
    };
  }
  return null;
}

export function listStarterIds(): string[] {
  return [...Object.keys(STARTERS), ...AQUA_INCUBATOR_TEMPLATE_IDS];
}
