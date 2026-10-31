import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Permanent_Marker } from "next/font/google";
import { Scene } from "@/components/scene/Scene";
import { SketchDefs } from "@/components/scene/SketchDefs";
import "./globals.css";

// Fonts are part of the art direction: swap them here and in src/styles/theme.css.
const marker = Permanent_Marker({ variable: "--font-marker", weight: "400", subsets: ["latin"] });
const mono = JetBrains_Mono({ variable: "--font-jetbrains", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Grave Digger",
  description: "Turn any public GitHub repo into its own Halloween monster.",
};

// Browser UI colour; keep in sync with --color-page in src/styles/theme.css.
export const viewport: Viewport = { themeColor: "#0a0e1f" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${marker.variable} ${mono.variable}`}>
      <body className="antialiased">
        <SketchDefs />
        <Scene />
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  );
}
