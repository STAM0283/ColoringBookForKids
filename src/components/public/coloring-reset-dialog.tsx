"use client";

import { useEffect, useId } from "react";
import { RotateCcw, X } from "lucide-react";

export function ColoringResetDialog({ en, cancel, confirm }: { en:boolean; cancel:()=>void; confirm:()=>void }) {
  const titleId = useId();

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") cancel();
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [cancel]);

  return <div className="fixed inset-0 z-[170] grid place-items-center bg-slate-950/75 p-4 backdrop-blur-sm" onPointerDown={cancel}>
    <div role="dialog" aria-modal="true" aria-labelledby={titleId} onPointerDown={event => event.stopPropagation()} className="relative w-full max-w-sm overflow-hidden rounded-[1.75rem] border border-white/20 bg-card p-6 text-center shadow-2xl dark:border-white/10 sm:p-7">
      <button type="button" aria-label={en ? "Close" : "Fermer"} onClick={cancel} className="absolute right-4 top-4 grid size-10 place-items-center rounded-xl border bg-background text-foreground/65 transition hover:rotate-6 hover:text-foreground dark:border-white/10"><X size={18}/></button>
      <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-amber-100 text-amber-700 shadow-inner dark:bg-amber-400/15 dark:text-amber-300"><RotateCcw size={29}/></span>
      <h2 id={titleId} className="mt-5 font-display text-2xl font-black text-foreground">{en ? "Start again?" : "Recommencer le coloriage ?"}</h2>
      <p className="mx-auto mt-3 max-w-xs text-sm font-medium leading-6 text-foreground/65">{en ? "All the colours you added will be erased." : "Toutes les couleurs que tu as ajoutées seront effacées."}</p>
      <div className="mt-6 grid grid-cols-2 gap-3">
        <button type="button" onClick={cancel} className="min-h-12 rounded-xl border bg-background px-3 text-sm font-black text-foreground transition hover:bg-foreground/5 dark:border-white/10">{en ? "Keep drawing" : "Continuer"}</button>
        <button type="button" onClick={confirm} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-3 text-sm font-black text-white shadow-lg shadow-primary/20 transition hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0"><RotateCcw size={17}/>{en ? "Start over" : "Recommencer"}</button>
      </div>
    </div>
  </div>;
}
