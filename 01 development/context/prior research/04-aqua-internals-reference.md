# Aqua internals — agency portal reference

Source: `~/Desktop/obsidian/Mission Ed/05 Business & Ventures/Aqua Bios - Internals/`
+ `Aqua HQ/Sops, Docs & Templates/Full Aqua System/Full Aqua System SOP HUB/`.

This is the *real* operating shape of Ed's agency Aqua. Use it to ground the
agency portal's sidebar, phase presets, kanban templates, and content. The
goal is "Ed logs in and immediately sees his actual business" — not a
generic SaaS dashboard.

## 1. Brand voice

- Tagline: **"Where Healing Meets Revolution."**
- Subtitle (often paired): **"Crafted & Curated by AquaOasis-Web."**
- Audience: **therapists** (and adjacent healing-modality practitioners).
  Every product decision frames "where the therapist is + where they want
  to go" — that's the operative question Aqua is built to answer.

## 2. Aqua HQ sidebar — the real top-level shape

The Aqua HQ in Obsidian has six sections. The agency portal's "Tools" /
sidebar should mirror them so Ed's portal feels like his real HQ:

| Section | What lives here |
|---|---|
| **Leads & Clients HQ** | All leads + active clients in one place. Pipeline + per-client CRM card. |
| **Client Billing & Finance** | Income · Expenses Recurring · Expenses Other. Quick-fire records. |
| **Tasks & To-Do's** | Cross-cutting task list — agency-wide and per-client. |
| **SOPs, Docs & Templates** | The Full Aqua System SOP HUB (organised by Sales / Service / Standards / Internal). |
| **Social Media Planner** | Content · Content Calendar · Content Library Ideas · Ads & Scripting. |
| **Passwords & Access** | Owner access + per-client credential vault. |

