// Server-side barrel — three services + container builder + foundation
// adapter exports. Same shape as fulfillment + ecommerce so the
// foundation's wire-up code is symmetrical across plugins.

export { StaffService } from "./staff";
export { DepartmentService, DEFAULT_DEPARTMENTS } from "./departments";
export { LeaveService } from "./leave";

export type {
  ActivityLogPort,
  EventBusPort,
  HrEventName,
  ListActivityFilter,
  LogActivityInput,
  PluginInstallStorePort,
  TenantPort,
} from "./ports";

export {
  registerAgencyHrFoundation,
  clearAgencyHrFoundation,
  isFoundationRegistered,
  requireFoundation,
  containerFor,
  containerWithDeps,
  _containerFromCtx,
} from "./foundationAdapter";
export type { AgencyHrFoundation } from "./foundationAdapter";

import type { AgencyId } from "../lib/tenancy";
import type { PluginStorage } from "../lib/aquaPluginTypes";
import type {
  ActivityLogPort,
  EventBusPort,
  PluginInstallStorePort,
  TenantPort,
} from "./ports";
import { StaffService } from "./staff";
import { DepartmentService } from "./departments";
import { LeaveService } from "./leave";

// ─── Container ────────────────────────────────────────────────────────────

export interface AgencyHrDeps {
  agencyId: AgencyId;
  storage: PluginStorage;
  activity: ActivityLogPort;
  events: EventBusPort;
  tenant: TenantPort;
  pluginInstalls: PluginInstallStorePort;
}

export interface AgencyHrContainer {
  staff: StaffService;
  departments: DepartmentService;
  leave: LeaveService;
}

export function buildAgencyHrContainer(deps: AgencyHrDeps): AgencyHrContainer {
  const staff = new StaffService(deps.agencyId, deps.storage, deps.activity, deps.events);
  const departments = new DepartmentService(deps.agencyId, deps.storage, deps.activity, deps.events);
  const leave = new LeaveService(deps.agencyId, deps.storage, deps.activity, deps.events, staff);
  return { staff, departments, leave };
}
