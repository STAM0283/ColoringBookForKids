"use client";
import Image from "next/image";
import { AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, Download, FileText, LoaderCircle, LockKeyhole, Pencil, RefreshCw, Save, Tags, Trash2, UploadCloud, Users, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { SiblingPagination } from "@/components/client-pagination";
import { ActivityCategorySelector, type CategoryOption } from "./activity-category-selector";
import { MarkdownEditor } from "./markdown-editor";
import { AdminSelect } from "./admin-select";
type Activity = {
    id: string;
    title: string;
    description: string;
    pageCount: number | null;
    published: boolean;
    accessLevel: "PUBLIC" | "CLUB";
    downloadEnabled: boolean;
    downloadCount: number;
    createdAt: string;
    updatedAt: string;
};
type Media = {
    path: string;
    originalName: string;
    alt: string | null;
};
type Row = {
    activity: Activity;
    pdf: Media | null;
    preview: Media | null;
    categoryIds: string[];
};
export function ActivityManagementList() {
    const [items, setItems] = useState<Row[]>([]), [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>([]), [query, setQuery] = useState(""), [category, setCategory] = useState(""), [loading, setLoading] = useState(true), [expanded, setExpanded] = useState<string | null>(null), [editing, setEditing] = useState<Row | null>(null), [pendingDelete, setPendingDelete] = useState<Row | null>(null), [deleting, setDeleting] = useState(false), [success, setSuccess] = useState<string | null>(null), [error, setError] = useState("");
    const load = useCallback(async () => { setLoading(true); const response = await fetch("/api/admin/activities", { cache: "no-store" }); if (response.ok) {
        const data = (await response.json()) as {
            items: Row[];
            categoryOptions: CategoryOption[];
        };
        setItems(data.items);
        setCategoryOptions(data.categoryOptions);
    } setLoading(false); }, []);
    useEffect(() => { void load(); const refresh = () => void load(); window.addEventListener("admin-content-updated", refresh); return () => window.removeEventListener("admin-content-updated", refresh); }, [load]);
    const filtered = useMemo(() => items.filter(row => row.activity.title.toLowerCase().includes(query.toLowerCase()) && (!category || row.categoryIds.includes(category))), [category, items, query]);
    async function update(row: Row, data: {
        published?: boolean;
        accessLevel?: "PUBLIC" | "CLUB";
        downloadEnabled?: boolean;
    }) { setError(""); const response = await fetch(`/api/admin/activities/${row.activity.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }); const result = await response.json().catch(() => null) as {
        message?: string;
    } | null; if (response.ok) {
        setSuccess(result?.message || "Activité modifiée.");
        await load();
    }
    else
        setError(result?.message || "Modification impossible."); }
    async function save(form: HTMLFormElement) { if (!editing)
        return; setError(""); const response = await fetch(`/api/admin/activities/${editing.activity.id}`, { method: "PATCH", body: new FormData(form) }); const result = await response.json().catch(() => null) as {
        message?: string;
    } | null; if (response.ok) {
        setEditing(null);
        setSuccess(result?.message || "Activité modifiée avec succès.");
        await load();
    }
    else
        setError(result?.message || "Modification impossible."); }
    async function remove() { if (!pendingDelete)
        return; setDeleting(true); const response = await fetch(`/api/admin/activities/${pendingDelete.activity.id}`, { method: "DELETE" }); setDeleting(false); if (response.ok) {
        setPendingDelete(null);
        setSuccess("Activité supprimée avec succès.");
        await load();
    }
    else
        setError("Suppression impossible."); }
    return <section className="admin-activity-list rounded-[1.75rem] border bg-white p-5 shadow-sm dark:border-white/10 dark:bg-card md:p-7"><SiblingPagination total={filtered.length} pageSize={8} containerSelector=":scope > div.mt-6.space-y-3"/><div className="flex items-center justify-between gap-4"><div><h2 className="text-xl font-black text-slate-950 dark:text-white">Catalogue des activités</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-300">{items.length} activité{items.length > 1 ? "s" : ""} · {items.filter(item => item.activity.published).length} visible{items.filter(item => item.activity.published).length > 1 ? "s" : ""} sur le site</p></div><button type="button" aria-label="Actualiser" onClick={() => void load()} className="grid size-11 shrink-0 place-items-center rounded-xl border text-slate-500 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 dark:border-white/10 dark:text-slate-300 dark:hover:bg-emerald-400/10 dark:hover:text-emerald-300"><RefreshCw size={18}/></button></div>
 {error && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-sm font-bold text-red-700 dark:bg-red-500/10 dark:text-red-300">{error}</p>}<div className="mt-5 grid items-stretch gap-3 rounded-2xl bg-slate-50 p-3 dark:bg-white/[.045] sm:grid-cols-[minmax(0,1fr)_minmax(260px,.7fr)] md:p-4"><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Rechercher une activité…" className="min-h-14 rounded-2xl border bg-white px-4 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-white/10 dark:bg-background dark:text-white dark:placeholder:text-slate-500"/><AdminSelect label="Catégorie" icon={<Tags size={18}/>} value={category} options={[{value:"",label:"Toutes les catégories"},...categoryOptions.map(option=>({value:option.id,label:`${option.badge} ${option.label}`}))]} onChange={setCategory}/></div><div className="mt-6 min-h-[24rem] space-y-3 md:min-h-[30rem]">{loading ? <div className="grid h-40 place-items-center"><LoaderCircle className="animate-spin text-emerald-600"/></div> : filtered.length === 0 ? <p className="rounded-2xl border border-dashed p-10 text-center text-slate-500 dark:border-white/15 dark:text-slate-400">{items.length ? "Aucune activité ne correspond à ces filtres." : "Aucune activité créée pour le moment."}</p> : filtered.map(row => { const open = expanded === row.activity.id; return <article key={row.activity.id} className="overflow-hidden rounded-2xl border bg-white transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md dark:border-white/10 dark:bg-background dark:hover:border-emerald-400/30"><div className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center"><div className="relative h-36 w-full shrink-0 overflow-hidden rounded-xl bg-emerald-50 dark:bg-emerald-500/10 sm:h-32 lg:h-28 lg:w-24">{row.preview ? <Image unoptimized fill src={`/media/${row.preview.path}`} alt={row.preview.alt || row.activity.title} className="object-contain p-1"/> : <span className="grid size-full place-items-center text-emerald-700 dark:text-emerald-300"><FileText /></span>}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="font-black text-slate-950 dark:text-white">{row.activity.title}</h3><Badge text={row.activity.published ? "PUBLIÉ" : "MASQUÉ"} green={row.activity.published}/><Badge text={row.activity.accessLevel === "CLUB" ? "CLUB" : "PUBLIC"} green={row.activity.accessLevel === "PUBLIC"}/><Badge text={row.activity.downloadEnabled ? "PDF ACTIF" : "PDF DÉSACTIVÉ"} green={row.activity.downloadEnabled}/>{categoryOptions.filter(option => row.categoryIds.includes(option.id)).map(option => <span key={option.id} className="rounded-full px-2.5 py-1 text-[10px] font-black" style={{ backgroundColor: `${option.color}20`, color: option.color }}>{option.badge} {option.label}</span>)}</div><p className="mt-2 text-xs text-slate-400">{row.activity.pageCount ?? 1} page{(row.activity.pageCount ?? 1) > 1 ? "s" : ""} · {row.activity.downloadCount} téléchargement{row.activity.downloadCount > 1 ? "s" : ""} · mis à jour le {date(row.activity.updatedAt)}</p></div><div className="flex flex-wrap items-center gap-2"><button aria-label={row.activity.downloadEnabled ? "Désactiver le téléchargement du PDF" : "Activer le téléchargement du PDF"} onClick={() => void update(row, { downloadEnabled: !row.activity.downloadEnabled })} className={`inline-flex min-h-10 items-center gap-2 rounded-xl px-3 text-xs font-black transition duration-150 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:scale-95 ${row.activity.downloadEnabled ? "border border-red-200 text-red-600 hover:border-red-300 hover:bg-red-50 dark:border-red-400/25 dark:text-red-300 dark:hover:bg-red-500/10" : "bg-emerald-700 text-white hover:bg-emerald-800"}`}><Download size={15}/>{row.activity.downloadEnabled ? "Désactiver" : "Activer"}</button><button aria-label={row.activity.accessLevel === "CLUB" ? "Rendre ce PDF public" : "Réserver ce PDF au Club"} onClick={() => void update(row, { accessLevel: row.activity.accessLevel === "CLUB" ? "PUBLIC" : "CLUB" })} className="inline-flex min-h-10 items-center gap-2 rounded-xl border px-3 text-xs font-black transition duration-150 hover:-translate-y-0.5 hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-800 hover:shadow-md active:translate-y-0 active:scale-95 dark:border-white/10 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-300">{row.activity.accessLevel === "CLUB" ? <Users size={15}/> : <LockKeyhole size={15}/>} {row.activity.accessLevel === "CLUB" ? "Public" : "Club"}</button><button aria-label={row.activity.published ? "Masquer cette activité du site" : "Publier cette activité sur le site"} onClick={() => void update(row, { published: !row.activity.published })} className={`min-h-10 rounded-xl px-4 text-sm font-bold transition duration-150 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:scale-95 ${row.activity.published ? "border text-slate-600 hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700 dark:border-white/10 dark:text-slate-300 dark:hover:bg-amber-500/10 dark:hover:text-amber-300" : "bg-emerald-700 text-white hover:bg-emerald-800"}`}>{row.activity.published ? "Masquer" : "Publier"}</button><button onClick={() => setEditing(row)} aria-label="Modifier" title="Modifier" className="grid size-10 place-items-center rounded-xl border text-amber-600 transition hover:bg-amber-50 dark:border-white/10 dark:text-amber-300 dark:hover:bg-amber-500/10"><Pencil size={17}/></button>{row.pdf && <a href={`/api/activities/${row.activity.id}/download`} target="_blank" aria-label="Télécharger" title="Télécharger" className="grid size-10 place-items-center rounded-xl border text-blue-600 transition hover:bg-blue-50 dark:border-white/10 dark:text-blue-300 dark:hover:bg-blue-500/10"><Download size={17}/></a>}<button onClick={() => setPendingDelete(row)} aria-label="Supprimer" title="Supprimer" className="grid size-10 place-items-center rounded-xl border text-red-600 transition hover:bg-red-50 dark:border-white/10 dark:text-red-300 dark:hover:bg-red-500/10"><Trash2 size={17}/></button><button onClick={() => setExpanded(open ? null : row.activity.id)} aria-label="Description" className="grid size-10 place-items-center rounded-xl border transition hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/5">{open ? <ChevronUp size={17}/> : <ChevronDown size={17}/>}</button></div></div>{open && <p className="border-t bg-slate-50 p-5 text-sm leading-relaxed text-slate-600 dark:border-white/10 dark:bg-white/[.035] dark:text-slate-300">{row.activity.description}</p>}</article>; })}</div>
 {editing && <EditDialog row={editing} close={() => setEditing(null)} save={save}/>} {pendingDelete && <Modal close={() => !deleting && setPendingDelete(null)}><div className="p-8 text-center"><AlertTriangle className="mx-auto text-red-600" size={48}/><h2 className="mt-4 text-2xl font-black">Supprimer cette activité&nbsp;?</h2><p className="mt-3 text-slate-500">Le PDF et sa couverture seront définitivement supprimés.</p><div className="mt-7 grid grid-cols-2 gap-3"><button onClick={() => setPendingDelete(null)} className="rounded-xl border py-3 font-bold">Annuler</button><button onClick={() => void remove()} className="rounded-xl bg-red-600 py-3 font-bold text-white">{deleting ? "Suppression…" : "Supprimer"}</button></div></div></Modal>}{success && <Modal close={() => setSuccess(null)}><div className="p-8 text-center"><button aria-label="Fermer" onClick={() => setSuccess(null)} className="ml-auto grid size-9 place-items-center rounded-xl bg-slate-100"><X size={17}/></button><CheckCircle2 className="mx-auto text-emerald-600" size={54}/><h2 className="mt-4 text-2xl font-black">Opération réussie</h2><p className="mt-3 text-slate-500">{success}</p><button onClick={() => setSuccess(null)} className="mt-6 w-full rounded-xl bg-slate-900 py-3 font-bold text-white">Terminer</button></div></Modal>}</section>;
}
function EditDialog({ row, close, save }: {
    row: Row;
    close: () => void;
    save: (form: HTMLFormElement) => Promise<void>;
}) { const [coverPreview, setCoverPreview] = useState(row.preview ? `/media/${row.preview.path}` : ""); const [description, setDescription] = useState(row.activity.description); function preview(file: File | null) { if (coverPreview.startsWith("blob:"))
    URL.revokeObjectURL(coverPreview); if (file)
    setCoverPreview(URL.createObjectURL(file)); } return <Modal close={close} width="max-w-2xl"><form onSubmit={event => { event.preventDefault(); void save(event.currentTarget); }}><div className="flex items-center justify-between border-b p-6"><div><p className="text-xs font-black uppercase tracking-widest text-amber-600">Modification</p><h2 className="mt-1 text-2xl font-black">Modifier l’activité</h2></div><button type="button" onClick={close} className="grid size-10 place-items-center rounded-xl bg-slate-100"><X /></button></div><div className="grid gap-5 p-6"><label className="text-sm font-bold">Titre<input name="title" defaultValue={row.activity.title} required minLength={2} className={input}/></label>
<MarkdownEditor name="description" label="Description" value={description} onChange={setDescription} maximumLength={2000} compact help="Structurez la présentation avec du gras, des listes ou des sous-titres."/>
<ActivityCategorySelector initial={row.categoryIds}/><div className="grid gap-4 sm:grid-cols-[160px_1fr]"><div className="relative h-36 overflow-hidden rounded-2xl border bg-slate-50">{coverPreview ? <Image unoptimized fill src={coverPreview} alt="Aperçu de la couverture" className="object-contain p-2"/> : <span className="grid size-full place-items-center text-slate-400"><FileText size={32}/></span>}</div><div><p className="text-sm font-black">Couverture</p><p className="mt-1 text-xs leading-5 text-slate-500">Choisissez une nouvelle image pour remplacer la couverture actuelle.</p><label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-xl border bg-white px-4 py-3 text-sm font-bold text-emerald-700"><UploadCloud size={17}/> Choisir une couverture<input hidden name="cover" type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={event => preview(event.target.files?.[0] || null)}/></label></div></div><div className="grid gap-4 sm:grid-cols-3"><label className="text-sm font-bold">Accès<select name="accessLevel" defaultValue={row.activity.accessLevel} className={input}><option value="PUBLIC">Public</option><option value="CLUB">Club Instagram</option></select></label><label className="flex items-center gap-3 rounded-xl bg-slate-50 p-4 text-sm font-bold"><input type="checkbox" name="published" value="true" defaultChecked={row.activity.published}/> Publiée</label><label className="flex items-center gap-3 rounded-xl bg-slate-50 p-4 text-sm font-bold"><input type="checkbox" name="downloadEnabled" value="true" defaultChecked={row.activity.downloadEnabled}/> PDF actif</label></div><div className="flex justify-end gap-3"><button type="button" onClick={close} className="rounded-xl border px-5 py-3 font-bold text-slate-600">Annuler</button><button className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-3 font-bold text-white"><Save size={17}/> Enregistrer</button></div></div></form></Modal>; }
function Badge({ text, green }: {
    text: string;
    green: boolean;
}) { return <span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${green ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{text}</span>; }
function Modal({ children, close, width = "max-w-md" }: {
    children: React.ReactNode;
    close: () => void;
    width?: string;
}) { return <div className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/70 p-4 backdrop-blur-md" onMouseDown={close}><div onMouseDown={event => event.stopPropagation()} className={`max-h-[92vh] w-full overflow-auto rounded-[1.75rem] bg-white shadow-2xl ${width}`}>{children}</div></div>; }
const input = "mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100";
function date(value: string) { return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(new Date(value)); }
