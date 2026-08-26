"use client";

import { useEffect, useRef, useState } from "react";
import { Eraser, LoaderCircle, Redo2, RotateCcw, Undo2, X } from "lucide-react";
import { useViewportLock } from "@/hooks/use-viewport-lock";
import { ExportColoringButtons } from "./export-coloring-buttons";
import { MobileColoringToolbar } from "./mobile-coloring-toolbar";
import { ColoringResetDialog } from "./coloring-reset-dialog";

const colors = ["#EF4444", "#F97316", "#FACC15", "#22C55E", "#14B8A6", "#38BDF8", "#2563EB", "#8B5CF6", "#EC4899", "#92400E", "#111827", "#FFFFFF"];

export function RasterColoringStudio({ title, imagePath, en, close }: { title:string; imagePath:string; en:boolean; close:()=>void }) {
  useViewportLock();
  const canvas = useRef<HTMLCanvasElement>(null);
  const original = useRef<ImageData | null>(null);
  const [color, setColor] = useState(colors[0]);
  const [eraser, setEraser] = useState(false);
  const [undo, setUndo] = useState<ImageData[]>([]);
  const [redo, setRedo] = useState<ImageData[]>([]);
  const undoHistory = useRef<ImageData[]>([]);
  const redoHistory = useRef<ImageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [confirmingReset, setConfirmingReset] = useState(false);

  useEffect(() => {
    const image = new Image();
    image.onload = () => {
      const target = canvas.current;
      if (!target) return;
      const scale = Math.min(1, 900 / Math.max(image.naturalWidth, image.naturalHeight));
      target.width = Math.round(image.naturalWidth * scale);
      target.height = Math.round(image.naturalHeight * scale);
      const context = target.getContext("2d", { willReadFrequently:true });
      if (!context) return;
      context.fillStyle = "#fff";
      context.fillRect(0, 0, target.width, target.height);
      context.drawImage(image, 0, 0, target.width, target.height);
      original.current = context.getImageData(0, 0, target.width, target.height);
      setLoading(false);
    };
    image.onerror = () => setMessage(en ? "The image could not be loaded." : "Impossible de charger l’image.");
    image.src = `/media/${imagePath}`;
  }, [imagePath, en]);

  function paint(event: React.PointerEvent<HTMLCanvasElement>) {
    const target = canvas.current, context = target?.getContext("2d", { willReadFrequently:true });
    if (!target || !context || loading) return;
    const rect = target.getBoundingClientRect(), x = Math.floor((event.clientX - rect.left) * target.width / rect.width), y = Math.floor((event.clientY - rect.top) * target.height / rect.height), before = context.getImageData(0, 0, target.width, target.height), data = new Uint8ClampedArray(before.data), start = (y * target.width + x) * 4, targetColor = [data[start], data[start + 1], data[start + 2], data[start + 3]], replacement = hex(eraser ? "#FFFFFF" : color);
    if (targetColor[0] < 45 && targetColor[1] < 45 && targetColor[2] < 45) { setMessage(en ? "Tap inside a closed white area." : "Touchez l’intérieur d’une zone claire et fermée."); return; }
    if (distance(targetColor, replacement) < 18) return;
    const stack = [x, y], seen = new Uint8Array(target.width * target.height), tolerance = 42;
    let painted = 0;
    while (stack.length && painted < target.width * target.height) { const cy = stack.pop()!, cx = stack.pop()!; if (cx < 0 || cy < 0 || cx >= target.width || cy >= target.height) continue; const position = cy * target.width + cx; if (seen[position]) continue; seen[position] = 1; const i = position * 4, current = [data[i], data[i + 1], data[i + 2], data[i + 3]]; if (distance(current, targetColor) > tolerance) continue; data[i] = replacement[0]; data[i + 1] = replacement[1]; data[i + 2] = replacement[2]; data[i + 3] = 255; painted++; stack.push(cx + 1, cy, cx - 1, cy, cx, cy + 1, cx, cy - 1); }
    if (painted < 18) { setMessage(en ? "This area is too small or not fully closed." : "Cette zone est trop petite ou n’est pas complètement fermée."); return; }
    context.putImageData(new ImageData(data, target.width, target.height), 0, 0);
    updateHistory([...undoHistory.current.slice(-11), before], []);
    setMessage("");
  }
  function updateHistory(nextUndo: ImageData[], nextRedo: ImageData[]) {
    undoHistory.current = nextUndo;
    redoHistory.current = nextRedo;
    setUndo(nextUndo);
    setRedo(nextRedo);
  }
  function undoOne() {
    const target = canvas.current;
    const context = target?.getContext("2d", { willReadFrequently:true });
    const snapshot = undoHistory.current.at(-1);
    if (!target || !context || !snapshot) return;
    const current = context.getImageData(0, 0, target.width, target.height);
    context.putImageData(snapshot, 0, 0);
    updateHistory(undoHistory.current.slice(0, -1), [...redoHistory.current.slice(-11), current]);
  }
  function redoOne() {
    const target = canvas.current;
    const context = target?.getContext("2d", { willReadFrequently:true });
    const snapshot = redoHistory.current.at(-1);
    if (!target || !context || !snapshot) return;
    const current = context.getImageData(0, 0, target.width, target.height);
    context.putImageData(snapshot, 0, 0);
    updateHistory([...undoHistory.current.slice(-11), current], redoHistory.current.slice(0, -1));
  }
  function reset() { setConfirmingReset(true); }
  function confirmReset() { const target = canvas.current, context = target?.getContext("2d"); if (!target || !context || !original.current) return; context.putImageData(original.current, 0, 0); updateHistory([], []); setMessage(""); setConfirmingReset(false); }

  return <div className="fixed inset-0 z-[130] flex h-[100dvh] w-screen max-w-full flex-col overflow-hidden bg-[#f7f4ed] dark:bg-[#0d1218]">
    <header className="z-20 flex h-14 shrink-0 items-center justify-between border-b bg-background/95 px-3 backdrop-blur dark:border-white/10 lg:h-auto lg:px-4 lg:py-3"><div className="min-w-0"><p className="text-[9px] font-black uppercase tracking-widest text-primary lg:text-[10px]">{en ? "Magic colouring" : "Coloriage magique"}</p><h1 className="truncate font-display text-base font-black lg:text-xl">{title}</h1></div><button onClick={close} aria-label={en ? "Close" : "Fermer"} className="grid size-10 shrink-0 place-items-center rounded-xl border dark:border-white/10 lg:size-11"><X/></button></header>
    <main className="mx-auto grid min-h-0 w-full max-w-7xl flex-1 p-2 pb-[6.75rem] lg:grid-cols-[250px_1fr] lg:gap-5 lg:p-4">
      <aside className="hidden space-y-4 lg:block"><section className="rounded-[1.5rem] border bg-card p-4 dark:border-white/10"><p className="text-sm font-black">{en ? "Choose a colour" : "Choisis une couleur"}</p><div className="mt-3 grid grid-cols-4 gap-2">{colors.map(value => <button key={value} onClick={() => { setColor(value); setEraser(false); }} aria-label={value} className={`aspect-square rounded-xl border-2 transition hover:scale-110 ${!eraser && color === value ? "scale-110 border-slate-950 ring-4 ring-primary/30 dark:border-white" : "border-white/70 dark:border-white/15"}`} style={{ backgroundColor:value }}/>)}</div><button onClick={() => setEraser(true)} className={`mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border text-sm font-black ${eraser ? "bg-primary/15 text-primary" : "dark:border-white/10"}`}><Eraser size={17}/>{en ? "White eraser" : "Gomme blanche"}</button></section><section className="grid grid-cols-2 gap-2 rounded-[1.5rem] border bg-card p-3 dark:border-white/10"><button disabled={!undo.length} onClick={undoOne} className={action}><Undo2 size={17}/>{en ? "Undo" : "Annuler"}</button><button disabled={!redo.length} onClick={redoOne} className={action}><Redo2 size={17}/>{en ? "Redo" : "Rétablir"}</button><button onClick={reset} className={`${action} col-span-2`}><RotateCcw size={17}/>{en ? "Start again" : "Recommencer"}</button></section><ExportColoringButtons title={title} en={en} getCanvas={() => canvas.current}/></aside>
      <section className="relative min-h-0 min-w-0 overflow-hidden">{message && <p className="absolute inset-x-2 top-2 z-10 rounded-xl bg-amber-100/95 p-2 text-center text-xs font-bold text-amber-900 shadow dark:bg-amber-950/95 dark:text-amber-200 lg:relative lg:inset-auto lg:mb-3 lg:p-3 lg:text-sm">{message}</p>}<div className="grid size-full min-h-0 min-w-0 place-items-center overflow-hidden rounded-xl border bg-white p-1 shadow-lg dark:border-white/10 lg:min-h-[60vh] lg:rounded-[2rem] lg:p-2 lg:shadow-xl">{loading && <LoaderCircle className="absolute animate-spin text-primary"/>}<canvas ref={canvas} onPointerDown={paint} className="block size-full min-h-0 min-w-0 cursor-crosshair touch-none object-contain"/></div></section>
    </main>
    <MobileColoringToolbar colors={colors} color={color} eraser={eraser} undoDisabled={!undo.length} redoDisabled={!redo.length} en={en} title={title} setColor={setColor} setEraser={setEraser} undo={undoOne} redo={redoOne} reset={reset} getCanvas={() => canvas.current}/>
    {confirmingReset && <ColoringResetDialog en={en} cancel={() => setConfirmingReset(false)} confirm={confirmReset}/>}
  </div>;
}

const action = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border text-xs font-black disabled:opacity-35 dark:border-white/10";
function hex(value: string) { return [value.slice(1, 3), value.slice(3, 5), value.slice(5, 7), "FF"].map(part => parseInt(part, 16)); }
function distance(first: number[], second: number[]) { return Math.sqrt((first[0] - second[0]) ** 2 + (first[1] - second[1]) ** 2 + (first[2] - second[2]) ** 2); }
