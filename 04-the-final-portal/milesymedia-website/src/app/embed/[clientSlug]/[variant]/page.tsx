// `/embed/[clientSlug]/[variant]` — iframe-embeddable customer surface
// (T1 R16). Server-rendered. Strips chrome (no Sidebar/Topbar/banner),
// applies the resolved client's brand kit, renders the variant's
// active page via a minimal block walker. CSP `frame-ancestors`
// header is emitted by `portal/middleware.ts` based on the client's
// `getEmbedAllowList` record (T3 R013).
//
// Auth: when no session, renders the existing R9 EmbedLogin scoped
// to the client. Same-origin cookie means a successful login surfaces
// the variant on the next paint.
//
// PostMessage bridge: emits `aqua:auth-ok` when authed, plus
// `aqua:height-changed` on ResizeObserver and `aqua:navigate` on
// in-iframe link click — matches T3 chapter 12 contract.

import { notFound } from "next/navigation";
import Link from "next/link";
import { ensureHydrated } from "@/server/storage";
import { getSession } from "@/lib/server/auth";
import { listAgencies, listClients } from "@/server/tenants";
import { getInstall } from "@/server/pluginInstalls";
import { makeCtx } from "@/plugins/_runtime";
import { ThemeInjector } from "@/components/chrome/ThemeInjector";
import { isPortalRole } from "@/plugins/_types";
import { LoginForm } from "@/app/login/LoginForm";
import { isGoogleOAuthConfigured } from "@/lib/server/oauthGoogle";
import {
  getActivePortalVariant,
  getOrCreateDefaultSite,
} from "../../../../../../plugins/website-editor/src/server";

export const dynamic = "force-dynamic";

interface Block {
  id: string;
  type: string;
  props?: Record<string, unknown>;
  children?: Block[];
}

function summariseBlock(b: Block): string {
  const text =
    (b.props?.["text"] as string | undefined) ??
    (b.props?.["title"] as string | undefined) ??
    (b.props?.["headline"] as string | undefined) ??
    "";
  return text.trim();
}

