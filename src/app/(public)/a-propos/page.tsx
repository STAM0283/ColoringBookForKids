import type { Metadata } from "next";
import { AboutPage } from "@/components/public/about-page";

export const metadata: Metadata = {
  title: "À propos de la créatrice",
  description: "Découvrez l’univers du Petit Crayon et notre mission : développer la créativité, l’autonomie et la concentration des enfants.",
  alternates: { canonical: "/a-propos", languages: { fr: "/a-propos", en: "/en/about" } },
  openGraph: { url: "/a-propos", title: "L’histoire du Petit Crayon", description: "Des livres et activités imaginés avec soin pour encourager les enfants à créer." },
};

export default function FrenchAboutPage() {
  return <AboutPage locale="fr"/>;
}
