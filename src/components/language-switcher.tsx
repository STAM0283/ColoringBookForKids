"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { localeFromPathname, switchLocalePath } from "@/lib/i18n";

export function LanguageSwitcher() {
  const pathname = usePathname();
  const locale = localeFromPathname(pathname);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const hrefFor = (targetLocale: "fr" | "en") => {
    const target = targetLocale === locale ? pathname : switchLocalePath(pathname, targetLocale);
    return target === "/" || target === "/en" ? `${target}#accueil` : target;
  };

  return <nav aria-label={locale === "fr" ? "Choisir la langue" : "Choose language"} className="inline-flex h-10 shrink-0 items-center rounded-full border border-slate-200/80 bg-slate-100/90 p-1 shadow-inner shadow-slate-300/40 dark:border-white/10 dark:bg-slate-950/70 dark:shadow-black/30">
    {(["fr", "en"] as const).map(option => option === locale
      ? <span key={option} aria-current="page" className="grid h-8 min-w-10 select-none place-items-center rounded-full bg-[#087f6f] px-2.5 text-[11px] font-black uppercase tracking-wide text-white shadow-[0_4px_12px_-5px_rgba(5,150,125,.9)] dark:bg-emerald-700 dark:shadow-emerald-950/60">{option.toUpperCase()}</span>
      : <Link key={option} href={hrefFor(option)} scroll className="focus-ring grid h-8 min-w-10 place-items-center rounded-full px-2.5 text-[11px] font-black uppercase tracking-wide text-slate-500 transition hover:bg-white hover:text-slate-900 hover:shadow-sm dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"><span aria-hidden="true">{option.toUpperCase()}</span><span className="sr-only">{locale === "en" ? (option === "fr" ? "View the website in French" : "View the website in English") : (option === "fr" ? "Afficher le site en français" : "Afficher le site en anglais")}</span></Link>
    )}
  </nav>;
}
