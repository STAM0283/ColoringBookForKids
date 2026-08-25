"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUp, ArrowUpRight, BookOpen, Heart, Instagram, Lightbulb, Palette, PlayCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { INSTAGRAM_URL } from "@/lib/site-config";
import {localeFromPathname,localizedPath} from "@/lib/i18n";

export function SiteFooter() {
  const pathname = usePathname();
  const locale=localeFromPathname(pathname),en=locale==="en",links=[
    {label:en?"Books":"Les livres",href:localizedPath("books",locale),icon:BookOpen},
    {label:en?"Activities":"Activités",href:localizedPath("activities",locale),icon:Palette},
    {label:en?"Creative advice":"Conseils créatifs",href:localizedPath("blog",locale),icon:Lightbulb},
    {label:en?"Videos":"Vidéos",href:localizedPath("videos",locale),icon:PlayCircle},
  ];

  return <footer className="relative mt-24 overflow-hidden border-t bg-card dark:border-white/10">
    <div className="pointer-events-none absolute -left-16 top-12 size-48 rounded-full bg-amber-200/35 blur-3xl dark:bg-amber-400/10" aria-hidden="true"/>
    <div className="pointer-events-none absolute -right-16 bottom-6 size-56 rounded-full bg-emerald-200/35 blur-3xl dark:bg-emerald-400/10" aria-hidden="true"/>

    <div className="container relative grid gap-10 py-14 lg:grid-cols-[1.05fr_1fr_.9fr] lg:gap-14 lg:py-16">
      <div>
        <Link href={localizedPath("home",locale)} className="focus-ring group inline-flex items-center gap-3 rounded-xl font-display text-2xl font-black">
          <span className="grid size-11 place-items-center rounded-2xl bg-primary text-2xl text-white shadow-lg shadow-primary/20 transition duration-300 group-hover:-rotate-6 group-hover:scale-105" aria-hidden="true">✿</span>
          <span>Le Petit Crayon</span>
        </Link>
        <p className="mt-5 max-w-md text-base leading-7 text-foreground/60">{en?"Books and activities designed to nurture creativity, independence and focus, away from screens.":"Des livres et activités imaginés pour nourrir la créativité, l’autonomie et la concentration, loin des écrans."}</p>
        <Link href={localizedPath("about",locale)} className={cn("focus-ring group mt-6 inline-flex min-h-11 items-center gap-2 rounded-full border px-5 text-sm font-black transition duration-300 hover:-translate-y-0.5 hover:border-primary hover:bg-primary hover:text-white", pathname === localizedPath("about",locale) && "border-primary bg-primary text-white")}>
          {en?"Our story":"Notre histoire"} <ArrowUpRight className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" size={17}/>
        </Link>
      </div>

      <nav aria-label={en ? "Footer navigation" : "Navigation du pied de page"}>
        <p className="font-display text-lg font-black">{en?"Explore":"Explorer"}</p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
          {links.map(({label,href,icon:Icon}) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return <Link key={href} href={href} aria-current={active ? "page" : undefined} className={cn("focus-ring group flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-bold text-foreground/60 transition duration-200 hover:translate-x-1 hover:bg-secondary hover:text-primary", active && "bg-primary/10 text-primary ring-1 ring-primary/15")}>
              <span className={cn("grid size-8 shrink-0 place-items-center rounded-lg bg-secondary text-primary transition group-hover:bg-primary group-hover:text-white", active && "bg-primary text-white")}><Icon size={16}/></span>
              <span>{label}</span>
              <ArrowUpRight className="ml-auto opacity-0 transition group-hover:opacity-100" size={15}/>
            </Link>;
          })}
        </div>
      </nav>

      <div className="rounded-[1.75rem] border bg-background/70 p-6 shadow-[0_18px_50px_-40px_rgba(15,23,42,.5)] backdrop-blur dark:border-white/10">
        <span className="grid size-11 place-items-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-400/15 dark:text-rose-300"><Heart size={21} fill="currentColor"/></span>
        <p className="mt-5 font-display text-lg font-black">{en?"For parents":"Pour les parents"}</p>
        <p className="mt-2 text-sm leading-6 text-foreground/60">{en?"Gentle news, free resources and creative stories to enjoy as a family.":"Nouveautés douces, ressources gratuites et coulisses créatives à découvrir en famille."}</p>
        <Link href={localizedPath("activities",locale)} className="focus-ring group mt-5 inline-flex items-center gap-2 rounded-lg text-sm font-black text-primary hover:underline hover:underline-offset-4">{en?"Find an activity":"Trouver une activité"} <ArrowUpRight className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" size={16}/></Link>
      </div>
    </div>

    <div className="relative border-t bg-gradient-to-r from-amber-50/70 via-background to-emerald-50/70 dark:border-white/10 dark:from-amber-400/5 dark:via-background dark:to-emerald-400/5">
      <div className="container grid items-center gap-4 py-5 text-center text-sm md:grid-cols-[1fr_auto_1fr] md:text-left">
        <p className="inline-flex items-center justify-center gap-2 font-bold text-foreground/55 sm:justify-start">
          <span className="grid size-7 place-items-center rounded-xl bg-primary text-sm text-white shadow-sm" aria-hidden="true">✿</span>
          © {new Date().getFullYear()} Le Petit Crayon
        </p>
        <nav aria-label={en ? "Useful links" : "Liens pratiques"} className="flex flex-wrap items-center justify-center gap-2">
          <Link href={localizedPath("about",locale)} className="focus-ring inline-flex min-h-9 items-center gap-2 rounded-full px-3 font-bold text-foreground/55 transition hover:bg-amber-100 hover:text-amber-800 dark:hover:bg-amber-400/15 dark:hover:text-amber-300"><Heart size={14} className="text-rose-500" fill="currentColor"/> {en?"About":"À propos"}</Link>
          <span className="size-1 rounded-full bg-foreground/20" aria-hidden="true"/>
          <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer" className="focus-ring inline-flex min-h-9 items-center gap-2 rounded-full px-3 font-bold text-foreground/55 transition hover:bg-rose-100 hover:text-rose-700 dark:hover:bg-rose-400/15 dark:hover:text-rose-300"><Instagram size={15}/> Instagram</a>
        </nav>
        <button type="button" onClick={()=>window.scrollTo({top:0,behavior:"smooth"})} className="focus-ring group mx-auto inline-flex min-h-10 items-center gap-2 rounded-full border border-primary/15 bg-card px-4 font-black text-primary shadow-sm transition hover:-translate-y-0.5 hover:border-primary hover:bg-primary hover:text-white md:ml-auto md:mr-0">
          {en?"Back to top":"Retour en haut"} <span className="grid size-6 place-items-center rounded-full bg-primary/10 transition group-hover:bg-white/20"><ArrowUp size={14}/></span>
        </button>
      </div>
    </div>
  </footer>;
}
