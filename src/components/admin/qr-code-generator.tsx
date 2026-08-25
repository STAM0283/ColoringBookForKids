"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, Download, Link2, Palette, QrCode, Shapes, Sparkles } from "lucide-react";
import QRCode from "qrcode";

type ModuleShape = "square" | "rounded" | "dots";

const shapes: Array<{ value: ModuleShape; label: string; description: string }> = [
  { value: "square", label: "Classique", description: "Net et universel" },
  { value: "rounded", label: "Arrondi", description: "Doux et moderne" },
  { value: "dots", label: "Pastilles", description: "Ludique et créatif" },
];

function isFinderModule(row: number, col: number, size: number) {
  return (row < 7 && col < 7) || (row < 7 && col >= size - 7) || (row >= size - 7 && col < 7);
}

function safeUrl(value: string) {
  try {
    const url = new URL(value.trim());
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch { return null; }
}

function qrSvg(url: string, foreground: string, background: string, shape: ModuleShape) {
  const qr = QRCode.create(url, { errorCorrectionLevel: "H" });
  const quiet = 4, total = qr.modules.size + quiet * 2;
  const modules: string[] = [];
  for (let row = 0; row < qr.modules.size; row++) for (let col = 0; col < qr.modules.size; col++) {
    if (!qr.modules.get(row, col)) continue;
    const x = col + quiet, y = row + quiet, finder = isFinderModule(row, col, qr.modules.size);
    if (shape === "dots" && !finder) modules.push(`<circle cx="${x + .5}" cy="${y + .5}" r=".41"/>`);
    else modules.push(`<rect x="${x + .08}" y="${y + .08}" width=".84" height=".84" rx="${shape === "rounded" && !finder ? .24 : 0}"/>`);
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}" shape-rendering="geometricPrecision"><rect width="${total}" height="${total}" fill="${background}"/><g fill="${foreground}">${modules.join("")}</g></svg>`;
}

function downloadBlob(blob: Blob, filename: string) {
  const href = URL.createObjectURL(blob), link = document.createElement("a");
  link.href = href; link.download = filename; link.click();
  setTimeout(() => URL.revokeObjectURL(href), 500);
}

export function QrCodeGenerator() {
  const [url, setUrl] = useState("https://lepetitcrayon.fr");
  const [foreground, setForeground] = useState("#173f34");
  const [background, setBackground] = useState("#ffffff");
  const [shape, setShape] = useState<ModuleShape>("rounded");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const validUrl = useMemo(() => safeUrl(url), [url]);
  const svg = useMemo(() => validUrl ? qrSvg(validUrl, foreground, background, shape) : "", [validUrl, foreground, background, shape]);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas || !svg) return;
    const image = new Image(), blob = new Blob([svg], { type: "image/svg+xml" }), src = URL.createObjectURL(blob);
    image.onload = () => { const context = canvas.getContext("2d"); if (!context) return; context.clearRect(0, 0, canvas.width, canvas.height); context.drawImage(image, 0, 0, canvas.width, canvas.height); URL.revokeObjectURL(src); };
    image.src = src;
    return () => URL.revokeObjectURL(src);
  }, [svg]);

  function downloadSvg() { if (svg) downloadBlob(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }), "qr-code-le-petit-crayon.svg"); }
  function downloadPng() {
    if (!svg) return;
    const image = new Image(), src = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
    image.onload = () => { const canvas = document.createElement("canvas"); canvas.width = canvas.height = 1600; const context = canvas.getContext("2d"); if (!context) return; context.drawImage(image, 0, 0, 1600, 1600); canvas.toBlob(blob => blob && downloadBlob(blob, "qr-code-le-petit-crayon.png"), "image/png"); URL.revokeObjectURL(src); };
    image.src = src;
  }

  return <div className="mx-auto max-w-7xl space-y-7">
    <header className="overflow-hidden rounded-[2rem] border border-emerald-900/10 bg-gradient-to-br from-[#173f34] via-[#205846] to-[#2d735d] p-7 text-white shadow-xl md:p-10">
      <div className="flex items-start gap-5"><span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-white/15 ring-1 ring-white/20"><QrCode size={29}/></span><div><p className="text-xs font-black uppercase tracking-[.22em] text-emerald-200">Outil créatif</p><h1 className="mt-2 text-3xl font-black md:text-5xl">Générateur de QR code</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-emerald-50/80 md:text-base">Transformez une adresse web en QR code prêt à intégrer à vos livres. Rien n’est enregistré.</p></div></div>
    </header>

    <div className="grid gap-7 xl:grid-cols-[minmax(0,1fr)_430px]">
      <section className="space-y-7 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-card md:p-8">
        <div><div className="mb-3 flex items-center gap-2"><Link2 size={19} className="text-emerald-600"/><label htmlFor="qr-url" className="font-black">Adresse à transformer <span className="text-red-500">*</span></label></div><input id="qr-url" type="url" value={url} onChange={event => setUrl(event.target.value)} placeholder="https://votre-site.fr/page" aria-invalid={Boolean(url && !validUrl)} className="min-h-16 w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 text-base font-semibold outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 dark:border-white/10 dark:bg-background dark:focus:ring-emerald-500/15"/>{url && !validUrl && <p className="mt-2 text-sm font-bold text-red-500">Saisissez une adresse complète commençant par https://</p>}</div>

        <div><div className="mb-4 flex items-center gap-2"><Palette size={19} className="text-emerald-600"/><h2 className="font-black">Couleurs</h2></div><div className="grid gap-4 sm:grid-cols-2">{[["Couleur du motif", foreground, setForeground], ["Couleur du fond", background, setBackground]].map(([label, value, setter]) => <label key={label as string} className="flex cursor-pointer items-center gap-4 rounded-2xl border border-slate-200 p-4 transition hover:border-emerald-300 dark:border-white/10"><input type="color" value={value as string} onChange={event => (setter as (value:string)=>void)(event.target.value)} className="size-12 cursor-pointer rounded-xl border-0 bg-transparent"/><span><span className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-foreground/55">{label as string}</span><span className="mt-1 block font-mono text-sm font-bold uppercase">{value as string}</span></span></label>)}</div></div>

        <div><div className="mb-4 flex items-center gap-2"><Shapes size={19} className="text-emerald-600"/><h2 className="font-black">Forme du motif</h2></div><div className="grid gap-3 sm:grid-cols-3">{shapes.map(option => <button key={option.value} type="button" onClick={() => setShape(option.value)} aria-pressed={shape === option.value} className={`relative rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md ${shape === option.value ? "border-emerald-500 bg-emerald-50 ring-4 ring-emerald-100 dark:bg-emerald-500/10 dark:ring-emerald-500/10" : "border-slate-200 dark:border-white/10"}`}><span className="block font-black">{option.label}</span><span className="mt-1 block text-xs text-slate-500 dark:text-foreground/50">{option.description}</span>{shape === option.value && <CheckCircle2 size={18} className="absolute right-3 top-3 text-emerald-600"/>}</button>)}</div></div>
      </section>

      <aside className="self-start rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-card md:p-8 xl:sticky xl:top-8">
        <div className="mb-5 flex items-center justify-between"><div><p className="text-xs font-black uppercase tracking-[.18em] text-emerald-600">Aperçu en direct</p><h2 className="mt-1 text-2xl font-black">Votre QR code</h2></div><Sparkles className="text-amber-500"/></div>
        <div className="grid aspect-square place-items-center overflow-hidden rounded-[1.75rem] border border-dashed border-slate-300 bg-slate-50 p-5 dark:border-white/15 dark:bg-background"><canvas ref={canvasRef} width={800} height={800} className={`h-full w-full rounded-xl transition ${validUrl ? "opacity-100" : "opacity-15"}`}/></div>
        <p className="mt-4 text-center text-xs leading-5 text-slate-500 dark:text-foreground/50">Une marge de sécurité est ajoutée automatiquement pour garantir une bonne lecture.</p>
        <div className="mt-5 grid grid-cols-2 gap-3"><button type="button" disabled={!validUrl} onClick={downloadPng} className="flex min-h-13 items-center justify-center gap-2 rounded-2xl bg-[#28765f] px-4 font-black text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-[#205e4c] disabled:cursor-not-allowed disabled:opacity-40"><Download size={18}/>PNG</button><button type="button" disabled={!validUrl} onClick={downloadSvg} className="flex min-h-13 items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 font-black transition hover:-translate-y-0.5 hover:border-emerald-400 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/15 dark:hover:text-emerald-300"><Download size={18}/>SVG</button></div>
      </aside>
    </div>
  </div>;
}
