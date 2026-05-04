// Payout service. Manual `markPaid` for v1; Stripe Connect / PayPal
// API integration deferred to a future round.
//
// Storage:
//   payouts/by-id/<id>         → Payout
//   payouts/by-affiliate/<aff> → string[] of payout ids
//   payouts/index              → string[] of all payout ids

import { makeId } from "../lib/ids";
import { now } from "../lib/time";
import type { AgencyId, ClientId, UserId } from "../lib/tenancy";
import type {
  MarkPayoutPaidInput,
  Payout,
  PayoutFilter,
  PayoutMethod,
  SchedulePayoutInput,
} from "../lib/domain";
import type { ActivityLogPort, EventBusPort, StoragePort } from "./ports";
import type { AffiliateService } from "./affiliates";
import type { AttributionService } from "./attributions";

const PAYOUT_INDEX_KEY = "payouts/index";
const payoutKey = (id: string): string => `payouts/by-id/${id}`;
const byAffiliateKey = (aff: string): string => `payouts/by-affiliate/${aff}`;

export class PayoutService {
  constructor(
    private agencyId: AgencyId,
    private clientId: ClientId,
    private storage: StoragePort,
    private activity: ActivityLogPort,
    private events: EventBusPort,
    private affiliates: AffiliateService,
    private attributions: AttributionService,
  ) {}

  async list(filter?: PayoutFilter): Promise<Payout[]> {
    const ids = (await this.storage.get<string[]>(PAYOUT_INDEX_KEY)) ?? [];
    const out: Payout[] = [];
    for (const id of ids) {
      const row = await this.storage.get<Payout>(payoutKey(id));
      if (row) out.push(row);
    }
    return out
      .filter(p => !filter?.affiliateId || p.affiliateId === filter.affiliateId)
      .filter(p => !filter?.status || p.status === filter.status)
      .sort((a, b) => b.scheduledFor - a.scheduledFor);
  }

  async get(id: string): Promise<Payout | null> {
    const row = await this.storage.get<Payout>(payoutKey(id));
    return row && row.agencyId === this.agencyId && row.clientId === this.clientId ? row : null;
  }

  async listForAffiliate(affiliateId: string): Promise<Payout[]> {
    const ids = (await this.storage.get<string[]>(byAffiliateKey(affiliateId))) ?? [];
    const out: Payout[] = [];
    for (const id of ids) {
      const row = await this.storage.get<Payout>(payoutKey(id));
      if (row) out.push(row);
    }
    return out.sort((a, b) => b.scheduledFor - a.scheduledFor);
  }

  // Rolls all of an affiliate's `approved` attributions into a single
  // `scheduled` Payout. Returns null when there are no approved
  // attributions outstanding (handler returns 422 with a clear message
  // — there's nothing to pay out).
  async schedule(input: SchedulePayoutInput, actor: UserId, defaultMethod: PayoutMethod = "manual"): Promise<Payout | null> {
    const affiliate = await this.affiliates.get(input.affiliateId);
    if (!affiliate) throw new Error(`Affiliate ${input.affiliateId} not found.`);

    const approvedAttributions = await this.attributions.list({
      affiliateId: input.affiliateId,
      status: "approved",
    });
    if (approvedAttributions.length === 0) return null;

    const amountCents = approvedAttributions.reduce((sum, a) => sum + a.amountCents, 0);
    const id = makeId("po");
    const ts = now();
    const row: Payout = {
      id,
      agencyId: this.agencyId,
      clientId: this.clientId,
      affiliateId: input.affiliateId,
      amountCents,
      attributionIds: approvedAttributions.map(a => a.id),
      method: input.method ?? defaultMethod,
      status: "scheduled",
      scheduledFor: input.scheduledFor ?? ts,
      createdAt: ts,
    };
    await this.storage.set(payoutKey(id), row);
    const ix = (await this.storage.get<string[]>(PAYOUT_INDEX_KEY)) ?? [];
    if (!ix.includes(id)) {
      await this.storage.set(PAYOUT_INDEX_KEY, [...ix, id]);
    }
    const affIx = (await this.storage.get<string[]>(byAffiliateKey(input.affiliateId))) ?? [];
    if (!affIx.includes(id)) {
      await this.storage.set(byAffiliateKey(input.affiliateId), [...affIx, id]);
    }
    await this.activity.logActivity({
      agencyId: this.agencyId,
      clientId: this.clientId,
      actorUserId: actor,
      category: "affiliates",
      action: "affiliate.payout_scheduled",
      message: `Scheduled payout for ${affiliate.displayName} (${approvedAttributions.length} attributions, ${formatMoney(amountCents, "usd")}).`,
      metadata: { payoutId: id, affiliateId: input.affiliateId, amountCents, count: approvedAttributions.length },
    });
    this.events.emit(
      { agencyId: this.agencyId, clientId: this.clientId },
      "affiliate.payout_scheduled",
      { payoutId: id, affiliateId: input.affiliateId, amountCents },
    );
    return row;
  }

  async markPaid(id: string, input: MarkPayoutPaidInput, actor: UserId): Promise<Payout | null> {
    const existing = await this.get(id);
    if (!existing) return null;
    if (existing.status === "completed") return existing;        // idempotent
    const next: Payout = {
      ...existing,
      status: "completed",
      method: input.method ?? existing.method,
      externalRef: input.externalRef,
      completedAt: now(),
    };
    await this.storage.set(payoutKey(id), next);

    // Flip the rolled attributions to paid + bump the affiliate's
    // lifetime-earnings counter.
    await this.attributions._markPaid(existing.attributionIds, id);
    await this.affiliates._incrementCounters(existing.affiliateId, {
      addEarningsCents: existing.amountCents,
    });

    await this.activity.logActivity({
      agencyId: this.agencyId,
      clientId: this.clientId,
      actorUserId: actor,
      category: "affiliates",
      action: "affiliate.payout_completed",
      message: `Paid affiliate payout ${id} (${input.externalRef}).`,
      metadata: { payoutId: id, affiliateId: existing.affiliateId, amountCents: existing.amountCents, externalRef: input.externalRef },
    });
    this.events.emit(
      { agencyId: this.agencyId, clientId: this.clientId },
      "affiliate.payout_completed",
      { payoutId: id, affiliateId: existing.affiliateId, amountCents: existing.amountCents },
    );
    return next;
  }

  async markFailed(id: string, reason: string, actor: UserId): Promise<Payout | null> {
    const existing = await this.get(id);
    if (!existing) return null;
    const next: Payout = {
      ...existing,
      status: "failed",
      failureReason: reason,
    };
    await this.storage.set(payoutKey(id), next);
    await this.activity.logActivity({
      agencyId: this.agencyId,
      clientId: this.clientId,
      actorUserId: actor,
      category: "affiliates",
      action: "affiliate.payout_failed",
      message: `Payout ${id} failed: ${reason}`,
      metadata: { payoutId: id, affiliateId: existing.affiliateId, reason },
    });
    this.events.emit(
      { agencyId: this.agencyId, clientId: this.clientId },
      "affiliate.payout_failed",
      { payoutId: id, affiliateId: existing.affiliateId, reason },
    );
    return next;
  }
}

function formatMoney(cents: number, currency: string): string {
  const symbol = currency.toLowerCase() === "usd" ? "$" : currency.toLowerCase() === "gbp" ? "£" : currency.toLowerCase() === "eur" ? "€" : "";
  return `${symbol}${(cents / 100).toFixed(2)}`;
}
