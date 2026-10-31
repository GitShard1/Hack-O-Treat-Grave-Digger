import type { Metadata, Viewport } from "next";
import { Creepster, Geist } from "next/font/google";
import { Graveyard } from "@/components/Graveyard";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const creepster = Creepster({ variable: "--font-creepster", weight: "400", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Grave Digger",
  description: "Turn any public GitHub repo into its own Halloween monster.",
};

export const viewport: Viewport = { themeColor: "#0c0816" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${creepster.variable}`}>
      <body className="antialiased">
        <Graveyard />
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  );
}
