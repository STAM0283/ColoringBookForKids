"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { CheckCircle2, Download, Instagram, LoaderCircle, LockKeyhole, Palette, Printer, X } from "lucide-react";
import { INSTAGRAM_URL } from "@/lib/site-config";
import type { Locale } from "@/lib/i18n";
import { RasterColoringStudio } from "./raster-coloring-studio";

export function ClubDownloadButton({ activityId, title, coloringPages, coloringEnabled=false, clubOnly, unlocked, enabled, hasModel=false, locale = "fr" }: { activityId: string; title:string; coloringPages:Array<{path:string;modelPath:string|null}>; coloringEnabled?:boolean; clubOnly: boolean; unlocked: boolean; enabled: boolean; hasModel?:boolean;locale?: Locale }) {
  const en = locale === "en";
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [locallyUnlocked, setLocallyUnlocked] = useState(false);
  const [includeModel,setIncludeModel]=useState(false);
  const [requestedAction,setRequestedAction]=useState<"download"|"print">("download");
  const [busyAction,setBusyAction]=useState<"download"|"print"|null>(null);
  const [coloringOpen,setColoringOpen]=useState(false);
  const [currentImagePath,setCurrentImagePath]=useState(coloringPages[0]?.path ?? "");
  const [currentModelPath,setCurrentModelPath]=useState(coloringPages[0]?.modelPath ?? null);
  const router = useRouter();
  const query=includeModel?"?model=1":"";
  const downloadUrl = `/api/activities/${activityId}/download${query}`;
  const printUrl=`/api/activities/${activityId}/download?${includeModel?"model=1&":""}print=1`;
  const instagramUrl = INSTAGRAM_URL;

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape" && !loading) setOpen(false); };
    window.addEventListener("keydown", closeOnEscape);
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener("keydown", closeOnEscape); };
  }, [open, loading]);

  useEffect(() => {
    if (!clubOnly || unlocked) return;
    let active = true;
    fetch("/api/club/status", { cache: "no-store" })
      .then(response => response.ok ? response.json() : null)
      .then((data: { active?: boolean } | null) => { if (active && data?.active) setLocallyUnlocked(true); })
      .catch(() => undefined);
    return () => { active = false; };
  }, [clubOnly, unlocked]);

  useEffect(() => {
    const pageChange = (event: Event) => {
      const detail = (event as CustomEvent<{activityId:string;path:string;modelPath:string|null}>).detail;
      if (detail?.activityId !== activityId) return;
      const drawing = coloringPages.find(page => page.path === detail.path);
      if (!drawing) return;
      setCurrentImagePath(drawing.path);
      setCurrentModelPath(drawing.modelPath);
    };
    window.addEventListener("activity-page-change", pageChange);
    return () => window.removeEventListener("activity-page-change", pageChange);
  }, [activityId, coloringPages]);

  useEffect(() => {
    setCurrentImagePath(currentPath => {
      const nextPage = coloringPages.find(page => page.path === currentPath) ?? coloringPages[0];
      setCurrentModelPath(nextPage?.modelPath ?? null);
      return nextPage?.path ?? "";
    });
  }, [coloringPages]);

  function triggerDownload() {
    setError("");
    setBusyAction("download");
    const link = document.createElement("a");
    link.href = downloadUrl;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => setBusyAction(null), 900);
  }

  async function triggerPrint() {
    setError("");
    setBusyAction("print");
    const printWindow = window.open("about:blank", "_blank");
    if (!printWindow) {
      setBusyAction(null);
      setError(en ? "Allow pop-ups to open the print window." : "Autorisez les fenêtres contextuelles pour ouvrir l’impression.");
      return;
    }
    printWindow.document.title = en ? "Preparing document…" : "Préparation du document…";
    printWindow.document.body.innerHTML = `<main style="min-height:100vh;display:grid;place-items:center;font:600 16px system-ui;color:#334155"><p>${en ? "Preparing the print preview…" : "Préparation de l’aperçu avant impression…"}</p></main>`;
    try {
      const response = await fetch(printUrl, { cache: "no-store", credentials: "same-origin" });
      if (!response.ok) throw new Error(en ? "Unable to prepare the document." : "Impossible de préparer le document.");
      const pdfUrl = URL.createObjectURL(await response.blob());
      let printRequested = false;
      const requestPrint = () => {
        if (printRequested || printWindow.closed) return;
        printRequested = true;
        setBusyAction(null);
        printWindow.focus();
        printWindow.print();
      };
      printWindow.onload = () => window.setTimeout(requestPrint, 500);
      printWindow.location.replace(pdfUrl);
      window.setTimeout(requestPrint, 1800);
      window.setTimeout(() => {
        URL.revokeObjectURL(pdfUrl);
        setBusyAction(null);
      }, 120_000);
    } catch (cause) {
      printWindow.close();
      setBusyAction(null);
      setError(cause instanceof Error ? cause.message : (en ? "Printing failed." : "L’impression a échoué."));
    }
  }

  const modelOption=<label className={`mt-4 flex items-center gap-3 rounded-xl border border-foreground/10 bg-foreground/[.025] px-3 py-2.5 text-sm font-semibold dark:bg-white/[.035] ${hasModel?"cursor-pointer text-foreground/75":"cursor-not-allowed text-foreground/40"}`}><input type="checkbox" disabled={!hasModel} checked={includeModel} onChange={event=>{const checked=event.target.checked;setIncludeModel(checked);window.dispatchEvent(new CustomEvent("activity-model-option",{detail:{activityId,includeModel:checked}}))}} className="size-4 accent-emerald-600 disabled:opacity-40"/><span>{hasModel?(en?"PDF with color models":"PDF avec modèles en couleur"):(en?"No color model available":"Aucun modèle couleur disponible")}</span></label>;

  const actionButtons = (locked: boolean) => <div className={`mt-3 grid gap-2 ${coloringEnabled?"grid-cols-3":"grid-cols-2"}`}>
    {coloringEnabled && <button type="button" onClick={() => setColoringOpen(true)} aria-label={en?"Colour this drawing":"Colorier ce dessin"} title={en?"Colour":"Colorier"} className="group flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-2xl bg-gradient-to-br from-violet-600 via-fuchsia-600 to-pink-600 px-2 py-2 font-black text-white shadow-lg shadow-fuchsia-700/20 transition duration-200 hover:-translate-y-0.5 hover:brightness-110 hover:shadow-xl active:translate-y-0 active:scale-[.97] dark:border dark:border-fuchsia-300/20 dark:from-violet-700 dark:via-fuchsia-700 dark:to-pink-700 dark:shadow-black/35 sm:min-h-16">
      <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-white/15 ring-1 ring-white/15"><Palette size={18}/></span>
      <span className="hidden truncate text-xs sm:block">{en ? "Colour" : "Colorier"}</span>
    </button>}
    <button type="button" disabled={busyAction !== null} onClick={() => locked ? (setRequestedAction("download"), setOpen(true)) : triggerDownload()} aria-label={locked?(en?"Unlock and download":"Débloquer et télécharger"):(en?"Download":"Télécharger")} title={en?"Download":"Télécharger"} className="group flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-2xl bg-emerald-600 px-2 py-2 font-black text-white shadow-lg shadow-emerald-700/20 transition duration-200 hover:-translate-y-0.5 hover:bg-emerald-500 hover:shadow-xl active:translate-y-0 active:scale-[.97] disabled:pointer-events-none disabled:opacity-60 dark:border dark:border-emerald-300/20 dark:bg-emerald-600 dark:text-white dark:shadow-emerald-950/40 dark:hover:border-emerald-200/30 dark:hover:bg-emerald-500 sm:min-h-16">
      <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-white/15 ring-1 ring-white/10 dark:bg-slate-950/20 dark:ring-white/15">{busyAction === "download" ? <LoaderCircle className="animate-spin" size={18}/> : locked ? <LockKeyhole size={18}/> : <Download size={18}/>}</span>
      <span className="hidden max-w-full truncate text-xs sm:block">{locked ? (en ? "Unlock" : "Débloquer") : (en ? "Download" : "Télécharger")}</span>
    </button>
    <button type="button" disabled={busyAction !== null} onClick={() => locked ? (setRequestedAction("print"), setOpen(true)) : void triggerPrint()} aria-label={locked?(en?"Unlock and print":"Débloquer et imprimer"):(en?"Print":"Imprimer")} title={en?"Print":"Imprimer"} className="group flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-2xl border border-emerald-600/25 bg-emerald-50 px-2 py-2 font-black text-emerald-800 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-emerald-500/45 hover:bg-emerald-100 hover:shadow-md active:translate-y-0 active:scale-[.97] disabled:pointer-events-none disabled:opacity-60 dark:border-emerald-300/30 dark:bg-slate-800/90 dark:text-emerald-300 dark:shadow-black/20 dark:hover:border-emerald-300/50 dark:hover:bg-slate-700 sm:min-h-16">
      <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-emerald-600/10 ring-1 ring-emerald-600/10 dark:bg-emerald-300/10 dark:ring-emerald-300/15">{busyAction === "print" ? <LoaderCircle className="animate-spin" size={18}/> : <Printer size={18}/>}</span>
      <span className="hidden max-w-full truncate text-xs sm:block">{locked ? (en ? "Unlock" : "Débloquer") : (en ? "Print" : "Imprimer")}</span>
    </button>
  </div>;

  const coloringStudio = coloringEnabled && coloringOpen && currentImagePath && typeof document !== "undefined" ? createPortal(<RasterColoringStudio title={title} imagePath={currentImagePath} modelPath={currentModelPath} en={en} close={() => setColoringOpen(false)}/>, document.body) : null;

  if (!enabled) return <span className="mt-4 inline-flex items-center gap-2 font-bold text-slate-400 dark:text-slate-300"><LockKeyhole size={17}/> {en ? "Download unavailable" : "Téléchargement indisponible"}</span>;
  if (!clubOnly || unlocked || locallyUnlocked) return <><div>{modelOption}{actionButtons(false)}{error && <p role="alert" className="mt-2 text-sm font-bold text-red-600 dark:text-red-400">{error}</p>}</div>{coloringStudio}</>;

  async function activate(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true); setError("");
    const response = await fetch("/api/club/activate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code }) });
    const data = await response.json().catch(() => null) as { message?: string } | null;
    setLoading(false);
    if (!response.ok) return setError(data?.message || (en ? "Activation failed." : "Activation impossible."));
    setSuccess(true);
    window.setTimeout(() => {
      setLocallyUnlocked(true);
      setOpen(false);
      router.refresh();
      if (requestedAction === "print") void triggerPrint();
      else triggerDownload();
    }, 900);
  }

  const dialog = open && typeof document !== "undefined" ? createPortal(
    <div className="fixed inset-0 z-[10000] flex items-start justify-center overflow-y-auto overscroll-contain bg-slate-950/75 p-3 backdrop-blur-md sm:items-center sm:p-6" onMouseDown={() => !loading && setOpen(false)}>
      <div role="dialog" aria-modal="true" aria-labelledby="club-title" onMouseDown={event => event.stopPropagation()} className="relative my-2 max-h-[calc(100dvh-1.5rem)] w-full max-w-lg overflow-y-auto overscroll-contain rounded-[1.5rem] bg-white shadow-2xl dark:bg-card sm:my-auto sm:rounded-[2rem]">
        <div className="bg-gradient-to-br from-emerald-700 to-emerald-900 p-5 text-white sm:p-7">
          <button aria-label={en ? "Close" : "Fermer"} onClick={() => setOpen(false)} className="absolute right-4 top-4 grid size-10 place-items-center rounded-full bg-white/15 text-white hover:bg-white/25"><X size={19}/></button>
          <span className="grid size-12 place-items-center rounded-2xl bg-white/15 sm:size-14"><LockKeyhole size={24}/></span>
          <h2 id="club-title" className="mt-4 pr-10 text-2xl font-black sm:mt-5 sm:text-3xl">Club du Petit Crayon</h2>
          <p className="mt-3 text-sm leading-relaxed text-white/85 sm:text-base">{en ? <>Follow us on Instagram, then send <strong className="text-white">COLORING</strong> in a direct message to receive your free code.</> : <>Suivez-nous sur Instagram, puis envoyez le mot <strong className="text-white">COLORIAGE</strong> en message privé pour recevoir votre code gratuit.</>}</p>
          <a href={instagramUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 font-black text-emerald-800 sm:mt-5"><Instagram size={19}/> {en ? "Open Instagram" : "Ouvrir Instagram"}</a>
        </div>
        <form onSubmit={activate} className="p-5 sm:p-7">
          {success ? <div className="py-4 text-center"><CheckCircle2 className="mx-auto text-emerald-600" size={50}/><h3 className="mt-4 text-2xl font-black">{en ? "Access unlocked!" : "Accès débloqué !"}</h3><p className="mt-2 text-slate-500 dark:text-foreground/60">{en ? "Your download will begin shortly." : "Votre téléchargement va commencer."}</p></div> : <>
            <label className="text-sm font-black text-slate-700 dark:text-foreground">{en ? "I already have a code" : "J’ai déjà un code"}<input value={code} onChange={event => setCode(event.target.value.toUpperCase())} placeholder="CRAYON-XXXX-XXXX" autoComplete="one-time-code" className="mt-2 min-h-13 w-full rounded-xl border px-3 text-center font-mono text-base font-black uppercase tracking-wide outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 sm:min-h-14 sm:px-4 sm:text-lg sm:tracking-wider"/></label>
            {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">{error}</p>}
            <button disabled={loading || code.length < 8} className="mt-5 inline-flex min-h-13 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 font-black text-white disabled:opacity-40">{loading ? <LoaderCircle className="animate-spin" size={19}/> : <LockKeyhole size={18}/>} {en ? "Activate access" : "Activer mon accès"}</button>
            <p className="mt-4 text-center text-xs leading-relaxed text-slate-400 dark:text-foreground/45">{en ? "One code unlocks every Club PDF on this device for the duration of your pass." : "Un code active tous les PDF du Club sur cet appareil pendant la durée choisie pour ce Pass."}</p>
          </>}
        </form>
      </div>
    </div>, document.body) : null;

  return <><div>{modelOption}{actionButtons(true)}</div>{dialog}{coloringStudio}</>;
}
