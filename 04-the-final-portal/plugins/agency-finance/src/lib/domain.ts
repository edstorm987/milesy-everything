// Agency-finance domain. Persisted under per-install plugin storage.
//
// Scope: per-agency. Both Invoice and Expense rows carry `agencyId`;
// Invoice additionally carries `clientId` (the client being billed).
// All money is integer cents — no floats.

import type { AgencyId, ClientId, UserId } from "./tenancy";

// ─── Invoice ─────────────────────────────────────────────────────────────

export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue" | "void" | "refunded";
export type Currency = "usd" | "gbp" | "eur";

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitCents: number;
  totalCents: number;                  // computed = quantity * unitCents
}

export interface Invoice {
  id: string;
  agencyId: AgencyId;
  clientId: ClientId;                  // billed to a client
  number: string;                      // human-readable, e.g. "INV-2026-0042"
  issuedAt: number;                    // epoch ms — when invoice issued
  dueAt: number;                       // epoch ms — payment due
  lineItems: InvoiceLineItem[];
  subtotalCents: number;
  taxCents: number;
  totalCents: number;                  // subtotal + tax
  currency: Currency;
  status: InvoiceStatus;
  notes?: string;
  externalRef?: string;                // Stripe Invoice id when synced
  paidAt?: number;
  paidVia?: "stripe" | "bank-transfer" | "cash" | "manual";
  createdAt: number;
  updatedAt: number;
}

export interface CreateInvoiceInput {
  clientId: ClientId;
  issuedAt?: number;
  dueAt: number;
  lineItems: Array<{ description: string; quantity: number; unitCents: number }>;
  taxCents?: number;
  currency?: Currency;
  notes?: string;
}

export interface UpdateInvoicePatch {
  dueAt?: number;
  lineItems?: Array<{ description: string; quantity: number; unitCents: number }>;
  taxCents?: number;
  notes?: string;
  status?: InvoiceStatus;
  externalRef?: string;
  paidVia?: Invoice["paidVia"];
}

// ─── Expense ─────────────────────────────────────────────────────────────

export type ExpenseStatus = "pending" | "approved" | "reimbursed" | "rejected";

export interface Expense {
  id: string;
  agencyId: AgencyId;
  staffId?: string;                    // optional foundation User id (or agency-HR Staff id)
  categoryId: string;
  vendor?: string;
  description?: string;
  amountCents: number;
  currency: Currency;
  incurredAt: number;                  // epoch ms — when the expense happened
  status: ExpenseStatus;
  receiptUrl?: string;                 // stored on plugin storage
  approvedBy?: UserId;
  approvedAt?: number;
  reimbursedAt?: number;
  decisionNote?: string;               // approval / rejection reason
  createdAt: number;
  updatedAt: number;
}

export interface CreateExpenseInput {
  staffId?: string;
  categoryId: string;
  vendor?: string;
  description?: string;
  amountCents: number;
  currency?: Currency;
  incurredAt?: number;
  receiptUrl?: string;
}

export interface UpdateExpensePatch {
  staffId?: string;
  categoryId?: string;
  vendor?: string;
  description?: string;
  amountCents?: number;
  incurredAt?: number;
  receiptUrl?: string;
}

// ─── ExpenseCategory ─────────────────────────────────────────────────────

export type ExpenseCategoryStatus = "active" | "archived";

export interface ExpenseCategory {
  id: string;
  agencyId: AgencyId;
  name: string;
  isDefault: boolean;                  // seeded vs. agency-added
  status: ExpenseCategoryStatus;
  description?: string;
  createdAt: number;
  updatedAt: number;
}

export interface CreateCategoryInput {
  name: string;
  description?: string;
}

export interface UpdateCategoryPatch {
  name?: string;
  description?: string;
  status?: ExpenseCategoryStatus;
}

// ─── Listing filters ─────────────────────────────────────────────────────

export interface InvoiceFilter {
  status?: InvoiceStatus;
  clientId?: ClientId;
  query?: string;
  fromIssuedAt?: number;
  toIssuedAt?: number;
}

export interface ExpenseFilter {
  status?: ExpenseStatus;
  categoryId?: string;
  staffId?: string;
  fromIncurredAt?: number;
  toIncurredAt?: number;
}

// ─── Report types ────────────────────────────────────────────────────────

export interface RevenueSnapshot {
  from: number;
  to: number;
  currency: Currency;
  invoicesIssued: number;
  invoicesPaid: number;
  totalIssuedCents: number;
  totalPaidCents: number;
  totalOverdueCents: number;
  totalExpensesCents: number;
  netCents: number;                    // totalPaidCents - totalExpensesCents
  expensesByCategory: Array<{ categoryId: string; categoryName: string; amountCents: number; count: number }>;
  monthly: Array<{ year: number; month: number; paidCents: number; expenseCents: number }>;
}
