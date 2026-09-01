"use client";

import Link from "next/link";
import Image from "next/image";
import {usePathname} from "next/navigation";
import {BookOpen,ChevronDown,FileDown,Heart,Home,Images as ImagesIcon,Instagram,Menu,Moon,Newspaper,Palette,Sun,Video,X} from "lucide-react";
import {useEffect,useRef,useState} from "react";
import {createPortal} from "react-dom";
import {LanguageSwitcher} from "@/components/language-switcher";
import {localeFromPathname,localizedPath,messages,type PublicRoute} from "@/lib/i18n";
import {INSTAGRAM_URL} from "@/lib/site-config";
import {cn} from "@/lib/utils";
import {useReliableTheme} from "@/hooks/use-reliable-theme";

type NavigationItem=PublicRoute|"gallery";
const navigation:NavigationItem[]=["home","books","activities","gallery","blog","about"];

export function SiteHeader() {
  const[open,setOpen]=useState(false),[galleryOpen,setGalleryOpen]=useState(false),[mobileGalleryOpen,setMobileGalleryOpen]=useState(false),[mounted,setMounted]=useState(false);
  const galleryMenu=useRef<HTMLDivElement>(null),{isDark:darkTheme,toggleTheme}=useReliableTheme(),pathname=usePathname(),locale=localeFromPathname(pathname),copy=messages[locale],homePath=localizedPath("home",locale);
  const galleryActive=isCurrent(localizedPath("images",locale))||isCurrent(localizedPath("videos",locale));
  const galleryLabel=locale==="en"?"Gallery":"Galerie";

  function isCurrent(href:string){return href===homePath?pathname===homePath:pathname===href||pathname.startsWith(`${href}/`)}
  function routeHref(route:PublicRoute){const href=localizedPath(route,locale);return route==="home"?`${href}#accueil`:href}
  function closeMobile(){setOpen(false);setMobileGalleryOpen(false)}

  useEffect(()=>setMounted(true),[]);
  useEffect(()=>{function close(event:PointerEvent){if(!galleryMenu.current?.contains(event.target as Node))setGalleryOpen(false)}document.addEventListener("pointerdown",close);return()=>document.removeEventListener("pointerdown",close)},[]);
  useEffect(()=>{setOpen(false);setMobileGalleryOpen(false)},[pathname]);
  useEffect(()=>{if(!open)return;const body=document.body,root=document.documentElement,scrollY=window.scrollY,previous={overflow:body.style.overflow,position:body.style.position,top:body.style.top,width:body.style.width,rootOverflow:root.style.overflow};body.style.overflow="hidden";body.style.position="fixed";body.style.top=`-${scrollY}px`;body.style.width="100%";root.style.overflow="hidden";function closeOnEscape(event:KeyboardEvent){if(event.key==="Escape")setOpen(false)}document.addEventListener("keydown",closeOnEscape);return()=>{body.style.overflow=previous.overflow;body.style.position=previous.position;body.style.top=previous.top;body.style.width=previous.width;root.style.overflow=previous.rootOverflow;document.removeEventListener("keydown",closeOnEscape);window.scrollTo(0,scrollY)}},[open]);

  const mobileNavigation=<div id="mobile-navigation" className="fixed inset-x-0 bottom-0 top-16 z-[1000] overflow-y-auto overscroll-contain border-t bg-background shadow-2xl [-webkit-overflow-scrolling:touch] dark:border-white/10 sm:top-20 lg:hidden">
    <nav aria-label={locale==="en"?"Mobile navigation":"Navigation mobile"} className="container grid gap-2 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-5">
      {navigation.map(item=>item==="gallery"?<div key={item} className="overflow-hidden rounded-2xl border bg-card shadow-sm dark:border-white/10">
        <button type="button" aria-expanded={mobileGalleryOpen} onClick={()=>setMobileGalleryOpen(value=>!value)} className={cn("flex min-h-14 w-full touch-manipulation items-center justify-between px-3 font-bold text-foreground/80",galleryActive&&"text-primary")}><span className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary"><ImagesIcon size={19}/></span>{galleryLabel}</span><ChevronDown size={18} className={`mr-2 transition ${mobileGalleryOpen?"rotate-180":""}`}/></button>
        <div className={`grid transition-[grid-template-rows] duration-300 ${mobileGalleryOpen?"grid-rows-[1fr]":"grid-rows-[0fr]"}`}><div className="overflow-hidden"><div className="grid gap-1 border-t p-2 dark:border-white/10"><GalleryLink route="images" icon={<ImagesIcon size={18}/>} locale={locale} active={isCurrent(localizedPath("images",locale))} close={closeMobile}/><GalleryLink route="videos" icon={<Video size={18}/>} locale={locale} active={isCurrent(localizedPath("videos",locale))} close={closeMobile}/></div></div></div>
      </div>:<Link key={item} aria-current={isCurrent(localizedPath(item,locale))?"page":undefined} scroll href={routeHref(item)} onClick={closeMobile} className={cn("flex min-h-14 touch-manipulation items-center gap-3 rounded-2xl border border-transparent px-3 font-bold text-foreground/80 transition hover:border-primary/15 hover:bg-primary/10 hover:text-primary",isCurrent(localizedPath(item,locale))&&"border-primary/20 bg-primary text-white shadow-md shadow-primary/15 hover:bg-primary hover:text-white")}><span className={cn("grid size-10 place-items-center rounded-xl bg-primary/10 text-primary",isCurrent(localizedPath(item,locale))&&"bg-white/15 text-white")}>{mobileIcon(item)}</span>{copy.navigation[item]}</Link>)}
      <div className="mt-3 rounded-[1.5rem] border bg-card p-4 shadow-sm dark:border-white/10">
        <p className="mb-3 text-[10px] font-black uppercase tracking-[.16em] text-foreground/45">{locale==="en"?"Preferences":"Préférences"}</p>
        <div className="flex flex-wrap items-center gap-3"><LanguageSwitcher/><a aria-label="Instagram" className="focus-ring grid size-11 place-items-center rounded-full border bg-background transition hover:border-primary/40 hover:bg-primary/10 hover:text-primary" href={INSTAGRAM_URL} target="_blank" rel="noreferrer"><Instagram size={19}/></a><button type="button" aria-label={locale==="en"?"Change theme":"Changer le thème"} className="focus-ring grid size-11 place-items-center rounded-full border bg-background transition hover:border-primary/40 hover:bg-primary/10 hover:text-primary" onClick={toggleTheme}>{darkTheme?<Sun size={19}/>:<Moon size={19}/>}</button></div>
      </div>
    </nav>
  </div>;

  return <><header className="sticky left-0 top-0 z-40 w-full max-w-full overflow-x-clip border-b bg-background/90 shadow-[0_8px_30px_-24px_rgba(15,23,42,.55)] backdrop-blur-xl">
    <div className="container flex h-16 w-full min-w-0 max-w-full items-center justify-between gap-2 sm:h-20 sm:gap-3">
      <Link href={`${homePath}#accueil`} scroll aria-label={`Le Petit Crayon — ${copy.navigation.home}`} className="focus-ring inline-flex min-w-0 items-center gap-2 truncate rounded-lg font-display text-sm font-black min-[360px]:text-base sm:gap-2.5 sm:text-xl"><Image src="/images/le-petit-crayon-mark.png" alt="" width={28} height={40} priority className="h-8 w-auto shrink-0 object-contain drop-shadow-sm sm:h-11"/>Le Petit Crayon</Link>
      <nav aria-label={locale==="en"?"Main navigation":"Navigation principale"} className="hidden items-center gap-1 lg:flex">
        {navigation.map(item=>item==="gallery"?<div key={item} ref={galleryMenu} className="relative">
          <button type="button" aria-expanded={galleryOpen} aria-haspopup="menu" onClick={()=>setGalleryOpen(value=>!value)} onKeyDown={event=>{if(event.key==="Escape")setGalleryOpen(false)}} className={navClass(galleryActive)}>{galleryLabel}<ChevronDown size={15} className={`transition ${galleryOpen?"rotate-180":""}`}/></button>
          <div role="menu" className={`absolute left-1/2 top-[calc(100%+.75rem)] w-56 -translate-x-1/2 rounded-2xl border bg-card p-2 shadow-2xl transition duration-200 dark:border-white/10 ${galleryOpen?"visible translate-y-0 opacity-100":"invisible -translate-y-2 opacity-0"}`}>
            <GalleryLink route="images" icon={<ImagesIcon size={18}/>} locale={locale} active={isCurrent(localizedPath("images",locale))} close={()=>setGalleryOpen(false)}/>
            <GalleryLink route="videos" icon={<Video size={18}/>} locale={locale} active={isCurrent(localizedPath("videos",locale))} close={()=>setGalleryOpen(false)}/>
          </div>
        </div>:<Link key={item} aria-current={isCurrent(localizedPath(item,locale))?"page":undefined} scroll href={routeHref(item)} className={navClass(isCurrent(localizedPath(item,locale)))}>{copy.navigation[item]}</Link>)}
      </nav>
      <div className="hidden items-center gap-2 lg:flex">
        <LanguageSwitcher/>
        <span className="group/social relative shrink-0"><a aria-label="Instagram" className="focus-ring grid size-10 place-items-center overflow-hidden rounded-full border bg-card transition hover:border-primary/40 hover:bg-primary/10 hover:text-primary" href={INSTAGRAM_URL} target="_blank" rel="noreferrer"><Instagram size={18}/></a><HeaderTooltip className="group-hover/social:translate-y-0 group-hover/social:opacity-100">Instagram</HeaderTooltip></span>
        <span className="group/theme relative shrink-0"><button type="button" aria-label={locale==="en"?"Change theme":"Changer le thème"} className="focus-ring grid size-10 place-items-center overflow-hidden rounded-full border bg-card transition hover:border-primary/40 hover:bg-primary/10 hover:text-primary" onClick={toggleTheme}>{darkTheme?<Sun size={18}/>:<Moon size={18}/>}</button><HeaderTooltip className="group-hover/theme:translate-y-0 group-hover/theme:opacity-100">{darkTheme?(locale==="en"?"Light mode":"Mode clair"):(locale==="en"?"Dark mode":"Mode sombre")}</HeaderTooltip></span>
      </div>
      <button type="button" aria-label={open?(locale==="en"?"Close menu":"Fermer le menu"):(locale==="en"?"Open menu":"Ouvrir le menu")} aria-expanded={open} aria-controls="mobile-navigation" className="focus-ring relative z-[1001] grid size-11 shrink-0 touch-manipulation place-items-center rounded-2xl border bg-card text-foreground shadow-sm transition hover:border-primary/35 hover:bg-primary/10 hover:text-primary lg:hidden" onClick={()=>setOpen(value=>!value)}>{open?<X size={22}/>:<Menu size={23}/>}</button>
    </div>
  </header>{mounted&&open?createPortal(mobileNavigation,document.body):null}</>;
}

