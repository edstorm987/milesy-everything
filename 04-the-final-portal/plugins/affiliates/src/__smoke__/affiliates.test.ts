// Affiliates plugin smoke. node:test via tsx --test.
//
// Builds an in-memory foundation + a mock EcommerceOrdersPort that
// stages orders with `referralCodeId`s, and walks the lifecycle:
//
//   - enroll happy path + double-enrol rejection
//   - findByCode returns active code, archived returns null
//   - recordOrder creates pending Attribution; second call same orderId is idempotent
//   - approve flips pending → approved; double-approve no-op
//   - schedule rolls approved → Payout; pending excluded
//   - markPaid flips attributions to paid + bumps lifetime earnings
//   - side-effects: activity log + event bus

import { describe, test, before } from "node:test";
import { strict as assert } from "node:assert";

import type {
  ActivityEntry,
  AgencyId,
  Client,
  ClientId,
  EndCustomerProfile,
  PluginInstall,
  PluginInstallScope,
  UserId,
} from "../lib/tenancy";
import type { PluginStorage } from "../lib/aquaPluginTypes";
import type {
  ActivityLogPort,
  EcommerceOrderProjection,
  EcommerceOrdersPort,
  EventBusPort,
  PluginInstallStorePort,
  TenantPort,
  UserPort,
} from "../server/ports";
import { containerWithDeps } from "../server/foundationAdapter";

const AGENCY_ID: AgencyId = "agency_aff_smoke";
const CLIENT_ID: ClientId = "client_aff_smoke";
const ACTOR: UserId = "user_admin";
const ALICE: UserId = "user_alice";              // becomes affiliate
const BOB_BUYER: UserId = "user_bob_buyer";      // referred customer

function buildWorld() {
  const data = new Map<string, unknown>();
  const activityLog: ActivityEntry[] = [];
  const events: { name: string; payload: unknown }[] = [];
  const orders = new Map<string, EcommerceOrderProjection>();

  const client: Client = {
    id: CLIENT_ID, agencyId: AGENCY_ID, name: "Smoke Affiliate Co", slug: "smoke-aff",
    brand: { primaryColor: "#000" }, stage: "live", status: "active",
    createdAt: 0, updatedAt: 0,
  };
  const profiles: Record<string, EndCustomerProfile> = {
    [ALICE]: { id: ALICE, email: "alice@smoke-aff.test", name: "Alice", agencyId: AGENCY_ID, clientId: CLIENT_ID },
  };

  const storage: PluginStorage = {
    async get<T = unknown>(key: string): Promise<T | undefined> { return data.get(key) as T | undefined; },
    async set<T = unknown>(key: string, value: T): Promise<void> { data.set(key, value); },
    async del(key: string): Promise<void> { data.delete(key); },
    async list(prefix?: string): Promise<string[]> {
      const keys = [...data.keys()];
      return prefix ? keys.filter(k => k.startsWith(prefix)) : keys;
    },
  };
  const tenant: TenantPort = {
    getClient: id => (id === CLIENT_ID ? client : null),
    getClientForAgency: (a, id) => (a === AGENCY_ID && id === CLIENT_ID ? client : null),
  };
  const user: UserPort = {
    getUser: id => profiles[id] ?? null,
  };
  let actSeq = 1;
  const activity: ActivityLogPort = {
    logActivity(input) {
      const entry: ActivityEntry = {
        id: `act_${String(actSeq++).padStart(4, "0")}`,
        ts: Date.now(),
        agencyId: input.agencyId, clientId: input.clientId,
        actorUserId: input.actorUserId, actorEmail: input.actorEmail,
        category: input.category, action: input.action, message: input.message,
        metadata: input.metadata,
      };
      activityLog.push(entry);
      return entry;
    },
    listActivity(filter) {
      return activityLog.filter(e => e.agencyId === filter.agencyId);
    },
  };
  const eventBus: EventBusPort = { emit(_scope, name, payload) { events.push({ name, payload }); } };
  const pluginInstalls: PluginInstallStorePort = {
    getInstall(_scope: PluginInstallScope, _pluginId: string): PluginInstall | null { return null; },
  };
  const ecommerceOrders: EcommerceOrdersPort = {
    async getOrder(args) { return orders.get(args.orderId) ?? null; },
  };
  return {
    storage, tenant, user, activity, events: eventBus, pluginInstalls, ecommerceOrders,
    inspect: { activityLog, events, orders },
  };
}

