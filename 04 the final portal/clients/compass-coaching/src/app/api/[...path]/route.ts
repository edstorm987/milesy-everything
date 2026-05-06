import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getAuthOrigin } from "@/lib/portalConfig";

// Catch-all proxy. Same shape as luv-and-ker's — see chapter 43 for
// the full rationale. Forwards every method to PORTAL_API_ORIGIN.
// Hop-by-hop headers stripped; bodies streamed; Set-Cookie preserved;
// 502 fallback when upstream unreachable.

const HOP_BY_HOP = new Set([
  "connection",
  "keep-alive",
  "transfer-encoding",
  "upgrade",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailers",
  "host",
  "content-length",
]);

function buildUpstreamUrl(req: NextRequest, segments: string[]): string {
  const origin = getAuthOrigin();
  const path = `/api/${segments.join("/")}`;
  const search = req.nextUrl.search;
  return `${origin}${path}${search}`;
}

function copyRequestHeaders(req: NextRequest): Headers {
  const out = new Headers();
  req.headers.forEach((value, key) => {
    if (HOP_BY_HOP.has(key.toLowerCase())) return;
    out.set(key, value);
  });
  return out;
}

function copyResponseHeaders(upstream: Response): Headers {
  const out = new Headers();
  upstream.headers.forEach((value, key) => {
    if (HOP_BY_HOP.has(key.toLowerCase())) return;
    out.append(key, value);
  });
  return out;
}

async function proxy(req: NextRequest, segments: string[]): Promise<Response> {
  const url = buildUpstreamUrl(req, segments);
  const init: RequestInit = {
    method: req.method,
    headers: copyRequestHeaders(req),
    redirect: "manual",
  };
  if (req.method !== "GET" && req.method !== "HEAD") {
    init.body = req.body;
    // @ts-expect-error — Node fetch needs duplex: "half" when body is a stream
    init.duplex = "half";
  }
  let upstream: Response;
  try {
    upstream = await fetch(url, init);
  } catch (e) {
    const message = e instanceof Error ? e.message : "upstream unreachable";
    return NextResponse.json(
      { error: "portal-upstream-unreachable", upstream: url, detail: message },
      { status: 502 },
    );
  }
  return new NextResponse(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: copyResponseHeaders(upstream),
  });
}

interface Ctx { params: Promise<{ path: string[] }> }

export async function GET(req: NextRequest, ctx: Ctx)    { const { path } = await ctx.params; return proxy(req, path); }
export async function HEAD(req: NextRequest, ctx: Ctx)   { const { path } = await ctx.params; return proxy(req, path); }
export async function POST(req: NextRequest, ctx: Ctx)   { const { path } = await ctx.params; return proxy(req, path); }
export async function PUT(req: NextRequest, ctx: Ctx)    { const { path } = await ctx.params; return proxy(req, path); }
export async function PATCH(req: NextRequest, ctx: Ctx)  { const { path } = await ctx.params; return proxy(req, path); }
export async function DELETE(req: NextRequest, ctx: Ctx) { const { path } = await ctx.params; return proxy(req, path); }
export async function OPTIONS(req: NextRequest, ctx: Ctx){ const { path } = await ctx.params; return proxy(req, path); }
