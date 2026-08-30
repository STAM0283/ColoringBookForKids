"use client";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { Check, CheckCircle2, ChevronDown, Eraser, Gamepad2, Palette, Redo2, RotateCcw, Search, SlidersHorizontal, Tags, Undo2, UserRound, X } from "lucide-react";
import { useViewportLock } from "@/hooks/use-viewport-lock";
import { ExportColoringButtons } from "./export-coloring-buttons";
import { MobileColoringToolbar } from "./mobile-coloring-toolbar";
import { RasterColoringStudio } from "./raster-coloring-studio";
import { ColoringResetDialog } from "./coloring-reset-dialog";
import { articleContentToHtml, richTextToPlainText } from "@/lib/rich-text";
import { COLORING_COLORS, coloringCheckClass } from "@/lib/coloring-palette";
export type ColoringGame = {
    id: string;
    title: string;
    description: string;
    engine: "SVG" | "RASTER";
    svgContent: string;
    imagePath: string | null;
    difficulty: "EASY" | "MEDIUM" | "HARD";
    ageMin: number | null;
    ageMax: number | null;
    zoneCount: number;
    category: {
        name: string;
        slug: string;
        color: string;
    } | null;
    characters: Array<{
        name: string;
        slug: string;
        color: string;
    }>;
};
const colors = [...COLORING_COLORS];
export function ColoringGallery({ items, locale = "fr" }: {
    items: ColoringGame[];
    locale?: "fr" | "en";
}) {
    const en = locale === "en";
    const [selected, setSelected] = useState<ColoringGame | null>(null);
    const [query, setQuery] = useState("");
    const [category, setCategory] = useState("");
    const [character, setCharacter] = useState("");
    const categories = useMemo(() => [...new Map(items.flatMap(item => item.category ? [[item.category.slug, item.category] as const] : [])).values()].sort((a, b) => a.name.localeCompare(b.name)), [items]);
    const characters = useMemo(() => [...new Map(items.flatMap(item => item.characters.map(person => [person.slug, person] as const))).values()].sort((a, b) => a.name.localeCompare(b.name)), [items]);
    const visible = useMemo(() => { const term = query.trim().toLocaleLowerCase(locale); return items.filter(item => (!term || `${item.title} ${item.description} ${item.category?.name ?? ""} ${item.characters.map(person => person.name).join(" ")}`.toLocaleLowerCase(locale).includes(term)) && (!category || item.category?.slug === category) && (!character || item.characters.some(person => person.slug === character))); }, [items, query, category, character, locale]);
    const filtered = Boolean(query || category || character);
    if (selected)
        return selected.engine === "RASTER" && selected.imagePath
            ? <RasterColoringStudio title={selected.title} imagePath={selected.imagePath} en={en} close={() => setSelected(null)}/>
            : <SvgStudio game={selected} en={en} close={() => setSelected(null)}/>;
    return <><section aria-label={en ? "Colouring filters" : "Filtres des coloriages"} className="mb-7 rounded-[1.75rem] border bg-card/90 p-4 shadow-[0_20px_55px_-42px_rgba(15,23,42,.7)] backdrop-blur dark:border-white/10 sm:p-5">
    <div className="mb-4 flex items-center justify-between gap-3"><div className="flex min-w-0 items-center gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary dark:bg-emerald-400/10 dark:text-emerald-300"><SlidersHorizontal size={18}/></span><div className="min-w-0"><h2 className="truncate font-display text-lg font-black">{en ? "Find your colouring page" : "Trouve ton coloriage"}</h2><p className="truncate text-xs font-semibold text-foreground/50">{visible.length} {en ? (visible.length === 1 ? "result" : "results") : (visible.length === 1 ? "résultat" : "résultats")}</p></div></div>{filtered && <button type="button" aria-label={en ? "Reset filters" : "Réinitialiser les filtres"} onClick={() => { setQuery(""); setCategory(""); setCharacter(""); }} className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl border bg-background px-3 text-xs font-black text-foreground/65 transition hover:border-primary/40 hover:text-primary dark:border-white/10"><RotateCcw size={15}/><span className="hidden sm:inline">{en ? "Reset" : "Réinitialiser"}</span></button>}</div>
    <div className="grid gap-3 lg:grid-cols-[minmax(240px,1.35fr)_minmax(190px,.8fr)_minmax(190px,.8fr)]"><label className="group relative"><span className="sr-only">{en ? "Search" : "Rechercher"}</span><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/35 transition group-focus-within:text-primary" size={18}/><input value={query} onChange={event => setQuery(event.target.value)} placeholder={en ? "Title, category or character…" : "Titre, catégorie ou personnage…"} className="focus-ring min-h-14 w-full rounded-2xl border bg-background/70 pl-12 pr-4 font-bold text-foreground placeholder:font-semibold placeholder:text-foreground/35 dark:border-white/10"/></label><FilterSelect icon={<Tags size={17}/>} label={en ? "Category" : "Catégorie"} value={category} change={setCategory} options={[{ value: "", label: en ? "All categories" : "Toutes les catégories" }, ...categories.map(item => ({ value: item.slug, label: item.name }))]}/><FilterSelect icon={<UserRound size={17}/>} label={en ? "Character" : "Personnage"} value={character} change={setCharacter} options={[{ value: "", label: en ? "All characters" : "Tous les personnages" }, ...characters.map(item => ({ value: item.slug, label: item.name }))]}/></div>
  </section>{visible.length ? <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
    {visible.map(game => <article key={game.id} className="group overflow-hidden rounded-[2rem] border bg-card shadow-[0_20px_55px_-38px_rgba(15,23,42,.6)] transition duration-300 hover:-translate-y-1 hover:shadow-xl motion-reduce:transform-none dark:border-white/10">
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-50 p-6 dark:bg-slate-950/60">
        {game.engine === "RASTER" && game.imagePath
                    ? <Image fill quality={82} sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw" src={`/media/${game.imagePath}`} alt={game.title} className="object-contain p-5 transition duration-500 group-hover:scale-[1.025] motion-reduce:transform-none"/>
                    : <div className="size-full transition duration-500 group-hover:scale-[1.025] motion-reduce:transform-none [&_svg]:size-full" dangerouslySetInnerHTML={{ __html: game.svgContent }}/>}
        <span className="absolute right-4 top-4 grid size-11 place-items-center rounded-full bg-white/90 text-primary shadow-lg transition duration-300 group-hover:rotate-6 group-hover:scale-110 motion-reduce:transform-none dark:bg-slate-950/80 dark:text-emerald-300"><Palette size={20}/></span>
      </div>
      <div className="p-5">
        <div className="flex flex-wrap gap-2 text-[10px] font-black uppercase">{game.category && <span className="rounded-full px-3 py-1.5" style={{ backgroundColor: `${game.category.color}18`, color: game.category.color }}>{game.category.name}</span>}<span className="rounded-full bg-emerald-100 px-3 py-1.5 text-emerald-800 dark:bg-emerald-400/10 dark:text-emerald-300">{difficulty(game.difficulty, en)}</span><span className="rounded-full bg-amber-100 px-3 py-1.5 text-amber-800 dark:bg-amber-400/10 dark:text-amber-300">{game.engine === "RASTER" ? (en ? "Magic fill" : "Remplissage magique") : `${game.zoneCount} ${en ? "areas" : "zones"}`}</span></div>
        <h2 className="mt-4 font-display text-2xl font-black">{game.title}</h2>
        <p className="mt-2 line-clamp-2 text-sm leading-6 text-foreground/60">{richTextToPlainText(articleContentToHtml(game.description))}</p>
        <button type="button" onClick={() => setSelected(game)} aria-label={`${en ? "Start colouring" : "Commencer à colorier"} — ${game.title}`} className="coloring-play-button group/play relative mt-5 inline-flex min-h-14 items-center gap-3 overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-r from-primary via-emerald-600 to-teal-600 px-5 text-sm font-black text-white shadow-[0_12px_28px_-12px_rgba(22,101,76,.8)] transition duration-300 hover:-translate-y-1 hover:scale-[1.025] active:scale-95 dark:border-emerald-300/30 dark:from-emerald-950 dark:via-emerald-800 dark:to-teal-900">
          <span className="grid size-8 place-items-center rounded-xl bg-white/15"><Gamepad2 size={18}/></span><span>{en ? "Start colouring" : "Commencer à colorier"}</span><span aria-hidden="true" className="ml-auto">✦</span>
        </button>
      </div>
    </article>)}
  </div> : <div className="grid min-h-64 place-items-center rounded-[2rem] border border-dashed bg-card/60 p-6 text-center dark:border-white/10"><div><Search className="mx-auto text-primary" size={38}/><h2 className="mt-4 text-xl font-black">{en ? "No colouring page found" : "Aucun coloriage trouvé"}</h2><p className="mt-2 text-sm text-foreground/55">{en ? "Try changing or resetting your filters." : "Modifie ou réinitialise tes filtres."}</p></div></div>}</>;
}
function FilterSelect({ icon, label, value, change, options }: {
    icon: React.ReactNode;
    label: string;
    value: string;
    change: (value: string) => void;
    options: Array<{
        value: string;
        label: string;
    }>;
}) { const [open, setOpen] = useState(false), root = useRef<HTMLDivElement>(null), selected = options.find(option => option.value === value) ?? options[0]; useEffect(() => { function outside(event: MouseEvent) { if (!root.current?.contains(event.target as Node))
    setOpen(false); } function escape(event: KeyboardEvent) { if (event.key === "Escape")
    setOpen(false); } document.addEventListener("mousedown", outside); document.addEventListener("keydown", escape); return () => { document.removeEventListener("mousedown", outside); document.removeEventListener("keydown", escape); }; }, []); return <div ref={root} className="relative"><button type="button" aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen(current => !current)} className={`flex min-h-14 w-full items-center gap-3 rounded-2xl border bg-background/70 px-4 text-left transition ${open ? "border-primary ring-4 ring-primary/10" : "hover:border-primary/40 dark:border-white/10"}`}><span className="text-primary">{icon}</span><span className="min-w-0 flex-1"><span className="block text-[9px] font-black uppercase tracking-[.14em] text-foreground/40">{label}</span><span className="block truncate text-sm font-black text-foreground">{selected.label}</span></span><ChevronDown size={17} className={`shrink-0 text-foreground/40 transition ${open ? "rotate-180 text-primary" : ""}`}/></button>{open && <div role="listbox" aria-label={label} className="absolute left-0 right-0 top-[calc(100%+.5rem)] z-50 overflow-hidden rounded-2xl border bg-card p-2 shadow-2xl dark:border-white/10"><p className="px-3 pb-2 pt-1 text-[9px] font-black uppercase tracking-[.14em] text-foreground/40">{label}</p>{options.map(option => <button key={option.value || "all"} type="button" role="option" aria-selected={option.value === value} onClick={() => { change(option.value); setOpen(false); }} className={`flex min-h-11 w-full items-center justify-between rounded-xl px-3 text-left text-sm font-bold transition ${option.value === value ? "bg-primary text-white shadow-sm" : "text-foreground hover:bg-primary/10 hover:text-primary"}`}><span className="truncate">{option.label}</span>{option.value === value && <Check size={17}/>}</button>)}</div>}</div>; }
