// Domain types for the agency-HR plugin. Everything in this file is
// data-only — services live under `../server/`, components under
// `../components/` and `../pages/`.
//
// Scope: a single agency. There is no per-client surface; staff are the
// agency's employees, departments are the agency's org chart, and leave
// requests are submitted + approved by agency staff. Per `eds requirments.md`
// the platform's three audiences are agency / clients / end-customers —
// HR speaks only to the first.

import type { AgencyId, Role, UserId } from "./tenancy";

// ─── Staff ────────────────────────────────────────────────────────────────

export type StaffStatus = "active" | "on-leave" | "alumni";

export type StaffLocationType = "remote" | "hybrid" | "onsite";

// A `Staff` row is the canonical record for a person who works for the
// agency. The `userId` link is optional: not every staff member has a
// portal login (a contracted illustrator might have a directory entry
// but no login). When `userId` is set, the foundation's user store owns
// the auth surface; HR stores everything else.
export interface Staff {
  id: string;
  agencyId: AgencyId;
  userId?: UserId;                  // optional foundation user link
  name: string;
  email: string;
  role: Role;                       // mirrors foundation Role enum
  departmentId?: string;            // FK into Department
  title: string;                    // job title — separate from `role`
  joinedAt: string;                 // YYYY-MM-DD
  leftAt?: string;                  // YYYY-MM-DD when status === "alumni"
  status: StaffStatus;
  managerId?: string;               // FK into Staff (self-reference)
  locationType?: StaffLocationType;
  hourlyRate?: number;              // optional; whole units of agency currency
  createdAt: number;
  updatedAt: number;
}

// ─── Departments ──────────────────────────────────────────────────────────

// A single tree of departments per agency. `parentId` lets agencies
// build a multi-level org chart (e.g. "Engineering" → "Frontend"); v1
// renders flat-with-indent. Validation: cycles refused, parentId must
// resolve within the same agency.
export interface Department {
  id: string;
  agencyId: AgencyId;
  name: string;
  parentId?: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
}

// ─── Leave requests ──────────────────────────────────────────────────────

export type LeaveType = "pto" | "sick" | "sabbatical";
export type LeaveStatus = "pending" | "approved" | "rejected";

export interface LeaveRequest {
  id: string;
  agencyId: AgencyId;
  staffId: string;
  type: LeaveType;
  startDate: string;                // YYYY-MM-DD inclusive
  endDate: string;                  // YYYY-MM-DD inclusive
  days: number;                     // computed from startDate/endDate at create
  status: LeaveStatus;
  reason?: string;
  createdAt: number;
  approvedBy?: UserId;              // agency-owner / agency-manager / staff manager
  approvedAt?: number;              // epoch ms when approved or rejected
  decisionNote?: string;            // optional approval/rejection reason
}

// ─── Inputs / patches (CRUD shapes the API handlers consume) ─────────────

export interface CreateStaffInput {
  name: string;
  email: string;
  role: Role;
  departmentId?: string;
  title: string;
  joinedAt: string;
  managerId?: string;
  locationType?: StaffLocationType;
  hourlyRate?: number;
  userId?: UserId;
}

export interface UpdateStaffPatch {
  name?: string;
  email?: string;
  role?: Role;
  departmentId?: string;
  title?: string;
  joinedAt?: string;
  leftAt?: string;
  status?: StaffStatus;
  managerId?: string | null;        // explicit null clears the manager
  locationType?: StaffLocationType;
  hourlyRate?: number;
}

export interface CreateDepartmentInput {
  name: string;
  parentId?: string;
  description?: string;
}

export interface UpdateDepartmentPatch {
  name?: string;
  parentId?: string | null;
  description?: string;
}

export interface CreateLeaveInput {
  staffId: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  reason?: string;
}

export interface DecideLeaveInput {
  status: "approved" | "rejected";
  approvedBy: UserId;
  decisionNote?: string;
}

// ─── Listing filters ──────────────────────────────────────────────────────

export interface StaffFilter {
  status?: StaffStatus;
  departmentId?: string;
  managerId?: string;
  query?: string;                   // free-text against name/email/title
}

export interface LeaveFilter {
  status?: LeaveStatus;
  staffId?: string;
  type?: LeaveType;
}