Plugin map (what's already shipped maps to which Aqua section):

| Aqua section | Plugin |
|---|---|
| Leads & Clients HQ | `@aqua/plugin-client-crm` (per-client) + agency-side leads list (T1 agency-shell) |
| Client Billing & Finance | `@aqua/plugin-agency-finance` |
| Tasks & To-Do's | `@aqua/plugin-kanban` (in flight, T2) — multi-board (lead pipeline / client tasks / fulfillment) |
| SOPs, Docs & Templates | new lightweight notes plugin or website-editor pages (R-something later) |
| Social Media Planner | `@aqua/plugin-agency-marketing` (campaigns + content calendar) |
| Passwords & Access | not built yet — small per-client credential vault plugin (later) |

Items in `Aqua HQ/Sops, Docs & Templates/Full Aqua System SOP HUB/Standards & Internal/Internal Affairs/` confirm the same set: Tasks & To-Do's · Leads & Client HQ · Client billing & Finance · Passwords. That's the canonical sidebar.

## 3. Aqua's three-plan structure

From `Sales HUB/Offers, Pricing & Closing.md`:

- **Foundational Flow** — entry tier (build the foundation: brand + system + first traffic).
- **Expansion Plan** — traffic + scaling tier.
- **Mastery Plan** — long-haul "client must be fully booked with 200+ reviews" tier.
- **Lock-In Deposit**: £100 refundable to hold a spot.

These map onto the **per-client phase preset** the agency portal already
has the machinery for. Replace the placeholder `Discovery / Development /
Onboarding / Live` with Aqua's real phases (next section).

## 4. Aqua's real phase progression (replace the placeholder)

From `Service HQ/Aqua Incubator 2.0.md` ("THE AQUA INCUBATOR 3.0 (15 Hours
Max)") + `Onboarding & Service Delivery/Service HQ/`:

```
1. Epic intro to aqua
2. BluePrint Setup — Aqua Playbook
3. Diagnostics Report / Foundations Setting
4. Brand Builder + Verification
5. Traffic (The Expansion Plan)
6. Mastery & Ascension
```

Pre-onboarding pipeline (lead-side, before the client enters phase 1):

```
Pre-Sales → Discovery Call → Invoice Sent → Aqua Incubator (warm-up)
        → Shock & Awe → System Build → Onboarding Call + Aqua System intro
```

That pipeline IS the **lead-pipeline kanban template** Ed wants. Use the
exact column labels.

### Phase-preset → installed plugins (recommended mapping)

When the operator picks an Aqua phase at "+ New client", these plugins
auto-install (matches what the existing fulfillment phase-preset machinery
expects):

| Aqua phase | Plugins installed at this phase |
|---|---|
| Epic Intro | (no plugin install — onboarding form / welcome only) |
| Blueprint Setup | website-editor, client-crm, forms |
| Diagnostics / Foundations | + ai-builder (for diagnostics surveys + auto-content) |
| Brand Builder + Verification | + (brand-kit baked into website-editor) |
| Traffic (Expansion Plan) | + ecommerce, agency-marketing, email-sender |
| Mastery & Ascension | + memberships, affiliates |

Live custom-portal stage runs on top of all of these — the per-client
custom build can mix and match.

## 5. Real kanban templates

Replace the placeholder kanban templates (`new/qualified/proposal/won/lost`)
with Aqua's actual operating ones:

### lead-pipeline (Aqua)
```
Pre-Sales · Discovery Call Booked · Discovery Call Done
· Invoice Sent · Aqua Incubator Active · Shock & Awe Sent
· System Build · Onboarded
```

### client-tasks (Aqua's per-client task board)
```
Backlog · This Week · Doing · Waiting On Client · Review · Done
```

### fulfillment-mirror (mirrors the Aqua phase progression)
```
Epic Intro · Blueprint Setup · Diagnostics · Brand Builder · Traffic · Mastery
```

### blank
```
To Do
```

## 6. Communication SOP — the operating contract

From `Standards & Internal/Standards/Communication SOP.md`:

- **Channels**: WhatsApp (per-client group chats with client + responsible
  team members) + email. Per-client WhatsApp group is created on
  onboarding.
- **Operating hours**: standard hours; after-hours → next working day
  unless pre-agreed urgent.
- **Loop closure**: every comm thread closes with confirmed next steps —
  no open loops left.
- **Logins / 2FA**: handled via `Passwords & Access` vault.

Implication for the agency portal: per-client tile / overview should
surface a one-click "Open WhatsApp group" link (operator-pasted URL
stored on the client record) and the per-client email thread. Don't build
WhatsApp/email integration — just store the link/address.

## 7. Add-client field set (for T1's "+ New client" modal)

Beyond name/slug/brand colour/logo, the modal should capture what Aqua
actually onboards:

- Therapist name + practice name (the client's *display* name)
- Plan tier (Foundational / Expansion / Mastery)
- Starting phase (Aqua phase 1-6, default 1)
- Contact email + WhatsApp group invite link
- Lock-in deposit paid? (boolean)
- Invoice / Stripe link (optional)

Most of these can live as `metadata: {}` on the client record without a
schema change.

## 8. What's NOT in scope for v1

These exist in Aqua's Obsidian but skip them for the agency portal MVP:

- Sales 9 Figure Blueprint, Rebuttals & Domination Deflections — sales
  enablement docs; live in SOPs section as static content.
- The Novem / Behaviour Standards — internal standards; static SOP.
- Recurring Actions / Upsells — automation primitives; covered by
  agency-marketing plugin's existing campaigns.
- Aqua Set Sail Gift / Shock & Awe gift — operator-curated swag; not
  software.

## 9. Concrete fold-ins for the in-flight terminals

- **T1 Agency Shell** — sidebar mirrors §2; "+ New client" modal expands
  per §7; phase-preset picker uses §4 phase names.
- **T2 Kanban** — templates are §5 (Aqua-real, not generic).
- **T5 Luv & Ker** — paused per Ed (2026-05-07) until the agency OS is
  live for new clients.

## 10. Source pointer

When in doubt, `~/Desktop/obsidian/Mission Ed/05 Business & Ventures/
Aqua Bios - Internals/` is the canonical operating doc. Read-only from
this codebase — never write back to the vault.