type Action = {
    zone: string;
    before: string;
    after: string;
};
function SvgStudio({ game, en, close }: {
    game: ColoringGame;
    en: boolean;
    close: () => void;
}) {
    useViewportLock();
    const root = useRef<HTMLDivElement>(null);
    const [color, setColor] = useState<string>(colors[0]);
    const [eraser, setEraser] = useState(false);
    const [undo, setUndo] = useState<Action[]>([]);
    const [redo, setRedo] = useState<Action[]>([]);
    const undoHistory = useRef<Action[]>([]);
    const redoHistory = useRef<Action[]>([]);
    const [painted, setPainted] = useState(0);
    const [confirmingReset, setConfirmingReset] = useState(false);
    useEffect(() => { root.current?.querySelectorAll<SVGElement>("[data-color-zone]").forEach(zone => { zone.dataset.originalFill = zone.getAttribute("fill") || "#FFFFFF"; zone.style.transition = "fill .25s ease"; }); }, []);
    function update() { requestAnimationFrame(() => setPainted([...(root.current?.querySelectorAll<SVGElement>("[data-color-zone]") || [])].filter(zone => zone.getAttribute("fill") !== zone.dataset.originalFill).length)); }
    function updateHistory(nextUndo: Action[], nextRedo: Action[]) { undoHistory.current = nextUndo; redoHistory.current = nextRedo; setUndo(nextUndo); setRedo(nextRedo); }
    function paint(event: React.PointerEvent) { const zone = (event.target as Element).closest<SVGElement>("[data-color-zone]"); if (!zone)
        return; const before = zone.getAttribute("fill") || "#FFFFFF", after = eraser ? (zone.dataset.originalFill || "#FFFFFF") : color; if (before === after)
        return; zone.setAttribute("fill", after); updateHistory([...undoHistory.current, { zone: zone.dataset.colorZone || "", before, after }], []); update(); }
    function apply(action: Action, value: string) { root.current?.querySelector<SVGElement>(`[data-color-zone="${action.zone}"]`)?.setAttribute("fill", value); update(); }
    function undoOne() { const action = undoHistory.current.at(-1); if (!action)
        return; apply(action, action.before); updateHistory(undoHistory.current.slice(0, -1), [...redoHistory.current, action]); }
    function redoOne() { const action = redoHistory.current.at(-1); if (!action)
        return; apply(action, action.after); updateHistory([...undoHistory.current, action], redoHistory.current.slice(0, -1)); }
    function reset() { setConfirmingReset(true); }
    function confirmReset() { root.current?.querySelectorAll<SVGElement>("[data-color-zone]").forEach(zone => zone.setAttribute("fill", zone.dataset.originalFill || "#FFFFFF")); updateHistory([], []); setPainted(0); setConfirmingReset(false); }
    async function getCanvas() { const svg = root.current?.querySelector("svg"); if (!svg)
        return null; const source = new XMLSerializer().serializeToString(svg), blob = new Blob([source], { type: "image/svg+xml" }), url = URL.createObjectURL(blob), image = new window.Image(); return new Promise<HTMLCanvasElement | null>(resolve => { image.onload = () => { const box = svg.getAttribute("viewBox")?.split(/\s+/).map(Number), width = Math.max(800, box?.[2] || 1200), height = Math.max(800, box?.[3] || 1200), canvas = document.createElement("canvas"); canvas.width = width; canvas.height = height; const context = canvas.getContext("2d"); if (!context)
        return resolve(null); context.fillStyle = "#fff"; context.fillRect(0, 0, width, height); context.drawImage(image, 0, 0, width, height); URL.revokeObjectURL(url); resolve(canvas); }; image.onerror = () => { URL.revokeObjectURL(url); resolve(null); }; image.src = url; }); }
    return <><StudioShell title={game.title} en={en} close={close} color={color} setColor={setColor} eraser={eraser} setEraser={setEraser} undo={undo.length} redo={redo.length} undoOne={undoOne} redoOne={redoOne} reset={reset} getCanvas={getCanvas}>
    <div className="mb-1 text-right text-xs font-black text-primary lg:mb-3">{painted}/{game.zoneCount}</div>
    <div ref={root} onPointerDown={paint} className="grid size-full min-h-0 min-w-0 place-items-center overflow-hidden rounded-xl border bg-white p-1 shadow-lg touch-none dark:border-white/10 lg:min-h-[60vh] lg:rounded-[2rem] lg:p-5 lg:shadow-xl [&_svg]:size-full [&_svg]:max-h-full [&_svg]:max-w-full">{<div className="contents" dangerouslySetInnerHTML={{ __html: game.svgContent }}/>}</div>
  </StudioShell>{confirmingReset && <ColoringResetDialog en={en} cancel={() => setConfirmingReset(false)} confirm={confirmReset}/>}</>;
}
type StudioProps = {
    title: string;
    en: boolean;
    close: () => void;
    color: string;
    setColor: (value: string) => void;
    eraser: boolean;
    setEraser: (value: boolean) => void;
    undo: number;
    redo: number;
    undoOne: () => void;
    redoOne: () => void;
    reset: () => void;
    getCanvas: () => Promise<HTMLCanvasElement | null>;
    children: React.ReactNode;
};
function StudioShell(props: StudioProps) {
    return <div className="fixed inset-0 z-[130] flex h-[100dvh] w-screen max-w-full flex-col overflow-hidden bg-[#f7f4ed] dark:bg-[#0d1218]">
    <header className="z-20 flex h-14 shrink-0 items-center justify-between border-b bg-background/95 px-3 backdrop-blur dark:border-white/10 lg:h-auto lg:px-4 lg:py-3"><h1 className="min-w-0 truncate font-display text-base font-black lg:text-xl">{props.title}</h1><button onClick={props.close} aria-label={props.en ? "Close" : "Fermer"} className="grid size-10 shrink-0 place-items-center rounded-xl border dark:border-white/10 lg:size-11"><X /></button></header>
    <main className="mx-auto grid min-h-0 w-full max-w-7xl flex-1 p-2 pb-[6.75rem] lg:grid-cols-[250px_1fr] lg:gap-5 lg:p-4">
      <aside className="hidden space-y-4 lg:block">
        <section className="rounded-[1.5rem] border bg-card p-4 dark:border-white/10"><p className="text-sm font-black">{props.en ? "Choose a colour" : "Choisis une couleur"}</p><div className="mt-3 grid grid-cols-5 gap-2">{colors.map(value => <button key={value} onClick={() => { props.setColor(value); props.setEraser(false); }} className={`aspect-square rounded-xl border-2 ${!props.eraser && props.color === value ? "scale-110 border-slate-950 ring-4 ring-primary/30 dark:border-white" : "border-white/70 dark:border-white/15"}`} style={{ backgroundColor: value }}>{!props.eraser && props.color === value && <CheckCircle2 className={`mx-auto ${coloringCheckClass(value)}`} size={16}/>}</button>)}</div><button onClick={() => props.setEraser(true)} className={`mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border text-sm font-black ${props.eraser ? "bg-primary/15 text-primary" : "dark:border-white/10"}`}><Eraser size={17}/>{props.en ? "Eraser" : "Gomme"}</button></section>
        <section className="grid grid-cols-2 gap-2 rounded-[1.5rem] border bg-card p-3 dark:border-white/10"><button disabled={!props.undo} onClick={props.undoOne} className={action}><Undo2 size={17}/>{props.en ? "Undo" : "Annuler"}</button><button disabled={!props.redo} onClick={props.redoOne} className={action}><Redo2 size={17}/>{props.en ? "Redo" : "Rétablir"}</button><button onClick={props.reset} className={`${action} col-span-2`}><RotateCcw size={17}/>{props.en ? "Start again" : "Recommencer"}</button></section>
        <ExportColoringButtons title={props.title} en={props.en} getCanvas={props.getCanvas}/>
      </aside>
      <section className="min-h-0 min-w-0 overflow-hidden">{props.children}</section>
    </main>
    <MobileColoringToolbar colors={colors} color={props.color} eraser={props.eraser} undoDisabled={!props.undo} redoDisabled={!props.redo} en={props.en} title={props.title} setColor={props.setColor} setEraser={props.setEraser} undo={props.undoOne} redo={props.redoOne} reset={props.reset} getCanvas={props.getCanvas}/>
  </div>;
}
const action = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border text-xs font-black disabled:opacity-35 dark:border-white/10";
function difficulty(value: ColoringGame["difficulty"], en: boolean) { return value === "EASY" ? (en ? "Easy" : "Facile") : value === "MEDIUM" ? (en ? "Medium" : "Intermédiaire") : (en ? "Hard" : "Difficile"); }
