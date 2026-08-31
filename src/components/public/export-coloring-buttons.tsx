import { Download, FileImage, FileText } from "lucide-react";
import { exportCanvasPdf, exportCanvasPng } from "@/lib/client/canvas-export";

type Props = {
  title: string;
  en: boolean;
  getCanvas: () => Promise<HTMLCanvasElement | null> | HTMLCanvasElement | null;
  compact?: boolean;
  iconOnly?: boolean;
};

export function ExportColoringButtons({ title, en, getCanvas, compact = false, iconOnly = false }: Props) {
  async function run(format: "png" | "pdf") {
    const canvas = await getCanvas();
    if (!canvas) return;
    if (format === "png") return exportCanvasPng(canvas, title);
    await exportCanvasPdf(canvas, title);
  }

  if (compact) return <div className="contents">
    <button type="button" onClick={() => void run("png")} aria-label={en ? "Save as image" : "Enregistrer en image"} className="mobile-coloring-action"><FileImage size={19}/><span className="sr-only">PNG</span></button>
    <button type="button" onClick={() => void run("pdf")} aria-label={en ? "Save as PDF" : "Enregistrer en PDF"} className="mobile-coloring-action"><FileText size={19}/><span className="sr-only">PDF</span></button>
  </div>;

  if(iconOnly)return <div className="contents">
    <button type="button" onClick={()=>void run("png")} aria-label={en?"Save as PNG image":"Enregistrer en image PNG"} className="no-auto-tooltip group relative grid min-h-12 place-items-center rounded-xl bg-emerald-500/20 text-emerald-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-500/30 hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/25 active:translate-y-0 dark:bg-emerald-400/15 dark:text-emerald-300"><FileImage size={22} strokeWidth={2.3}/><ToolbarTooltip>{en?"Save PNG":"Image PNG"}</ToolbarTooltip></button>
    <button type="button" onClick={()=>void run("pdf")} aria-label={en?"Save as PDF":"Enregistrer en PDF"} className="no-auto-tooltip group relative grid min-h-12 place-items-center rounded-xl bg-violet-500/20 text-violet-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-violet-500/30 hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-500/25 active:translate-y-0 dark:bg-violet-400/15 dark:text-violet-300"><FileText size={22} strokeWidth={2.3}/><ToolbarTooltip align="right">{en?"Save PDF":"Enregistrer en PDF"}</ToolbarTooltip></button>
  </div>;

  return <section className="rounded-[1.4rem] border bg-card p-3 dark:border-white/10">
    <p className="flex items-center gap-2 px-1 text-xs font-black uppercase tracking-wide text-foreground/55"><Download size={15}/>{en ? "Save my picture" : "Enregistrer mon dessin"}</p>
    <div className="mt-3 grid grid-cols-2 gap-2">
      <button type="button" onClick={() => void run("png")} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-3 text-xs font-black text-white shadow-md transition hover:brightness-110"><FileImage size={17}/>{en ? "Image" : "Image PNG"}</button>
      <button type="button" onClick={() => void run("pdf")} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-slate-950 px-3 text-xs font-black text-white shadow-md transition hover:bg-slate-800 dark:bg-white dark:text-slate-950"><FileText size={17}/>PDF</button>
    </div>
  </section>;
}

function ToolbarTooltip({children,align="center"}:{children:React.ReactNode;align?:"center"|"right"}){return <span role="tooltip" className={`pointer-events-none absolute bottom-[calc(100%+.5rem)] z-50 translate-y-1 whitespace-nowrap rounded-lg bg-slate-950 px-2.5 py-1.5 text-[10px] font-bold text-white opacity-0 shadow-xl transition duration-150 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100 dark:bg-white dark:text-slate-950 ${align==="right"?"right-0":"left-1/2 -translate-x-1/2"}`}>{children}</span>}
