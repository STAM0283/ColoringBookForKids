"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { Eraser, Expand, ImageIcon, LoaderCircle, Maximize2, Minus, Plus, Redo2, RotateCcw, Undo2, X } from "lucide-react";
import { useViewportLock } from "@/hooks/use-viewport-lock";
import { ExportColoringButtons } from "./export-coloring-buttons";
import { MobileColoringToolbar } from "./mobile-coloring-toolbar";
import { ColoringResetDialog } from "./coloring-reset-dialog";
import { buildColoringRegionMap, findColoringRegion, type ColoringRegionMap } from "@/lib/client/raster-coloring-engine";
import { COLORING_COLORS } from "@/lib/coloring-palette";

const colors = [...COLORING_COLORS];
const desktopColors=colors.filter(value=>value!=="#FFFFFF");
type PaintAction = { region: number; before: string | null; after: string | null };
type Point = { x: number; y: number };
type Pinch = { distance: number; midpoint: Point; zoom: number; pan: Point };

export function RasterColoringStudio({ title, imagePath, modelPath=null, en, close }: { title:string; imagePath:string; modelPath?:string|null; en:boolean; close:()=>void }) {
  useViewportLock();
  const canvas = useRef<HTMLCanvasElement>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const original = useRef<ImageData | null>(null);
  const regionMap = useRef<ColoringRegionMap | null>(null);
  const regionColors = useRef(new Map<number, string>());
  const [color, setColor] = useState<string>(colors[0]);
  const [eraser, setEraser] = useState(false);
  const [undo, setUndo] = useState<PaintAction[]>([]);
  const [redo, setRedo] = useState<PaintAction[]>([]);
  const undoHistory = useRef<PaintAction[]>([]);
  const redoHistory = useRef<PaintAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [modelOpen, setModelOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<Point>({ x: 0, y: 0 });
  const zoomRef = useRef(1);
  const panRef = useRef<Point>({ x: 0, y: 0 });
  const pointers = useRef(new Map<number, Point>());
  const pinch = useRef<Pinch | null>(null);
  const touchStart = useRef<{ point: Point; pan: Point; moved: boolean; multi: boolean } | null>(null);
  const lastTap = useRef<{ at: number; point: Point } | null>(null);
  const [touchTarget, setTouchTarget] = useState<Point | null>(null);

  const setView = useCallback((nextZoom: number, nextPan: Point) => {
    const safeZoom = Math.max(1, Math.min(5, nextZoom));
    const safePan = clampPan(nextPan, safeZoom, viewport.current);
    zoomRef.current = safeZoom;
    panRef.current = safePan;
    setZoom(safeZoom);
    setPan(safePan);
  }, []);

  const fitDrawing = useCallback(() => setView(1, { x: 0, y: 0 }), [setView]);

  useEffect(()=>{if(!modelOpen)return;const escape=(event:KeyboardEvent)=>{if(event.key==="Escape")setModelOpen(false)};window.addEventListener("keydown",escape);return()=>window.removeEventListener("keydown",escape)},[modelOpen]);

  useEffect(() => {
    setLoading(true);
    const image = new window.Image();
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
      fitDrawing();
      setLoading(false);
    };
    image.onerror = () => setMessage(en ? "The image could not be loaded." : "Impossible de charger l’image.");
    image.src = `/media/${imagePath}`;
  }, [imagePath, en, fitDrawing]);

  function paintAt(clientX: number, clientY: number, vibrate = false) {
    const target = canvas.current, context = target?.getContext("2d", { willReadFrequently:true });
    if (!target || !context || loading) return;
    const map = regionMap.current;
    if (!map) return;
    const point = pointerToCanvas(target, clientX, clientY);
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
    if (vibrate && "vibrate" in navigator) navigator.vibrate(12);
  }

  function zoomAt(nextZoom: number, clientPoint?: Point) {
    const frame = viewport.current?.getBoundingClientRect();
    const currentZoom = zoomRef.current;
    if (!frame || !clientPoint) return setView(nextZoom, panRef.current);
    const center = { x: frame.left + frame.width / 2, y: frame.top + frame.height / 2 };
    const ratio = Math.max(1, Math.min(5, nextZoom)) / currentZoom;
    setView(nextZoom, {
      x: clientPoint.x - center.x - (clientPoint.x - center.x - panRef.current.x) * ratio,
      y: clientPoint.y - center.y - (clientPoint.y - center.y - panRef.current.y) * ratio,
    });
  }

  function onPointerDown(event: React.PointerEvent<HTMLCanvasElement>) {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    const point = { x: event.clientX, y: event.clientY };
    pointers.current.set(event.pointerId, point);
    if (event.pointerType === "mouse" || event.pointerType === "pen") return paintAt(event.clientX, event.clientY);
    setTouchTarget(relativePoint(point, viewport.current));
    if (pointers.current.size === 1) touchStart.current = { point, pan: panRef.current, moved: false, multi: false };
    if (pointers.current.size === 2) {
      const [first, second] = [...pointers.current.values()];
      const midpoint = middle(first, second);
      pinch.current = { distance: distance(first, second), midpoint, zoom: zoomRef.current, pan: panRef.current };
      if (touchStart.current) touchStart.current.multi = true;
    }
  }

  function onPointerMove(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!pointers.current.has(event.pointerId)) return;
    event.preventDefault();
    const point = { x: event.clientX, y: event.clientY };
    pointers.current.set(event.pointerId, point);
    if (touchStart.current && distance(touchStart.current.point, point) > 8) {
      touchStart.current.moved = true;
      setTouchTarget(null);
    }
    if (pointers.current.size === 1 && touchStart.current?.moved && !touchStart.current.multi) {
      setView(zoomRef.current, {
        x: touchStart.current.pan.x + point.x - touchStart.current.point.x,
        y: touchStart.current.pan.y + point.y - touchStart.current.point.y,
      });
      return;
    }
    if (pointers.current.size < 2 || !pinch.current) return;
    const [first, second] = [...pointers.current.values()];
    const midpoint = middle(first, second);
    const nextZoom = pinch.current.zoom * distance(first, second) / Math.max(1, pinch.current.distance);
    const scaleChange = Math.max(1, Math.min(5, nextZoom)) / pinch.current.zoom;
    const frame = viewport.current?.getBoundingClientRect();
    if (!frame) return;
    const center = { x:frame.left + frame.width / 2, y:frame.top + frame.height / 2 };
    setView(nextZoom, {
      x: midpoint.x - center.x - (pinch.current.midpoint.x - center.x - pinch.current.pan.x) * scaleChange,
      y: midpoint.y - center.y - (pinch.current.midpoint.y - center.y - pinch.current.pan.y) * scaleChange,
    });
  }

  function onPointerUp(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!pointers.current.has(event.pointerId)) return;
    event.preventDefault();
    const start = touchStart.current;
    pointers.current.delete(event.pointerId);
    setTouchTarget(null);
    if (pointers.current.size < 2) pinch.current = null;
    if (start?.multi && pointers.current.size === 1) {
      const remaining = [...pointers.current.values()][0];
      touchStart.current = { point: remaining, pan: panRef.current, moved: true, multi: false };
      return;
    }
    if (event.pointerType === "mouse" || event.pointerType === "pen" || !start || start.multi || start.moved) {
      if (!pointers.current.size) touchStart.current = null;
      return;
    }
    const point = { x: event.clientX, y: event.clientY };
    const previous = lastTap.current;
    if (previous && performance.now() - previous.at < 330 && distance(previous.point, point) < 32) {
      zoomAt(zoomRef.current > 1 ? 1 : 2.25, point);
      lastTap.current = null;
    } else {
      paintAt(point.x, point.y, true);
      lastTap.current = { at: performance.now(), point };
    }
    touchStart.current = null;
  }

  function onPointerCancel(event: React.PointerEvent<HTMLCanvasElement>) {
    pointers.current.delete(event.pointerId);
    if (!pointers.current.size) { pinch.current = null; touchStart.current = null; setTouchTarget(null); }
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

  return <div className="fixed inset-0 z-[130] flex h-[100svh] w-screen max-w-full flex-col overflow-hidden bg-[#f7f4ed] dark:bg-[#0d1218] lg:h-[100dvh]">
    <header className="z-20 flex h-14 shrink-0 items-center justify-between border-b bg-background/95 px-3 backdrop-blur dark:border-white/10 lg:h-auto lg:px-4 lg:py-3"><div className="min-w-0"><p className="text-[9px] font-black uppercase tracking-widest text-primary lg:text-[10px]">{en ? "Magic colouring" : "Coloriage magique"}</p><h1 className="truncate font-display text-base font-black lg:text-xl">{title}</h1></div><button onClick={close} aria-label={en ? "Close" : "Fermer"} className="no-auto-tooltip group relative grid size-10 shrink-0 place-items-center rounded-xl border transition hover:border-red-300 hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-500/15 dark:border-white/10 dark:hover:border-red-400/30 dark:hover:bg-red-500/10 dark:hover:text-red-300 lg:size-11"><X/><span role="tooltip" className="pointer-events-none absolute right-[calc(100%+.65rem)] top-1/2 z-50 -translate-y-1/2 translate-x-1 whitespace-nowrap rounded-lg bg-slate-950 px-3 py-2 text-[11px] font-bold text-white opacity-0 shadow-xl transition duration-150 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100 dark:bg-white dark:text-slate-950">{en?"Close":"Fermer"}</span></button></header>
    <main className="mx-auto grid min-h-0 w-full max-w-[96rem] flex-1 p-2 pb-[6.75rem] lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-5 lg:p-4 xl:grid-cols-[340px_minmax(0,1fr)]">
      <aside className="hidden min-h-0 space-y-3 overflow-y-auto overscroll-contain pr-1 lg:block"><section className="rounded-[1.35rem] border bg-card p-3.5 shadow-sm dark:border-white/10"><p className="text-base font-black">{en ? "Choose a colour" : "Choisis une couleur"}</p><div className="mt-2.5 grid grid-cols-6 gap-2">{desktopColors.map(value => <button key={value} onClick={() => { setColor(value); setEraser(false); }} aria-label={value} className={`aspect-square rounded-xl border-2 shadow-sm transition hover:z-10 hover:scale-110 hover:shadow-md ${!eraser && color === value ? "z-10 scale-110 border-slate-950 ring-4 ring-primary/30 dark:border-white" : "border-white/70 dark:border-white/15"}`} style={{ backgroundColor:value }}/>)}</div><div aria-label={en?"Drawing tools":"Outils du dessin"} className="mt-3 grid grid-cols-6 gap-2 border-t border-foreground/10 pt-3 dark:border-white/10"><ToolbarAction label={en?"Eraser":"Gomme"} action={()=>setEraser(true)} tone="eraser" pressed={eraser}><Eraser size={22} strokeWidth={2.3}/></ToolbarAction><ToolbarAction label={en?"Undo":"Annuler"} disabled={!undo.length} action={undoOne} tone="red"><Undo2 size={22} strokeWidth={2.3}/></ToolbarAction><ToolbarAction label={en?"Redo":"Rétablir"} disabled={!redo.length} action={redoOne} tone="blue"><Redo2 size={22} strokeWidth={2.3}/></ToolbarAction><ToolbarAction label={en?"Start again":"Recommencer"} action={reset} tone="amber"><RotateCcw size={22} strokeWidth={2.3}/></ToolbarAction><ExportColoringButtons iconOnly title={title} en={en} getCanvas={()=>canvas.current}/></div></section>{modelPath&&<button type="button" onClick={()=>setModelOpen(true)} className="group w-full overflow-hidden rounded-[1.35rem] border bg-card p-2.5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-500/35 hover:shadow-lg dark:border-white/10"><span className="mb-1.5 flex items-center justify-between gap-2 px-1"><span className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wide text-emerald-700 dark:text-emerald-300"><ImageIcon size={17}/>{en?"Colour model":"Modèle couleur"}</span><Expand size={17} className="text-foreground/40 transition group-hover:scale-110 group-hover:text-emerald-600"/></span><span className="relative block h-40 overflow-hidden rounded-xl bg-slate-50 dark:bg-slate-950/60 xl:h-48"><Image src={`/media/${modelPath}`} alt={en?"Colour model":"Modèle en couleur"} fill sizes="320px" className="object-contain p-1 transition duration-300 group-hover:scale-[1.03]"/></span></button>}</aside>
      <section className="relative min-h-0 min-w-0 overflow-hidden">{message && <p className="absolute inset-x-2 top-2 z-30 rounded-xl bg-amber-100/95 p-2 text-center text-xs font-bold text-amber-900 shadow dark:bg-amber-950/95 dark:text-amber-200 lg:relative lg:inset-auto lg:mb-3 lg:p-3 lg:text-sm">{message}</p>}<div ref={viewport} className="relative size-full min-h-0 min-w-0 overflow-hidden rounded-xl border bg-white p-1 shadow-lg dark:border-white/10 lg:min-h-[60vh] lg:rounded-[2rem] lg:p-2 lg:shadow-xl">
{loading && <div className="absolute inset-0 z-20 grid place-items-center bg-[radial-gradient(circle_at_50%_42%,hsl(var(--primary)/.12),transparent_38%),linear-gradient(135deg,#f3efe7,#e9f4ef)] dark:bg-[radial-gradient(circle_at_50%_42%,hsl(var(--primary)/.18),transparent_38%),linear-gradient(135deg,#111923,#0d1218)]">
  <div className="text-center text-foreground/70">
    <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-card/85 shadow-lg ring-1 ring-border/70 backdrop-blur"><LoaderCircle className="animate-spin text-primary"/></span>
    <p className="mt-4 text-sm font-black">{en ? "Preparing your drawing…" : "Préparation de ton dessin…"}</p>
  </div>
</div>}
<div className="absolute inset-0 overflow-hidden will-change-transform" style={{ transform:`translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})`, transformOrigin:"center" }}><canvas ref={canvas} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerCancel} onLostPointerCapture={onPointerCancel} className={`absolute inset-0 block h-full w-full cursor-crosshair touch-none select-none object-contain transition-opacity duration-150 ${loading ? "opacity-0" : "opacity-100"}`}/></div>{touchTarget && <span aria-hidden className="pointer-events-none absolute z-20 size-9 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary bg-primary/10 shadow-[0_0_0_4px_rgb(255_255_255/.8)]" style={{ left:touchTarget.x, top:touchTarget.y }}/>}<div className="absolute bottom-2 right-2 z-30 flex gap-1 rounded-xl border bg-card/95 p-1 shadow-lg backdrop-blur lg:hidden"><button type="button" onClick={() => zoomAt(zoomRef.current - .5)} disabled={zoom <= 1} className="mobile-coloring-zoom" aria-label={en ? "Zoom out" : "Dézoomer"}><Minus size={18}/></button><button type="button" onClick={fitDrawing} className="mobile-coloring-zoom" aria-label={en ? "Fit drawing" : "Ajuster le dessin"}><Maximize2 size={17}/></button><button type="button" onClick={() => zoomAt(zoomRef.current + .5)} disabled={zoom >= 5} className="mobile-coloring-zoom" aria-label={en ? "Zoom in" : "Zoomer"}><Plus size={18}/></button></div></div></section>
    </main>
    <MobileColoringToolbar colors={colors} color={color} eraser={eraser} undoDisabled={!undo.length} redoDisabled={!redo.length} en={en} title={title} setColor={setColor} setEraser={setEraser} undo={undoOne} redo={redoOne} reset={reset} hasModel={Boolean(modelPath)} openModel={()=>setModelOpen(true)} getCanvas={() => canvas.current}/>
    {modelOpen && modelPath && (
      <ColorModelDialog path={modelPath} title={title} en={en} close={() => setModelOpen(false)} />
    )}
    {confirmingReset && <ColoringResetDialog en={en} cancel={() => setConfirmingReset(false)} confirm={confirmReset}/>}
  </div>;
}

