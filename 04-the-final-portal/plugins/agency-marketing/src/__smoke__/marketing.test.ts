// Agency-marketing plugin smoke. node:test via tsx --test.

import { describe, test, before } from "node:test";
import { strict as assert } from "node:assert";

import type {
  ActivityEntry,
  Agency,
  AgencyId,
  PluginInstall,
  PluginInstallScope,
  UserId,
  UserProjection,
} from "../lib/tenancy";
import type { PluginStorage } from "../lib/aquaPluginTypes";
import type {
  ActivityLogPort,
  EventBusPort,
  PluginInstallStorePort,
  TenantPort,
  UserPort,
} from "../server/ports";
import { containerWithDeps } from "../server/foundationAdapter";

const AGENCY_ID: AgencyId = "agency_mkt_smoke";
const ACTOR: UserId = "user_admin";
const STAFF_ID = "stf_anna";

function buildWorld() {
  const agency: Agency = {
    id: AGENCY_ID, name: "Smoke Marketing Agency", slug: "smoke-mkt",
    brand: { primaryColor: "#000" }, status: "active",
    createdAt: 0, updatedAt: 0,
  };
  const profile: UserProjection = {
    id: STAFF_ID, email: "anna@smoke-mkt.test", name: "Anna", agencyId: AGENCY_ID,
  };

  const data = new Map<string, unknown>();
  const activityLog: ActivityEntry[] = [];
  const events: { name: string; payload: unknown }[] = [];

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
    getAgency: id => (id === AGENCY_ID ? agency : null),
  };
  const user: UserPort = {
    getUser: id => (id === STAFF_ID ? profile : null),
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
    listActivity(filter) { return activityLog.filter(e => e.agencyId === filter.agencyId); },
  };
  const eventBus: EventBusPort = { emit(_scope, name, payload) { events.push({ name, payload }); } };
  const pluginInstalls: PluginInstallStorePort = {
    getInstall(_scope: PluginInstallScope, _pluginId: string): PluginInstall | null { return null; },
  };
  return { storage, tenant, user, activity, events: eventBus, pluginInstalls, inspect: { activityLog, events } };
}

