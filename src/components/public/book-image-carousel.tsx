"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type CarouselImage = { path: string; alt: string };

export function BookImageCarousel({ images, title, fallback }: { images: CarouselImage[]; title: string; fallback: React.ReactNode }) {
  const [index, setIndex] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [mounted, setMounted] = useState(false);
  const current = images[index];

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (!expanded) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const close = (event: KeyboardEvent) => event.key === "Escape" && setExpanded(false);
    window.addEventListener("keydown", close);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", close);
    };
  }, [expanded]);

  if (!current) return <>{fallback}</>;
  const previous = () => setIndex(value => (value - 1 + images.length) % images.length);
  const next = () => setIndex(value => (value + 1) % images.length);

  const viewer = expanded && mounted ? createPortal(
    <div role="dialog" aria-modal="true" aria-label={`Aperçu de ${title}`} className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/95 p-4 backdrop-blur-md" onClick={() => setExpanded(false)}>
      <div className="relative h-full max-h-[92vh] w-full max-w-6xl" onClick={event => event.stopPropagation()}>
        <Image fill priority src={`/media/${current.path}`} alt={current.alt || title} sizes="100vw" className="select-none object-contain" />
        <button type="button" aria-label="Fermer l’aperçu" onClick={() => setExpanded(false)} className="absolute right-2 top-2 z-10 grid size-12 place-items-center rounded-full bg-white text-slate-900 shadow-xl transition hover:scale-105"><X /></button>
        {images.length > 1 && <>
          <button type="button" aria-label="Image précédente" onClick={previous} className="absolute left-2 top-1/2 z-10 grid size-12 -translate-y-1/2 place-items-center rounded-full bg-white text-slate-900 shadow-xl transition hover:scale-105"><ChevronLeft /></button>
          <button type="button" aria-label="Image suivante" onClick={next} className="absolute right-2 top-1/2 z-10 grid size-12 -translate-y-1/2 place-items-center rounded-full bg-white text-slate-900 shadow-xl transition hover:scale-105"><ChevronRight /></button>
          <span className="absolute bottom-3 left-1/2 z-10 -translate-x-1/2 rounded-full bg-black/70 px-4 py-2 text-xs font-black text-white">{index + 1} / {images.length}</span>
        </>}
      </div>
    </div>, document.body
  ) : null;

  return <>
    <div className="relative size-full overflow-hidden">
      <Image fill src={`/media/${current.path}`} alt={current.alt || `Image de ${title}`} sizes="(min-width: 1024px) 33vw, 100vw" className="object-contain p-5 drop-shadow-xl transition duration-300 group-hover:scale-[1.02]" />
      <button type="button" aria-label="Agrandir l’image" onClick={() => setExpanded(true)} className="absolute right-3 top-3 grid size-10 place-items-center rounded-full bg-white/95 text-slate-800 shadow-md transition hover:scale-105"><Expand size={17} /></button>
      {images.length > 1 && <>
        <button type="button" aria-label="Image précédente" onClick={previous} className="absolute left-3 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-white/95 text-slate-800 shadow-md transition hover:scale-105"><ChevronLeft /></button>
        <button type="button" aria-label="Image suivante" onClick={next} className="absolute right-3 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-white/95 text-slate-800 shadow-md transition hover:scale-105"><ChevronRight /></button>
        <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 rounded-full bg-slate-950/60 px-1.5 py-1 backdrop-blur">{images.map((_, dot) => <button type="button" key={dot} aria-label={`Afficher l’image ${dot + 1}`} onClick={() => setIndex(dot)} className="grid size-8 place-items-center rounded-full"><span className={`h-2 rounded-full transition-all ${dot === index ? "w-5 bg-white" : "w-2 bg-white/50"}`}/></button>)}</div>
        <span className="absolute bottom-3 right-3 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-black text-slate-700">{index + 1}/{images.length}</span>
      </>}
    </div>
    {viewer}
  </>;
}