describe("affiliates smoke", () => {
  let world: ReturnType<typeof buildWorld>;
  let services: ReturnType<typeof containerWithDeps>;
  let aliceAffiliateId: string;
  let codeId: string;
  let codeRaw: string;
  let attribution1Id: string;

  before(() => {
    world = buildWorld();
    services = containerWithDeps({
      agencyId: AGENCY_ID, clientId: CLIENT_ID,
      storage: world.storage,
      tenant: world.tenant, user: world.user,
      activity: world.activity, events: world.events,
      pluginInstalls: world.pluginInstalls,
      ecommerceOrders: world.ecommerceOrders,
    });
  });

  test("step 0: enroll + double-enrol rejected", async () => {
    const aff = await services.affiliates.enroll({
      endCustomerUserId: ALICE,
      displayName: "Alice the Affiliate",
      payoutEmail: "alice-payouts@smoke-aff.test",
    }, ACTOR);
    aliceAffiliateId = aff.id;
    assert.equal(aff.status, "pending", "enrolment lands in pending");
    assert.equal(aff.totalReferred, 0);

    await assert.rejects(
      services.affiliates.enroll({
        endCustomerUserId: ALICE,
        displayName: "Alice 2",
        payoutEmail: "x@y.z",
      }, ACTOR),
      /already an affiliate/i,
    );

    // Owner approves.
    const updated = await services.affiliates.update(aliceAffiliateId, { status: "active" }, ACTOR);
    assert.equal(updated?.status, "active");
  });

  test("step 1: create code + findByCode + collision detection", async () => {
    const code = await services.codes.create({
      affiliateId: aliceAffiliateId,
      code: "ALICE10",
    }, ACTOR);
    codeId = code.id;
    codeRaw = code.code;
    assert.equal(code.code, "ALICE10");
    assert.equal(code.status, "active");
    assert.equal(code.redemptionCount, 0);

    // findByCode is case-insensitive + active-only.
    const found = await services.codes.findByCode("alice10");
    assert.ok(found);
    assert.equal(found?.id, code.id);

    // Collision rejected.
    await assert.rejects(
      services.codes.create({ affiliateId: aliceAffiliateId, code: "ALICE10" }, ACTOR),
      /already exists/i,
    );

    // Archived code not returned by findByCode.
    const arch = await services.codes.create({ affiliateId: aliceAffiliateId, code: "ARCHIVED1" }, ACTOR);
    await services.codes.update(arch.id, { status: "archived" }, ACTOR);
    const afterArchive = await services.codes.findByCode("ARCHIVED1");
    assert.equal(afterArchive, null, "archived code returns null");
  });

  test("step 2: recordOrder creates pending Attribution + idempotent", async () => {
    // Stage an ecommerce order that carries the referral code.
    world.inspect.orders.set("ord_001", {
      id: "ord_001",
      agencyId: AGENCY_ID,
      clientId: CLIENT_ID,
      endCustomerUserId: BOB_BUYER,
      amountTotal: 4500,           // post-discount
      currency: "usd",
      subtotal: 5000,              // pre-discount
      referralCodeId: codeId,
      createdAt: Date.now(),
    });

    const attr = await services.attributions.recordOrder({
      orderId: "ord_001",
      defaultCommissionPercent: 10,
    });
    assert.ok(attr);
    attribution1Id = attr!.id;
    assert.equal(attr?.status, "pending");
    assert.equal(attr?.commissionPercentSnapshot, 10);
    assert.equal(attr?.amountCents, 500);              // 10% of 5000

    // Idempotent — same orderId returns the same row.
    const second = await services.attributions.recordOrder({
      orderId: "ord_001",
      defaultCommissionPercent: 10,
    });
    assert.equal(second?.id, attr?.id);

    // Affiliate counters bumped.
    const aff = await services.affiliates.get(aliceAffiliateId);
    assert.equal(aff?.totalReferred, 1);

    // Code redemption count bumped.
    const code = await services.codes.get(codeId);
    assert.equal(code?.redemptionCount, 1);
  });

  test("step 3: recordOrder skipped when no code", async () => {
    world.inspect.orders.set("ord_no_code", {
      id: "ord_no_code", agencyId: AGENCY_ID, clientId: CLIENT_ID,
      amountTotal: 3000, currency: "usd", subtotal: 3000,
      createdAt: Date.now(),
    });
    const attr = await services.attributions.recordOrder({
      orderId: "ord_no_code",
      defaultCommissionPercent: 10,
    });
    assert.equal(attr, null, "no code → no attribution");
  });

  test("step 4: approve flips pending → approved (idempotent on approved)", async () => {
    const out = await services.attributions.approve(attribution1Id, ACTOR);
    assert.equal(out?.status, "approved");
    assert.ok(out?.approvedAt);

    // Double-approve is a no-op (returns same status).
    const second = await services.attributions.approve(attribution1Id, ACTOR);
    assert.equal(second?.status, "approved");
  });

  test("step 5: schedule rolls only approved attributions into Payout", async () => {
    // Create a second order so we have a pending attribution to exclude.
    world.inspect.orders.set("ord_002", {
      id: "ord_002", agencyId: AGENCY_ID, clientId: CLIENT_ID,
      endCustomerUserId: BOB_BUYER,
      amountTotal: 2000, currency: "usd", subtotal: 2000,
      referralCodeId: codeId,
      createdAt: Date.now(),
    });
    const second = await services.attributions.recordOrder({
      orderId: "ord_002",
      defaultCommissionPercent: 10,
    });
    assert.equal(second?.status, "pending");

    const payout = await services.payouts.schedule(
      { affiliateId: aliceAffiliateId },
      ACTOR,
      "manual",
    );
    assert.ok(payout);
    assert.equal(payout?.status, "scheduled");
    assert.equal(payout?.method, "manual");
    assert.equal(payout?.attributionIds.length, 1, "only the approved attribution rolled in");
    assert.equal(payout?.amountCents, 500);

    // markPaid flips both the payout AND its rolled attributions.
    const paid = await services.payouts.markPaid(payout!.id, {
      externalRef: "PP-ABC123",
    }, ACTOR);
    assert.equal(paid?.status, "completed");
    assert.equal(paid?.externalRef, "PP-ABC123");

    const attr = await services.attributions.get(attribution1Id);
    assert.equal(attr?.status, "paid");
    assert.equal(attr?.payoutId, payout!.id);

    // Lifetime earnings bumped.
    const aff = await services.affiliates.get(aliceAffiliateId);
    assert.equal(aff?.lifetimeEarnings, 500);
  });

  test("step 6: schedule with no approved attributions returns null", async () => {
    const out = await services.payouts.schedule(
      { affiliateId: aliceAffiliateId },
      ACTOR,
      "manual",
    );
    assert.equal(out, null, "no approved attributions → no payout scheduled");
  });

  test("step 7: side-effects — activity log + event bus", async () => {
    const log = await world.activity.listActivity({ agencyId: AGENCY_ID, limit: 100 });
    const actions = log.map(e => e.action);
    assert.ok(actions.includes("affiliate.enrolled"));
    assert.ok(actions.includes("affiliate.code_created"));
    assert.ok(actions.includes("affiliate.attribution_recorded"));
    assert.ok(actions.includes("affiliate.attribution_approved"));
    assert.ok(actions.includes("affiliate.payout_scheduled"));
    assert.ok(actions.includes("affiliate.payout_completed"));

    const eventNames = world.inspect.events.map(e => e.name);
    assert.ok(eventNames.includes("affiliate.enrolled"));
    assert.ok(eventNames.includes("affiliate.code_created"));
    assert.ok(eventNames.includes("affiliate.attribution_recorded"));
    assert.ok(eventNames.includes("affiliate.payout_scheduled"));
    assert.ok(eventNames.includes("affiliate.payout_completed"));
  });

  test("step 8: customer view — getByUser + listForAffiliate", async () => {
    const aff = await services.affiliates.getByUser(ALICE);
    assert.ok(aff);
    assert.equal(aff?.id, aliceAffiliateId);

    const forAff = await services.attributions.listForAffiliate(aliceAffiliateId);
    assert.equal(forAff.length, 2, "both attributions surface");

    const codes = await services.codes.list({ affiliateId: aliceAffiliateId });
    assert.equal(codes.length, 2, "active + archived both list");
  });
});
