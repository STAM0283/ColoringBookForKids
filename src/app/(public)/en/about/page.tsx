import type { Metadata } from "next";
import { AboutPage } from "@/components/public/about-page";

export const metadata: Metadata = {
  title: "About Le Petit Crayon",
  description: "Discover the world of Le Petit Crayon and our mission to nurture children’s creativity, independence and concentration.",
  alternates: { canonical: "/en/about", languages: { fr: "/a-propos", en: "/en/about" } },
  openGraph: { locale: "en_GB", url: "/en/about", title: "The story of Le Petit Crayon", description: "Books and activities thoughtfully created to inspire children." },
};

export default function EnglishAboutPage() {
  return <AboutPage locale="en"/>;
}
