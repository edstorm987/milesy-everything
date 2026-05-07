# From orchestrator → T3

Append-only. The orchestrator (chief commander) writes here when:
- Replying to your `Q-BLOCKED` or correcting a `Q-ASSUMED`
- Handing you a new sub-task or Round-2 prompt
- Course-correcting your direction

You (T3) READ this each cycle and ACT on what you find. You never write here.

Format: `[ISO timestamp] TYPE: message`. Same vocabulary as the global protocol (`messages/README.md`).

---

[2026-05-04T07:00:00Z] REPLY (ref T3 01:04:30Z Q-ASSUMED on applyStarterVariant role): Confirmed. You're right — `role: PortalRole` is correct. The starter variant is keyed by which surface (login / affiliates / orders / account), not by user role. T2 has been notified to update `PortalVariantPort.role: Role` → `role: PortalRole` in their `ports.ts`. Proceed exporting `applyStarterVariant({ clientId, agencyId, role: PortalRole, variantId })` from your plugin.

[2026-05-04T07:00:00Z] PLAN: Continue Step 2+ — port the editor surface (admin/editor + admin/portals + admin/customise + admin/sites + admin/themes), block library (58 blocks), storefront overlay (PortalEditOverlay + PortalPageRenderer), server runtime (pages.ts variant helpers + themes + content + preview). Round-1 finish line: tsc-clean plugin + chapter `04-plugin-website-editor.md` documenting the contract for T2 to call `applyStarterVariant`. Once DONE, stop — Round 2 prompt will land in this inbox.

[2026-05-04T18:00:00Z] TASK: Round 2 prompt at `01 development/terminal-prompts/T3-round2-block-uis.md`. Round 1 shipped 58 block stubs + 11 admin page stubs + full server runtime + applyStarterVariant. Round 2 = lift the REAL implementations from `02 felicias aqua portal work/`: real block components, real EditorPage with Live/Block/Code modes + outliner + properties + topbar + publish modal, real PortalsPage with variant CRUD, real Pages/Customise/Sites/Themes/Sections/Assets/Popups admin pages. Phase A (58 blocks) is the heaviest — commit per 10 blocks lifted. Chapter update or new `04-plugin-website-editor-round2.md`. Re-paste if /loop ended.

[2026-05-04T22:00:00Z] TASK: Round 3 prompt at `01 development/terminal-prompts/T3-round3-admin-and-renderers.md`. R2 closed cleanly @ `079a666` — chapter 29 (`04-plugin-website-editor-round2.md`), MASTER row, tasks.md ticked. Excellent execution across all four phases (A: 58 blocks; B: 1429-LOC EditorPage; C: 444-LOC PortalsPage; D: Sections/Assets/Popups/Themes). R3 picks up your own R2-deferred list plus a long-standing cross-team handoff: (Goal A) lift `CustomisePage` (898 lines, brand-kit editor), (Goal B) wire `RENDERER_REGISTRATIONS` to T2's 8 ecommerce block ids — they were declared in T2's manifest with delegated rendering; you've had the components since R2 Phase A but they aren't formally registered as cross-plugin renderers yet, (Goal C) lift `ThemeDetailPage` (1063 lines) + re-point `PagesPage` at the EditorPage list. PageDetailPage / SitesPage / customPages backend deferred to R4 — explicitly carved out in NOT-in-scope. If T2 R4 (memberships) lands during your loop, pre-register its 3 block ids alongside the ecommerce ones; otherwise log a Q-ASSUMED and defer. If your /loop ended after R2 DONE, Ed re-pastes.

[2026-05-05T02:15:00Z] PING: Ed cleaned up the workspace — your R3 prompt is the ONLY active T3 prompt at `01 development/terminal-prompts/T3-round3-admin-and-renderers.md` (T3-round2-block-uis.md has been archived to `old prompts/`). All previous T3 work (R1/R2) shipped cleanly. R3 is your next round. Ed is re-pasting the prompt now to restart your /loop. UPDATE on Goal B's contingent renderer pre-registration: while you were silent, T2 shipped memberships (R4 → 3 block ids) AND affiliates (R5b → 3 block ids) AND agency-marketing (R7b → 0 block ids) AND client-crm coming in R8 → 1 block id. So when you reach Goal B, the pre-register list is firmer: ecommerce 8 ids + memberships 3 ids + affiliates 3 ids = 14 cross-plugin renderers. The components are already in your `BLOCK_REGISTRY` from R2 Phase A — you just need to formally wire `RENDERER_REGISTRATIONS` and `registerExternalBlockRenderers`. Welcome back.

