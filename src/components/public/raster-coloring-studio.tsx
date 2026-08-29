"use client";

import { useEffect, useRef, useState } from "react";
import { Eraser, LoaderCircle, Redo2, RotateCcw, Undo2, X } from "lucide-react";
import { useViewportLock } from "@/hooks/use-viewport-lock";
import { ExportColoringButtons } from "./export-coloring-buttons";
import { MobileColoringToolbar } from "./mobile-coloring-toolbar";
import { ColoringResetDialog } from "./coloring-reset-dialog";
import { buildColoringRegionMap, findColoringRegion, type ColoringRegionMap } from "@/lib/client/raster-coloring-engine";

const colors = ["#EF4444", "#F97316", "#FACC15", "#22C55E", "#14B8A6", "#38BDF8", "#2563EB", "#8B5CF6", "#EC4899", "#92400E", "#111827", "#FFFFFF"];
type PaintAction = { region: number; before: string | null; after: string | null };

export function RasterColoringStudio({ title, imagePath, en, close }: { title:string; imagePath:string; en:boolean; close:()=>void }) {
  useViewportLock();
  const canvas = useRef<HTMLCanvasElement>(null);
  const original = useRef<ImageData | null>(null);
  const regionMap = useRef<ColoringRegionMap | null>(null);
  const regionColors = useRef(new Map<number, string>());
  const [color, setColor] = useState(colors[0]);
  const [eraser, setEraser] = useState(false);
  const [undo, setUndo] = useState<PaintAction[]>([]);
  const [redo, setRedo] = useState<PaintAction[]>([]);
  const undoHistory = useRef<PaintAction[]>([]);
  const redoHistory = useRef<PaintAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [confirmingReset, setConfirmingReset] = useState(false);

  useEffect(() => {
    const image = new Image();
    image.onload = () => {
      const target = canvas.current;
      if (!target) return;
      const preferredResolution = Math.min(1400, Math.max(900, Math.round(window.innerWidth * Math.min(window.devicePixelRatio || 1, 2))));
      const scale = Math.min(1, preferredResolution / Math.max(image.naturalWidth, image.naturalHeight));
      target.width = Math.round(image.naturalWidth * scale);
      target.height = Math.round(image.naturalHeight * scale);
      const context = target.getContext("2d", { willReadFrequently:true });
      if (!context) return;
      context.fillStyle = "#fff";
      context.fillRect(0, 0, target.width, target.height);
      context.drawImage(image, 0, 0, target.width, target.height);
      original.current = context.getImageData(0, 0, target.width, target.height);
      regionMap.current = buildColoringRegionMap(original.current.data, target.width, target.height);
      regionColors.current.clear();
      updateHistory([], []);
      setLoading(false);
    };
    image.onerror = () => setMessage(en ? "The image could not be loaded." : "Impossible de charger l’image.");
    image.src = `/media/${imagePath}`;
  }, [imagePath, en]);

  function paint(event: React.PointerEvent<HTMLCanvasElement>) {
    const target = canvas.current, context = target?.getContext("2d", { willReadFrequently:true });
    if (!target || !context || loading) return;
    const map = regionMap.current;
    if (!map) return;
    event.preventDefault();
    const point = pointerToCanvas(target, event.clientX, event.clientY);
    if (!point) return;
    const { x, y, displayedWidth } = point;
    const searchRadius = Math.ceil(4 * target.width / displayedWidth);
    const region = findColoringRegion(map, x, y, searchRadius);
    if (!region) { setMessage(en ? "Tap inside a closed light area." : "Touchez l’intérieur d’une zone claire et fermée."); return; }
    const before = regionColors.current.get(region) ?? null;
    const after = eraser ? null : color;
    if (before === after) return;
    drawRegion(region, after);
    updateHistory([...undoHistory.current.slice(-49), { region, before, after }], []);
    setMessage("");
  }
  function drawRegion(regionId: number, value: string | null) {
    const target = canvas.current;
    const context = target?.getContext("2d", { willReadFrequently:true });
    const source = original.current;
    const map = regionMap.current;
    const region = map?.regions[regionId];
    if (!target || !context || !source || !map || !region) return;
    const width = region.maxX - region.minX + 1;
    const height = region.maxY - region.minY + 1;
    const patch = context.getImageData(region.minX, region.minY, width, height);
    const replacement = value ? hex(value) : null;
    for (let localY = 0; localY < height; localY++) {
      for (let localX = 0; localX < width; localX++) {
        const globalPosition = (region.minY + localY) * map.width + region.minX + localX;
        if (map.labels[globalPosition] !== regionId) continue;
        const localOffset = (localY * width + localX) * 4;
        const globalOffset = globalPosition * 4;
        patch.data[localOffset] = replacement?.[0] ?? source.data[globalOffset];
        patch.data[localOffset + 1] = replacement?.[1] ?? source.data[globalOffset + 1];
        patch.data[localOffset + 2] = replacement?.[2] ?? source.data[globalOffset + 2];
        patch.data[localOffset + 3] = source.data[globalOffset + 3];
      }
    }
    context.putImageData(patch, region.minX, region.minY);
    if (value) regionColors.current.set(regionId, value); else regionColors.current.delete(regionId);
  }
  function updateHistory(nextUndo: PaintAction[], nextRedo: PaintAction[]) {
    undoHistory.current = nextUndo;
    redoHistory.current = nextRedo;
    setUndo(nextUndo);
    setRedo(nextRedo);
  }
  function undoOne() {
    const action = undoHistory.current.at(-1);
    if (!action) return;
    drawRegion(action.region, action.before);
    updateHistory(undoHistory.current.slice(0, -1), [...redoHistory.current.slice(-49), action]);
  }
  function redoOne() {
    const action = redoHistory.current.at(-1);
    if (!action) return;
    drawRegion(action.region, action.after);
    updateHistory([...undoHistory.current.slice(-49), action], redoHistory.current.slice(0, -1));
  }
  function reset() { setConfirmingReset(true); }
  function confirmReset() { const target = canvas.current, context = target?.getContext("2d"); if (!target || !context || !original.current) return; context.putImageData(original.current, 0, 0); regionColors.current.clear(); updateHistory([], []); setMessage(""); setConfirmingReset(false); }

  return <div className="fixed inset-0 z-[130] flex h-[100dvh] w-screen max-w-full flex-col overflow-hidden bg-[#f7f4ed] dark:bg-[#0d1218]">
    <header className="z-20 flex h-14 shrink-0 items-center justify-between border-b bg-background/95 px-3 backdrop-blur dark:border-white/10 lg:h-auto lg:px-4 lg:py-3"><div className="min-w-0"><p className="text-[9px] font-black uppercase tracking-widest text-primary lg:text-[10px]">{en ? "Magic colouring" : "Coloriage magique"}</p><h1 className="truncate font-display text-base font-black lg:text-xl">{title}</h1></div><button onClick={close} aria-label={en ? "Close" : "Fermer"} className="grid size-10 shrink-0 place-items-center rounded-xl border dark:border-white/10 lg:size-11"><X/></button></header>
    <main className="mx-auto grid min-h-0 w-full max-w-7xl flex-1 p-2 pb-[6.75rem] lg:grid-cols-[250px_1fr] lg:gap-5 lg:p-4">
      <aside className="hidden space-y-4 lg:block"><section className="rounded-[1.5rem] border bg-card p-4 dark:border-white/10"><p className="text-sm font-black">{en ? "Choose a colour" : "Choisis une couleur"}</p><div className="mt-3 grid grid-cols-4 gap-2">{colors.map(value => <button key={value} onClick={() => { setColor(value); setEraser(false); }} aria-label={value} className={`aspect-square rounded-xl border-2 transition hover:scale-110 ${!eraser && color === value ? "scale-110 border-slate-950 ring-4 ring-primary/30 dark:border-white" : "border-white/70 dark:border-white/15"}`} style={{ backgroundColor:value }}/>)}</div><button onClick={() => setEraser(true)} className={`mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border text-sm font-black ${eraser ? "bg-primary/15 text-primary" : "dark:border-white/10"}`}><Eraser size={17}/>{en ? "White eraser" : "Gomme blanche"}</button></section><section className="grid grid-cols-2 gap-2 rounded-[1.5rem] border bg-card p-3 dark:border-white/10"><button disabled={!undo.length} onClick={undoOne} className={action}><Undo2 size={17}/>{en ? "Undo" : "Annuler"}</button><button disabled={!redo.length} onClick={redoOne} className={action}><Redo2 size={17}/>{en ? "Redo" : "Rétablir"}</button><button onClick={reset} className={`${action} col-span-2`}><RotateCcw size={17}/>{en ? "Start again" : "Recommencer"}</button></section><ExportColoringButtons title={title} en={en} getCanvas={() => canvas.current}/></aside>
      <section className="relative min-h-0 min-w-0 overflow-hidden">{message && <p className="absolute inset-x-2 top-2 z-10 rounded-xl bg-amber-100/95 p-2 text-center text-xs font-bold text-amber-900 shadow dark:bg-amber-950/95 dark:text-amber-200 lg:relative lg:inset-auto lg:mb-3 lg:p-3 lg:text-sm">{message}</p>}<div className="relative size-full min-h-0 min-w-0 overflow-hidden rounded-xl border bg-white p-1 shadow-lg dark:border-white/10 lg:min-h-[60vh] lg:rounded-[2rem] lg:p-2 lg:shadow-xl">{loading && <LoaderCircle className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 animate-spin text-primary"/>}<canvas ref={canvas} onPointerDown={paint} className="absolute left-1/2 top-1/2 block h-auto w-auto max-h-[calc(100%-0.5rem)] max-w-[calc(100%-0.5rem)] -translate-x-1/2 -translate-y-1/2 cursor-crosshair touch-none select-none lg:max-h-[calc(100%-1rem)] lg:max-w-[calc(100%-1rem)]"/></div></section>
    </main>
    <MobileColoringToolbar colors={colors} color={color} eraser={eraser} undoDisabled={!undo.length} redoDisabled={!redo.length} en={en} title={title} setColor={setColor} setEraser={setEraser} undo={undoOne} redo={redoOne} reset={reset} getCanvas={() => canvas.current}/>
    {confirmingReset && <ColoringResetDialog en={en} cancel={() => setConfirmingReset(false)} confirm={confirmReset}/>}
  </div>;
}

const action = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border text-xs font-black disabled:opacity-35 dark:border-white/10";
function hex(value: string) { return [value.slice(1, 3), value.slice(3, 5), value.slice(5, 7), "FF"].map(part => parseInt(part, 16)); }
function pointerToCanvas(target: HTMLCanvasElement, clientX: number, clientY: number) {
  const rect = target.getBoundingClientRect();
  if (!rect.width || !rect.height) return null;
  const canvasRatio = target.width / target.height;
  const boxRatio = rect.width / rect.height;
  const displayedWidth = boxRatio > canvasRatio ? rect.height * canvasRatio : rect.width;
  const displayedHeight = boxRatio > canvasRatio ? rect.height : rect.width / canvasRatio;
  const offsetX = (rect.width - displayedWidth) / 2;
  const offsetY = (rect.height - displayedHeight) / 2;
  const localX = clientX - rect.left - offsetX;
  const localY = clientY - rect.top - offsetY;
  if (localX < 0 || localY < 0 || localX >= displayedWidth || localY >= displayedHeight) return null;
  return {
    x: Math.max(0, Math.min(target.width - 1, Math.floor(localX * target.width / displayedWidth))),
    y: Math.max(0, Math.min(target.height - 1, Math.floor(localY * target.height / displayedHeight))),
    displayedWidth,
  };
}
