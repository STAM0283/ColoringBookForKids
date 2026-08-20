"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Instagram, Menu, Moon, Sun, X } from "lucide-react";
import { useTheme } from "next-themes";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { INSTAGRAM_URL } from "@/lib/site-config";

const links = [
  ["Accueil", "/"], ["Livres", "/livres"], ["Activités gratuites", "/activites"],
  ["Vidéos", "/videos"], ["Images", "/images"], ["Blog", "/blog"], ["À propos", "/a-propos"],
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();
  const pathname = usePathname();
  const isActive = (href: string) => href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`) || (href === "/videos" && pathname.startsWith("/vlog"));
  const scrollHomeToTop = () => window.scrollTo({ top: 0, left: 0, behavior: "auto" });

  return <header className="sticky top-0 z-40 border-b bg-background/90 shadow-[0_8px_30px_-24px_rgba(15,23,42,.55)] backdrop-blur-xl">
    <div className="container flex h-20 items-center justify-between gap-3">
      <Link href="/" scroll onClick={scrollHomeToTop} aria-label="Le Petit Crayon — Accueil" className="focus-ring shrink-0 whitespace-nowrap rounded-lg font-display text-base font-black sm:text-xl"><span className="mr-1.5 text-xl text-accent sm:mr-2 sm:text-2xl" aria-hidden="true">✿</span>Le Petit Crayon</Link>
      <nav aria-label="Navigation principale" className="hidden items-center gap-1 lg:flex">
        {links.map(([label, href]) => {
          const active = isActive(href);
          return <Link aria-current={active ? "page" : undefined} scroll className={cn("relative rounded-full px-3.5 py-2 text-sm font-semibold text-foreground/65 transition hover:bg-secondary/50 hover:text-foreground", active && "bg-primary text-white shadow-sm hover:bg-primary hover:text-white")} onClick={href === "/" ? scrollHomeToTop : undefined} href={href} key={href}>{label}{active && <span className="absolute -bottom-[17px] left-1/2 size-1.5 -translate-x-1/2 rounded-full bg-primary" />}</Link>;
        })}
      </nav>
      <div className="flex items-center gap-2">
        <span className="group/social relative shrink-0"><a aria-label="Instagram" className="focus-ring grid size-10 place-items-center overflow-hidden rounded-full border bg-card transition hover:border-primary/40 hover:bg-primary/10 hover:text-primary" href={INSTAGRAM_URL} target="_blank" rel="noreferrer"><Instagram size={18}/></a><HeaderTooltip className="group-hover/social:translate-y-0 group-hover/social:opacity-100">Instagram</HeaderTooltip></span>
        <span className="group/theme relative shrink-0"><button aria-label="Changer le thème" className="focus-ring grid size-10 place-items-center overflow-hidden rounded-full border bg-card transition hover:border-primary/40 hover:bg-primary/10 hover:text-primary" onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}>{resolvedTheme === "dark" ? <Sun size={18}/> : <Moon size={18}/>}</button><HeaderTooltip className="group-hover/theme:translate-y-0 group-hover/theme:opacity-100">{resolvedTheme === "dark" ? "Mode clair" : "Mode sombre"}</HeaderTooltip></span>
        <button aria-label="Menu" aria-expanded={open} className="grid size-10 place-items-center lg:hidden" onClick={() => setOpen(!open)}>{open ? <X/> : <Menu/>}</button>
      </div>
    </div>
    {open && <nav aria-label="Navigation mobile" className="container grid gap-2 border-t py-4 lg:hidden">{links.map(([label, href]) => { const active = isActive(href); return <Link aria-current={active ? "page" : undefined} scroll className={cn("flex items-center justify-between rounded-xl px-4 py-3 font-semibold hover:bg-secondary", active && "bg-primary text-white hover:bg-primary")} onClick={() => { setOpen(false); if (href === "/") scrollHomeToTop(); }} href={href} key={href}>{label}{active && <span className="size-2 rounded-full bg-white" />}</Link>; })}</nav>}
  </header>;
}

function HeaderTooltip({children,className}:{children:React.ReactNode;className:string}) {
  return <span aria-hidden="true" className={`pointer-events-none absolute left-1/2 top-[calc(100%+.65rem)] z-[100] w-max max-w-36 -translate-x-1/2 -translate-y-1 rounded-lg bg-slate-950 px-3 py-1.5 text-center text-[11px] font-bold leading-tight text-white opacity-0 shadow-xl transition duration-150 after:absolute after:bottom-full after:left-1/2 after:size-2 after:-translate-x-1/2 after:translate-y-1/2 after:rotate-45 after:bg-slate-950 ${className}`}>{children}</span>;
}
