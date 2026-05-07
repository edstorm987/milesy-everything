# Aqua internals — agency portal grounding

Sources:
- `~/Desktop/obsidian/Mission Ed/05 Business & Ventures/Aqua Bios - Internals/`
  (operating SOPs + HQ structure)
- `~/Desktop/obsidian/Mission Ed/05 Business & Ventures/Aqua HQ/Sops, Docs &
  Templates/Full Aqua System/Full Aqua System SOP HUB/`
- `03 old portal/old-portal-github/extras/eds-old-portal-idea-fixed/src/`
  (the most-evolved prior-iteration agency-side surface — every view + modal
  that existed before we rebuilt)

This chapter is the operating reference for **Ed's agency-side experience**.
The goal: when Ed logs into Aqua Portal, it should feel like *his actual
business* — not a generic SaaS dashboard. Get the sidebar, phase presets,
kanban templates, add-client modal, employee surface, and SOP shelf right
on the first try by mirroring what already works for him.

> Read-only on the source vault and `03/`. Never write back. When a section
> below conflicts with current code, current code wins — patch this chapter.

## 1. Brand voice + audience

- **Tagline**: *"Where Healing Meets Revolution."*
- **Subtitle (sometimes paired)**: *"Crafted & Curated by AquaOasis-Web."*
- **Audience**: therapists and adjacent healing-modality practitioners.
  Every product decision frames "where the therapist is + where they want
  to go" — that's the operative question Aqua is built to answer.
- **Register**: direct, strategic, occasionally sacred. Match Ed's mythos
  language ("scroll", "alchemy", "battle", "warrior") rather than sanitised
  SaaS speak.

## 2. The Aqua HQ sidebar — six canonical sections

Aqua's Obsidian HQ has six top-level sections. The agency portal sidebar
should mirror them so Ed's portal feels like his real HQ:

| Section | What lives here | Mapped plugin / surface |
|---|---|---|
| **Leads & Clients HQ** | All leads + active clients in one place. Pipeline + per-client CRM card. | `@aqua/plugin-client-crm` (per-client) + agency-shell Clients page (T1) |
| **Client Billing & Finance** | Income · Expenses Recurring · Expenses Other. Quick-fire records. | `@aqua/plugin-agency-finance` |
| **Tasks & To-Do's** | Cross-cutting task list — agency-wide and per-client. | `@aqua/plugin-kanban` (in flight, T2) |
| **SOPs, Docs & Templates** | The Full Aqua System SOP HUB — Sales / Service / Standards / Internal. | New lightweight notes plugin (later) — for v1 use website-editor pages |
| **Social Media Planner** | Content · Content Calendar · Content Library Ideas · Ads & Scripting. | `@aqua/plugin-agency-marketing` |
| **Passwords & Access** | Owner access + per-client credential vault. | Not built — small per-client credential-vault plugin (later) |

The mirror also exists at `Aqua HQ/Sops, Docs & Templates/Full Aqua System
SOP HUB/Standards & Internal/Internal Affairs/` — same six rows, same
canonical sidebar.

## 3. Old portal — agency-side surface inventory

The most-evolved prior iteration (`03 old portal/.../eds-old-portal-idea-fixed`)
shipped a complete agency-side experience. This is the full inventory of
what existed; rows tagged with which plugin / round delivers them today,
and what's still ahead. **Use this as the sidebar wishlist Ed gets to.**

### 3a. Top-level views (the agency-side router)

