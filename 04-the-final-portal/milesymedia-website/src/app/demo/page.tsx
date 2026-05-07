// T4 unify-fix — Demo persona chooser. /demo used to auto-sign-in
// as the demo agency-owner; now visitors pick which seat to try
// first. Each card hits /demo/start?as=<persona>, which performs
// the actual seed + cookie issuance + redirect (preserving the
// existing demo lifecycle and ?embed=1 support).
//
// Pattern matches /signup (role chooser) and /dev/pov so the auth
// surfaces feel consistent.

import Link from "next/link";
import { SiteShell } from "@/components/SiteShell";

export const metadata = {
  title: "Try the demo · Milesy Media",
};

const POVS = [
  {
    id: "agency",
    title: "I run an agency",
    sub: "See the agency control room — clients, plugins, fulfilment, billing, the lot. The owner's seat.",
    cta: "Open agency view",
    landing: "/portal/agency",
  },
  {
    id: "client",
    title: "I'm a client of an agency",
    sub: "Felicia's POV. Brand kit, websites being built for her, current Incubator phase, deliverables.",
    cta: "Open client view",
    landing: "/portal/clients/<slug>",
  },
  {
    id: "customer",
    title: "I'm a customer of a business",
    sub: "Shopper's POV — the storefront-side surface clients' end-customers see (orders, bookings, account).",
    cta: "Open customer view",
    landing: "/portal/customer",
  },
];

export default function DemoChooserPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const sourceRaw = searchParams?.source;
  const source = Array.isArray(sourceRaw) ? sourceRaw[0] : sourceRaw;
  const embedRaw = searchParams?.embed;
  const embed = Array.isArray(embedRaw) ? embedRaw[0] : embedRaw;
  const qs = new URLSearchParams();
  if (source) qs.set("source", source);
  if (embed === "1") qs.set("embed", "1");

  return (
    <SiteShell>
      <main className="mm-auth-shell">
        <div className="mm-auth-card mm-signup-picker">
          <div className="mm-auth-card-head">
            <span className="mm-dev-eyebrow">Demo</span>
            <h1>Who do you want to be?</h1>
            <p>
              Three seats, one shared sandbox. Pick a POV to start in;
              once inside you can cycle through the others from the
              demo banner. Nothing here touches a real account — the
              sandbox resets nightly.
            </p>
          </div>
          <div className="mm-role-grid">
            {POVS.map(p => {
              const params = new URLSearchParams(qs);
              params.set("as", p.id);
              return (
                <Link
                  key={p.id}
                  href={`/demo/start?${params.toString()}`}
                  className="mm-role-card is-available"
                  prefetch={false}
                >
                  <span className="mm-role-badge">Try it</span>
                  <span className="mm-role-title">{p.title}</span>
                  <span className="mm-role-sub">{p.sub}</span>
                  <span className="mm-role-cta">{p.cta} →</span>
                </Link>
              );
            })}
          </div>
          <div className="mm-auth-foot">
            <span>
              Want a real account? <Link href="/signup">Get started →</Link>
            </span>
            <Link href="/login">Already have one? Sign in →</Link>
          </div>
        </div>
      </main>
    </SiteShell>
  );
}
