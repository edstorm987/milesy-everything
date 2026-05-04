// Server-side barrel — services + container builder + foundation adapter.

export { CategoryService, DEFAULT_CATEGORIES } from "./categories";
export { InvoiceService } from "./invoices";
export { ExpenseService } from "./expenses";
export { ReportService } from "./reports";

export type {
  ActivityLogPort,
  EventBusPort,
  FinanceEventName,
  ListActivityFilter,
  LogActivityInput,
  PluginInstallStorePort,
  StoragePort,
  TenantPort,
  UserPort,
} from "./ports";

export {
  registerAgencyFinanceFoundation,
  clearAgencyFinanceFoundation,
  isFoundationRegistered,
  requireFoundation,
  containerFor,
  containerWithDeps,
  _containerFromCtx,
} from "./foundationAdapter";
export type { AgencyFinanceFoundation, ContainerForArgs } from "./foundationAdapter";

import type { AgencyId } from "../lib/tenancy";
import type { PluginStorage } from "../lib/aquaPluginTypes";
import type {
  ActivityLogPort,
  EventBusPort,
  PluginInstallStorePort,
  StoragePort,
  TenantPort,
  UserPort,
} from "./ports";
import { CategoryService } from "./categories";
import { InvoiceService } from "./invoices";
import { ExpenseService } from "./expenses";
import { ReportService } from "./reports";

// ─── Container ────────────────────────────────────────────────────────────

export interface AgencyFinanceDeps {
  agencyId: AgencyId;
  storage: PluginStorage | StoragePort;
  activity: ActivityLogPort;
  events: EventBusPort;
  tenant: TenantPort;
  user: UserPort;
  pluginInstalls: PluginInstallStorePort;
}

export interface AgencyFinanceContainer {
  invoices: InvoiceService;
  expenses: ExpenseService;
  categories: CategoryService;
  reports: ReportService;
}

export function buildAgencyFinanceContainer(deps: AgencyFinanceDeps): AgencyFinanceContainer {
  const storage = deps.storage as StoragePort;
  const categories = new CategoryService(deps.agencyId, storage, deps.activity, deps.events);
  const invoices = new InvoiceService(deps.agencyId, storage, deps.tenant, deps.activity, deps.events);
  const expenses = new ExpenseService(deps.agencyId, storage, deps.activity, deps.events, categories);
  const reports = new ReportService(deps.agencyId, invoices, expenses, categories);
  return { invoices, expenses, categories, reports };
}