function GalleryLink({route,icon,locale,active,close}:{route:"images"|"videos";icon:React.ReactNode;locale:"fr"|"en";active:boolean;close:()=>void}) {
  const label=messages[locale].navigation[route];
  return <Link role="menuitem" href={localizedPath(route,locale)} onClick={close} className={cn("flex min-h-12 items-center gap-3 rounded-xl px-3 text-sm font-bold text-foreground/75 transition hover:bg-primary/10 hover:text-primary dark:text-slate-100",active&&"bg-primary/10 text-primary dark:text-emerald-300")}><span className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary dark:text-emerald-300">{icon}</span>{label}</Link>;
}

function navClass(active:boolean){return cn("inline-flex min-h-10 items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-bold text-foreground/75 transition hover:bg-secondary/60 hover:text-foreground dark:text-slate-100 dark:hover:text-white",active&&"bg-primary text-white shadow-sm hover:bg-primary hover:text-white dark:text-slate-950 dark:hover:text-slate-950")}

function mobileIcon(route:PublicRoute){switch(route){case"home":return <Home size={19}/>;case"books":return <BookOpen size={19}/>;case"activities":return <FileDown size={19}/>;case"coloring":return <Palette size={19}/>;case"blog":return <Newspaper size={19}/>;case"about":return <Heart size={19}/>;default:return null}}

function HeaderTooltip({children,className}:{children:React.ReactNode;className:string}) {
  return <span aria-hidden="true" className={`pointer-events-none absolute left-1/2 top-[calc(100%+.65rem)] z-[100] w-max max-w-36 -translate-x-1/2 -translate-y-1 rounded-lg bg-slate-950 px-3 py-1.5 text-center text-[11px] font-bold leading-tight text-white opacity-0 shadow-xl transition duration-150 after:absolute after:bottom-full after:left-1/2 after:size-2 after:-translate-x-1/2 after:translate-y-1/2 after:rotate-45 after:bg-slate-950 ${className}`}>{children}</span>;
}