| Old-portal view | What it did | v1 status |
|---|---|---|
| `AdminDashboardView` | Top-level overview (stats + activity widgets). | **In flight T1 Agency Shell** — home with clients grid. |
| `AgencyHubView` | Operational hub — team module + AI sessions + recent activity. | Partially in T1 home; Team module deferred to Employee HQ. |
| `AgencyClientsView` | Clients list with quick actions. | **In flight T1** — clients grid + per-client overview. |
| `AgencyConfiguratorView` | Agency-wide config (roles, branding, integrations). | Deferred — single-line "Settings" link in v1; full configurator later. |
| `AgencyBuilderView` | Onboard a new agency tenant. | Already covered by `/api/tenants/seed` + signup flow. |
| `AgencySetupView` | First-run setup wizard. | Deferred — happens through "+ New client" modal in v1. |
| `AgencyLoginView` / `ClientLoginView` | Tier-specific login surfaces. | Shipped T1 R5 + R9 (OAuth + magic-link). |
| `EmployeeManagementView` | Manage team — roles, status, per-employee permissions. | **DEFERRED** to "Employee HQ" round (see §9). |
| `RoleBuilder` | Define custom roles per agency. | **DEFERRED** with Employee HQ. |
| `TaskBoardView` | Kanban / task management. | **In flight T2 Kanban**. |
| `CrmView` | Lead + contact CRM. | Shipped via `@aqua/plugin-client-crm` (per-client) + agency-side leads list (T1 sidebar). |
| `InboxView` | Internal + client messages. | Deferred — out of v1; T2's email-sender covers transactional. |
| `LogsView` / `GlobalActivityView` | Activity log / audit trail. | Foundation `activityFeed` ports already record; UI deferred. |
| `ResourcesView` | SOPs / docs / templates shelf. | Deferred — for v1 Ed manually pastes SOPs into website-editor pages. |
| `AquaAiView` / `AiSessionsView` | General-purpose AI assistant + audit. | Deferred — `@aqua/plugin-ai-builder` covers editor surface; general chat assistant is later. |
| `FounderTodosView` | Ed's personal todo list (Founder-only). | **Deferred** — could ship as a private kanban board template ("founder-todos") in T2 R-something. |
| `OnboardingDashboardView` / `OnboardingView` | Client onboarding workflow. | Phase-preset machinery in fulfillment plugin already covers this — just needs UI surfacing in T1's per-client overview. |
| `ProjectHubView` | Per-client projects. | Deferred — folds into per-client overview tabs. |
| `SupportTicketsView` / `SupportView` | Support inbox + tickets. | Deferred — out of v1. |
| `DiscoverView` / `DiscoveryDashboardView` | Sales / lead-discovery surface. | Deferred — Sales HUB in Obsidian covers manually for now. |
| `CollaborationView` | Multi-user real-time collab. | Deferred (architecture §13 parked). |
| `DataHubView` | Data management. | Deferred. |
| `DevDashboardView` / `DesignDashboardView` | Role-specific dashboards. | Deferred — Employee HQ + RoleBuilder enables this. |
| `FeatureRequestView` | Internal feature requests. | Deferred — out of v1. |
| `GlobalSettingsView` | Global config. | Deferred — single "Settings" link in v1. |
| `WebsiteView` / `PageBuilder` / `CustomPageView` | Website + page editor. | Shipped via `@aqua/plugin-website-editor`. |
| `DashboardOverviewView` | Per-role dashboard renderer. | Deferred — folds into per-client overview tabs. |

### 3b. Modals (the action surface)

| Modal | Purpose | v1 status |
|---|---|---|
| `AddClientModal` / `EditClientModal` | Create/edit a client. | **In flight T1** — modal in agency shell. |
| `AddUserModal` | Add an end-customer or staff. | T1 R5 end-customer signup shipped; staff (Employee HQ) deferred. |
| `AddRoleModal` | Define a new agency role. | Deferred (Role Builder). |
| `EmployeeManagementModal` / `EmployeeProfileModal` | Manage individual employee. | Deferred (Employee HQ). |
| `TaskModal` / `TaskDetailModal` / `GlobalTasksModal` | Task creation + detail. | **In flight T2** — covered by kanban card drawer. |
| `NewProjectModal` | Start a project. | Deferred (Project Hub). |
| `PlanModal` | Plan tier picker. | Will live in T1's "+ New client" modal (Foundational / Expansion / Mastery). |
| `SettingsModal` | Settings shortcut. | Deferred. |
| `InboxModal` / `AgencyCommunicateModal` | Quick comms. | Deferred. |
| `AppLauncherModal` | Switch between apps. | Deferred — sidebar covers it. |
| `TicketModal` / `SupportTicketsModal` | Support ticket. | Deferred. |
| `ConfirmationModal` | Generic confirm. | T4's `ConfirmDialog` primitive already exists. |

