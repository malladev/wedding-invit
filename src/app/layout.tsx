import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { titreMariage, mariage } from "@/lib/config";
import { BoutonScan } from "./BoutonScan";
import "./globals.css";

const serif = localFont({
  variable: "--serif",
  src: [
    { path: "../../assets/fonts/cormorant-garamond-latin-500-normal.woff", weight: "500" },
    { path: "../../assets/fonts/cormorant-garamond-latin-600-normal.woff", weight: "600" },
    { path: "../../assets/fonts/cormorant-garamond-latin-700-normal.woff", weight: "700" },
  ],
});
const sans = localFont({
  variable: "--sans",
  src: [
    { path: "../../assets/fonts/montserrat-latin-400-normal.woff", weight: "400" },
    { path: "../../assets/fonts/montserrat-latin-500-normal.woff", weight: "500" },
    { path: "../../assets/fonts/montserrat-latin-600-normal.woff", weight: "600" },
    { path: "../../assets/fonts/montserrat-latin-700-normal.woff", weight: "700" },
  ],
});

export const metadata: Metadata = {
  title: `Mariage de ${titreMariage}`,
  description: `${mariage.dateLongue} · ${mariage.lieu}`,
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { themeColor: "#FAF6EE" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${serif.variable} ${sans.variable}`}>
      {/* Certaines extensions (ColorZilla, Grammarly...) ajoutent des attributs sur <body> avant React */}
      <body suppressHydrationWarning>
        {children}
        <BoutonScan />
      </body>
    </html>
  );
}
