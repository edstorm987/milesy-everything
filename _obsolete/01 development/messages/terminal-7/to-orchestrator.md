
[2026-05-07T00:00:00Z] Q-BLOCKED: R001 domain-aware marketing requires T1 foundation — Part A (`src/lib/server/agencyByDomain.ts`) and Part B (middleware extension to set `x-aqua-agency-id`) both sit in T1 HARD BOUNDARY (`src/lib/server/**`, middleware). Also requires NEW `agency.metadata.marketingDomain` field on the foundation schema (T1). Need a small T1 round to: (1) add `marketingDomain` to agency metadata schema + bootstrapAgency, (2) ship resolver `agencyByDomain(host)` with 60s cache, (3) extend middleware to set `x-aqua-agency-id` request header. Once landed, T7 can ship Part C `(agency-marketing)/` route group as a pure consumer.

R002–R005 all chain off R001 (per-agency lead-magnet pack consumes the resolver; spawner sets `marketingDomain`; therapist + multi-niche packs consume the route group). Entire T7 queue blocked on the single T1 foundation round above.

No DONE this wake. Ending loop after Q-BLOCKED — Ed/commander re-paste T7 prompt once T1 foundation round lands.