## 4. Aqua's three plan tiers

From `Sales HUB/Offers, Pricing & Closing.md`:

- **Foundational Flow** — entry tier. Build the foundation: brand + system
  + first traffic.
- **Expansion Plan** — traffic + scaling tier.
- **Mastery Plan** — long-haul "client must be fully booked with 200+
  reviews" tier.
- **Lock-In Deposit**: £100 refundable to hold a spot.

Plan tier is a **per-client** field captured in the Add-Client modal (§8).
Plan tier ≠ Aqua phase: a Mastery client is still walked through the same
six phases (§5) when they first onboard.

## 5. Real phase progression — the Aqua Incubator 3.0

From `Service HQ/Aqua Incubator 2.0.md` (titled "THE AQUA INCUBATOR 3.0
(15 Hours Max)") + `Onboarding & Service Delivery/Service HQ/`:

```
1. Epic Intro to Aqua
2. Blueprint Setup — Aqua Playbook
3. Diagnostics Report / Foundations Setting
4. Brand Builder + Verification
5. Traffic (The Expansion Plan)
6. Mastery & Ascension
```

Pre-onboarding pipeline (lead-side, before phase 1):

```
Pre-Sales → Discovery Call Booked → Discovery Call Done
        → Invoice Sent → Aqua Incubator Active → Shock & Awe Sent
        → System Build → Onboarded
```

That pipeline IS the **lead-pipeline kanban template** (§6). Use the exact
column labels.

### 5a. Phase-preset → installed plugins

When the operator picks an Aqua phase at "+ New client", these plugins
auto-install (matches the existing fulfillment phase-preset machinery):

| Aqua phase | Plugins installed at this phase |
|---|---|
| Epic Intro | (no plugin install — onboarding form / welcome only) |
| Blueprint Setup | `website-editor`, `client-crm`, `forms` |
| Diagnostics / Foundations | + `ai-builder` (diagnostics surveys + content gen) |
| Brand Builder + Verification | + (brand-kit baked into `website-editor`) |
| Traffic (Expansion Plan) | + `ecommerce`, `agency-marketing`, `email-sender` |
| Mastery & Ascension | + `memberships`, `affiliates` |

The **Live custom-portal** stage runs on top of all of these — the
per-client custom build mixes and matches.

## 6. Real kanban templates

Replace generic templates (`new/qualified/proposal/won/lost`) with Aqua's
actual operating ones:

### lead-pipeline (Aqua-real)
```
Pre-Sales · Discovery Call Booked · Discovery Call Done
· Invoice Sent · Aqua Incubator Active · Shock & Awe Sent
· System Build · Onboarded
```

### client-tasks (per-client task board)
```
Backlog · This Week · Doing · Waiting On Client · Review · Done
```

### fulfillment-mirror (mirrors phase progression)
```
Epic Intro · Blueprint Setup · Diagnostics · Brand Builder · Traffic · Mastery
```

### founder-todos (Ed's personal — Founder-only board)
```
Today · This Week · Backlog · Done
```

### blank
```
To Do
```

## 7. Communication SOP

From `Standards & Internal/Standards/Communication SOP.md`:

- **Channels**: WhatsApp (per-client group chats with client + responsible
  team members) + email. Per-client WhatsApp group is created on
  onboarding.
- **Operating hours**: standard hours; after-hours → next working day
  unless pre-agreed urgent.
- **Loop closure**: every comm thread closes with confirmed next steps —
  no open loops.
- **Logins / 2FA**: handled via `Passwords & Access` vault.

**Implication for the agency portal**: per-client tile / overview surfaces
a one-click "Open WhatsApp group" link (operator-pasted URL stored on the
client record) and the per-client email thread address. Don't build
WhatsApp/email integration — just store the link/address as metadata.

## 8. Add-client field set

Beyond name/slug/brand colour/logo, the "+ New client" modal captures:

- **Therapist name** + **Practice name** (display name)
- **Plan tier** (Foundational / Expansion / Mastery)
- **Starting Aqua phase** (1–6, default 1 — Epic Intro)
- **Contact email** + **WhatsApp group invite link**
- **Lock-in deposit paid?** (boolean)
- **Stripe / invoice link** (optional URL)

Most live in `metadata: {}` on the client record without a schema change.

## 9. Employee HQ (Ed mentioned, deferred to its own round)

The old portal had a full employee surface. v1 ships without it; this
section is the spec for the round that adds it.

### 9a. Why it matters

- Aqua takes on contractors / staff per phase (designer for Brand Builder,
  copywriter for Traffic, ops for Mastery).
- Each employee gets scoped access to the right things — fulfillment + the
  SOPs they need, not the full agency surface.
- Custom roles per agency mean an Aqua employee role is different from a
  future-software-client's employee role.

### 9b. What an Employee HQ round looks like

1. **`@aqua/plugin-employee-hq`** (or fold into existing agency-hr).
   Domain: Employee (extends ServerUser with `agencyEmployee:true` flag),
   Role (`{id, label, permissions: string[], visibleViewIds: string[]}`),
   Assignment (employee × client × role × scope).
2. **Surfaces**:
   - `EmployeeListPage` — all agency employees with role + active-clients
     count + last-active.
   - `EmployeeProfilePage` — single employee detail; assigned clients,
     skills, status, NDA signed, payroll info (linked to agency-finance).
   - `RoleBuilderPage` — define custom roles + permissions matrix.
   - `Add Employee` modal — name, email, role, starting clients.
3. **Permission model**: per-role allowlist of plugin namespaces +
   per-route gates (`canViewClient` / `canEditClient` / `canViewSOPs`).
   Reuse existing per-route `visibleToRoles` machinery.
4. **SOP access**: Employee role gates which `Resources` / SOP tags are
   visible. Aqua's SOP HUB has natural splits (Sales / Service / Standards
   / Internal) — gate by tag.