describe("agency-marketing smoke", () => {
  let world: ReturnType<typeof buildWorld>;
  let services: ReturnType<typeof containerWithDeps>;
  let campaignId: string;
  let leadId: string;

  before(() => {
    world = buildWorld();
    services = containerWithDeps({
      agencyId: AGENCY_ID,
      storage: world.storage,
      tenant: world.tenant,
      user: world.user,
      activity: world.activity,
      events: world.events,
      pluginInstalls: world.pluginInstalls,
    });
  });

  test("step 0: seed default email templates (idempotent)", async () => {
    const first = await services.templates.seedDefaults(ACTOR);
    assert.equal(first.seeded, 3, "Welcome / Re-engagement / Newsletter seeded");
    const second = await services.templates.seedDefaults(ACTOR);
    assert.equal(second.seeded, 0);
    assert.equal(second.existed, 3);

    const list = await services.templates.list();
    assert.equal(list.length, 3);
    assert.deepEqual(list.map(t => t.name).sort(), ["Newsletter", "Re-engagement", "Welcome"]);
    assert.ok(list.every(t => t.isDefault));
  });

  test("step 1: campaign create + status state-machine", async () => {
    const cmp = await services.campaigns.create({
      name: "Spring 2026 launch",
      channel: "email",
      budgetCents: 50000,
      goalKpi: "leads",
      goalTarget: 100,
      ownerStaffId: STAFF_ID,
    }, ACTOR);
    campaignId = cmp.id;
    assert.equal(cmp.status, "draft");
    assert.equal(cmp.budgetCents, 50000);

    // draft → scheduled
    let next = await services.campaigns.update(campaignId, { status: "scheduled" }, ACTOR);
    assert.equal(next?.status, "scheduled");

    // scheduled → running
    next = await services.campaigns.update(campaignId, { status: "running" }, ACTOR);
    assert.equal(next?.status, "running");

    // Cannot go directly back to draft
    await assert.rejects(
      services.campaigns.update(campaignId, { status: "draft" }, ACTOR),
      /Cannot transition/i,
    );

    // running → paused → completed
    next = await services.campaigns.update(campaignId, { status: "paused" }, ACTOR);
    assert.equal(next?.status, "paused");
    next = await services.campaigns.update(campaignId, { status: "completed" }, ACTOR);
    assert.equal(next?.status, "completed");
  });

  test("step 2: campaign delete only on draft", async () => {
    // Existing campaign is "completed" — delete rejected.
    await assert.rejects(
      services.campaigns.delete(campaignId, ACTOR),
      /Only draft/i,
    );
    // A fresh draft can be deleted.
    const d = await services.campaigns.create({ name: "Throwaway", channel: "social" }, ACTOR);
    const ok = await services.campaigns.delete(d.id, ACTOR);
    assert.equal(ok, true);
  });

  test("step 3: lead create + duplicate-email rejected + funnel transitions", async () => {
    const lead = await services.leads.create({
      email: "Marie@example.com",
      name: "Marie",
      campaignId,
      source: "campaign",
    }, ACTOR);
    leadId = lead.id;
    assert.equal(lead.status, "new");
    assert.equal(lead.campaignId, campaignId);

    // Duplicate email rejected.
    await assert.rejects(
      services.leads.create({ email: "marie@example.com", name: "Different" }, ACTOR),
      /already exists/i,
    );

    // recordContact bumps new → contacted + records history.
    const contacted = await services.leads.recordContact(leadId, "Sent intro deck", ACTOR);
    assert.equal(contacted?.status, "contacted");
    assert.equal(contacted?.contactHistory.length, 1);
    assert.equal(contacted?.contactHistory[0]?.note, "Sent intro deck");
    assert.ok(contacted?.lastContactedAt);

    // contacted → qualified
    const qualified = await services.leads.update(leadId, { status: "qualified" }, ACTOR);
    assert.equal(qualified?.status, "qualified");

    // qualified → converted (terminal)
    const converted = await services.leads.update(leadId, { status: "converted" }, ACTOR);
    assert.equal(converted?.status, "converted");

    // Cannot un-convert.
    await assert.rejects(
      services.leads.update(leadId, { status: "contacted" }, ACTOR),
      /Cannot transition/i,
    );
  });

  test("step 4: lead getByEmail + listForCampaign", async () => {
    const found = await services.leads.getByEmail("MARIE@example.com");
    assert.ok(found);
    assert.equal(found?.id, leadId);

    const inCampaign = await services.leads.listForCampaign(campaignId);
    assert.equal(inCampaign.length, 1);
    assert.equal(inCampaign[0]?.id, leadId);

    // Unknown email → null.
    const missing = await services.leads.getByEmail("nobody@nowhere.test");
    assert.equal(missing, null);
  });

  test("step 5: template create + render with placeholders", async () => {
    const tpl = await services.templates.create({
      name: "Custom one-off",
      subject: "Hello {{firstName}}",
      bodyHtml: "<p>Hi {{firstName}}, welcome to {{agencyName}}!</p>",
      category: "transactional",
    }, ACTOR);
    assert.equal(tpl.status, "active");
    assert.equal(tpl.isDefault, false);

    const subject = services.templates.renderSubject(tpl, { firstName: "Marie" });
    assert.equal(subject, "Hello Marie");

    const body = services.templates.renderHtml(tpl, { firstName: "Marie", agencyName: "Milesy" });
    assert.match(body, /Hi Marie, welcome to Milesy!/);

    // Missing var renders as `{{key}}` literal.
    const partial = services.templates.renderSubject(tpl, {});
    assert.equal(partial, "Hello {{firstName}}");
  });

  test("step 6: campaignSnapshot + leadFunnel aggregates", async () => {
    const from = Date.now() - 365 * 86400_000;
    const to = Date.now() + 86400_000;
    const camps = await services.reports.campaignSnapshot({ from, to });
    assert.equal(camps.totalCampaigns, 1, "throwaway was deleted, only Spring remains");
    assert.equal(camps.totalBudgetCents, 50000);
    const emailRow = camps.byChannel.find(r => r.channel === "email");
    assert.equal(emailRow?.count, 1);

    const funnel = await services.reports.leadFunnel({ from, to });
    assert.equal(funnel.total, 1);
    assert.equal(funnel.convertedCount, 1);
    assert.equal(funnel.conversionRate, 1);
    assert.deepEqual(funnel.byStatus, [{ status: "converted", count: 1 }]);

    const cmpStats = await services.reports.campaignLeadStats(campaignId);
    assert.equal(cmpStats.total, 1);
    assert.equal(cmpStats.converted, 1);
    assert.equal(cmpStats.conversionRate, 1);
  });

  test("step 7: side-effects — activity + events", async () => {
    const log = await world.activity.listActivity({ agencyId: AGENCY_ID, limit: 100 });
    const actions = log.map(e => e.action);
    assert.ok(actions.includes("template.created"));
    assert.ok(actions.includes("campaign.created"));
    assert.ok(actions.includes("campaign.scheduled"));
    assert.ok(actions.includes("campaign.started"));
    assert.ok(actions.includes("campaign.paused"));
    assert.ok(actions.includes("campaign.completed"));
    assert.ok(actions.includes("lead.created"));
    assert.ok(actions.includes("lead.contacted"));
    assert.ok(actions.includes("lead.converted"));

    const eventNames = world.inspect.events.map(e => e.name);
    assert.ok(eventNames.includes("template.created"));
    assert.ok(eventNames.includes("campaign.created"));
    assert.ok(eventNames.includes("lead.created"));
    assert.ok(eventNames.includes("lead.converted"));
  });
});
