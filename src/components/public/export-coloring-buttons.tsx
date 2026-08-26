import { Download, FileImage, FileText } from "lucide-react";
import { exportCanvasPdf, exportCanvasPng } from "@/lib/client/canvas-export";

type Props = {
  title: string;
  en: boolean;
  getCanvas: () => Promise<HTMLCanvasElement | null> | HTMLCanvasElement | null;
  compact?: boolean;
};

export function ExportColoringButtons({ title, en, getCanvas, compact = false }: Props) {
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

  return <section className="rounded-[1.4rem] border bg-card p-3 dark:border-white/10">
    <p className="flex items-center gap-2 px-1 text-xs font-black uppercase tracking-wide text-foreground/55"><Download size={15}/>{en ? "Save my picture" : "Enregistrer mon dessin"}</p>
    <div className="mt-3 grid grid-cols-2 gap-2">
      <button type="button" onClick={() => void run("png")} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-3 text-xs font-black text-white shadow-md transition hover:brightness-110"><FileImage size={17}/>{en ? "Image" : "Image PNG"}</button>
      <button type="button" onClick={() => void run("pdf")} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-slate-950 px-3 text-xs font-black text-white shadow-md transition hover:bg-slate-800 dark:bg-white dark:text-slate-950"><FileText size={17}/>PDF</button>
    </div>
  </section>;
}
