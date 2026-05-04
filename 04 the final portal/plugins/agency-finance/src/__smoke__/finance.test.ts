// Agency-finance plugin smoke. node:test via tsx --test.
//
// Walks: seedDefaults idempotent, invoice CRUD + status transitions,
// expense submit → approve → reimburse, revenueSnapshot aggregates,
// activity log + event bus side-effects.

import { describe, test, before } from "node:test";
import { strict as assert } from "node:assert";

import type {
  ActivityEntry,
  Agency,
  AgencyId,
  Client,
  ClientId,
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

const AGENCY_ID: AgencyId = "agency_fin_smoke";
const CLIENT_ID: ClientId = "client_fin_smoke";
const ACTOR: UserId = "user_admin";
const STAFF_ID: UserId = "user_staff";

function buildWorld() {
  const agency: Agency = {
    id: AGENCY_ID, name: "Smoke Finance Agency", slug: "smoke-fin",
    brand: { primaryColor: "#000" }, status: "active",
    createdAt: 0, updatedAt: 0,
  };
  const client: Client = {
    id: CLIENT_ID, agencyId: AGENCY_ID, name: "Felicia Smoke", slug: "felicia",
    brand: { primaryColor: "#f80" }, stage: "live", status: "active",
    createdAt: 0, updatedAt: 0,
  };
  const profile: UserProjection = {
    id: STAFF_ID, email: "staff@smoke-fin.test", name: "Staff Member", agencyId: AGENCY_ID,
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
    getClient: id => (id === CLIENT_ID ? client : null),
    getClientForAgency: (a, id) => (a === AGENCY_ID && id === CLIENT_ID ? client : null),
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
  return {
    storage, tenant, user, activity, events: eventBus, pluginInstalls,
    inspect: { activityLog, events },
  };
}

describe("agency-finance smoke", () => {
  let world: ReturnType<typeof buildWorld>;
  let services: ReturnType<typeof containerWithDeps>;
  let categoryId: string;
  let invoiceId: string;
  let expenseId: string;

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

  test("step 0: seed default categories (idempotent)", async () => {
    const first = await services.categories.seedDefaults(ACTOR);
    assert.equal(first.seeded, 6, "six default categories seeded");
    const second = await services.categories.seedDefaults(ACTOR);
    assert.equal(second.seeded, 0);
    assert.equal(second.existed, 6);

    const list = await services.categories.list();
    assert.deepEqual(
      list.map(c => c.name).sort(),
      ["Marketing", "Office", "Other", "Salaries", "Software", "Travel"],
    );
    assert.ok(list.every(c => c.isDefault));
    categoryId = list.find(c => c.name === "Software")!.id;
  });

  test("step 1: create category fails on duplicate name", async () => {
    await assert.rejects(
      services.categories.create({ name: "software" }, ACTOR),
      /already exists/i,
    );
    // Adding a new unique category works.
    const cat = await services.categories.create({ name: "R&D" }, ACTOR);
    assert.equal(cat.isDefault, false);
  });

  test("step 2: invoice create + status transitions + markPaid", async () => {
    const inv = await services.invoices.create({
      clientId: CLIENT_ID,
      dueAt: Date.now() + 30 * 86400_000,
      lineItems: [
        { description: "Design retainer", quantity: 1, unitCents: 200000 },
        { description: "Hours over budget", quantity: 5, unitCents: 15000 },
      ],
      taxCents: 5000,
      currency: "usd",
    }, ACTOR);
    invoiceId = inv.id;
    assert.equal(inv.status, "draft");
    assert.equal(inv.subtotalCents, 200000 + 5 * 15000);          // 275000
    assert.equal(inv.totalCents, 275000 + 5000);                  // 280000
    assert.match(inv.number, /^INV-\d{4}-\d{4}$/);

    // draft → sent
    const sent = await services.invoices.update(invoiceId, { status: "sent" }, ACTOR);
    assert.equal(sent?.status, "sent");

    // Cannot delete a non-draft invoice.
    await assert.rejects(
      services.invoices.delete(invoiceId, ACTOR),
      /Only draft/i,
    );

    // update() refuses status:"paid" — markPaid is the sole path so
    // paidAt + paidVia + externalRef + activity + event fire together.
    await assert.rejects(
      services.invoices.update(invoiceId, { status: "paid" }, ACTOR),
      /Use markPaid/i,
    );
  });

  test("step 3: markPaid records payment + activity + event", async () => {
    const before = world.inspect.events.filter(e => e.name === "invoice.paid").length;
    const paid = await services.invoices.markPaid(invoiceId, {
      externalRef: "BANK-TXN-1234",
      paidVia: "bank-transfer",
    }, ACTOR);
    assert.equal(paid?.status, "paid");
    assert.equal(paid?.paidVia, "bank-transfer");
    assert.equal(paid?.externalRef, "BANK-TXN-1234");

    // Idempotent — second markPaid is a no-op.
    const second = await services.invoices.markPaid(invoiceId, { externalRef: "ignored" }, ACTOR);
    assert.equal(second?.externalRef, "BANK-TXN-1234", "first ref preserved");

    const after = world.inspect.events.filter(e => e.name === "invoice.paid").length;
    assert.equal(after, before + 1);
  });

  test("step 4: invoice HTML render", async () => {
    const html = await services.invoices.renderInvoiceHtml(invoiceId);
    assert.ok(html);
    assert.match(html ?? "", /INV-\d{4}-\d{4}/);
    assert.match(html ?? "", /Design retainer/);
    assert.match(html ?? "", /Felicia Smoke/);
  });

  test("step 5: expense submit → approve → reimburse", async () => {
    const exp = await services.expenses.create({
      categoryId,
      vendor: "GitHub",
      description: "Annual GitHub team plan",
      amountCents: 30000,
      staffId: STAFF_ID,
    }, ACTOR);
    expenseId = exp.id;
    assert.equal(exp.status, "pending");

    // Cannot reimburse without approval first.
    await assert.rejects(
      services.expenses.reimburse(expenseId, ACTOR),
      /must be approved/i,
    );

    const approved = await services.expenses.approve(expenseId, ACTOR, "Looks good");
    assert.equal(approved?.status, "approved");
    assert.equal(approved?.decisionNote, "Looks good");

    // Approving twice is a no-op (idempotent).
    const second = await services.expenses.approve(expenseId, ACTOR);
    assert.equal(second?.status, "approved");

    const reimbursed = await services.expenses.reimburse(expenseId, ACTOR);
    assert.equal(reimbursed?.status, "reimbursed");
    assert.ok(reimbursed?.reimbursedAt);
  });

  test("step 6: expense reject path", async () => {
    const exp = await services.expenses.create({
      categoryId,
      vendor: "Suspicious vendor",
      amountCents: 99999,
    }, ACTOR);
    const rejected = await services.expenses.reject(exp.id, ACTOR, "Out of policy");
    assert.equal(rejected?.status, "rejected");
    assert.equal(rejected?.decisionNote, "Out of policy");

    // Cannot edit a rejected expense.
    await assert.rejects(
      services.expenses.update(exp.id, { vendor: "Different" }, ACTOR),
      /Cannot edit/i,
    );
  });

  test("step 7: revenueSnapshot aggregates", async () => {
    const from = Date.now() - 365 * 86400_000;
    const to = Date.now() + 86400_000;
    const snap = await services.reports.revenueSnapshot({ from, to, currency: "usd" });
    assert.equal(snap.invoicesIssued, 1);
    assert.equal(snap.invoicesPaid, 1);
    assert.equal(snap.totalIssuedCents, 280000);
    assert.equal(snap.totalPaidCents, 280000);
    assert.equal(snap.totalExpensesCents, 30000, "only reimbursed expense counts");
    assert.equal(snap.netCents, 280000 - 30000);

    // Two expenses by category — but only Software (reimbursed +
    // rejected — wait, rejected gets filtered out). The Software
    // category has 1 reimbursed (30000); Suspicious-vendor on
    // Software is rejected → excluded.
    const softwareAgg = snap.expensesByCategory.find(c => c.categoryName === "Software");
    assert.ok(softwareAgg);
    assert.equal(softwareAgg?.amountCents, 30000);
    assert.equal(softwareAgg?.count, 1);
  });

  test("step 8: side-effects — activity + event bus", async () => {
    const log = await world.activity.listActivity({ agencyId: AGENCY_ID, limit: 100 });
    const actions = log.map(e => e.action);
    assert.ok(actions.includes("invoice.created"));
    assert.ok(actions.includes("invoice.sent"));
    assert.ok(actions.includes("invoice.paid"));
    assert.ok(actions.includes("expense.created"));
    assert.ok(actions.includes("expense.approved"));
    assert.ok(actions.includes("expense.reimbursed"));
    assert.ok(actions.includes("expense.rejected"));

    const eventNames = world.inspect.events.map(e => e.name);
    assert.ok(eventNames.includes("invoice.created"));
    assert.ok(eventNames.includes("invoice.sent"));
    assert.ok(eventNames.includes("invoice.paid"));
    assert.ok(eventNames.includes("expense.created"));
    assert.ok(eventNames.includes("expense.approved"));
    assert.ok(eventNames.includes("expense.reimbursed"));
    assert.ok(eventNames.includes("category.created"));
  });
});
