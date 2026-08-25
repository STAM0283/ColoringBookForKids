"use client";

import Link from "next/link";
import {usePathname} from "next/navigation";
import {ChevronDown,Images as ImagesIcon,Instagram,Menu,Moon,Sun,Video,X} from "lucide-react";
import {useTheme} from "next-themes";
import {useEffect,useRef,useState} from "react";
import {LanguageSwitcher} from "@/components/language-switcher";
import {localeFromPathname,localizedPath,messages,type PublicRoute} from "@/lib/i18n";
import {INSTAGRAM_URL} from "@/lib/site-config";
import {cn} from "@/lib/utils";

type NavigationItem=PublicRoute|"gallery";
const navigation:NavigationItem[]=["home","books","activities","coloring","gallery","blog","about"];

export function SiteHeader() {
  const[open,setOpen]=useState(false),[galleryOpen,setGalleryOpen]=useState(false),[mobileGalleryOpen,setMobileGalleryOpen]=useState(false),[themeMounted,setThemeMounted]=useState(false);
  const galleryMenu=useRef<HTMLDivElement>(null),{resolvedTheme,setTheme}=useTheme(),pathname=usePathname(),locale=localeFromPathname(pathname),copy=messages[locale],homePath=localizedPath("home",locale),darkTheme=themeMounted&&resolvedTheme==="dark";
  const galleryActive=isCurrent(localizedPath("images",locale))||isCurrent(localizedPath("videos",locale));
  const galleryLabel=locale==="en"?"Gallery":"Galerie";

  function isCurrent(href:string){return href===homePath?pathname===homePath:pathname===href||pathname.startsWith(`${href}/`)}
  function routeHref(route:PublicRoute){const href=localizedPath(route,locale);return route==="home"?`${href}#accueil`:href}
  function closeMobile(){setOpen(false);setMobileGalleryOpen(false)}

  useEffect(()=>setThemeMounted(true),[]);
  useEffect(()=>{function close(event:PointerEvent){if(!galleryMenu.current?.contains(event.target as Node))setGalleryOpen(false)}document.addEventListener("pointerdown",close);return()=>document.removeEventListener("pointerdown",close)},[]);

  return <header className="sticky top-0 z-40 border-b bg-background/90 shadow-[0_8px_30px_-24px_rgba(15,23,42,.55)] backdrop-blur-xl">
    <div className="container flex h-20 items-center justify-between gap-3">
      <Link href={`${homePath}#accueil`} scroll aria-label={`Le Petit Crayon — ${copy.navigation.home}`} className="focus-ring shrink-0 whitespace-nowrap rounded-lg font-display text-base font-black sm:text-xl"><span className="mr-1.5 text-xl text-accent sm:mr-2 sm:text-2xl" aria-hidden="true">✿</span>Le Petit Crayon</Link>
      <nav aria-label={locale==="en"?"Main navigation":"Navigation principale"} className="hidden items-center gap-1 lg:flex">
        {navigation.map(item=>item==="gallery"?<div key={item} ref={galleryMenu} className="relative">
          <button type="button" aria-expanded={galleryOpen} aria-haspopup="menu" onClick={()=>setGalleryOpen(value=>!value)} onKeyDown={event=>{if(event.key==="Escape")setGalleryOpen(false)}} className={navClass(galleryActive)}>{galleryLabel}<ChevronDown size={15} className={`transition ${galleryOpen?"rotate-180":""}`}/></button>
          <div role="menu" className={`absolute left-1/2 top-[calc(100%+.75rem)] w-56 -translate-x-1/2 rounded-2xl border bg-card p-2 shadow-2xl transition duration-200 dark:border-white/10 ${galleryOpen?"visible translate-y-0 opacity-100":"invisible -translate-y-2 opacity-0"}`}>
            <GalleryLink route="images" icon={<ImagesIcon size={18}/>} locale={locale} active={isCurrent(localizedPath("images",locale))} close={()=>setGalleryOpen(false)}/>
            <GalleryLink route="videos" icon={<Video size={18}/>} locale={locale} active={isCurrent(localizedPath("videos",locale))} close={()=>setGalleryOpen(false)}/>
          </div>
        </div>:<Link key={item} aria-current={isCurrent(localizedPath(item,locale))?"page":undefined} scroll href={routeHref(item)} className={navClass(isCurrent(localizedPath(item,locale)))}>{copy.navigation[item]}</Link>)}
      </nav>
      <div className="flex items-center gap-2">
        <LanguageSwitcher/>
        <span className="group/social relative shrink-0"><a aria-label="Instagram" className="focus-ring grid size-10 place-items-center overflow-hidden rounded-full border bg-card transition hover:border-primary/40 hover:bg-primary/10 hover:text-primary" href={INSTAGRAM_URL} target="_blank" rel="noreferrer"><Instagram size={18}/></a><HeaderTooltip className="group-hover/social:translate-y-0 group-hover/social:opacity-100">Instagram</HeaderTooltip></span>
        <span className="group/theme relative shrink-0"><button type="button" aria-label={locale==="en"?"Change theme":"Changer le thème"} className="focus-ring grid size-10 place-items-center overflow-hidden rounded-full border bg-card transition hover:border-primary/40 hover:bg-primary/10 hover:text-primary" onClick={()=>setTheme(darkTheme?"light":"dark")}>{darkTheme?<Sun size={18}/>:<Moon size={18}/>}</button><HeaderTooltip className="group-hover/theme:translate-y-0 group-hover/theme:opacity-100">{darkTheme?(locale==="en"?"Light mode":"Mode clair"):(locale==="en"?"Dark mode":"Mode sombre")}</HeaderTooltip></span>
        <button type="button" aria-label="Menu" aria-expanded={open} className="grid size-10 place-items-center lg:hidden" onClick={()=>setOpen(value=>!value)}>{open?<X/>:<Menu/>}</button>
      </div>
    </div>
    {open&&<nav aria-label={locale==="en"?"Mobile navigation":"Navigation mobile"} className="container grid gap-2 border-t py-4 lg:hidden">
      {navigation.map(item=>item==="gallery"?<div key={item} className="overflow-hidden rounded-2xl border bg-card dark:border-white/10">
        <button type="button" aria-expanded={mobileGalleryOpen} onClick={()=>setMobileGalleryOpen(value=>!value)} className={cn("flex min-h-12 w-full items-center justify-between px-4 font-bold text-foreground/80",galleryActive&&"text-primary")}><span className="flex items-center gap-3"><span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary"><ImagesIcon size={17}/></span>{galleryLabel}</span><ChevronDown size={17} className={`transition ${mobileGalleryOpen?"rotate-180":""}`}/></button>
        <div className={`grid transition-[grid-template-rows] duration-300 ${mobileGalleryOpen?"grid-rows-[1fr]":"grid-rows-[0fr]"}`}><div className="overflow-hidden"><div className="grid gap-1 border-t p-2 dark:border-white/10"><GalleryLink route="images" icon={<ImagesIcon size={17}/>} locale={locale} active={isCurrent(localizedPath("images",locale))} close={closeMobile}/><GalleryLink route="videos" icon={<Video size={17}/>} locale={locale} active={isCurrent(localizedPath("videos",locale))} close={closeMobile}/></div></div></div>
      </div>:<Link key={item} aria-current={isCurrent(localizedPath(item,locale))?"page":undefined} scroll href={routeHref(item)} onClick={closeMobile} className={cn("flex min-h-12 items-center justify-between rounded-xl px-4 font-semibold text-foreground/80 transition hover:bg-secondary",isCurrent(localizedPath(item,locale))&&"bg-primary text-white hover:bg-primary")}>{copy.navigation[item]}</Link>)}
    </nav>}
  </header>;
}

