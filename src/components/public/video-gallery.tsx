"use client";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ChevronDown, ChevronUp, Clock3, Expand, Film, Play, X } from "lucide-react";
import { useEffect, useState } from "react";
import { localeFromPathname } from "@/lib/i18n";
import { MarkdownContent } from "@/components/markdown-content";
export type PublicVideo = {
    id: string;
    title: string;
    description: string;
    duration: number | null;
    path: string | null;
    mimeType: string | null;
    thumbnailPath: string | null;
};
export function VideoGallery({ items }: {
    items: PublicVideo[];
}) {
    const en = localeFromPathname(usePathname()) === "en";
    const [expanded, setExpanded] = useState<string | null>(null);
    const [selected, setSelected] = useState<PublicVideo | null>(null);
    useEffect(() => {
        if (!selected)
            return;
        const previousOverflow = document.body.style.overflow;
        const close = (event: KeyboardEvent) => event.key === "Escape" && setSelected(null);
        document.body.style.overflow = "hidden";
        window.addEventListener("keydown", close);
        return () => { document.body.style.overflow = previousOverflow; window.removeEventListener("keydown", close); };
    }, [selected]);
    return <>
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {items.map(item => {
            const open = expanded === item.id;
            return <article key={item.id} className="group overflow-hidden rounded-[1.5rem] border bg-card shadow-[0_18px_50px_-32px_rgba(15,23,42,.55)] transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-xl">
          <button onClick={() => setSelected(item)} className="relative block aspect-square w-full overflow-hidden bg-slate-900 text-white" aria-label={`${en ? "Watch" : "Regarder"} ${item.title}`}>
            <div className="absolute inset-0 grid place-items-center bg-[radial-gradient(circle_at_50%_30%,#2f6657,#101827_72%)]"><Film size={58} className="opacity-30"/></div>
            {item.thumbnailPath && <>
              <Image aria-hidden="true" src={`/media/${item.thumbnailPath}`} alt="" fill quality={70} sizes="(max-width:640px) calc(100vw - 2rem),(max-width:1024px) 50vw,600px" className="scale-110 object-cover opacity-35 blur-xl"/>
              <Image src={`/media/${item.thumbnailPath}`} alt={`${en ? "Thumbnail for" : "Miniature de"} ${item.title}`} fill quality={92} sizes="(max-width:640px) calc(100vw - 2rem),(max-width:1024px) 50vw,600px" className="object-contain transition-transform duration-500 group-hover:scale-[1.015]"/>
              <span className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/10"/>
            </>}
            <span className="absolute left-1/2 top-1/2 grid size-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white text-emerald-800 shadow-2xl transition group-hover:scale-110"><Play size={23} fill="currentColor"/></span>
            <span className="absolute right-3 top-3 grid size-9 place-items-center rounded-full bg-black/35 backdrop-blur"><Expand size={17}/></span>
            {item.duration && <span className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-black/60 px-3 py-1.5 text-xs font-bold backdrop-blur"><Clock3 size={13}/>{formatDuration(item.duration)}</span>}
          </button>
          <div className="p-5 md:p-6"><div className="flex items-start justify-between gap-4"><div className="min-w-0"><p className="text-[10px] font-black uppercase tracking-[.16em] text-primary">{en ? "Creative video" : "Vidéo créative"}</p><h3 className="mt-1 text-balance font-display text-xl font-black">{item.title}</h3></div><button onClick={() => setExpanded(open ? null : item.id)} aria-expanded={open} aria-label={open ? (en ? "Hide description" : "Masquer la description") : (en ? "Show description" : "Afficher la description")} className="grid size-11 shrink-0 place-items-center rounded-full border text-foreground/60 transition hover:border-primary/40 hover:bg-primary/10 hover:text-primary">{open ? <ChevronUp size={19}/> : <ChevronDown size={19}/>}</button></div><div className={`grid transition-[grid-template-rows,opacity,margin] duration-300 ${open ? "mt-4 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}><div className="overflow-hidden">
<div className="rounded-2xl border border-primary/10 bg-gradient-to-br from-primary/[.07] to-transparent p-4 dark:border-white/10 dark:from-primary/10"><p className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[.16em] text-primary"><Film size={14}/>{en?"About this video":"À propos de la vidéo"}</p><MarkdownContent value={item.description} className="text-sm leading-7 text-foreground/75 [&_h2]:text-lg [&_h3]:text-base [&_li]:my-1 [&_p]:my-2"/></div>
</div></div></div>
        </article>;
        })}
    </div>
    {selected && <div role="dialog" aria-modal="true" aria-label={selected.title} onClick={() => setSelected(null)} className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/92 p-3 backdrop-blur-md sm:p-6"><div onClick={event => event.stopPropagation()} className="relative max-h-[calc(100vh-2rem)] w-full max-w-5xl overflow-hidden rounded-[1.5rem] bg-card shadow-2xl sm:max-h-[calc(100vh-3rem)] sm:rounded-[2rem]"><div className="group/close absolute right-3 top-3 z-20 sm:right-4 sm:top-4"><button type="button" aria-label={en ? "Close" : "Fermer"} onClick={() => setSelected(null)} className="grid size-11 place-items-center overflow-hidden rounded-full border border-white/70 bg-white/95 text-slate-950 shadow-xl backdrop-blur transition hover:rotate-90 hover:scale-105 hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/40 sm:size-12"><X size={23}/></button><span aria-hidden="true" className="pointer-events-none absolute right-0 top-[calc(100%+.6rem)] whitespace-nowrap rounded-lg bg-slate-950 px-3 py-1.5 text-xs font-bold text-white opacity-0 shadow-xl transition duration-150 group-hover/close:opacity-100 group-focus-within/close:opacity-100">{en ? "Close video" : "Fermer la vidéo"}</span></div><div className="aspect-video bg-black">{selected.path ? <video src={`/media/${selected.path}`} controls preload="metadata" controlsList="nodownload noplaybackrate" disablePictureInPicture autoPlay draggable={false} onContextMenu={event => event.preventDefault()} className="size-full">{en ? "Your browser cannot play this video." : "Votre navigateur ne peut pas lire cette vidéo."}</video> : <div className="grid size-full place-items-center text-white"><Film size={60}/></div>}</div><div className="p-5 sm:p-6"><h2 className="font-display text-2xl font-black">{selected.title}</h2>
<div className="mt-4 rounded-2xl border border-primary/10 bg-primary/[.055] p-4 dark:border-white/10 dark:bg-white/[.035]"><p className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[.16em] text-primary"><Film size={14}/>{en?"The story behind this video":"L’histoire de cette vidéo"}</p><MarkdownContent value={selected.description} className="leading-7 text-foreground/75 [&_h2]:text-xl [&_h3]:text-lg [&_li]:my-1 [&_p]:my-2"/></div>
</div></div></div>}
  </>;
}
function formatDuration(seconds: number) { return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`; }
