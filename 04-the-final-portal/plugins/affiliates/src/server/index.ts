// Server-side barrel — services + container builder + foundation adapter.

export { AffiliateService } from "./affiliates";
export { ReferralCodeService } from "./codes";
export { AttributionService } from "./attributions";
export type { RecordOrderArgs } from "./attributions";
export { PayoutService } from "./payouts";

export type {
  ActivityLogPort,
  AffiliateEventName,
  EcommerceOrderProjection,
  EcommerceOrdersPort,
  EventBusPort,
  ListActivityFilter,
  LogActivityInput,
  PluginInstallStorePort,
  StoragePort,
  TenantPort,
  UserPort,
} from "./ports";

export {
  registerAffiliatesFoundation,
  clearAffiliatesFoundation,
  isFoundationRegistered,
  requireFoundation,
  containerFor,
  containerWithDeps,
  _containerFromCtx,
} from "./foundationAdapter";
export type { AffiliatesFoundation, ContainerForArgs } from "./foundationAdapter";

import type { AgencyId, ClientId } from "../lib/tenancy";
import type { PluginStorage } from "../lib/aquaPluginTypes";
import type {
  ActivityLogPort,
  EcommerceOrdersPort,
  EventBusPort,
  PluginInstallStorePort,
  StoragePort,
  TenantPort,
  UserPort,
} from "./ports";
import { AffiliateService } from "./affiliates";
import { ReferralCodeService } from "./codes";
import { AttributionService } from "./attributions";
import { PayoutService } from "./payouts";

// ─── Container ────────────────────────────────────────────────────────────

export interface AffiliatesDeps {
  agencyId: AgencyId;
  clientId: ClientId;
  storage: PluginStorage | StoragePort;
  activity: ActivityLogPort;
  events: EventBusPort;
  tenant: TenantPort;
  user: UserPort;
  pluginInstalls: PluginInstallStorePort;
  ecommerceOrders: EcommerceOrdersPort;
}

export interface AffiliatesContainer {
  affiliates: AffiliateService;
  codes: ReferralCodeService;
  attributions: AttributionService;
  payouts: PayoutService;
}

export function buildAffiliatesContainer(deps: AffiliatesDeps): AffiliatesContainer {
  const storage = deps.storage as StoragePort;
  const affiliates = new AffiliateService(
    deps.agencyId, deps.clientId, storage, deps.user, deps.activity, deps.events,
  );
  const codes = new ReferralCodeService(
    deps.agencyId, deps.clientId, storage, deps.activity, deps.events, affiliates,
  );
  const attributions = new AttributionService(
    deps.agencyId, deps.clientId, storage, deps.activity, deps.events,
    affiliates, codes, deps.ecommerceOrders,
  );
  const payouts = new PayoutService(
    deps.agencyId, deps.clientId, storage, deps.activity, deps.events,
    affiliates, attributions,
  );
  return { affiliates, codes, attributions, payouts };
}
