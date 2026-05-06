// Manifest API routes — mounted at `/api/portal/agency-marketing/...`.

import type { PluginApiRoute } from "../lib/aquaPluginTypes";
import {
  contactLeadHandler,
  createCampaignHandler,
  createLeadHandler,
  createTemplateHandler,
  deleteCampaignHandler,
  listCampaignsHandler,
  listLeadsHandler,
  listTemplatesHandler,
  reportCampaignsHandler,
  reportLeadsHandler,
  updateCampaignHandler,
  updateLeadHandler,
  updateTemplateHandler,
} from "./handlers";

const AGENCY_ADMINS = ["agency-owner", "agency-manager"] as const;
const AGENCY_VIEWERS = ["agency-owner", "agency-manager", "agency-staff"] as const;

export const ROUTES: PluginApiRoute[] = [
  // Campaigns (4 routes)
  { path: "campaigns", methods: ["GET"], handler: listCampaignsHandler, visibleToRoles: [...AGENCY_VIEWERS] },
  { path: "campaigns", methods: ["POST"], handler: createCampaignHandler, visibleToRoles: [...AGENCY_ADMINS] },
  { path: "campaigns", methods: ["PATCH"], handler: updateCampaignHandler, visibleToRoles: [...AGENCY_ADMINS] },
  { path: "campaigns", methods: ["DELETE"], handler: deleteCampaignHandler, visibleToRoles: [...AGENCY_ADMINS] },

  // Leads (4 routes)
  { path: "leads", methods: ["GET"], handler: listLeadsHandler, visibleToRoles: [...AGENCY_VIEWERS] },
  { path: "leads", methods: ["POST"], handler: createLeadHandler, visibleToRoles: [...AGENCY_VIEWERS] },
  { path: "leads", methods: ["PATCH"], handler: updateLeadHandler, visibleToRoles: [...AGENCY_VIEWERS] },
  { path: "leads/contact", methods: ["POST"], handler: contactLeadHandler, visibleToRoles: [...AGENCY_VIEWERS] },

  // Templates (3 routes)
  { path: "templates", methods: ["GET"], handler: listTemplatesHandler, visibleToRoles: [...AGENCY_VIEWERS] },
  { path: "templates", methods: ["POST"], handler: createTemplateHandler, visibleToRoles: [...AGENCY_ADMINS] },
  { path: "templates", methods: ["PATCH"], handler: updateTemplateHandler, visibleToRoles: [...AGENCY_ADMINS] },

  // Reports (2 routes)
  { path: "reports/campaigns", methods: ["GET"], handler: reportCampaignsHandler, visibleToRoles: [...AGENCY_VIEWERS] },
  { path: "reports/leads", methods: ["GET"], handler: reportLeadsHandler, visibleToRoles: [...AGENCY_VIEWERS] },
];
