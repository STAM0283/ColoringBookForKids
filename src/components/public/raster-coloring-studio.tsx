"use client";

import { useEffect, useRef, useState } from "react";
import { Eraser, LoaderCircle, Maximize2, Minus, Plus, Redo2, RotateCcw, Undo2, X } from "lucide-react";
import { useViewportLock } from "@/hooks/use-viewport-lock";
import { ExportColoringButtons } from "./export-coloring-buttons";
import { MobileColoringToolbar } from "./mobile-coloring-toolbar";
import { ColoringResetDialog } from "./coloring-reset-dialog";
import { buildColoringRegionMap, findColoringRegion, type ColoringRegionMap } from "@/lib/client/raster-coloring-engine";

const colors = ["#EF4444", "#F97316", "#FACC15", "#22C55E", "#14B8A6", "#38BDF8", "#2563EB", "#8B5CF6", "#EC4899", "#92400E", "#111827", "#FFFFFF"];
type PaintAction = { region: number; before: string | null; after: string | null };
type Point = { x: number; y: number };
type Pinch = { distance: number; midpoint: Point; zoom: number; pan: Point };

export function RasterColoringStudio({ title, imagePath, en, close }: { title:string; imagePath:string; en:boolean; close:()=>void }) {
  useViewportLock();
  const canvas = useRef<HTMLCanvasElement>(null);
  const viewport = useRef<HTMLDivElement>(null);
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
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<Point>({ x: 0, y: 0 });
  const zoomRef = useRef(1);
  const panRef = useRef<Point>({ x: 0, y: 0 });
  const pointers = useRef(new Map<number, Point>());
  const pinch = useRef<Pinch | null>(null);
  const touchStart = useRef<{ point: Point; pan: Point; moved: boolean; multi: boolean } | null>(null);
  const lastTap = useRef<{ at: number; point: Point } | null>(null);
  const [touchTarget, setTouchTarget] = useState<Point | null>(null);
  const [canvasDisplay, setCanvasDisplay] = useState<{ width: number; height: number } | null>(null);

  useEffect(() => {
    setCanvasDisplay(null);
    setLoading(true);
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
      fitDrawing();
      setLoading(false);
    };
    image.onerror = () => setMessage(en ? "The image could not be loaded." : "Impossible de charger l’image.");
    image.src = `/media/${imagePath}`;
  }, [imagePath, en]);

  useEffect(() => {
    const frame = viewport.current;
    const target = canvas.current;
    if (loading || !frame || !target || !target.width || !target.height) return;

    const resize = () => {
      const bounds = frame.getBoundingClientRect();
      const availableWidth = Math.max(1, bounds.width - 16);
      const availableHeight = Math.max(1, bounds.height - 16);
      const ratio = target.width / target.height;
      const width = Math.min(availableWidth, availableHeight * ratio);
      setCanvasDisplay({ width, height: width / ratio });
      setView(1, { x: 0, y: 0 });
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(frame);
    return () => observer.disconnect();
  }, [loading]);

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

  function setView(nextZoom: number, nextPan: Point) {
    const safeZoom = Math.max(1, Math.min(5, nextZoom));
    const safePan = clampPan(nextPan, safeZoom, viewport.current);
    zoomRef.current = safeZoom;
    panRef.current = safePan;
    setZoom(safeZoom);
    setPan(safePan);
  }

  function fitDrawing() { setView(1, { x: 0, y: 0 }); }

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

  return <div className="fixed inset-0 z-[130] flex h-[100dvh] w-screen max-w-full flex-col overflow-hidden bg-[#f7f4ed] dark:bg-[#0d1218]">
    <header className="z-20 flex h-14 shrink-0 items-center justify-between border-b bg-background/95 px-3 backdrop-blur dark:border-white/10 lg:h-auto lg:px-4 lg:py-3"><div className="min-w-0"><p className="text-[9px] font-black uppercase tracking-widest text-primary lg:text-[10px]">{en ? "Magic colouring" : "Coloriage magique"}</p><h1 className="truncate font-display text-base font-black lg:text-xl">{title}</h1></div><button onClick={close} aria-label={en ? "Close" : "Fermer"} className="grid size-10 shrink-0 place-items-center rounded-xl border dark:border-white/10 lg:size-11"><X/></button></header>
    <main className="mx-auto grid min-h-0 w-full max-w-7xl flex-1 p-2 pb-[6.75rem] lg:grid-cols-[250px_1fr] lg:gap-5 lg:p-4">
      <aside className="hidden space-y-4 lg:block"><section className="rounded-[1.5rem] border bg-card p-4 dark:border-white/10"><p className="text-sm font-black">{en ? "Choose a colour" : "Choisis une couleur"}</p><div className="mt-3 grid grid-cols-4 gap-2">{colors.map(value => <button key={value} onClick={() => { setColor(value); setEraser(false); }} aria-label={value} className={`aspect-square rounded-xl border-2 transition hover:scale-110 ${!eraser && color === value ? "scale-110 border-slate-950 ring-4 ring-primary/30 dark:border-white" : "border-white/70 dark:border-white/15"}`} style={{ backgroundColor:value }}/>)}</div><button onClick={() => setEraser(true)} className={`mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border text-sm font-black ${eraser ? "bg-primary/15 text-primary" : "dark:border-white/10"}`}><Eraser size={17}/>{en ? "White eraser" : "Gomme blanche"}</button></section><section className="grid grid-cols-2 gap-2 rounded-[1.5rem] border bg-card p-3 dark:border-white/10"><button disabled={!undo.length} onClick={undoOne} className={action}><Undo2 size={17}/>{en ? "Undo" : "Annuler"}</button><button disabled={!redo.length} onClick={redoOne} className={action}><Redo2 size={17}/>{en ? "Redo" : "Rétablir"}</button><button onClick={reset} className={`${action} col-span-2`}><RotateCcw size={17}/>{en ? "Start again" : "Recommencer"}</button></section><ExportColoringButtons title={title} en={en} getCanvas={() => canvas.current}/></aside>
      <section className="relative min-h-0 min-w-0 overflow-hidden">{message && <p className="absolute inset-x-2 top-2 z-30 rounded-xl bg-amber-100/95 p-2 text-center text-xs font-bold text-amber-900 shadow dark:bg-amber-950/95 dark:text-amber-200 lg:relative lg:inset-auto lg:mb-3 lg:p-3 lg:text-sm">{message}</p>}<div ref={viewport} className="relative size-full min-h-0 min-w-0 overflow-hidden rounded-xl border bg-white p-1 shadow-lg dark:border-white/10 lg:min-h-[60vh] lg:rounded-[2rem] lg:p-2 lg:shadow-xl">{(loading || !canvasDisplay) && <LoaderCircle className="absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2 animate-spin text-primary"/>}<div className="absolute inset-0 grid place-items-center will-change-transform" style={{ transform:`translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})`, transformOrigin:"center" }}><canvas ref={canvas} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerCancel} onLostPointerCapture={onPointerCancel} style={canvasDisplay ?? undefined} className={`block max-h-full max-w-full cursor-crosshair touch-none select-none ${canvasDisplay ? "opacity-100" : "opacity-0"}`}/></div>{touchTarget && <span aria-hidden className="pointer-events-none absolute z-20 size-9 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary bg-primary/10 shadow-[0_0_0_4px_rgb(255_255_255/.8)]" style={{ left:touchTarget.x, top:touchTarget.y }}/>}<div className="absolute bottom-2 right-2 z-30 flex gap-1 rounded-xl border bg-card/95 p-1 shadow-lg backdrop-blur lg:hidden"><button type="button" onClick={() => zoomAt(zoomRef.current - .5)} disabled={zoom <= 1} className="mobile-coloring-zoom" aria-label={en ? "Zoom out" : "Dézoomer"}><Minus size={18}/></button><button type="button" onClick={fitDrawing} className="mobile-coloring-zoom" aria-label={en ? "Fit drawing" : "Ajuster le dessin"}><Maximize2 size={17}/></button><button type="button" onClick={() => zoomAt(zoomRef.current + .5)} disabled={zoom >= 5} className="mobile-coloring-zoom" aria-label={en ? "Zoom in" : "Zoomer"}><Plus size={18}/></button></div></div></section>
    </main>
    <MobileColoringToolbar colors={colors} color={color} eraser={eraser} undoDisabled={!undo.length} redoDisabled={!redo.length} en={en} title={title} setColor={setColor} setEraser={setEraser} undo={undoOne} redo={redoOne} reset={reset} getCanvas={() => canvas.current}/>
    {confirmingReset && <ColoringResetDialog en={en} cancel={() => setConfirmingReset(false)} confirm={confirmReset}/>}
  </div>;
}

const action = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border text-xs font-black disabled:opacity-35 dark:border-white/10";
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