function ColorModelDialog({path,title,en,close}:{path:string;title:string;en:boolean;close:()=>void}){return <div role="dialog" aria-modal="true" aria-label={en?`Colour model for ${title}`:`Modèle couleur de ${title}`} onMouseDown={close} className="fixed inset-0 z-[220] grid place-items-center bg-slate-950/80 p-3 backdrop-blur-md sm:p-6"><div onMouseDown={event=>event.stopPropagation()} className="relative flex max-h-[90dvh] w-full max-w-3xl flex-col overflow-hidden rounded-[1.75rem] border border-white/15 bg-white shadow-2xl dark:bg-slate-900 sm:rounded-[2rem]"><header className="flex shrink-0 items-center justify-between gap-3 border-b px-4 py-3 dark:border-white/10 sm:px-5"><div className="min-w-0"><p className="text-[10px] font-black uppercase tracking-[.16em] text-emerald-700 dark:text-emerald-300">{en?"Colour model":"Modèle couleur"}</p><h2 className="truncate text-base font-black text-slate-900 dark:text-white sm:text-lg">{title}</h2></div><button type="button" autoFocus onClick={close} aria-label={en?"Close model":"Fermer le modèle"} className="grid size-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-700 transition hover:scale-105 hover:bg-slate-200 dark:bg-white/10 dark:text-white dark:hover:bg-white/15"><X size={20}/></button></header><div className="relative min-h-0 flex-1 bg-[radial-gradient(circle_at_center,#f8fafc,#eef2f7)] dark:bg-[radial-gradient(circle_at_center,#1e293b,#0f172a)]"><div className="relative mx-auto h-[min(72dvh,760px)] w-full"><Image src={`/media/${path}`} alt={en?`Colour model for ${title}`:`Modèle couleur de ${title}`} fill priority sizes="(max-width:768px) 96vw,768px" className="object-contain p-3 sm:p-5"/></div></div></div></div>}