function GalleryLink({route,icon,locale,active,close}:{route:"images"|"videos";icon:React.ReactNode;locale:"fr"|"en";active:boolean;close:()=>void}) {
  const label=messages[locale].navigation[route];
  return <Link role="menuitem" href={localizedPath(route,locale)} onClick={close} className={cn("flex min-h-12 items-center gap-3 rounded-xl px-3 text-sm font-bold text-foreground/75 transition hover:bg-primary/10 hover:text-primary",active&&"bg-primary/10 text-primary")}><span className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary">{icon}</span>{label}</Link>;
}

function navClass(active:boolean){return cn("inline-flex min-h-10 items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-bold text-foreground/75 transition hover:bg-secondary/60 hover:text-foreground dark:text-foreground/80",active&&"bg-primary text-white shadow-sm hover:bg-primary hover:text-white dark:text-slate-950")}

function HeaderTooltip({children,className}:{children:React.ReactNode;className:string}) {
  return <span aria-hidden="true" className={`pointer-events-none absolute left-1/2 top-[calc(100%+.65rem)] z-[100] w-max max-w-36 -translate-x-1/2 -translate-y-1 rounded-lg bg-slate-950 px-3 py-1.5 text-center text-[11px] font-bold leading-tight text-white opacity-0 shadow-xl transition duration-150 after:absolute after:bottom-full after:left-1/2 after:size-2 after:-translate-x-1/2 after:translate-y-1/2 after:rotate-45 after:bg-slate-950 ${className}`}>{children}</span>;
}
