"use client";

import { useEffect, useRef, useState } from "react";
import type { PDFDocumentLoadingTask, PDFDocumentProxy, RenderTask } from "pdfjs-dist";

export function PdfBookPage({ src, page, onDocumentLoaded }: { src: string; page: number; onDocumentLoaded: (pages: number) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const renderRef = useRef<RenderTask | null>(null);
  const [document, setDocument] = useState<PDFDocumentProxy | null>(null);
  const [width, setWidth] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    let loadingTask: PDFDocumentLoadingTask | null = null;
    void import("pdfjs-dist").then(async pdfjs => {
      pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
      loadingTask = pdfjs.getDocument({ url: src });
      const loaded = await loadingTask.promise;
      if (!active) return;
      setDocument(loaded);
      onDocumentLoaded(loaded.numPages);
    }).catch(() => active && setError(true));
    return () => { active = false; void loadingTask?.destroy(); };
  }, [src, onDocumentLoaded]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(entries => setWidth(entries[0]?.contentRect.width ?? 0));
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!document || !width || !canvasRef.current) return;
    let active = true;
    setLoading(true);
    renderRef.current?.cancel();
    void document.getPage(page).then(pdfPage => {
      if (!active || !canvasRef.current || !containerRef.current) return;
      const base = pdfPage.getViewport({ scale: 1 });
      const inset = window.innerWidth < 1024 ? 0 : 24;
      const availableHeight = Math.max(320, containerRef.current.clientHeight - inset);
      const scale = Math.min((width - inset) / base.width, availableHeight / base.height) * Math.min(window.devicePixelRatio, 2);
      const viewport = pdfPage.getViewport({ scale });
      // Le rendu est préparé hors écran puis copié en une seule fois. La page
      // précédente reste ainsi nette et visible pendant toute la transition.
      const buffer = window.document.createElement("canvas");
      buffer.width = viewport.width;
      buffer.height = viewport.height;
      const task = pdfPage.render({ canvas: buffer, canvasContext: buffer.getContext("2d")!, viewport });
      renderRef.current = task;
      return task.promise.then(() => {
        if (!active || !canvasRef.current) return;
        const canvas = canvasRef.current;
        canvas.width = buffer.width;
        canvas.height = buffer.height;
        canvas.style.width = `${viewport.width / Math.min(window.devicePixelRatio, 2)}px`;
        canvas.style.height = `${viewport.height / Math.min(window.devicePixelRatio, 2)}px`;
        canvas.getContext("2d")?.drawImage(buffer, 0, 0);
        setLoading(false);
        // PDF.js garde ces pages en cache : les actions suivante/précédente
        // deviennent presque immédiates sans augmenter le rendu initial.
        void Promise.all([page - 1, page + 1].filter(value => value >= 1 && value <= document.numPages).map(value => document.getPage(value)));
      }).catch(reason => { if (reason?.name !== "RenderingCancelledException" && active) setError(true); });
    });
    return () => { active = false; renderRef.current?.cancel(); };
  }, [document, page, width]);

  return <div ref={containerRef} className="relative grid min-h-0 flex-1 touch-manipulation place-items-center overflow-hidden bg-slate-900 p-0 lg:p-3">
    {loading && !error && <div className="absolute left-1/2 top-20 z-10 -translate-x-1/2 rounded-full bg-slate-950/75 px-4 py-2 text-xs font-bold text-white/80 shadow-xl backdrop-blur-md lg:top-4">Chargement…</div>}
    {error ? <p className="rounded-2xl bg-red-500/15 px-5 py-4 font-bold text-red-200">Le PDF ne peut pas être affiché.</p> : <canvas ref={canvasRef} className="max-h-full max-w-full bg-white shadow-2xl"/>}
  </div>;
}