function ToolbarAction({label,disabled=false,action:run,tone="default",pressed,children}:{label:string;disabled?:boolean;action:()=>void;tone?:"default"|"amber"|"red"|"blue"|"eraser";pressed?:boolean;children:React.ReactNode}){const tones={default:"bg-foreground/[.06] text-foreground/70 hover:bg-primary/15 hover:text-primary focus-visible:ring-primary/20 dark:bg-white/[.08]",amber:"bg-amber-500/15 text-amber-700 hover:bg-amber-500/25 focus-visible:ring-amber-500/25 dark:bg-amber-400/15 dark:text-amber-300",red:"bg-red-500/15 text-red-700 hover:bg-red-500/25 focus-visible:ring-red-500/25 dark:bg-red-400/15 dark:text-red-300",blue:"bg-blue-500/15 text-blue-700 hover:bg-blue-500/25 focus-visible:ring-blue-500/25 dark:bg-blue-400/15 dark:text-blue-300",eraser:pressed?"bg-emerald-600 text-white ring-4 ring-emerald-500/20 focus-visible:ring-emerald-500/30 dark:bg-emerald-500 dark:text-slate-950":"bg-slate-100 text-slate-700 hover:bg-slate-200 focus-visible:ring-slate-400/25 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/15"};return <button type="button" disabled={disabled} onClick={run} aria-label={label} aria-pressed={pressed} className={`no-auto-tooltip group relative grid min-h-12 place-items-center rounded-xl shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-4 active:translate-y-0 disabled:pointer-events-none disabled:opacity-30 ${tones[tone]}`}>{children}<span role="tooltip" className="pointer-events-none absolute bottom-[calc(100%+.5rem)] left-1/2 z-50 -translate-x-1/2 translate-y-1 whitespace-nowrap rounded-lg bg-slate-950 px-2.5 py-1.5 text-[10px] font-bold text-white opacity-0 shadow-xl transition duration-150 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100 dark:bg-white dark:text-slate-950">{label}</span></button>}
function hex(value: string) { return [value.slice(1, 3), value.slice(3, 5), value.slice(5, 7), "FF"].map(part => parseInt(part, 16)); }
function distance(first: Point, second: Point) { return Math.hypot(second.x - first.x, second.y - first.y); }
function middle(first: Point, second: Point) { return { x:(first.x + second.x) / 2, y:(first.y + second.y) / 2 }; }
function relativePoint(point: Point, target: HTMLElement | null) {
  const rect = target?.getBoundingClientRect();
  return rect ? { x:point.x - rect.left, y:point.y - rect.top } : null;
}
function clampPan(point: Point, zoom: number, target: HTMLElement | null) {
  const rect = target?.getBoundingClientRect();
  if (!rect || zoom <= 1) return { x:0, y:0 };
  const limitX = rect.width * (zoom - 1) / 2;
  const limitY = rect.height * (zoom - 1) / 2;
  return {
    x:Math.max(-limitX, Math.min(limitX, point.x)),
    y:Math.max(-limitY, Math.min(limitY, point.y)),
  };
}
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
