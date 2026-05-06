// API route table for @aqua/plugin-ai-builder. Round-7.

import type { PluginApiRoute } from "../lib/aquaPluginTypes";
import {
  generateHandler,
  listGenerationsHandler,
  getGenerationHandler,
  metricsHandler,
  getSettingsHandler,
  saveSettingsHandler,
  statusHandler,
} from "./handlers";

const ADMIN_ROLES = ["agency-owner", "agency-manager", "agency-staff", "client-owner", "client-staff"] as const;

export const ROUTES: PluginApiRoute[] = [
  { path: "status",         methods: ["GET"],  handler: statusHandler,          visibleToRoles: [...ADMIN_ROLES] },
  { path: "generate",       methods: ["POST"], handler: generateHandler,        visibleToRoles: [...ADMIN_ROLES] },
  { path: "generations",    methods: ["GET"],  handler: listGenerationsHandler, visibleToRoles: [...ADMIN_ROLES] },
  { path: "generations/get", methods: ["GET"], handler: getGenerationHandler,   visibleToRoles: [...ADMIN_ROLES] },
  { path: "metrics",        methods: ["GET"],  handler: metricsHandler,         visibleToRoles: [...ADMIN_ROLES] },
  { path: "settings",       methods: ["GET"],  handler: getSettingsHandler,     visibleToRoles: [...ADMIN_ROLES] },
  { path: "settings",       methods: ["POST"], handler: saveSettingsHandler,    visibleToRoles: [...ADMIN_ROLES] },
];