function RenderBlocks({ blocks }: { blocks: Block[] }) {
  if (!blocks?.length) return null;
  return (
    <ul className="flex flex-col gap-3" data-testid="embed-block-list">
      {blocks.map(b => {
        const text = summariseBlock(b);
        return (
          <li
            key={b.id}
            className="rounded-lg border border-[var(--brand-border,rgba(0,0,0,0.08))] bg-[var(--brand-bg-elevated,#fff)] px-4 py-3 text-sm text-[var(--brand-text,#0F172A)]"
          >
            <div className="text-[10px] font-semibold uppercase tracking-wide text-[var(--brand-text-muted,rgba(0,0,0,0.5))]">
              {b.type}
            </div>
            {text && <div className="mt-1 text-base">{text}</div>}
            {b.children && b.children.length > 0 && (
              <div className="mt-2 pl-3">
                <RenderBlocks blocks={b.children} />
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

const POSTMESSAGE_BRIDGE_SCRIPT = `
(function() {
  if (window.parent === window) return;
  function emit(type, payload) {
    try { window.parent.postMessage({ kind: type, payload: payload || null }, "*"); }
    catch (e) {}
  }
  emit("aqua:auth-ok", { authed: ${"{{authed}}"}, slug: ${"{{slug}}"}, variant: ${"{{variant}}"} });
  let lastHeight = -1;
  function reportHeight() {
    var h = document.documentElement.scrollHeight;
    if (h !== lastHeight) { lastHeight = h; emit("aqua:height-changed", { height: h }); }
  }
  reportHeight();
  if (typeof ResizeObserver !== "undefined") {
    new ResizeObserver(reportHeight).observe(document.documentElement);
  } else {
    window.addEventListener("resize", reportHeight);
  }
  document.addEventListener("click", function(e) {
    var a = e.target && e.target.closest && e.target.closest("a[href]");
    if (a) emit("aqua:navigate", { href: a.getAttribute("href") });
  }, true);
})();
`.trim();

function buildBridgeScript(authed: boolean, slug: string, variant: string): string {
  return POSTMESSAGE_BRIDGE_SCRIPT
    .replace(/\{\{authed\}\}/g, authed ? "true" : "false")
    .replace(/\{\{slug\}\}/g, JSON.stringify(slug))
    .replace(/\{\{variant\}\}/g, JSON.stringify(variant));
}

export default async function EmbedClientVariantPage({
  params,
}: {
  params: Promise<{ clientSlug: string; variant: string }>;
}) {
  await ensureHydrated();
  const { clientSlug, variant } = await params;
  if (!isPortalRole(variant)) notFound();

  // Resolve the client across all agencies via slug (Q-ASSUMED:
  // foundation slug uniqueness across agencies; chapter notes the
  // R+1 path if collisions become real).
  let agencyId = "";
  let clientId = "";
  let client: { id: string; agencyId: string; name: string; brand: import("@/server/types").BrandKit; slug: string } | null = null;
  for (const agency of listAgencies()) {
    const found = listClients(agency.id).find(c => c.slug === clientSlug);
    if (found) {
      client = found;
      agencyId = agency.id;
      clientId = found.id;
      break;
    }
  }
  if (!client) notFound();

  const session = await getSession();
  const authed = !!session;

  // Auth fallback — render EmbedLogin scoped to the resolved client.
  if (!authed) {
    return (
      <html lang="en">
        <body className="m-0 min-h-screen bg-[var(--brand-bg-elevated,#fff)] text-[var(--brand-text,#0F172A)]">
          <ThemeInjector brand={client.brand} scope="customer" />
          <main data-testid="embed-login" className="mx-auto max-w-md p-6">
            <h1 className="text-xl font-semibold">Sign in to {client.name}</h1>
            <p className="mt-1 text-sm text-[var(--brand-text-muted,rgba(0,0,0,0.6))]">
              Embedded view — sessions are scoped to the parent agency&apos;s portal origin.
            </p>
            <div className="mt-4">
              <LoginForm
                embedded
                clientId={clientId}
                googleEnabled={isGoogleOAuthConfigured()}
              />
            </div>
          </main>
          <script dangerouslySetInnerHTML={{ __html: buildBridgeScript(false, clientSlug, variant) }} />
        </body>
      </html>
    );
  }

  // Authed — load the active variant for (clientSlug × portalRole).
  const install = getInstall({ agencyId, clientId }, "website-editor");
  if (!install) {
    return (
      <html lang="en">
        <body className="m-0 min-h-screen p-6">
          <p data-testid="embed-no-website-editor">website-editor not installed for this client.</p>
          <script dangerouslySetInnerHTML={{ __html: buildBridgeScript(true, clientSlug, variant) }} />
        </body>
      </html>
    );
  }
  const ctx = makeCtx(install);
  const site = await getOrCreateDefaultSite(ctx.storage, agencyId, clientId, clientId);
  const page = await getActivePortalVariant(
    ctx.storage,
    agencyId,
    clientId,
    site.id,
    variant as never,
  );

  return (
    <html lang="en">
      <body
        className="m-0 min-h-screen bg-[var(--brand-bg-elevated,#fff)] text-[var(--brand-text,#0F172A)]"
        data-testid="embed-surface"
        data-client-slug={clientSlug}
        data-variant={variant}
      >
        <ThemeInjector brand={client.brand} scope="customer" />
        <main className="mx-auto max-w-3xl p-6">
          <header className="border-b border-[var(--brand-border,rgba(0,0,0,0.08))] pb-3">
            <h1 className="text-xl font-semibold">
              {page?.title ?? `${client.name} · ${variant}`}
            </h1>
            <p className="text-xs text-[var(--brand-text-muted,rgba(0,0,0,0.6))]">
              {client.name} · {variant} · embed surface
            </p>
          </header>
          <div className="mt-4">
            {page && page.blocks?.length ? (
              <RenderBlocks blocks={page.blocks as unknown as Block[]} />
            ) : (
              <p data-testid="embed-empty" className="text-sm text-[var(--brand-text-muted,rgba(0,0,0,0.6))]">
                No active variant yet for <code>{variant}</code>. Configure one in the editor —
                <Link href={`/portal/clients/${clientId}?tab=portal`} className="ml-1 underline">
                  open portal tab →
                </Link>
              </p>
            )}
          </div>
        </main>
        <script dangerouslySetInnerHTML={{ __html: buildBridgeScript(true, clientSlug, variant) }} />
      </body>
    </html>
  );
}
