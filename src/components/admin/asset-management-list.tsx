"use client";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, AlignLeft, CalendarDays, CheckCircle2, ChevronDown, ChevronUp, Eye, Film, ImageIcon, Lightbulb, LoaderCircle, Pencil, RefreshCw, Save, Search, Tags, Trash2, Type, UploadCloud, X } from "lucide-react";
import { SiblingPagination } from "@/components/client-pagination";
import { AdminSelect } from "./admin-select";
import { MarkdownEditor } from "./markdown-editor";
import { MarkdownContent } from "@/components/markdown-content";
import { articleContentToHtml, richTextToPlainText } from "@/lib/rich-text";
type Media = {
    id: string;
    path: string;
    alt: string | null;
    creativeIdea: string | null;
    categoryId: string | null;
    originalName: string;
    mimeType: string;
    width: number | null;
    height: number | null;
    size: number;
    published: boolean;
    accessLevel: "PUBLIC" | "CLUB";
    createdAt: string;
    updatedAt: string;
};
type VideoRow = {
    item: {
        id: string;
        title: string;
        description: string;
        categoryId: string | null;
        published: boolean;
        createdAt: string;
        updatedAt: string;
    };
    video: Media | null;
    thumbnail: Media | null;
};
type EditValue = {
    id: string;
    title: string;
    description: string;
    creativeIdea?: string;
    categoryId?: string;
    published?: boolean;
    accessLevel?: "PUBLIC" | "CLUB";
    thumbnail?: File;
    thumbnailPreview?: string;
    imageUrl?: string;
};
type Preview = {
    title: string;
    description: string;
    url: string;
    type: "image" | "video";
};
export function AssetManagementList({ kind }: {
    kind: "images" | "videos";
}) {
    const [allImages, setImages] = useState<Media[]>([]), [videos, setVideos] = useState<VideoRow[]>([]), [loading, setLoading] = useState(true), [expanded, setExpanded] = useState<string | null>(null);
    const [categories, setCategories] = useState<Array<{
        id: string;
        name: string;
    }>>([]), [query, setQuery] = useState(""), [categoryFilter, setCategoryFilter] = useState(""), [dateSort, setDateSort] = useState<"recent" | "oldest" | "updated">("recent");
    const [editing, setEditing] = useState<EditValue | null>(null), [viewing, setViewing] = useState<Preview | null>(null), [pendingDelete, setPendingDelete] = useState<{
        id: string;
        title: string;
    } | null>(null), [success, setSuccess] = useState<string | null>(null), [error, setError] = useState("");
    const load = useCallback(async () => { setLoading(true); setError(""); try {
        const response = await fetch(kind === "images" ? "/api/admin/media" : "/api/admin/vlogs", { cache: "no-store" });
        const data = await response.json().catch(() => null) as {
            items?: Media[] | VideoRow[];
            message?: string;
        } | null;
        if (!response.ok)
            throw new Error(data?.message || "Chargement impossible.");
        if (kind === "images")
            setImages(((data?.items ?? []) as Media[]).filter(item => item.mimeType.startsWith("image/")));
        else
            setVideos((data?.items ?? []) as VideoRow[]);
    }
    catch (cause) {
        setError(cause instanceof Error ? cause.message : "Chargement impossible.");
    }
    finally {
        setLoading(false);
    } }, [kind]);
    useEffect(() => { void load(); const refresh = () => void load(); window.addEventListener("admin-content-updated", refresh); return () => window.removeEventListener("admin-content-updated", refresh); }, [load]);
    useEffect(() => { fetch("/api/admin/activity-categories").then(response => response.ok ? response.json() : { items: [] }).then((data: {
        items: Array<{
            id: string;
            name: string;
        }>;
    }) => setCategories(data.items)).catch(() => setCategories([])); }, []);
    const images = useMemo(() => { const normalized = query.trim().toLocaleLowerCase("fr"); return allImages.filter(item => (!normalized || `${item.alt ?? ""} ${item.originalName}`.toLocaleLowerCase("fr").includes(normalized)) && (!categoryFilter || (categoryFilter === "__none__" ? !item.categoryId : item.categoryId === categoryFilter))).sort((a, b) => dateSort === "oldest" ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime() : dateSort === "updated" ? new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime() : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); }, [allImages, query, categoryFilter, dateSort]);
    const rows = kind === "images" ? images : videos;
    const editingVideo = kind === "videos" && editing ? videos.find(row => row.item.id === editing.id) : undefined;
    async function remove() { if (!pendingDelete)
        return; setError(""); const response = await fetch(`${kind === "images" ? "/api/admin/media" : "/api/admin/vlogs"}/${pendingDelete.id}`, { method: "DELETE" }), data = await response.json().catch(() => null) as {
        message?: string;
    } | null; if (response.ok) {
        setPendingDelete(null);
        setSuccess(data?.message || "Élément supprimé avec succès.");
        await load();
    }
    else {
        setPendingDelete(null);
        setError(data?.message || "Suppression impossible.");
    } }
    async function save() { if (!editing)
        return; const endpoint = kind === "images" ? `/api/admin/media/${editing.id}` : `/api/admin/vlogs/${editing.id}`; let response: Response; if (kind === "images") {
        response = await fetch(endpoint, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ alt: editing.description, creativeIdea: editing.creativeIdea || "", categoryId: editing.categoryId || null, published: Boolean(editing.published), accessLevel: editing.accessLevel || "PUBLIC" }) });
    }
    else {
        const form = new FormData();
        form.set("title", editing.title);
        form.set("description", editing.description);
        form.set("categoryId", editing.categoryId || "");
        form.set("published", String(Boolean(editing.published)));
        if (editing.thumbnail)
            form.set("thumbnail", editing.thumbnail);
        response = await fetch(endpoint, { method: "PATCH", body: form });
    } const data = await response.json().catch(() => null) as {
        message?: string;
    } | null; if (response.ok) {
        if (editing.thumbnailPreview)
            URL.revokeObjectURL(editing.thumbnailPreview);
        setEditing(null);
        setSuccess(data?.message || "Modification enregistrée avec succès.");
        await load();
    }
    else
        setError(data?.message || "Modification impossible."); }
    return <section className="mx-auto mt-8 max-w-6xl rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-7">
  <div className="flex items-center justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[.18em] text-emerald-700">Bibliothèque</p><h2 className="mt-1 text-2xl font-black">Liste des {kind === "images" ? "images" : "vidéos"}</h2><p className="mt-1 text-sm text-slate-500">{rows.length} élément{rows.length > 1 ? "s" : ""} enregistré{rows.length > 1 ? "s" : ""}</p></div><button aria-label="Actualiser" onClick={() => void load()} className="grid size-11 place-items-center rounded-xl border text-slate-500 hover:bg-slate-50"><RefreshCw size={18}/></button></div>
  {kind === "images" && <section className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/80 p-4"><div className="grid gap-3 lg:grid-cols-[minmax(250px,1fr)_280px_250px]"><label className="relative"><span className="sr-only">Rechercher une image</span><Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"/><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Rechercher une image…" className="min-h-14 w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-4 font-semibold outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"/></label><AdminSelect label="Catégorie" icon={<Tags size={18}/>} value={categoryFilter} options={[{ value: "", label: "Toutes les catégories" }, { value: "__none__", label: "Sans catégorie" }, ...categories.map(category => ({ value: category.id, label: category.name }))]} onChange={setCategoryFilter}/><AdminSelect label="Date" icon={<CalendarDays size={18}/>} value={dateSort} options={[{ value: "recent", label: "Ajoutées récemment" }, { value: "oldest", label: "Ajoutées anciennement" }, { value: "updated", label: "Modifiées récemment" }]} onChange={value => setDateSort(value as typeof dateSort)}/></div><div className="mt-3 flex items-center justify-between text-sm"><p className="font-semibold text-slate-500"><strong className="text-slate-900">{images.length}</strong> résultat{images.length !== 1 ? "s" : ""}</p>{(query || categoryFilter) && <button type="button" onClick={() => { setQuery(""); setCategoryFilter(""); }} className="font-black text-emerald-700">Réinitialiser</button>}</div></section>}
  {error && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-sm font-bold text-red-700">{error}</p>}
  <SiblingPagination total={rows.length} pageSize={8} containerSelector=":scope > div.mt-6.space-y-3"/>
  <div className="mt-6 space-y-3">{loading ? <div className="grid min-h-40 place-items-center"><LoaderCircle className="animate-spin text-emerald-700"/></div> : rows.length === 0 ? <Empty kind={kind}/> : kind === "images" ? images.map(item => <ImageRow key={item.id} item={item} open={expanded === item.id} toggle={() => setExpanded(expanded === item.id ? null : item.id)} view={() => setViewing({ title: item.alt || item.originalName, description: item.creativeIdea || item.alt || "Aucune description.", url: `/media/${item.path}`, type: "image" })} edit={() => setEditing({ id: item.id, title: item.originalName, description: item.alt || "", creativeIdea: item.creativeIdea || "", categoryId: item.categoryId || "", published: item.published, accessLevel: item.accessLevel, imageUrl: `/media/${item.path}` })} remove={() => setPendingDelete({ id: item.id, title: item.alt || item.originalName })}/>) : videos.map(row => <VideoItem key={row.item.id} row={row} open={expanded === row.item.id} toggle={() => setExpanded(expanded === row.item.id ? null : row.item.id)} view={() => setViewing({ title: row.item.title, description: row.item.description, url: row.video ? `/media/${row.video.path}` : "", type: "video" })} edit={() => setEditing({ id: row.item.id, title: row.item.title, description: row.item.description, categoryId: row.item.categoryId || "", published: row.item.published })} remove={() => setPendingDelete({ id: row.item.id, title: row.item.title })}/>)}</div>
  {viewing && <PreviewDialog value={viewing} close={() => setViewing(null)}/>} {editing && <EditDialog kind={kind} categories={categories} value={editing.thumbnailPreview || !editingVideo?.thumbnail ? editing : { ...editing, thumbnailPreview: `/media/${editingVideo.thumbnail.path}` }} setValue={setEditing} close={() => setEditing(null)} save={() => void save()}/>} {pendingDelete && <DeleteDialog title={pendingDelete.title} close={() => setPendingDelete(null)} confirm={() => void remove()}/>} {success && <SuccessDialog message={success} close={() => setSuccess(null)}/>} 
 </section>;
}
function ImageRow({ item, open, toggle, view, edit, remove }: {
    item: Media;
    open: boolean;
    toggle: () => void;
    view: () => void;
    edit: () => void;
    remove: () => void;
}) { return <article className="overflow-hidden rounded-2xl border border-slate-200 transition hover:border-slate-300 hover:shadow-md"><div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center"><div className="relative h-28 w-full shrink-0 overflow-hidden rounded-xl bg-slate-100 sm:w-36"><Image unoptimized fill src={`/media/${item.path}`} alt={item.alt || item.originalName} className="object-contain p-1"/></div><Info title={item.alt || item.originalName} badge={`${item.published ? "Publiée" : "Brouillon"} · ${item.accessLevel === "CLUB" ? "Club" : "Public"}`} created={item.createdAt} updated={item.updatedAt} detail={`${formatBytes(item.size)}${item.width && item.height ? ` · ${item.width} × ${item.height} px` : ""}`}/><Actions view={view} edit={edit} remove={remove} open={open} toggle={toggle}/></div>{open && <><Description text={item.alt || "Aucune description renseignée pour cette image."}/><GalleryImageControls item={item}/></>}</article>; }
function GalleryImageControls({ item }: {
    item: Media;
}) {
    const [pending, setPending] = useState(false), [error, setError] = useState("");
    async function update(values: Partial<Pick<Media, "published" | "accessLevel">>) { setPending(true); setError(""); const response = await fetch(`/api/admin/media/${item.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ alt: item.alt || "", categoryId: item.categoryId, published: values.published ?? item.published, accessLevel: values.accessLevel ?? item.accessLevel }) }); const data = await response.json().catch(() => null) as {
        message?: string;
    } | null; setPending(false); if (!response.ok)
        return setError(data?.message || "Modification impossible."); window.dispatchEvent(new Event("admin-content-updated")); }
    return <div className="flex flex-col gap-3 border-t bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-black uppercase tracking-wider text-slate-400">Visibilité de la galerie</p>{error && <p className="mt-1 text-xs font-bold text-red-600">{error}</p>}</div><div className="flex flex-wrap gap-2"><button disabled={pending} onClick={() => void update({ accessLevel: item.accessLevel === "PUBLIC" ? "CLUB" : "PUBLIC" })} className="rounded-xl border px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50">{item.accessLevel === "PUBLIC" ? "Réserver au Club" : "Rendre publique"}</button><button disabled={pending} onClick={() => void update({ published: !item.published })} className={`rounded-xl px-4 py-2 text-sm font-black text-white transition disabled:opacity-50 ${item.published ? "bg-slate-600 hover:bg-slate-700" : "bg-emerald-700 hover:bg-emerald-800"}`}>{item.published ? "Dépublier" : "Publier"}</button></div></div>;
}
function VideoItem({ row, open, toggle, view, edit, remove }: {
    row: VideoRow;
    open: boolean;
    toggle: () => void;
    view: () => void;
    edit: () => void;
    remove: () => void;
}) { return <article className="overflow-hidden rounded-2xl border border-slate-200 transition hover:border-slate-300 hover:shadow-md"><div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center"><div className="relative h-28 w-full shrink-0 overflow-hidden rounded-xl bg-slate-900 sm:w-44">{row.thumbnail ? <Image unoptimized fill src={`/media/${row.thumbnail.path}`} alt={row.item.title} className="object-cover"/> : row.video ? <video src={`/media/${row.video.path}`} className="size-full object-cover" preload="metadata"/> : <span className="grid size-full place-items-center text-white"><Film /></span>}</div><Info title={row.item.title} badge={row.item.published ? "Publiée" : "Brouillon"} created={row.item.createdAt} updated={row.item.updatedAt} detail={row.item.description}/><Actions view={view} edit={edit} remove={remove} open={open} toggle={toggle}/></div>{open && <Description text={row.item.description}/>}</article>; }
function Info({ title, badge, created, updated, detail }: {
    title: string;
    badge: string;
    created: string;
    updated: string;
    detail: string;
}) { return <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="truncate font-black text-slate-900">{title}</h3><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase text-emerald-700">{badge}</span></div><p className="mt-2 text-xs text-slate-500">Créé le {date(created)} <span className="mx-1 text-slate-300">•</span> Mis à jour le {date(updated)}</p><p className="mt-2 line-clamp-1 text-sm text-slate-500">{richTextToPlainText(articleContentToHtml(detail))}</p></div>; }
function Actions({ view, edit, remove, open, toggle }: {
    view: () => void;
    edit: () => void;
    remove: () => void;
    open: boolean;
    toggle: () => void;
}) { const base = "grid size-10 place-items-center rounded-xl border transition hover:-translate-y-0.5"; return <div className="flex shrink-0 items-center gap-2"><button aria-label="Consulter" title="Consulter" onClick={view} className={`${base} text-blue-600 hover:bg-blue-50`}><Eye size={17}/></button><button aria-label="Modifier" title="Modifier" onClick={edit} className={`${base} text-amber-600 hover:bg-amber-50`}><Pencil size={17}/></button><button aria-label="Supprimer" title="Supprimer" onClick={remove} className={`${base} text-red-600 hover:bg-red-50`}><Trash2 size={17}/></button><button aria-label={open ? "Masquer la description" : "Afficher la description"} onClick={toggle} className={`${base} bg-slate-50 text-slate-600`}>{open ? <ChevronUp size={18}/> : <ChevronDown size={18}/>}</button></div>; }
function Description({ text }: {
    text: string;
}) { return <div className="border-t bg-slate-50/80 px-5 py-4"><p className="text-xs font-black uppercase tracking-wider text-slate-400">Description</p><MarkdownContent value={text} className="mt-2 max-w-4xl text-sm leading-relaxed text-slate-600"/></div>; }
function Modal({ children, close, width = "max-w-2xl" }: {
    children: React.ReactNode;
    close: () => void;
    width?: string;
}) { return <div className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/70 p-4 backdrop-blur-md" onMouseDown={close}><div onMouseDown={e => e.stopPropagation()} className={`asset-modal max-h-[92vh] w-full overflow-auto rounded-[1.75rem] bg-white shadow-[0_30px_100px_-25px_rgba(0,0,0,.7)] ${width}`}>{children}</div></div>; }
function PreviewDialog({ value, close }: {
    value: Preview;
    close: () => void;
}) { return <Modal close={close} width="max-w-5xl"><div className="flex items-center justify-between border-b p-5"><div><p className="text-xs font-black uppercase tracking-widest text-blue-600">Consultation</p><h2 className="mt-1 text-xl font-black text-slate-900">{value.title}</h2></div><Close close={close}/></div><div className="grid min-h-96 place-items-center bg-slate-950 p-4">{value.type === "image" ? <div className="relative h-[65vh] w-full"><Image unoptimized fill src={value.url} alt={value.title} className="object-contain"/></div> : value.url ? <video src={value.url} controls autoPlay className="max-h-[65vh] w-full rounded-xl"/> : <Film size={48} className="text-white"/>}</div><div className="p-6"><p className="text-xs font-black uppercase tracking-wider text-slate-400">Description</p><MarkdownContent value={value.description} className="mt-2 leading-relaxed text-slate-600"/></div></Modal>; }
function EditDialog({ kind, categories, value, setValue, close, save }: {
    kind: "images" | "videos";
    categories: Array<{
        id: string;
        name: string;
    }>;
    value: EditValue;
    setValue: (v: EditValue) => void;
    close: () => void;
    save: () => void;
}) {
    const video = kind === "videos", validTitle = !video || value.title.trim().length >= 2, validDescription = value.description.trim().length >= 10;
    const dismiss = () => { if (value.thumbnailPreview)
        URL.revokeObjectURL(value.thumbnailPreview); close(); };
    const chooseThumbnail = (file?: File) => { if (value.thumbnailPreview)
        URL.revokeObjectURL(value.thumbnailPreview); setValue({ ...value, thumbnail: file, thumbnailPreview: file ? URL.createObjectURL(file) : undefined }); };
    if (!video) return <ImageEditDialog categories={categories} value={value} setValue={setValue} close={dismiss} save={save}/>;
    return <Modal close={dismiss} width="max-w-xl"><div className={`asset-edit-dialog overflow-hidden rounded-[1.75rem] bg-white dark:bg-slate-900 ${video ? "asset-video-edit-dialog" : ""}`}><header className="flex items-start justify-between gap-5 border-b bg-gradient-to-br from-amber-50 via-white to-white px-6 py-4 dark:border-white/10 dark:from-amber-950/35 dark:via-slate-900 dark:to-slate-900 sm:px-7"><div className="flex min-w-0 gap-4"><span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"><Pencil size={21}/></span><div><p className="text-[11px] font-black uppercase tracking-[.2em] text-amber-700 dark:text-amber-300">Modification</p><h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950 dark:text-white">Modifier {video ? "la vidéo" : "l’image"}</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-300">Mettez à jour les informations visibles sur le site.</p></div></div><Close close={dismiss}/></header><div className={`space-y-5 px-6 py-4 sm:px-7 ${video ? "asset-video-editor-body" : ""}`}>{video && <label className="block"><span className="flex items-center justify-between gap-3 text-sm font-black text-slate-800 dark:text-slate-100"><span className="inline-flex items-center gap-2"><Type size={16} className="text-amber-600 dark:text-amber-300"/>Titre</span><span className="text-xs font-semibold text-slate-400 dark:text-slate-400">{value.title.length}/150</span></span><input autoFocus value={value.title} maxLength={150} onChange={event => setValue({ ...value, title: event.target.value })} placeholder="Titre de la vidéo" className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-4 font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-100 dark:border-white/10 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500 dark:hover:border-white/20 dark:focus:border-amber-400 dark:focus:bg-slate-800 dark:focus:ring-amber-500/15"/></label>}
{video ? (
  <MarkdownEditor
    label="Description"
    value={value.description}
    onChange={description => setValue({ ...value, description })}
    maximumLength={2000}
    compact
    help="Structurez la présentation avec du gras, des listes ou des sous-titres."
  />
) : (
  <label className="block">
    <span className="flex items-center justify-between gap-3 text-sm font-black text-slate-800 dark:text-slate-100">
      <span className="inline-flex items-center gap-2"><AlignLeft size={16} className="text-amber-600 dark:text-amber-300"/>Description accessible</span>
      <span className="text-xs font-semibold text-slate-400">{value.description.length}/300</span>
    </span>
    <textarea value={value.description} maxLength={300} onChange={event => setValue({ ...value, description: event.target.value })} placeholder="Décrivez brièvement l’image…" className="mt-2 min-h-24 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50/70 p-4 leading-relaxed text-slate-700 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-100 dark:border-white/10 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:hover:border-white/20 dark:focus:border-amber-400 dark:focus:bg-slate-800 dark:focus:ring-amber-500/15"/>
  </label>
)}
{!video && <label className="block"><span className="flex items-center justify-between gap-3 text-sm font-black text-slate-800 dark:text-slate-100"><span className="inline-flex items-center gap-2"><Lightbulb size={16} className="text-amber-600 dark:text-amber-300"/>Idée créative <span className="font-semibold text-slate-400">(facultatif)</span></span><span className="text-xs font-semibold text-slate-400">{value.creativeIdea?.length || 0}/500</span></span><textarea value={value.creativeIdea || ""} maxLength={500} onChange={event => setValue({ ...value, creativeIdea: event.target.value })} placeholder="Ex. Trouve cinq détails et imagine ce qui pourrait arriver ensuite." className="mt-2 min-h-28 w-full resize-y rounded-2xl border border-slate-200 bg-amber-50/30 p-4 leading-relaxed text-slate-700 outline-none transition placeholder:text-slate-400 hover:border-amber-300 focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-100 dark:border-white/10 dark:bg-amber-500/5 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-amber-400 dark:focus:bg-slate-800 dark:focus:ring-amber-500/15"/><p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">Cette suggestion apparaîtra sous l’image dans la galerie publique.</p></label>}{<AdminSelect label="Catégorie" icon={<Tags size={18}/>} placement="down" value={value.categoryId || ""} options={[{ value: "", label: "Sans catégorie" }, ...categories.map(category => ({ value: category.id, label: category.name }))]} onChange={categoryId => setValue({ ...value, categoryId })}/>} {video && <div><p className="flex items-center gap-2 text-sm font-black text-slate-800 dark:text-slate-100"><ImageIcon size={16} className="text-amber-600 dark:text-amber-300"/>Miniature ou couverture</p><label className="mt-2 flex cursor-pointer items-center gap-4 rounded-2xl border border-dashed border-amber-300 bg-amber-50/50 p-3 transition hover:border-amber-500 hover:bg-amber-50 dark:border-amber-400/35 dark:bg-amber-400/5 dark:hover:border-amber-300 dark:hover:bg-amber-400/10">{value.thumbnailPreview ? <span className="relative h-16 w-28 shrink-0 overflow-hidden rounded-xl bg-white shadow-sm dark:bg-slate-950"><Image unoptimized fill src={value.thumbnailPreview} alt="Aperçu de la nouvelle miniature" className="object-cover"/></span> : <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-white text-amber-600 shadow-sm dark:bg-slate-800 dark:text-amber-300"><UploadCloud size={23}/></span>}<span className="min-w-0"><span className="block font-black text-slate-900 dark:text-white">{value.thumbnail?.name || "Choisir une nouvelle miniature"}</span><span className="mt-1 block text-xs leading-relaxed text-slate-500 dark:text-slate-300">JPG, PNG, WebP ou AVIF · 15 Mo maximum. Format 16:9 recommandé.</span></span><input hidden type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={event => chooseThumbnail(event.target.files?.[0])}/></label>{value.thumbnail && <button type="button" onClick={() => chooseThumbnail()} className="mt-2 text-xs font-bold text-red-600 hover:underline dark:text-red-400">Retirer la nouvelle sélection</button>}</div>}{video && <label className={`flex cursor-pointer items-center justify-between gap-4 rounded-2xl border p-3 transition ${value.published ? "border-emerald-200 bg-emerald-50/70 dark:border-emerald-400/35 dark:bg-emerald-400/10" : "border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/5"}`}><span><span className="block font-black text-slate-900 dark:text-white">Publication sur le site</span><span className="mt-1 block text-xs leading-relaxed text-slate-500 dark:text-slate-300">{value.published ? "La vidéo est visible par les visiteurs." : "La vidéo reste enregistrée comme brouillon."}</span></span><span className={`relative h-7 w-12 shrink-0 rounded-full transition ${value.published ? "bg-emerald-600" : "bg-slate-300 dark:bg-slate-600"}`}><input type="checkbox" checked={value.published} onChange={event => setValue({ ...value, published: event.target.checked })} className="sr-only"/><span className={`absolute top-1 size-5 rounded-full bg-white shadow-sm transition ${value.published ? "left-6" : "left-1"}`}/></span></label>}</div><footer className="flex flex-col-reverse gap-3 border-t bg-slate-50/70 px-6 py-3 dark:border-white/10 dark:bg-slate-950/35 sm:flex-row sm:justify-end sm:px-7"><button type="button" onClick={dismiss} className="min-h-11 rounded-2xl border border-slate-200 bg-white px-6 font-bold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 dark:border-white/10 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-white/20 dark:hover:bg-slate-700">Annuler</button><button type="button" onClick={save} disabled={!validTitle || !validDescription} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 px-6 font-black text-white shadow-lg shadow-amber-500/20 transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0"><Save size={18}/>Enregistrer les modifications</button></footer></div></Modal>;
}
function ImageEditDialog({categories,value,setValue,close,save}:{categories:Array<{id:string;name:string}>;value:EditValue;setValue:(value:EditValue)=>void;close:()=>void;save:()=>void}) {
    const valid=value.description.trim().length>=3;
    return <Modal close={close} width="max-w-5xl"><div className="overflow-hidden rounded-[1.75rem] bg-white dark:bg-slate-900"><header className="flex items-start justify-between gap-5 border-b bg-gradient-to-br from-emerald-50 via-white to-amber-50 px-6 py-5 dark:border-white/10 dark:from-emerald-950/40 dark:via-slate-900 dark:to-amber-950/20 sm:px-8"><div className="flex min-w-0 gap-4"><span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300"><ImageIcon size={22}/></span><div><p className="text-[11px] font-black uppercase tracking-[.2em] text-emerald-700 dark:text-emerald-300">Galerie créative</p><h2 className="mt-1 text-2xl font-black text-slate-950 dark:text-white">Modifier l’illustration</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-300">Préparez exactement ce que le visiteur découvrira.</p></div></div><Close close={close}/></header><div className="grid gap-6 px-6 py-6 sm:px-8 lg:grid-cols-[minmax(0,1fr)_330px]"><div className="space-y-5"><label className="block"><span className="flex items-center justify-between gap-3 text-sm font-black text-slate-800 dark:text-slate-100"><span className="inline-flex items-center gap-2"><AlignLeft size={16} className="text-emerald-600"/>Texte alternatif</span><span className="text-xs font-semibold text-slate-400">{value.description.length}/300</span></span><input autoFocus value={value.description} maxLength={300} onChange={event=>setValue({...value,description:event.target.value})} placeholder="Décrivez précisément l’image…" className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-4 font-semibold outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100 dark:border-white/10 dark:bg-slate-950/45 dark:text-white dark:focus:ring-emerald-500/15"/></label><MarkdownEditor label="Description" value={value.creativeIdea||""} onChange={creativeIdea=>setValue({...value,creativeIdea})} maximumLength={2000} minimumLength={0} required={false} compact help="Cette description Markdown s’ouvre avec la flèche sous l’image publique."/><AdminSelect label="Catégorie" icon={<Tags size={18}/>} placement="down" value={value.categoryId||""} options={[{value:"",label:"Sans catégorie"},...categories.map(category=>({value:category.id,label:category.name}))]} onChange={categoryId=>setValue({...value,categoryId})}/><div className="grid gap-3 sm:grid-cols-2"><button type="button" onClick={()=>setValue({...value,accessLevel:value.accessLevel==="CLUB"?"PUBLIC":"CLUB"})} className="min-h-14 rounded-2xl border px-4 text-left transition hover:border-emerald-400 dark:border-white/10"><span className="block text-xs font-black uppercase tracking-wider text-slate-400">Accès</span><span className="mt-1 block font-black dark:text-white">{value.accessLevel==="CLUB"?"Club":"Public"}</span></button><button type="button" onClick={()=>setValue({...value,published:!value.published})} className={`min-h-14 rounded-2xl border px-4 text-left transition ${value.published?"border-emerald-300 bg-emerald-50 dark:border-emerald-400/30 dark:bg-emerald-400/10":"border-slate-200 dark:border-white/10"}`}><span className="block text-xs font-black uppercase tracking-wider text-slate-400">Publication</span><span className="mt-1 block font-black dark:text-white">{value.published?"Visible":"Brouillon"}</span></button></div></div><aside className="lg:sticky lg:top-0 lg:self-start"><p className="mb-2 text-sm font-black text-slate-800 dark:text-slate-100">Aperçu visiteur</p><div className="overflow-hidden rounded-[1.5rem] border bg-white shadow-xl dark:border-white/10 dark:bg-card"><div className="relative aspect-square bg-slate-950">{value.imageUrl?<Image unoptimized fill src={value.imageUrl} alt={value.description||value.title} className="object-contain"/>:<span className="grid size-full place-items-center text-white/45"><ImageIcon size={42}/></span>}<span className="absolute right-3 top-3 grid size-10 place-items-center rounded-full bg-white/90 text-slate-900 shadow-lg"><Eye size={17}/></span></div><div className="p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">Illustration</span><h3 className="mt-2 truncate font-black text-slate-950 dark:text-white">{value.description||"Titre de l’illustration"}</h3></div><span className="grid size-9 shrink-0 place-items-center rounded-full border dark:border-white/15"><ChevronUp size={17}/></span></div>{value.creativeIdea?.trim()?<MarkdownContent value={value.creativeIdea} className="mt-4 border-t pt-4 text-sm leading-relaxed text-slate-600 dark:border-white/10 dark:text-slate-300"/>:<p className="mt-4 border-t pt-4 text-sm italic text-slate-400 dark:border-white/10">La description Markdown apparaîtra ici.</p>}</div></div></aside></div><footer className="flex flex-col-reverse gap-3 border-t bg-slate-50/70 px-6 py-4 dark:border-white/10 dark:bg-slate-950/35 sm:flex-row sm:justify-end sm:px-8"><button type="button" onClick={close} className="min-h-12 rounded-2xl border bg-white px-6 font-bold text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">Annuler</button><button type="button" onClick={save} disabled={!valid} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 px-6 font-black text-white shadow-lg shadow-emerald-600/20 transition hover:-translate-y-0.5 disabled:opacity-45"><Save size={18}/>Enregistrer</button></footer></div></Modal>;
}
function DeleteDialog({ title, close, confirm }: {
    title: string;
    close: () => void;
    confirm: () => void;
}) { return <Modal close={close} width="max-w-md"><div className="p-7 text-center"><span className="mx-auto grid size-16 place-items-center rounded-full bg-red-100 text-red-600"><AlertTriangle size={30}/></span><h2 className="mt-5 text-2xl font-black text-slate-900">Confirmer la suppression</h2><p className="mt-3 leading-relaxed text-slate-500">Voulez-vous vraiment supprimer <strong className="text-slate-800">{title}</strong> ? Cette action est irréversible.</p><div className="mt-7 grid grid-cols-2 gap-3"><button onClick={close} className="rounded-xl border px-4 py-3 font-bold text-slate-600">Annuler</button><button onClick={confirm} className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 font-bold text-white shadow-lg shadow-red-600/20"><Trash2 size={17}/> Supprimer</button></div></div></Modal>; }
function SuccessDialog({ message, close }: {
    message: string;
    close: () => void;
}) { return <Modal close={close} width="max-w-sm"><div className="p-8 text-center"><span className="mx-auto grid size-16 place-items-center rounded-full bg-emerald-100 text-emerald-600"><CheckCircle2 size={32}/></span><h2 className="mt-5 text-2xl font-black text-slate-900">Opération réussie</h2><p className="mt-3 text-slate-500">{message}</p><button autoFocus onClick={close} className="mt-7 w-full rounded-xl bg-slate-900 px-5 py-3 font-bold text-white">Terminer</button></div></Modal>; }
function Close({ close }: {
    close: () => void;
}) { return <span className="group/close relative shrink-0"><button aria-label="Fermer" onClick={close} className="grid size-10 place-items-center overflow-hidden rounded-xl bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-900"><X size={19}/></button><span aria-hidden="true" className="pointer-events-none absolute right-full top-1/2 z-50 mr-2 -translate-y-1/2 translate-x-1 whitespace-nowrap rounded-lg bg-slate-950 px-3 py-1.5 text-xs font-bold text-white opacity-0 shadow-xl transition group-hover/close:translate-x-0 group-hover/close:opacity-100">Fermer</span></span>; }
function Empty({ kind }: {
    kind: string;
}) { return <div className="grid min-h-48 place-items-center rounded-2xl border border-dashed bg-slate-50 text-center"><div>{kind === "images" ? <ImageIcon className="mx-auto text-slate-400"/> : <Film className="mx-auto text-slate-400"/>}<p className="mt-3 font-bold">Aucun élément pour le moment</p></div></div>; }
function date(value: string) { return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)); }
function formatBytes(bytes: number) { return bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} Mo` : `${(bytes / 1024).toFixed(1)} Ko`; }
