import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { DEFAULT_DESCRIPTION, SITE_NAME, siteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  applicationName: SITE_NAME,
  title: { default: "Le Petit Crayon - Livres de coloriage pour enfants", template: "%s | Le Petit Crayon" },
  description: DEFAULT_DESCRIPTION,
  keywords: ["livre coloriage enfant", "cahier activités enfant", "coloriage à imprimer", "activité gratuite enfant", "jeux éducatifs", "livre créatif enfant"],
  authors: [{ name: SITE_NAME, url: siteUrl() }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: "Livres et activités pour enfants",
  alternates: { canonical: "/" },
  openGraph: { type: "website", locale: "fr_FR", url: "/", siteName: SITE_NAME, title: "Le Petit Crayon - Livres créatifs pour enfants", description: DEFAULT_DESCRIPTION },
  twitter: { card: "summary_large_image", title: "Le Petit Crayon - Livres créatifs pour enfants", description: DEFAULT_DESCRIPTION },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } },
  verification: process.env.GOOGLE_SITE_VERIFICATION ? { google: process.env.GOOGLE_SITE_VERIFICATION } : undefined,
};

export default function RootLayout({ children }: { children: React.ReactNode }) { return <html lang="fr" suppressHydrationWarning><body><ThemeProvider>{children}</ThemeProvider></body></html>; }
