# 04 — Private / password-protected pages (T3 R026)

T3 Round 026. Per-page privacy levels: public / unlisted /
password / members-only. Storefront enforces; editor surfaces
toggle + password field.

## 1. Schema

`EditorPage` gains:

```ts
privacy?: "public" | "unlisted" | "password" | "members-only"
passwordHash?: string  // sha256:<hex>, only set when privacy="password"
```

Defaults to "public" when absent — every legacy page renders
unchanged. `UpdatePagePatch` extended too so the existing PATCH
handlers thread privacy through, but the raw password is never
accepted there — operators must use `/pages/privacy` which
hashes server-side.

## 2. Privacy library

NEW `lib/pagePrivacy.ts` (pure, Web Crypto):

- `hashPagePassword(pageId, password)` returns `sha256:<hex>`
  with the pageId baked in as a per-page salt. Same password on
  two pages produces different hashes — operator can lift one
  page record without leaking another.
- `verifyPagePassword` constant-time equal.
- `makeUnlockToken(pageId, passwordHash)` → `<pageId>:<sha256>`
  cookie payload. Token includes the pageId so a stolen cookie
  from one page can't unlock another.
- `verifyUnlockToken` constant-time equal.
- `evaluatePageAccess(page, ctx)` returns `PageAccessResult`:
  - public → allow.
  - unlisted → allow + `hideFromSitemap: true`.
  - members-only → allow when `ctx.memberRole` set, else deny
    with reason "members-only".
  - password → allow only when `ctx.unlockToken` matches; else
    deny with reason "challenge". Default-denies when password
    privacy is set but `passwordHash` missing (mis-configured).
- `pagesVisibleInSitemap(pages)` filters to public-only.

Hash format is sha256 with pageId salt — adequate for the v1
threat model (casual-lookup site gate). R+1: upgrade to
scrypt/argon2 with random salt for credential-grade security.

## 3. Endpoints

`api/handlers/pagePrivacy.ts`:

- `POST /pages/privacy?siteId=…&id=…` body `{ privacy, password? }`:
  - Sets the page's privacy. When `privacy === "password"` and
    `password` is supplied, hashes server-side and stores. When
    privacy moves away from "password", drops the hash so it
    doesn't linger.
  - 400 missing args, 404 unknown page, 400 if switching to
    password with no password and no existing hash, 400 invalid
    privacy enum value.
  - Response always masks `passwordHash` (never echoed back).
- `POST /pages/privacy/unlock?siteId=…&id=…` body `{ password }`:
  - Verifies password against the stored hash; on success
    returns `{ token }` for the host page to set as a cookie
    + send back on subsequent requests.
  - 401 wrong password, 400 page not password-gated, 400 missing
    args, 404 unknown page.

`requireClientScope` gated.

## 4. Storefront wire-up (host-side)

The pure library + endpoints are the contract. Foundation
storefront middleware composes:

```ts
const cookie = req.cookies.get(`aqua_unlock_${pageId}`)?.value;
const result = await evaluatePageAccess(page, {
  unlockToken: cookie,
  memberRole: session?.role,
});
if (!result.allow && result.reason === "challenge") {
  return renderPasswordForm(pageId);
}
if (!result.allow && result.reason === "members-only") {
  return redirectToLogin(req.url);
}
if (result.hideFromSitemap) {
  res.headers.set("X-Robots-Tag", "noindex");
}
return renderPage(page);
```

R014's `pagesVisibleInSitemap` already handles the unlisted
case for sitemap.xml generation — extend `buildSitemapXml`
to consult page.privacy as a follow-up R+1.

## 5. Smoke

NEW `__smoke__/r026-page-privacy.test.ts` 33/33 pass:

- Hash format (`sha256:<64-hex>`) + per-page salt + verify
  hit/miss/wrong-pageId/non-prefixed-input.
- Unlock token shape (`<pageId>:<hex>`) + verify
  hit/mismatch-pageId/mismatch-hash/garbage.
- `evaluatePageAccess`: public allow + missing-privacy defaults
  public; unlisted allow + hideFromSitemap; members-only
  deny-without-role / allow-with-role; password challenge-without-
  token / challenge-on-bogus-token / allow-with-valid-token /
  default-deny when hash missing.
- `pagesVisibleInSitemap` drops non-public.
- HTTP `/pages/privacy`: set without password 400; set with
  password 200 + masks hash in response + persists to storage;
  switching to public drops hash; invalid privacy enum 400.
- HTTP `/pages/privacy/unlock`: wrong pw 401; correct pw 200 +
  token starting with `pageId:`; missing siteId 400.

`@aqua/plugin-website-editor` package.json test chain extended.
website-editor tsc-clean.

## 6. Files

- `plugins/website-editor/src/types/editorPage.ts` patch
  (EditorPagePrivacy + privacy/passwordHash on EditorPage +
  UpdatePagePatch).
- `plugins/website-editor/src/lib/pagePrivacy.ts` (NEW —
  hashPagePassword, verifyPagePassword, makeUnlockToken,
  verifyUnlockToken, evaluatePageAccess, pagesVisibleInSitemap,
  constant-time equal).
- `plugins/website-editor/src/api/handlers/pagePrivacy.ts`
  (NEW — handleSetPagePrivacy, handleUnlockPage).
- `plugins/website-editor/src/api/routes.ts` patch (2 new routes).
- `plugins/website-editor/src/__smoke__/r026-page-privacy.test.ts`
  (NEW).
- `plugins/website-editor/package.json` (test chain).

## 7. Q-ASSUMED / deviations

- Hash is sha256 with pageId-salt, not scrypt/argon2. Adequate
  for site-gate threat model (casual-lookup defense, not
  credential theft). R+1: upgrade with proper KDF + random
  salt.
- `evaluatePageAccess` consumes a cookie value the host
  middleware harvests; cookie name + signing is host concern
  (recommend `aqua_unlock_<pageId>`, HttpOnly + SameSite=Lax,
  domain-scoped to the storefront).
- members-only checks `ctx.memberRole` — host derives from
  session. R026 doesn't define what counts as "member"; chapter
  10 portal-roles is the source of truth. The check is
  `Boolean(memberRole)` for v1; R+1 ties to specific role
  enums (e.g. only `client-staff` or higher).
- Sitemap integration: R014's `buildSitemapXml` already filters
  by `noIndex` + portal-variant + status. R+1 extends with
  privacy filter so unlisted/password/members-only pages are
  also dropped from the XML feed (smoke for that lands when
  the sitemap consumer wires through the privacy field).
- Editor "privacy chip in page settings" UI deferred to host-
  page composition — this round ships the type + endpoints +
  pure access lib.

## 8. R+1 candidates

- scrypt / argon2-id KDF with random salt + iteration tuning.
- Editor page-settings UI for privacy + password input
  (mirrors R007 cookie-consent block field-form pattern).
- Sitemap integration: extend R014's `buildSitemapXml` to drop
  non-public pages.
- Multi-password / temporary access tokens (out of scope per
  prompt) for share-link flows.
- Per-block privacy (out of scope per prompt) for partial-page
  gating.
- Brute-force protection (rate-limit per-page unlock attempts)
  — host middleware concern, R+1.
- Session-cookie revocation (rotate the hash → existing tokens
  invalidate) — already true today since token includes the
  hash, but explicit "expire all unlocks" admin button is R+1.
