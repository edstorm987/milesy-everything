// Agency-marketing domain. Persisted under per-install plugin storage.
//
// Scope: per-agency. All three entities carry `agencyId`. No `clientId`
// field on Campaign/Lead/EmailTemplate — marketing is the agency's own
// outbound activity to drive new client acquisition + nurture.

import type { AgencyId, UserId } from "./tenancy";

// ─── Campaign ────────────────────────────────────────────────────────────

export type CampaignChannel =
  | "email" | "sms" | "social" | "paid" | "organic" | "event";

export type CampaignStatus =
  | "draft" | "scheduled" | "running" | "paused" | "completed" | "archived";

export type CampaignKpi = "leads" | "signups" | "revenue" | "engagement";

export type Currency = "usd" | "gbp" | "eur";

export interface Campaign {
  id: string;
  agencyId: AgencyId;
  name: string;
  channel: CampaignChannel;
  status: CampaignStatus;
  startAt?: number;                    // epoch ms
  endAt?: number;
  budgetCents?: number;
  currency: Currency;
  goalKpi?: CampaignKpi;
  goalTarget?: number;
  resultActual?: number;               // populated as the campaign runs
  ownerStaffId?: string;               // FK to agency-HR Staff (optional)
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

export interface CreateCampaignInput {
  name: string;
  channel: CampaignChannel;
  startAt?: number;
  endAt?: number;
  budgetCents?: number;
  currency?: Currency;
  goalKpi?: CampaignKpi;
  goalTarget?: number;
  ownerStaffId?: string;
  notes?: string;
}

export interface UpdateCampaignPatch {
  name?: string;
  channel?: CampaignChannel;
  status?: CampaignStatus;
  startAt?: number;
  endAt?: number;
  budgetCents?: number;
  currency?: Currency;
  goalKpi?: CampaignKpi;
  goalTarget?: number;
  resultActual?: number;
  ownerStaffId?: string | null;
  notes?: string;
}

// ─── Lead ────────────────────────────────────────────────────────────────

export type LeadSource = "form" | "manual" | "import" | "campaign";
export type LeadStatus =
  | "new" | "contacted" | "qualified" | "converted" | "unqualified" | "lost";

export interface LeadContactNote {
  at: number;
  by?: UserId;
  note: string;
}

export interface Lead {
  id: string;
  agencyId: AgencyId;
  campaignId?: string;                 // attribution
  email: string;
  name?: string;
  phone?: string;
  source: LeadSource;
  status: LeadStatus;
  assignedStaffId?: string;
  notes?: string;                      // free-form
  contactHistory: LeadContactNote[];   // append-only
  createdAt: number;
  updatedAt: number;
  lastContactedAt?: number;
}

export interface CreateLeadInput {
  email: string;
  name?: string;
  phone?: string;
  campaignId?: string;
  source?: LeadSource;
  notes?: string;
  assignedStaffId?: string;
}

export interface UpdateLeadPatch {
  email?: string;
  name?: string;
  phone?: string;
  campaignId?: string | null;
  status?: LeadStatus;
  assignedStaffId?: string | null;
  notes?: string;
}

// ─── EmailTemplate ───────────────────────────────────────────────────────

export type EmailTemplateCategory =
  | "welcome" | "re-engagement" | "newsletter" | "transactional" | "other";
export type EmailTemplateStatus = "active" | "archived";

export interface EmailTemplate {
  id: string;
  agencyId: AgencyId;
  name: string;
  subject: string;
  bodyHtml: string;
  bodyText?: string;
  category: EmailTemplateCategory;
  status: EmailTemplateStatus;
  isDefault: boolean;                  // seeded vs agency-added
  createdAt: number;
  updatedAt: number;
}

export interface CreateTemplateInput {
  name: string;
  subject: string;
  bodyHtml: string;
  bodyText?: string;
  category: EmailTemplateCategory;
}

export interface UpdateTemplatePatch {
  name?: string;
  subject?: string;
  bodyHtml?: string;
  bodyText?: string;
  category?: EmailTemplateCategory;
  status?: EmailTemplateStatus;
}

// ─── Filters ─────────────────────────────────────────────────────────────

export interface CampaignFilter {
  status?: CampaignStatus;
  channel?: CampaignChannel;
  query?: string;
}

export interface LeadFilter {
  status?: LeadStatus;
  campaignId?: string;
  assignedStaffId?: string;
  query?: string;
}

export interface TemplateFilter {
  category?: EmailTemplateCategory;
  status?: EmailTemplateStatus;
}

// ─── Reports ─────────────────────────────────────────────────────────────

export interface CampaignSnapshot {
  from: number;
  to: number;
  byChannel: Array<{ channel: CampaignChannel; count: number; budgetCents: number; resultTotal: number }>;
  byStatus: Array<{ status: CampaignStatus; count: number }>;
  totalCampaigns: number;
  totalBudgetCents: number;
}

export interface LeadFunnel {
  from: number;
  to: number;
  byStatus: Array<{ status: LeadStatus; count: number }>;
  total: number;
  conversionRate: number;              // converted / total (0..1, or 0 if total === 0)
  newCount: number;
  contactedCount: number;
  qualifiedCount: number;
  convertedCount: number;
  unqualifiedCount: number;
  lostCount: number;
}
