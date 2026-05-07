import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SkipToContent } from "@/components/ui/SkipToContent";
import { SidebarCollapseHydrationScript } from "@/components/chrome/SidebarCollapseToggle";

export const metadata: Metadata = {
  title: "Aqua portal",
  description: "Milesy Media's agency platform — a portal to anywhere.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* T1 R035 — synchronous read of localStorage["mm-sidebar-collapsed"]
            so the desktop <aside> renders at the correct width before
            paint. No flash on reload. */}
        <SidebarCollapseHydrationScript />
      </head>
      <body>
        <SkipToContent />
        {children}
      </body>
    </html>
  );
}
