# T4 — outbox

Append-only. Format: `[ISO timestamp] TYPE: message` (see `messages/README.md`).

[2026-05-05T01:00:00Z] STARTED: Round 1 — UX + accessibility pass across portal + 9 plugins. Beginning Phase A audit (chrome + 70 plugin admin pages + 58 storefront blocks + 18 cross-plugin renderers).
[2026-05-05T01:00:30Z] Q-ASSUMED: shared UI primitives + a11y hooks live foundation-side under `04 the final portal/portal/src/{components/ui,lib/a11y}/`. Plugins re-implement the same patterns inline using the same Tailwind utility classes; they all inherit the global focus-ring CSS layer (Phase C). Reason: a real workspace dep `@aqua/ui` would require touching every plugin's tsconfig/exports + adding a `file:..` line per plugin — out of scope for an a11y-polish round. R2 can promote if churn is high.
[2026-05-05T01:00:45Z] Q-ASSUMED: skeletons use `animate-pulse bg-black/5` for light surfaces and `animate-pulse bg-white/5` for dark surfaces (storefront blocks render against a typically dark canvas in the editor). Reason: matches the Felicia-portal vocabulary in `clients/felicias perfect portal/src/app/admin/page.tsx:276-299` while staying brand-neutral.
