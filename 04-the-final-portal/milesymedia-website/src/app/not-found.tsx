import Link from "next/link";
import { SiteShell } from "@/components/SiteShell";

export const metadata = {
  title: "Not found · Milesy Media",
};

// Top-level 404 — covers any URL not handled by app/ routes or
// public/ rewrites. Keeps the marketing chrome so visitors never
// feel dropped into a void.
export default function NotFound() {
  return (
    <SiteShell>
      <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center gap-4 px-6 py-16 text-center">
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#B89254]">
          404 · not found
        </span>
        <h1 className="font-[Playfair_Display,Georgia,serif] text-4xl leading-tight tracking-tight text-[#14120E]">
          That page isn&apos;t here.
        </h1>
        <p className="max-w-prose text-sm text-[#4A4439]">
          The link might have moved, or the URL has a typo. Take one of
          these:
        </p>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
          <Link
            href="/"
            className="rounded-md bg-[#14120E] px-4 py-2 text-sm font-semibold text-white hover:bg-[#2A2520]"
          >
            Marketing home
          </Link>
          <Link
            href="/health-check"
            className="rounded-md border border-black/10 bg-white px-4 py-2 text-sm font-medium text-[#14120E] hover:bg-[#FAF7EE]"
          >
            Free Health Check
          </Link>
          <Link
            href="/login"
            className="rounded-md border border-black/10 bg-white px-4 py-2 text-sm font-medium text-[#14120E] hover:bg-[#FAF7EE]"
          >
            Sign in
          </Link>
        </div>
      </main>
    </SiteShell>
  );
}
