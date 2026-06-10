/loop

# T3 — Round 013: Iframe-embed customer surface

Per requirements §3 (third audience: end-customers): each client's
end-customers log in via an iframe embedded on the client's own
website. Same engine, branded as the client's. PostMessage protocol.

## Mandatory pre-read

1. `01 development/eds requirments.md` §3 audiences table.
2. Chapter 09 (storefront) + 17 (concepts to port — iframe-embed
   login from `02 felicias aqua portal work/`).
3. T1 R009 OAuth chapter — `EmbedLogin` component already exists.

## Scope

**A** — Route `/embed/[clientSlug]/[variant]` — strips chrome, applies
client's brand kit, renders the chosen variant tree (login / account /
orders / etc.).

**B** — Embed-only CSP / X-Frame-Options: explicit allow-list per
client (`metadata.embedAllowedOrigins[]`).

**C** — `postMessage` protocol per chapter 12 bridge: `aqua:auth-ok`,
`aqua:height-changed`, `aqua:navigate` events fired to host window.
Resize-to-content auto-iframe-height via `MessageChannel`.

**D** — Embed snippet generator UI per client (paste-ready HTML/JS
for the operator to send the client).

**E** — Smoke (puppeteer-style: load embed in test iframe, check
postMessage events) + chapter `04-iframe-embed-surface.md` + MASTER
row.

## NOT in scope

- Custom-domain provisioning (T6).
- Cross-origin cookie tricks beyond what's in chapter 10.

## When done
DONE referencing `013-iframe-embed-customer-surface.md`.
