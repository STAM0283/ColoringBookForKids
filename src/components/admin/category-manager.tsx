"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Eye, LoaderCircle, Pencil, Plus, RefreshCw, Search, Tags, Trash2, X } from "lucide-react";
import { ClientPagination } from "@/components/client-pagination";
import { CategoryBadgePicker as BadgePicker } from "./category-badge-picker";
import { MarkdownEditor } from "./markdown-editor";
import { MarkdownContent } from "@/components/markdown-content";
type Category = {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    color: string;
    badge: string;
    activityCount: number;
    createdAt: string;
    updatedAt: string;
};
type FormValue = {
    name: string;
    description: string;
    color: string;
    badge: string;
};
const blank: FormValue = { name: "", description: "", color: "#0F8A68", badge: "🏷️" };
export function CategoryManager() { const [items, setItems] = useState<Category[]>([]), [loading, setLoading] = useState(true), [query, setQuery] = useState(""), [page, setPage] = useState(1), [creating, setCreating] = useState(false), [viewing, setViewing] = useState<Category | null>(null), [editing, setEditing] = useState<Category | null>(null), [deleting, setDeleting] = useState<Category | null>(null), [success, setSuccess] = useState(""), [error, setError] = useState(""); const load = useCallback(async () => { setLoading(true); const response = await fetch("/api/admin/activity-categories", { cache: "no-store" }); if (response.ok)
    setItems(((await response.json()) as {
        items: Category[];
    }).items); setLoading(false); }, []); useEffect(() => { void load(); }, [load]); const filtered = useMemo(() => items.filter(item => `${item.name} ${item.description || ""}`.toLowerCase().includes(query.toLowerCase())), [items, query]), pages = Math.max(1, Math.ceil(filtered.length / 9)), visible = filtered.slice((page - 1) * 9, page * 9); useEffect(() => setPage(1), [query]); async function submit(value: FormValue, id?: string) { setError(""); const response = await fetch(id ? `/api/admin/activity-categories/${id}` : "/api/admin/activity-categories", { method: id ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(value) }), data = await response.json().catch(() => null) as {
    message?: string;
} | null; if (!response.ok)
    return setError(data?.message || "Opération impossible."); setCreating(false); setEditing(null); setSuccess(data?.message || "Catégorie enregistrée."); await load(); } async function remove() { if (!deleting)
    return; const response = await fetch(`/api/admin/activity-categories/${deleting.id}`, { method: "DELETE" }), data = await response.json().catch(() => null) as {
    message?: string;
} | null; if (response.ok) {
    setDeleting(null);
    setSuccess(data?.message || "Catégorie supprimée.");
    await load();
}
else
    setError(data?.message || "Suppression impossible."); } return <div className="mx-auto max-w-7xl"><header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="text-xs font-black uppercase tracking-[.2em] text-emerald-700">Organisation</p><h1 className="mt-2 text-3xl font-black">Catégories</h1><p className="mt-2 text-slate-500">Classez vos activités avec des couleurs et des badges reconnaissables.</p></div><button onClick={() => setCreating(true)} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-slate-950 px-6 font-black text-white"><Plus size={18}/> Nouvelle catégorie</button></header>{error && <p className="mt-5 rounded-xl bg-red-50 p-4 font-bold text-red-700">{error}</p>}<section className="mt-8 rounded-[1.75rem] border bg-white p-6 shadow-sm"><div className="flex gap-3"><label className="relative flex-1"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Rechercher une catégorie…" className="min-h-12 w-full rounded-xl border pl-11 pr-4"/></label><button onClick={() => void load()} aria-label="Actualiser" className="grid size-12 place-items-center rounded-xl border"><RefreshCw size={18}/></button></div>{loading ? <div className="grid h-60 place-items-center"><LoaderCircle className="animate-spin text-emerald-700"/></div> : visible.length ? <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{visible.map(item => <article key={item.id} className="overflow-hidden rounded-2xl border bg-white transition hover:-translate-y-1 hover:shadow-lg"><div className="h-2" style={{ backgroundColor: item.color }}/><div className="p-5"><div className="flex items-start gap-4"><span className="grid size-14 shrink-0 place-items-center rounded-2xl text-2xl" style={{ backgroundColor: `${item.color}20`, color: item.color }}>{item.badge}</span><div className="min-w-0 flex-1"><h2 className="truncate text-lg font-black">{item.name}</h2><p className="mt-1 text-xs font-bold uppercase tracking-wider text-slate-400">{item.activityCount} activité{item.activityCount > 1 ? "s" : ""}</p></div></div>
{item.description ? <MarkdownContent value={item.description} className="mt-4 line-clamp-2 min-h-10 text-sm leading-5 text-slate-500 dark:text-slate-400 [&_*]:!m-0 [&_h1]:!text-sm [&_h2]:!text-sm [&_h3]:!text-sm [&_p]:!inline"/> : <p className="mt-4 min-h-10 text-sm leading-5 text-slate-500 dark:text-slate-400">Aucune description.</p>}
<div className="mt-5 flex justify-end gap-2"><Action label="Consulter" click={() => setViewing(item)} icon={<Eye size={17}/>} color="text-blue-600"/><Action label="Modifier" click={() => setEditing(item)} icon={<Pencil size={17}/>} color="text-amber-600"/><Action label="Supprimer" click={() => setDeleting(item)} icon={<Trash2 size={17}/>} color="text-red-600"/></div></div></article>)}</div> : <div className="grid h-60 place-items-center text-center"><div><Tags className="mx-auto text-slate-300" size={42}/><h2 className="mt-3 font-black">Aucune catégorie</h2><p className="mt-1 text-sm text-slate-500">Créez votre première catégorie d’activité.</p></div></div>}<ClientPagination page={page} pages={pages} onChange={setPage}/></section>{creating && <CategoryForm title="Nouvelle catégorie" initial={blank} close={() => setCreating(false)} submit={value => void submit(value)}/>} {editing && <CategoryForm title="Modifier la catégorie" initial={editing} close={() => setEditing(null)} submit={value => void submit(value, editing.id)}/>} {viewing && <View item={viewing} close={() => setViewing(null)}/>} {deleting && <Confirm item={deleting} close={() => setDeleting(null)} confirm={() => void remove()}/>} {success && <Success message={success} close={() => setSuccess("")}/>}</div>; }
function Action({ label, click, icon, color }: {
    label: string;
    click: () => void;
    icon: React.ReactNode;
    color: string;
}) { return <button title={label} aria-label={label} onClick={click} className={`grid size-10 place-items-center rounded-xl border transition hover:-translate-y-0.5 hover:bg-slate-50 ${color}`}>{icon}</button>; }
function Modal({ children, close, width = "max-w-xl" }: {
    children: React.ReactNode;
    close: () => void;
    width?: string;
}) { return <div className="fixed inset-0 z-[120] grid place-items-center bg-slate-950/70 p-4 backdrop-blur-sm" onMouseDown={close}><div role="dialog" aria-modal="true" onMouseDown={event => event.stopPropagation()} className={`max-h-[92vh] w-full overflow-auto rounded-[2rem] bg-white shadow-2xl dark:bg-slate-900 dark:text-white ${width}`}>{children}</div></div>; }
function CategoryForm({ title, initial, close, submit }: {
    title: string;
    initial: FormValue | Category;
    close: () => void;
    submit: (value: FormValue) => void;
}) {
    const [value, setValue] = useState<FormValue>({ name: initial.name, description: initial.description || "", color: initial.color, badge: initial.badge });
    return <Modal close={close} width="max-w-5xl">
        <form onSubmit={event => { event.preventDefault(); submit(value); }} className="overflow-hidden rounded-[2rem] bg-white dark:bg-slate-900 dark:text-white">
            <div className="relative z-40 flex items-center justify-between border-b bg-white px-6 py-4 dark:border-white/10 dark:bg-slate-900 sm:px-8">
                <div><p className="text-xs font-black uppercase tracking-[.18em] text-emerald-700 dark:text-emerald-300">Organisation</p><h2 className="mt-1 text-2xl font-black">{title}</h2></div>
                <div className="group/close relative z-50">
                    <button type="button" aria-label="Fermer" onClick={close} className="grid size-11 place-items-center overflow-hidden rounded-2xl bg-slate-100 text-slate-600 transition hover:bg-rose-50 hover:text-rose-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-200 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-rose-400/15 dark:hover:text-rose-300 dark:focus-visible:ring-rose-400/20"><X /></button>
                    <span aria-hidden="true" className="pointer-events-none absolute right-0 top-[calc(100%+.55rem)] z-[60] whitespace-nowrap rounded-lg bg-slate-950 px-3 py-1.5 text-xs font-bold text-white opacity-0 shadow-xl transition group-hover/close:opacity-100 group-focus-within/close:opacity-100 before:absolute before:-top-1 before:right-4 before:size-2 before:rotate-45 before:bg-slate-950">Fermer</span>
                </div>
            </div>
            <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(20rem,.85fr)] lg:p-7">
                <div className="space-y-5">
                    <label className="block text-sm font-black">Nom<input required minLength={2} maxLength={60} value={value.name} onChange={event => setValue({ ...value, name: event.target.value })} className="mt-2 min-h-12 w-full rounded-xl border bg-background px-4 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 dark:border-white/10 dark:focus:ring-emerald-500/15"/></label>
                    <MarkdownEditor label="Description" value={value.description} onChange={description => setValue({ ...value, description })} maximumLength={500} minimumLength={0} required={false} compact help="Ajoutez du gras, des listes ou un court sous-titre, puis vérifiez le rendu."/>
                </div>
                <div className="space-y-4">
                    <label className="block text-sm font-black">Couleur<input type="color" value={value.color} onChange={event => setValue({ ...value, color: event.target.value.toUpperCase() })} className="mt-2 h-12 w-full cursor-pointer rounded-xl border bg-background p-1 dark:border-white/10"/></label>
                    <BadgePicker value={value.badge} onChange={badge => setValue({ ...value, badge })}/>
                    <div className="flex items-center gap-3 rounded-2xl border bg-slate-50/70 p-4 dark:border-white/10 dark:bg-white/[.04]"><span className="grid size-12 place-items-center rounded-xl text-xl" style={{ backgroundColor: `${value.color}20`, color: value.color }}>{value.badge || "🏷️"}</span><div className="min-w-0"><p className="truncate font-black">{value.name || "Aperçu de la catégorie"}</p><p className="text-xs text-slate-500 dark:text-slate-400">Couleur et badge affichés dans les activités.</p></div></div>
                    <button className="min-h-12 w-full rounded-xl bg-slate-950 font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-800 hover:shadow-md active:translate-y-0 dark:bg-emerald-700 dark:text-white dark:hover:bg-emerald-600">Enregistrer</button>
                </div>
            </div>
        </form>
    </Modal>;
}
function View({ item, close }: {
    item: Category;
    close: () => void;
}) { return <Modal close={close}><div className="relative overflow-hidden p-8 text-center"><button onClick={close} className="absolute right-5 top-5 grid size-10 place-items-center rounded-xl bg-slate-100"><X /></button><span className="mx-auto grid size-20 place-items-center rounded-3xl text-4xl" style={{ backgroundColor: `${item.color}20`, color: item.color }}>{item.badge}</span><h2 className="mt-5 text-3xl font-black">{item.name}</h2>{item.description ? <MarkdownContent value={item.description} className="mt-3 text-left leading-7 text-slate-500"/> : <p className="mt-3 leading-7 text-slate-500">Aucune description.</p>}<p className="mt-5 font-bold" style={{ color: item.color }}>{item.activityCount} activité{item.activityCount > 1 ? "s" : ""} associée{item.activityCount > 1 ? "s" : ""}</p></div></Modal>; }
function Confirm({ item, close, confirm }: {
    item: Category;
    close: () => void;
    confirm: () => void;
}) { return <Modal close={close} width="max-w-md"><div className="p-8 text-center"><AlertTriangle className="mx-auto text-red-600" size={48}/><h2 className="mt-4 text-2xl font-black">Supprimer cette catégorie ?</h2><p className="mt-3 text-slate-500">Les {item.activityCount} association{item.activityCount > 1 ? "s" : ""} seront retirées. Les activités ne seront pas supprimées.</p><div className="mt-7 grid grid-cols-2 gap-3"><button onClick={close} className="rounded-xl border py-3 font-bold">Annuler</button><button onClick={confirm} className="rounded-xl bg-red-600 py-3 font-bold text-white">Supprimer</button></div></div></Modal>; }
function Success({ message, close }: {
    message: string;
    close: () => void;
}) { return <Modal close={close} width="max-w-sm"><div className="p-8 text-center"><CheckCircle2 className="mx-auto text-emerald-600" size={54}/><h2 className="mt-4 text-2xl font-black">Opération réussie</h2><p className="mt-3 text-slate-500">{message}</p><button onClick={close} className="mt-6 w-full rounded-xl bg-slate-950 py-3 font-bold text-white">Terminer</button></div></Modal>; }
