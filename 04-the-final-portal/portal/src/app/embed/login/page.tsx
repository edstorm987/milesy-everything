// Embed-able login surface. Iframe-loaded from a client's own website
// (e.g. luvandker.com), customised per `?client=<id>` for branding.
//
// Cookies are still scoped to the portal origin (`milesymedia.com`), so
// the same session works in both surfaces. The form's success handler
// navigates the *parent* frame so the user lands on their account page
// at the embedding site, not inside the iframe.

import { Suspense } from "react";
import { LoginForm } from "@/app/login/LoginForm";
import { isGoogleOAuthConfigured } from "@/lib/server/oauthGoogle";
import { ThemeInjector } from "@/components/chrome/ThemeInjector";
import { getAgency, getClient } from "@/server/tenants";
import { ensureHydrated } from "@/server/storage";
import type { BrandKit } from "@/server/types";

interface SearchParams {
  client?: string;
  agency?: string;
}

export default async function EmbedLoginPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await ensureHydrated();
  const params = await searchParams;

  let brand: BrandKit | null = null;
  let title = "Sign in";
  let subtitle: string | undefined;
  let resolvedClientId: string | undefined;
  let allowSignup = false;

  if (params.client) {
    const client = getClient(params.client);
    if (client) {
      brand = client.brand;
      title = `Sign in to ${client.name}`;
      subtitle = "Member access";
      resolvedClientId = client.id;
      // Default true — only suppressed when the agency explicitly turns
      // signups off for this client.
      allowSignup = client.endCustomers?.signupsEnabled !== false;
    }
  } else if (params.agency) {
    const agency = getAgency(params.agency);
    if (agency) {
      brand = agency.brand;
      title = `Sign in to ${agency.name}`;
    }
  }

  return (
    <main
      id="main-content"
      className="flex min-h-screen flex-col items-center justify-center bg-[var(--brand-surface,_#fff)] px-4 py-8"
      data-embed="true"
    >
      {brand && <ThemeInjector brand={brand} scope="client" />}
      <div className="w-full max-w-xs">
        <div className="mb-5 text-center">
          {brand?.logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={brand.logoUrl}
              alt={`${title}`}
              className="mx-auto mb-3 h-10 w-auto"
              // Reserve a fixed height so the form below doesn't jump
              // when the logo finishes loading. width=auto + h-10 keeps
              // the visual size; the height attr removes the flash.
              height={40}
            />
          )}
          <h1 className="text-lg font-semibold tracking-tight text-black/90">
            {title}
          </h1>
          {subtitle && <p className="mt-1 text-xs text-black/60">{subtitle}</p>}
        </div>
        <Suspense
          fallback={
            <div role="status" aria-live="polite" aria-busy="true" className="flex flex-col gap-2">
              <span className="sr-only">Loading sign-in form</span>
              <div className="h-9 rounded-md bg-black/5 animate-pulse" aria-hidden />
              <div className="h-9 rounded-md bg-black/5 animate-pulse" aria-hidden />
              <div className="h-10 mt-1 rounded-md bg-black/10 animate-pulse" aria-hidden />
            </div>
          }
        >
          <LoginForm
            embedded
            clientId={resolvedClientId}
            allowSignup={allowSignup}
            googleEnabled={isGoogleOAuthConfigured()}
            magicLinkEnabled={allowSignup}
          />
        </Suspense>
      </div>
    </main>
  );
}
