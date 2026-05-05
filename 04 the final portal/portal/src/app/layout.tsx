import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SkipToContent } from "@/components/ui/SkipToContent";

export const metadata: Metadata = {
  title: "Aqua portal",
  description: "Milesy Media's agency platform — a portal to anywhere.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SkipToContent />
        {children}
      </body>
    </html>
  );
}