### 9c. SOP shelf (for the eventual `Resources` view)

The Aqua SOP HUB's tag taxonomy:

- **Sales & Discovery** — Lead Magnets, Offers/Pricing/Closing,
  Rebuttals & Domination Deflections, Sales 9-Figure Blueprint, Sales
  Presentation, Business & Founders Audit.
- **Onboarding & Service Delivery** — Aqua Incubator 2.0, Aqua Set Sail
  Gift, Consultant OS Call + Onboarding, Invoice & Contract & Email,
  Recurring Actions, The Expansion Plan (Traffic), The Foundation Flow,
  Upsells.
- **Leads & Nurturing** — Pre Sales HQ, Re-Nurturing.
- **Standards & Internal** — Behaviour Standards, The Novem, Communication
  SOP, Company Development.
- **Mastery Plan** — "Client must be fully booked with 200+ reviews"
  follow-on programme.

When Resources view ships, render those five tag families as the top-level
filter.

## 10. 90-day social media plan (for the agency-marketing plugin)

From `90 Day Social Media Plan - Quick Fire.md` — Ed's agency content
philosophy. Useful when the agency-marketing plugin renders a "fresh
campaign" template:

- **Phase 1 (Days 1–30): Awareness & Presence** — show up daily.
  Weekly: 2 Reels + 2 Carousels/Posts + 3 Stories/day + 1 IG Live.
- **Phase 2 (Days 31–60): Trust & Depth** — repeat themes, deeper into
  pain points. Add: 1 lead-magnet drop + 1 DM prompt/wk + clip Lives → Reels.
