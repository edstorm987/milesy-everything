"use client";

// MembershipPaywallBlock — gates rendered children unless the visitor
// has an active subscription on a plan in `props.requirePlanIds`.
//
// **Round-3 status**: T2's @aqua/plugin-memberships declares this block
// id and delegates rendering to this plugin per architecture. The
// real-time gate consults a session endpoint
// (`/api/portal/memberships/me`) that doesn't ship with R3 — until it
// does, the block renders its children only when the visitor's
// localStorage flag matches one of the required plan ids. Editor mode
// always renders children so layout work is possible.

import { useEffect, useState } from "react";
import type { BlockRenderProps } from "../blockRegistry";
import { blockStylesToCss } from "../blockStyles";

export default function MembershipPaywallBlock({ block, editorMode, renderChildren }: BlockRenderProps) {
  const requirePlanIds = (block.props.requirePlanIds as string[] | undefined) ?? [];
  const [hasAccess, setHasAccess] = useState<boolean>(false);

  useEffect(() => {
    if (editorMode) return;
    try {
      const planId = window.localStorage.getItem("lk_member_plan_id");
      if (!planId) return;
      if (requirePlanIds.length === 0 || requirePlanIds.includes(planId)) {
        setHasAccess(true);
      }
    } catch { /* sealed-off browser */ }
  }, [editorMode, requirePlanIds]);

  const showChildren = editorMode || hasAccess;

  if (showChildren) {
    return <>{renderChildren?.(block.children)}</>;
  }

  return (
    <section
      data-block-type="membership-paywall"
      style={{
        padding: "48px 24px",
        textAlign: "center",
        background: "rgba(255,255,255,0.02)",
        border: "1px dashed rgba(255,255,255,0.15)",
        borderRadius: 16,
        ...blockStylesToCss(block.styles),
      }}
    >
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <p style={{ fontSize: 32, marginBottom: 16 }}>🔒</p>
        <p style={{ fontSize: 15, opacity: 0.85, marginBottom: 16 }}>
          Members only — subscribe to access this content.
        </p>
        <a
          href="/membership"
          style={{
            display: "inline-block",
            padding: "10px 18px",
            borderRadius: 10,
            background: "var(--brand-orange, #ff6b35)",
            color: "#fff",
            fontSize: 14,
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          See plans
        </a>
      </div>
    </section>
  );
}
