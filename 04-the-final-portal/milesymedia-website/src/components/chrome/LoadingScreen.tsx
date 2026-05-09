"use client";
// Aqua Portal / Business OS splash. Conditional by pathname:
//   /portal/*       → "Aqua Portal"
//   /demo/*         → "Aqua Portal"
//   /business-os/*  → "Business OS"
//   anywhere else   → render nothing (marketing site stays splash-free)

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const MIN_DISPLAY_MS = 0;   // ultra-fast: no artificial delay
const FADE_MS = 220;

type Surface = { tag: string; gradient: [string, string] } | null;

function detectSurface(path: string | null): Surface {
  if (!path) return null;
  if (path.startsWith("/portal") || path.startsWith("/demo")) {
    return { tag: "Aqua Portal", gradient: ["#D4B888", "#8B6F3D"] };
  }
  if (path.startsWith("/business-os")) {
    return { tag: "Business OS", gradient: ["#7DD3FC", "#0E7490"] };
  }
  return null;
}

export function LoadingScreen() {
  const pathname = usePathname();
  const surface = detectSurface(pathname);
  const [phase, setPhase] = useState<"in" | "out" | "gone">(surface ? "in" : "gone");

  useEffect(() => {
    if (!surface) return;
    const start = performance.now();
    const finish = () => {
      const elapsed = performance.now() - start;
      const wait = Math.max(0, MIN_DISPLAY_MS - elapsed);
      setTimeout(() => {
        setPhase("out");
        setTimeout(() => setPhase("gone"), FADE_MS);
      }, wait);
    };
    if (document.readyState === "complete") finish();
    else window.addEventListener("load", finish, { once: true });
    return () => window.removeEventListener("load", finish);
  }, [surface]);

  if (!surface || phase === "gone") return null;
  const [g1, g2] = surface.gradient;
  return (
    <div className={`mm-splash ${phase === "out" ? "mm-splash-out" : ""}`} aria-hidden="true">
      <div className="mm-splash-glow" />
      <div className="mm-splash-inner">
        <div className="mm-splash-mark">
          <svg viewBox="0 0 64 64" width="64" height="64" aria-hidden="true">
            <defs>
              <linearGradient id="mmGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor={g1} />
                <stop offset="100%" stopColor={g2} />
              </linearGradient>
            </defs>
            <rect x="6" y="6" width="52" height="52" rx="14" fill="url(#mmGrad)" />
            <text
              x="32" y="42" textAnchor="middle"
              fontFamily="Playfair Display, Georgia, serif"
              fontSize="28" fontWeight="700" fill="#0A0A0A"
            >M</text>
          </svg>
        </div>
        <div className="mm-splash-wordmark">
          <span>Milesy</span><span className="mm-splash-accent" style={{ backgroundImage: `linear-gradient(135deg, ${g1} 0%, ${g2} 100%)` }}>Media</span>
        </div>
        <div className="mm-splash-tag">{surface.tag}</div>
        <div className="mm-splash-progress"><span style={{ background: `linear-gradient(90deg, transparent 0%, ${g1} 50%, transparent 100%)` }} /></div>
      </div>
    </div>
  );
}
