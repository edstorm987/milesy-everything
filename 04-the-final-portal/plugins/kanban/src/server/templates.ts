// Read-only template registry. Templates are bundled — operators pick
// one at board-creation time. After creation, columns + cards are
// fully editable; the templateId is preserved on the Board for
// metadata only.

import type { TemplateDefinition, TemplateId } from "../lib/domain";

export const TEMPLATES: Record<TemplateId, TemplateDefinition> = {
  "fulfillment-mirror": {
    id: "fulfillment-mirror",
    name: "Fulfillment mirror",
    description:
      "Discovery / Development / Onboarding / Live — mirrors the fulfillment phase-board for teams that want a flexible scratchpad alongside the rigid lifecycle.",
    columns: [
      { label: "Discovery" },
      { label: "Development" },
      { label: "Onboarding" },
      { label: "Live" },
    ],
    cards: [
      { columnIndex: 0, title: "Kickoff call notes", tags: ["sample"] },
      { columnIndex: 1, title: "Build storefront", tags: ["sample"] },
    ],
  },
  "lead-pipeline": {
    id: "lead-pipeline",
    name: "Lead pipeline",
    description: "New / Qualified / Proposal / Won / Lost — classic sales funnel.",
    columns: [
      { label: "New" },
      { label: "Qualified" },
      { label: "Proposal" },
      { label: "Won", color: "#16a34a" },
      { label: "Lost", color: "#dc2626" },
    ],
    cards: [
      { columnIndex: 0, title: "Inbound from website form", tags: ["sample"] },
      { columnIndex: 1, title: "Discovery call booked", tags: ["sample"] },
    ],
  },
  "client-tasks": {
    id: "client-tasks",
    name: "Client tasks",
    description: "Backlog / Doing / Review / Done — generic task tracker.",
    columns: [
      { label: "Backlog" },
      { label: "Doing" },
      { label: "Review" },
      { label: "Done", color: "#16a34a" },
    ],
    cards: [
      { columnIndex: 0, title: "Sample task", tags: ["sample"] },
      { columnIndex: 1, title: "Sample task in progress", tags: ["sample"] },
    ],
  },
  "blank": {
    id: "blank",
    name: "Blank",
    description: "Single 'To do' column. Build the board your way.",
    columns: [{ label: "To do" }],
    cards: [],
  },
};

export function getTemplate(id: TemplateId): TemplateDefinition {
  const t = TEMPLATES[id];
  if (!t) throw new Error(`Unknown kanban template: ${id}`);
  return t;
}

export function listTemplates(): TemplateDefinition[] {
  return Object.values(TEMPLATES);
}
