"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";
import { useEffect, useState } from "react";

type ActivityImage = { path: string; alt: string | null };

export function ActivityImageCarousel({ images, title, locale = "fr" }: { images: ActivityImage[]; title: string; locale?: "fr" | "en" }) {
  const [index, setIndex] = useState(0), [expanded, setExpanded] = useState(false), en = locale === "en";
  const multiple = images.length > 1, current = images[index];
  function move(direction: number) { setIndex(value => (value + direction + images.length) % images.length); }

  useEffect(() => {
    if (!expanded) return;
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setExpanded(false);
      if (event.key === "ArrowLeft" && multiple) setIndex(value => (value - 1 + images.length) % images.length);
      if (event.key === "ArrowRight" && multiple) setIndex(value => (value + 1) % images.length);
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", keydown);
    return () => { document.body.style.overflow = previous; document.removeEventListener("keydown", keydown); };
  }, [expanded, multiple, images.length]);

  if (!current) return null;
  const picture = (fullscreen = false) => <Image src={`/media/${current.path}`} alt={current.alt || `${en ? "Page" : "Page"} ${index + 1} — ${title}`} fill sizes={fullscreen ? "100vw" : "(max-width:640px) 100vw,(max-width:1024px) 50vw,33vw"} quality={fullscreen ? 92 : 82} className="object-contain"/>;

  return <>
    <div className="relative size-full overflow-hidden">
      <div className="absolute inset-0">{picture()}</div>
      <button type="button" onClick={() => setExpanded(true)} aria-label={en ? "Open large preview" : "Ouvrir l’aperçu en grand"} className="absolute right-3 top-3 z-20 grid size-10 place-items-center rounded-full border border-white/50 bg-white/90 text-slate-800 shadow-lg backdrop-blur transition hover:scale-105 hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25"><Expand size={17}/></button>
      {multiple && <><button type="button" onClick={() => move(-1)} aria-label={en ? "Previous page" : "Page précédente"} className="absolute left-3 top-1/2 z-20 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-slate-800 shadow-lg transition hover:scale-105 hover:bg-white"><ChevronLeft size={21}/></button><button type="button" onClick={() => move(1)} aria-label={en ? "Next page" : "Page suivante"} className="absolute right-3 top-1/2 z-20 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-slate-800 shadow-lg transition hover:scale-105 hover:bg-white"><ChevronRight size={21}/></button><div className="absolute bottom-3 left-1/2 z-20 flex max-w-[70%] -translate-x-1/2 items-center gap-1.5 rounded-full bg-slate-950/65 px-3 py-2 shadow-lg backdrop-blur">{images.map((_, position) => <button key={position} type="button" onClick={() => setIndex(position)} aria-label={`${en ? "Page" : "Page"} ${position + 1}`} aria-current={position === index ? "true" : undefined} className={`size-2.5 rounded-full transition ${position === index ? "scale-125 bg-white" : "bg-white/45 hover:bg-white/75"}`}/>)}</div><span className="absolute bottom-3 right-3 z-20 rounded-full bg-white/90 px-3 py-1.5 text-xs font-black text-slate-800 shadow">{index + 1}/{images.length}</span></>}
    </div>
    {expanded && <div role="dialog" aria-modal="true" aria-label={en ? `Preview of ${title}` : `Aperçu de ${title}`} className="fixed inset-0 z-[10000] grid place-items-center bg-slate-950/95 p-3 backdrop-blur-md sm:p-6" onMouseDown={() => setExpanded(false)}><div className="relative size-full max-h-[94vh] max-w-6xl" onMouseDown={event => event.stopPropagation()}>{picture(true)}<button type="button" autoFocus onClick={() => setExpanded(false)} aria-label={en ? "Close preview" : "Fermer l’aperçu"} className="absolute right-2 top-2 z-30 grid size-12 place-items-center rounded-full bg-white text-slate-900 shadow-xl transition hover:scale-105"><X size={23}/></button>{multiple && <><button type="button" onClick={() => move(-1)} aria-label={en ? "Previous page" : "Page précédente"} className="absolute left-2 top-1/2 z-30 grid size-12 -translate-y-1/2 place-items-center rounded-full bg-white text-slate-900 shadow-xl sm:left-4"><ChevronLeft size={26}/></button><button type="button" onClick={() => move(1)} aria-label={en ? "Next page" : "Page suivante"} className="absolute right-2 top-1/2 z-30 grid size-12 -translate-y-1/2 place-items-center rounded-full bg-white text-slate-900 shadow-xl sm:right-4"><ChevronRight size={26}/></button><span className="absolute bottom-3 left-1/2 z-30 -translate-x-1/2 rounded-full bg-white px-4 py-2 text-sm font-black text-slate-900 shadow-xl">{index + 1} / {images.length}</span></>}</div></div>}
  </>;
}
