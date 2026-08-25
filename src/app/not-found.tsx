"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { localeFromPathname, localizedPath } from "@/lib/i18n";

export default function NotFound() {
  const locale = localeFromPathname(usePathname());
  const en = locale === "en";
  const home = `${localizedPath("home", locale)}#accueil`;

  return <main className="grid min-h-screen place-items-center p-6 text-center">
    <div>
      <p className="text-8xl" aria-hidden="true">🖍️</p>
      <h1 className="mt-6 font-display text-4xl font-black">{en ? "This page has gone outside the lines" : "Cette page a dépassé les lignes"}</h1>
      <p className="mt-3 opacity-65">{en ? "Perhaps it went looking for a new color." : "Elle est peut-être partie chercher une nouvelle couleur."}</p>
      <Link href={home} className="mt-7 inline-block rounded-full bg-primary px-6 py-3 font-bold text-white">{en ? "Back to home" : "Retour à l’accueil"}</Link>
    </div>
  </main>;
}