- **Phase 3 (Days 61–90): Authority & Conversion** — funnel-driven posts,
  testimonials, calls-to-action.

Marketing plugin's "Campaigns" page can offer this as a starter template.

## 11. Founder Todos — Ed's personal layer

Ed's identity system (vault `01 Self & Identity/Master Scroll/Need to do.md`)
treats his own tasks as a separate ritual layer. The old portal had
`FounderTodosView` (Founder-only). v1 path: ship it as a Kanban board
with template `founder-todos` (§6) on the home screen sidebar, gated to
the Founder role only.

## 12. v1 vs deferred — the explicit list

**v1 (in flight or shipped)**:
- Admin Dashboard / Home (T1 Agency Shell)
- Clients grid + Add Client + Per-Client Overview tabs (T1)
- "+ Add capability" picker (T1, per-client plugin install)
- Phase-preset machinery (fulfillment, already shipped — surfaced via T1)
- Kanban with Aqua-real templates (T2 — including founder-todos)
- All shipped plugins (CRM / Finance / Marketing / HR / Memberships /
  Affiliates / Forms / Email / AI Builder / Domains / Ops / Portal Export)

**Deferred (Ed says "after the agency OS works for new clients")**:
- Employee HQ + Role Builder (§9)
- Resources / SOP shelf (§9c)
- Aqua AI general-purpose chat assistant
- Inbox / Agency Communicate
- Logs UI (foundation already records activity)
- Onboarding Dashboard (folds into per-client overview phase tab)
- Project Hub (folds into per-client overview)
- Support Tickets
- Discover / Discovery Dashboard
- Global Settings UI
- Custom credential-vault plugin (Passwords & Access §2)

**Out of scope (parked or obsolete)**:
- Multi-user real-time collaboration (architecture §13)
- Data Hub
- Feature Request inbox
- Per-role Dev/Design dashboards (Employee HQ + RoleBuilder unlocks
  these naturally)

## 13. Concrete fold-ins for the in-flight terminals

### T1 Agency Shell
- **Sidebar** mirrors §2 (six canonical sections + plugin map).
- **"+ New client" modal** uses the field set in §8 + phase picker uses
  §5's six Aqua phases (replace placeholder Discovery/Development/
  Onboarding/Live).
- **Plan tier** is a separate field (Foundational / Expansion / Mastery)
  with the £100 lock-in-deposit checkbox.
- **Brand voice** in welcome copy ("Where Healing Meets Revolution",
  therapist audience).
- **Per-client overview tabs**: Overview · Website · Portal · Kanban ·
  Finance · Assets · Tools — tabs that don't apply to the client's plan
  tier are still visible but greyed with a "+ Add capability" prompt.

### T2 Kanban
- Templates per §6 (Aqua-real): lead-pipeline, client-tasks,
  fulfillment-mirror, founder-todos, blank.
- Founder-todos gated to Founder role only.

### T3 Editor deep-link
- No specific Aqua fold-in — the deep-link contract is generic.

### T5 (Felicia / Luv & Ker) — paused per Ed 2026-05-07.

### Future Employee HQ round
- Spec captured in §9. Ship after T1 Agency Shell + T2 Kanban land.

## 14. Source pointers

- `~/Desktop/obsidian/Mission Ed/05 Business & Ventures/Aqua Bios -
  Internals/` — operating SOPs (canonical).
- `~/Desktop/obsidian/Mission Ed/05 Business & Ventures/Aqua HQ/Sops, Docs
  & Templates/Full Aqua System/Full Aqua System SOP HUB/` — full SOP shelf
  by tag family.
- `03 old portal/old-portal-github/extras/eds-old-portal-idea-fixed/src/
  components/{views,modals}/` — most-evolved prior-iteration agency
  surface inventory (read-only reference).
- `01 development/eds requirments.md` — Ed's spec (read-only).

When in doubt, the Obsidian vault wins. When current code conflicts with
this chapter, current code wins — patch this chapter.