[2026-05-05T11:00:00Z] TASK: Round 5 prompt at `01 development/terminal-prompts/T3-round5-cross-plugin-block-renderers.md`. R4 closed cleanly — Goal A (SitesPage 3264-LOC) absorbed in `64d9dca` per shared-`.git/index` mesh, Goals B+C in `b7d9290`. Editor admin surface is now parity-with-`02`. R5 fills in the **real React components for the 18 cross-plugin storefront blocks** that you registered as stubs in R3 Goal B: ecommerce 8 (product-card / product-grid / cart-summary / checkout-summary / payment-button / order-success / variant-picker / product-search) + memberships 3 (paywall / signup / tier-grid) + affiliates 3 (signup / payout-meter / leaderboard) + forms 1 (form-render) + crm 1 (contact-form) + ecommerce-extras 1 (donation-button). Phase A: ecommerce 8 (real fetches replacing the ecommerceBridge stubs). Phase B: memberships 3 + affiliates 3 + forms 1 + crm 1 (real fetches against each plugin's API namespace). Phase C: smoke + chapter `04-plugin-website-editor-round5.md`. If your /loop ended after R4 DONE / WAKE 1/3 entry, Ed is re-pasting now.

[2026-05-05T13:30:00Z] TASK: Round 6 prompt at `01 development/terminal-prompts/T3-round6-editor-per-client-save-mode.md`. R5 closed cleanly @ `83e6a7e` — all 18 cross-plugin renderers shipped real (Phase A ecommerce 8 in `6bd81c5`; Phase B+C the rest). R6 wires the editor's Save button to write directly into `clients/<slug>/` for Live clients via T2 R11's portal-export plugin. Per architecture extension chapter 19b — the editor becomes "the git-based web editor for portals" Ed described, with storage target switching based on phase. Four goals: (A) save-target toggle in editor topbar, (B) save-pipeline branching (shared portal vs client repo), (C) diff preview + post-save banner, (D) new `GitStatusPage` surface. **Critical**: coordinate with T2 R11's save API contract before relying on it; if R11 only exposes initial materialise and not incremental save, fall back to full re-export per save (slow but correct, R7 polish). Coordinate with T5's `clients/luv-and-ker/` shape (commits `8f0bb01` + `2fc3ae1`). Coordinate with T6 on `GitOpsPort`. New optional ports (`PortalExportPort`, `GitOpsPort`) accepted via container builder; missing ports → save-mode toggle hidden, graceful degradation.

[2026-05-05T15:10:00Z] TASK: Round 7 prompt at `01 development/terminal-prompts/T3-round7-ai-page-builder.md`. R6 closed @ `2db45c0` — editor save-to-per-client-repo + GitStatusPage. R7 ships `@aqua/plugin-ai-builder` — the AI page builder eds requirements lists as v1-future. Operator types a description, Claude (Haiku 4.5 default; Sonnet 4.6 fallback for harder generations) returns a `BlockTree[]` using your block library. API key per-install config. Prompt caching enabled on the (huge static) system prompt. Editor's topbar gets a "✨ Generate" button; modal shows streaming preview; insert at selection. `requires: ["website-editor"]`, `scopePolicy: "either"`.

[2026-05-06T22:13:00Z] REPLY: my commander cycle-20 `git add -A` absorbed your uncommitted R-round working tree into commit `eb16b14` (same shared-`.git/index` mesh hazard several terminals have logged before). Your work is on origin/main intact. Treat the round as DONE; if you have a final DONE outbox entry to write, do it now and the next cycle will draft your next round.

[2026-05-06T22:40:00Z] TASK: Round 8 prompt at `01 development/terminal-prompts/T3-round8-streaming-and-live-preview.md`. R7 closed @ `892c1a4`/`165336c` — `@aqua/plugin-ai-builder` + GenerateModal + EditorTopBar ✨ wired (smoke 3/3, MASTER #52). R8 closes the two biggest R7 deferrals: SSE streaming on Generate (live partial-tree render in modal) + LivePreview iframe panel in EditorPage (postMessage block-selection sync). Also folder rename note — paths now `04-the-final-portal/`. R7 prompt archived.

[2026-05-06T22:38:00Z] TASK: Round 9 prompt at `01 development/terminal-prompts/T3-round9-ai-images-and-cost-ceilings.md`. R8 closed @ `ca6c2c7` — SSE streaming + LivePreview iframe + smoke 5/5 + MASTER #54. R9 closes the AI loop: image generation (pluggable provider, default stub via picsum, encrypted per-install OpenAI key) + per-agency cost ceilings (monthly tokens/images, circuit breaker, Settings Usage panel). R8 prompt archived.

[2026-05-06T23:07:00Z] REPLY: my cycle-23 commit `9b27049` absorbed your R9 working tree (imageService + ceilings in domain.ts + SettingsPage Usage panel + GenerateModal updates + smoke). Same shared-`.git/index` mesh hazard. R9 effectively shipped on origin/main; treat as DONE. R9 prompt archived. Next round prompt holding pending Ed's strategic redirection on simple-agency-shell + kanban scope.

[2026-05-06T23:15:00Z] TASK: Fresh slate per Ed's directive — all prior active prompts archived. New prompt at `01 development/terminal-prompts/T3-lift-inventory.md`. Lift Inventory chapter — read-only audit of `02 felicias aqua portal work/` + `03 old portal/`. Document every screen/feature/asset, mark PORTED/PARTIAL/NOT-PORTED. Pure documentation, zero code changes.

**HARD BOUNDARY** (in every prompt): do NOT touch `04-the-final-portal/milesymedia website/` or `04-the-final-portal/business-os/` — Ed owns those (T4's territory). Q-BLOCKED if your work would cross the line.

[2026-05-06T23:33:00Z] TASK: Next prompt at `01 development/terminal-prompts/T3-editor-deeplink.md`. Lift Inventory shipped @ `8611db8` (chapter #58) — beautiful work, 19-entry revival list now in hand. R9 close-out chapter @ `179270c` (#57). Next round: **editor deep-link contract** so T1's agency-shell "Edit website" CTA opens the editor at the right client + page + variant; plus a page-picker toolbar so the editor feels like a website manager. Light round, supports T1's work directly. Lift-inventory prompt archived.

[2026-05-07T00:35:00Z] ARCHITECTURE CHANGE — queue-based loop. Ed asked for a self-pacing queue so we don't bottleneck on his re-paste. New workflow:

1. Ed pastes `01 development/terminal-prompts/T3-router.md` into your terminal ONCE. That router is now your persistent /loop input.
2. On each wake, you list `01 development/terminal-prompts/queues/T3/*.md` lexically, treat the lowest-numbered file as your active round, follow its Scope, log DONE referencing the filename.
3. Commander archives the shipped file to `old prompts/`. Next wake you see the next-lowest file and start that round automatically — no Ed re-paste needed.
4. Empty queue → `WAKE-EMPTY` x3 → end loop. Ed re-pastes router when more work is staged.

Currently in your queue:
  - 001-editor-deeplink.md
  - 002-incubator-template.md

Read `01 development/terminal-prompts/queues/README.md` for the full discipline. Your previous active prompt has been moved into the queue at position 001 — pick up where you left off, and 002 is staged for when you finish.

[2026-05-07T00:42:00Z] REPLY: 001 round shipped + archived to `old prompts/`. Your queue now has only `002-*` active — next /loop fire reads it and starts Incubator template + 4 Notion-style blocks. Beautiful work shipping the queue's first round under the new architecture.

[2026-05-07T11:10:00Z] NOTE — WEBSITE HANDS-OFF (Ed directive)
Ed is now driving T4 manually on the Milesy website. **Do NOT touch any file under `04-the-final-portal/milesymedia website/`** for the foreseeable future, regardless of what your queue prompts may suggest. This reinforces your existing HARD BOUNDARY but is now an active-conflict zone.

If a queue prompt requires editing milesymedia website/ files, log Q-BLOCKED instead of Q-ASSUMED — commander will rewrite the prompt or defer the round. No "I'll just touch one file" exceptions.

Your territory is unchanged otherwise:
- T1 → portal/ (foundation/agency-shell)
- T2 → plugins/ (agency + customer plugins)
- T3 → plugins/website-editor/ (block engine + editor)

Carry on.
