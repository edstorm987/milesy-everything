// Same-origin API client. Server-side calls hit the proxy
// (`/api/...`) which forwards to the shared portal at
// PORTAL_API_ORIGIN. Browser-side calls hit `/api/...` directly so the
// `lk_session_v1` cookie (scoped to milesymedia.com) flows when the
// per-client portal is iframed inside that origin.

export interface PortalApiOptions extends RequestInit {
  query?: Record<string, string | number | undefined>;
}

function buildUrl(path: string, query?: PortalApiOptions["query"]): string {
  const base = path.startsWith("/api") ? path : `/api${path.startsWith("/") ? path : `/${path}`}`;
  if (!query) return base;
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v !== undefined) params.set(k, String(v));
  }
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}

export async function portalApi<T>(path: string, opts: PortalApiOptions = {}): Promise<T> {
  const { query, ...init } = opts;
  const res = await fetch(buildUrl(path, query), {
    credentials: "include",
    headers: {
      "content-type": "application/json",
      ...(init.headers ?? {}),
    },
    ...init,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Portal API ${res.status}: ${text || res.statusText}`);
  }
  return (await res.json()) as T;
}

export const portalApiGet = <T>(path: string, query?: PortalApiOptions["query"]) =>
  portalApi<T>(path, { method: "GET", query });

export const portalApiPost = <T>(path: string, body?: unknown) =>
  portalApi<T>(path, {
    method: "POST",
    body: body === undefined ? undefined : JSON.stringify(body),
  });
