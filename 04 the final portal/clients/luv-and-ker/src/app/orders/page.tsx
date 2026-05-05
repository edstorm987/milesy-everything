import { redirect } from "next/navigation";
import { Header } from "@/components/chrome/Header";
import { Footer } from "@/components/chrome/Footer";
import { MemberDrawer } from "@/components/chrome/MemberDrawer";
import { getSessionUser } from "@/lib/sessionUser";
import { getAuthOrigin, getPortalConfig } from "@/lib/portalConfig";

export const metadata = { title: "Orders" };

interface OrderSummary {
  id: string;
  number?: string;
  status: string;
  totalCents?: number;
  currency?: string;
  createdAt: number;
}

// Pulls /api/portal/ecommerce/customer/orders from the shared portal
// (server-side, with the visitor's session cookie) and renders a
// branded list. Falls back to an empty state if the plugin endpoint is
// unavailable in dev.

async function fetchOrders(cookieValue: string): Promise<OrderSummary[]> {
  const cfg = getPortalConfig();
  const origin = getAuthOrigin();
  try {
    const res = await fetch(`${origin}/api/portal/ecommerce/customer/orders`, {
      headers: { cookie: `${cfg.auth.cookieName}=${cookieValue}` },
      cache: "no-store",
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { orders?: OrderSummary[] };
    return data.orders ?? [];
  } catch {
    return [];
  }
}

function formatMoney(cents: number | undefined, currency: string | undefined): string {
  if (cents == null) return "—";
  const amount = cents / 100;
  try {
    return new Intl.NumberFormat("en-GB", { style: "currency", currency: currency ?? "GBP" }).format(amount);
  } catch {
    return `£${amount.toFixed(2)}`;
  }
}

export default async function OrdersPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  // Re-read the cookie value so we can forward it.
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  const cfg = getPortalConfig();
  const cookieVal = cookieStore.get(cfg.auth.cookieName)?.value ?? "";
  const orders = cookieVal ? await fetchOrders(cookieVal) : [];

  return (
    <>
      <Header />
      <main className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-8 md:grid-cols-12">
          <MemberDrawer email={user.email} />
          <section className="md:col-span-9 space-y-6">
            <header>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--brand-primary)]">
                Orders
              </p>
              <h1 className="mt-2 font-[family-name:var(--brand-font-heading)] text-4xl font-semibold tracking-tight">
                Order history
              </h1>
              <p className="mt-2 text-sm text-[var(--brand-ink)]/70">
                Your recent purchases. Tap an order for details + reorder.
              </p>
            </header>

            {orders.length === 0 ? (
              <div className="rounded-[var(--brand-radius)] border border-dashed border-black/15 bg-white p-10 text-center">
                <p className="font-[family-name:var(--brand-font-heading)] text-2xl font-semibold tracking-tight">
                  No orders yet.
                </p>
                <p className="mt-2 text-sm text-[var(--brand-ink)]/65">
                  Once you place your first order it will appear here.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-black/10 rounded-[var(--brand-radius)] border border-black/10 bg-white">
                {orders.map(order => (
                  <li key={order.id} className="flex items-center justify-between px-5 py-4">
                    <div>
                      <p className="font-medium text-[var(--brand-ink)]">
                        Order {order.number ?? order.id.slice(0, 8)}
                      </p>
                      <p className="mt-0.5 text-xs uppercase tracking-wider text-[var(--brand-ink)]/55">
                        {order.status} · {new Date(order.createdAt).toLocaleDateString("en-GB")}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-[var(--brand-ink)]">
                      {formatMoney(order.totalCents, order.currency)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
