// Six default phase definitions. Seeded into the phase store on first
// agency creation (`seedDefaultPhases`). Agencies can edit / add / archive
// later — these are *defaults*, not enums. See `04-architecture.md §7`.
//
// Each preset specifies:
//   - the `ClientStage` it represents (one of the seven canonical stages)
//   - the plugin preset (ids that get installed when entering this phase)
//   - the starter portal-variant id (T3 owns the variant content)
//   - the checklist template (internal + client items)
//
// **Plugin catalogue mapping (R7 — consolidation pass)**
//
// The presets reflect the real plugin lifecycle a Felicia-shaped client
// actually walks through:
//
// | Phase       | Plugins installed                                            | Why |
// |-------------|--------------------------------------------------------------|-----|
// | Discovery   | website-editor                                               | Brand exploration; pages but no commerce yet. |
// | Design      | website-editor                                               | Mood-board / wireframe iteration. |
// | Development | website-editor + ecommerce                                   | Build the storefront. |
// | Onboarding  | website-editor + ecommerce + memberships                     | Add the member tier offering. |
// | Live        | website-editor + ecommerce + memberships + affiliates        | Full customer-facing trio (shop · join · refer). |
// | Churned     | (nothing — old installs flip to enabled:false, config preserved) | Per architecture §7 / Decisions log #4. |
//
// **Soft-fail policy.** Foundation today (R3 wire-up) only registers
// `fulfillment` + `ecommerce` + `website-editor`. The four extra ids
// memberships / affiliates / agency-hr / agency-finance / agency-marketing
// are not yet in `_registry.ts`. Per R3a Bug A, an unregistered id
// causes a hard 422 from the runtime — which would fail every phase
// advance into Onboarding / Live until T1's mass-wire-up round lands.
//
// To prevent that, `TransitionService.advancePhase` and
// `ClientLifecycleService.createWithPhase` treat "plugin not in
// registry" as a SOFT-FAIL: log a WARN activity entry, emit
// `phase.preset_plugin_skipped`, continue. Real registry-side errors
// (auth, dependency, scope) still hard-fail. Same architectural spirit
// as the variant-id soft-fail (Bug B). When T1 wires the new plugins,
// re-running phase advance picks them up automatically.

import { makeId } from "../lib/ids";
import type { AgencyId, PhaseDefinition, PhaseChecklistItem } from "../lib/tenancy";

export interface PhasePresetSeed {
  stage: PhaseDefinition["stage"];
  label: string;
  description: string;
  order: number;
  pluginPreset: string[];
  starterVariantId?: string;
  internalTasks: string[];
  clientTasks: string[];
}

export const DEFAULT_PHASE_PRESETS: readonly PhasePresetSeed[] = [
  {
    stage: "discovery",
    label: "Discovery",
    description: "Initial consultation, scoping, and kick-off.",
    order: 10,
    pluginPreset: ["website-editor"],
    starterVariantId: "starter-discovery",
    internalTasks: [
      "Schedule kickoff call",
      "Send discovery doc",
      "Note budget + timeline",
    ],
    clientTasks: [
      "Complete discovery questionnaire",
      "Provide brand assets",
    ],
  },
  {
    stage: "design",
    label: "Design",
    description: "Mood-boards, wireframes, and the design proposal.",
    order: 20,
    pluginPreset: ["website-editor"],
    starterVariantId: "starter-design",
    // Note: same set as discovery — design extends rather than replaces.
    // Architecture §7: `auto-disable` removes only plugins NOT in the
    // new preset. So discovery → design is a no-op on installs; only
    // the variant + checklist swap.
    internalTasks: [
      "Build mood-board",
      "Wireframe 3 versions",
      "Internal review",
    ],
    clientTasks: [
      "Approve mood-board",
      "Pick wireframe variant",
    ],
  },
  {
    stage: "development",
    label: "Development",
    description: "Build the site / portal / app.",
    order: 30,
    pluginPreset: ["website-editor", "ecommerce"],
    starterVariantId: "starter-development",
    internalTasks: [
      "Convert design to blocks",
      "Wire forms",
      "QA on staging",
    ],
    clientTasks: [
      "Provide content (copy + images)",
      "Test staging URL",
    ],
  },
  {
    stage: "onboarding",
    label: "Onboarding",
    description: "Pre-launch training and plugin configuration.",
    order: 40,
    // Adds memberships — Felicia's tier offering goes live before
    // public launch so existing customers can join during onboarding.
    pluginPreset: ["website-editor", "ecommerce", "memberships"],
    starterVariantId: "starter-onboarding",
    internalTasks: [
      "Set up Stripe",
      "Configure email provider",
      "Train client",
    ],
    clientTasks: [
      "Provide payment processor details",
      "Invite team members",
    ],
  },
  {
    stage: "live",
    label: "Live",
    description: "Site is live; ongoing optimisation.",
    order: 50,
    // Adds affiliates — referral programme launches at Live so members
    // can start earning commissions on referred orders. Memberships
    // already established during Onboarding.
    pluginPreset: ["website-editor", "ecommerce", "memberships", "affiliates"],
    starterVariantId: "starter-live",
    internalTasks: [
      "Weekly performance review",
      "Monthly audit",
    ],
    clientTasks: [
      "Submit support tickets via portal",
      "Review monthly reports",
    ],
  },
  {
    stage: "churned",
    label: "Churned",
    description: "Engagement ended. All plugins disabled, config preserved.",
    order: 60,
    pluginPreset: [],
    internalTasks: [
      "Archive deliverables",
      "Final invoice",
      "Offboard team",
    ],
    clientTasks: [
      "Receive deliverables export",
    ],
  },
] as const;

// Build PhaseDefinition rows from the presets, scoped to a single agency.
// Called once on agency creation; agency owners can edit afterwards.
export function buildDefaultPhases(agencyId: AgencyId): PhaseDefinition[] {
  return DEFAULT_PHASE_PRESETS.map(preset => buildPhaseFromPreset(agencyId, preset));
}

function buildPhaseFromPreset(agencyId: AgencyId, preset: PhasePresetSeed): PhaseDefinition {
  const phaseId = `phase_${agencyId}_${preset.stage}`;
  const checklist: PhaseChecklistItem[] = [
    ...preset.internalTasks.map(label => ({
      id: makeId("task"),
      label,
      visibility: "internal" as const,
    })),
    ...preset.clientTasks.map(label => ({
      id: makeId("task"),
      label,
      visibility: "client" as const,
    })),
  ];
  return {
    id: phaseId,
    agencyId,
    stage: preset.stage,
    label: preset.label,
    description: preset.description,
    order: preset.order,
    pluginPreset: [...preset.pluginPreset],
    portalVariantId: preset.starterVariantId,
    checklist,
  };
}
