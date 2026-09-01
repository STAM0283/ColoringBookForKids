"use client";

import { useEffect, useRef, useState } from "react";
import type { PDFDocumentProxy, RenderTask } from "pdfjs-dist";

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
    void import("pdfjs-dist").then(async pdfjs => {
      pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
      const loadingTask = pdfjs.getDocument({ url: src });
      const loaded = await loadingTask.promise;
      if (!active) { await loadingTask.destroy(); return; }
      setDocument(loaded);
      onDocumentLoaded(loaded.numPages);
    }).catch(() => active && setError(true));
    return () => { active = false; };
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
      const availableHeight = Math.max(320, containerRef.current.clientHeight - 24);
      const scale = Math.min((width - 24) / base.width, availableHeight / base.height) * Math.min(window.devicePixelRatio, 2);
      const viewport = pdfPage.getViewport({ scale });
      const canvas = canvasRef.current;
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      canvas.style.width = `${viewport.width / Math.min(window.devicePixelRatio, 2)}px`;
      canvas.style.height = `${viewport.height / Math.min(window.devicePixelRatio, 2)}px`;
      const task = pdfPage.render({ canvas, canvasContext: canvas.getContext("2d")!, viewport });
      renderRef.current = task;
      return task.promise.then(() => active && setLoading(false)).catch(reason => { if (reason?.name !== "RenderingCancelledException" && active) setError(true); });
    });
    return () => { active = false; renderRef.current?.cancel(); };
  }, [document, page, width]);

  return <div ref={containerRef} className="relative grid min-h-0 flex-1 place-items-center overflow-hidden bg-slate-800 p-3">
    {loading && !error && <div className="absolute inset-0 grid place-items-center bg-slate-900/60 text-sm font-bold text-white/70">Chargement de la page…</div>}
    {error ? <p className="rounded-2xl bg-red-500/15 px-5 py-4 font-bold text-red-200">Le PDF ne peut pas être affiché.</p> : <canvas ref={canvasRef} className="max-h-full max-w-full bg-white shadow-2xl"/>}
  </div>;
}
