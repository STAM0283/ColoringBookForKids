"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, LoaderCircle, Pencil, Plus, Save, Tags, Trash2, X } from "lucide-react";
import { CategoryBadgePicker } from "./category-badge-picker";
type Category = {
    id: string;
    name: string;
    description: string | null;
    color: string;
    badge: string;
    activityCount: number;
};
type FormValue = {
    name: string;
    description: string;
    color: string;
    badge: string;
};
const blank: FormValue = { name: "", description: "", color: "#D97706", badge: "✏️" };
export function BlogCategoryManager() {
    const [items, setItems] = useState<Category[]>([]), [loading, setLoading] = useState(true), [editing, setEditing] = useState<Category | null>(null), [creating, setCreating] = useState(false), [error, setError] = useState(""), [message, setMessage] = useState("");
    const load = useCallback(async () => { setLoading(true); const response = await fetch("/api/admin/blog-categories", { cache: "no-store" }); if (response.ok)
        setItems(((await response.json()) as {
            items: Category[];
        }).items); setLoading(false); }, []);
    useEffect(() => { void load(); }, [load]);
    async function save(value: FormValue, id?: string) { setError(""); setMessage(""); const response = await fetch(id ? `/api/admin/blog-categories/${id}` : "/api/admin/blog-categories", { method: id ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(value) }), data = await response.json().catch(() => null) as {
        message?: string;
    } | null; if (!response.ok)
        return setError(data?.message || "Enregistrement impossible."); setCreating(false); setEditing(null); setMessage(data?.message || "Catégorie enregistrée."); await load(); }
    async function remove(item: Category) { if (!window.confirm(`Supprimer la catégorie « ${item.name} » ? Les articles seront conservés sans catégorie.`))
        return; const response = await fetch(`/api/admin/blog-categories/${item.id}`, { method: "DELETE" }), data = await response.json().catch(() => null) as {
        message?: string;
    } | null; if (!response.ok)
        return setError(data?.message || "Suppression impossible."); setMessage(data?.message || "Catégorie supprimée."); await load(); }
    return <div className="mx-auto max-w-6xl">
    <Link href="/admin/blog" className="inline-flex items-center gap-2 rounded-xl text-sm font-black text-slate-500 hover:text-emerald-700"><ArrowLeft size={17}/> Retour au blog</Link>
    <header className="mt-6 flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="text-xs font-black uppercase tracking-[.2em] text-amber-600">Organisation</p><h1 className="mt-2 text-3xl font-black">Catégories du blog</h1><p className="mt-2 text-slate-500">Créez des catégories reconnaissables pour aider les visiteurs à trouver les bons articles.</p></div><button onClick={() => setCreating(true)} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-slate-950 px-6 font-black text-white"><Plus size={18}/> Nouvelle catégorie</button></header>
    {error && <p className="mt-5 rounded-xl bg-red-50 p-4 font-bold text-red-700">{error}</p>}{message && <p className="mt-5 rounded-xl bg-emerald-50 p-4 font-bold text-emerald-700">{message}</p>}
    <section className="mt-8 rounded-[1.75rem] border bg-white p-6 shadow-sm">{loading ? <div className="grid h-56 place-items-center"><LoaderCircle className="animate-spin text-emerald-700"/></div> : items.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{items.map(item => <article key={item.id} className="overflow-hidden rounded-2xl border bg-white"><div className="h-2" style={{ backgroundColor: item.color }}/><div className="p-5"><div className="flex items-center gap-4"><span className="grid size-14 place-items-center rounded-2xl text-2xl" style={{ backgroundColor: `${item.color}20`, color: item.color }}>{item.badge}</span><div className="min-w-0 flex-1"><h2 className="truncate text-lg font-black">{item.name}</h2><p className="text-xs font-bold uppercase tracking-wide text-slate-400">{item.activityCount} article{item.activityCount > 1 ? "s" : ""}</p></div></div><p className="mt-4 min-h-10 text-sm leading-5 text-slate-500">{item.description || "Aucune description."}</p><div className="mt-5 flex justify-end gap-2"><button onClick={() => setEditing(item)} aria-label="Modifier" className="grid size-10 place-items-center rounded-xl border text-amber-600 hover:bg-amber-50"><Pencil size={17}/></button><button onClick={() => void remove(item)} aria-label="Supprimer" className="grid size-10 place-items-center rounded-xl border text-red-600 hover:bg-red-50"><Trash2 size={17}/></button></div></div></article>)}</div> : <div className="grid h-56 place-items-center text-center"><div><Tags className="mx-auto text-slate-300" size={42}/><h2 className="mt-3 font-black">Aucune catégorie</h2><p className="mt-1 text-sm text-slate-500">Créez la première catégorie de votre blog.</p></div></div>}</section>
    {(creating || editing) && <ThemeForm initial={editing || blank} close={() => { setCreating(false); setEditing(null); }} submit={value => void save(value, editing?.id)}/>} 
  </div>;
}
function ThemeForm({ initial, close, submit }: {
    initial: FormValue | Category;
    close: () => void;
    submit: (value: FormValue) => void;
}) { const [value, setValue] = useState<FormValue>({ name: initial.name, description: initial.description || "", color: initial.color, badge: initial.badge }); return <div className="fixed inset-0 z-[120] grid place-items-center bg-slate-950/70 p-4 backdrop-blur-sm" onMouseDown={close}><form onSubmit={event => { event.preventDefault(); submit(value); }} onMouseDown={event => event.stopPropagation()} className="max-h-[92vh] w-full max-w-xl overflow-auto rounded-[2rem] bg-white shadow-2xl"><header className="flex items-center justify-between border-b p-6"><div><p className="text-xs font-black uppercase tracking-widest text-amber-600">Catégorie du blog</p><h2 className="mt-1 text-2xl font-black">{initial.name ? "Modifier la catégorie" : "Nouvelle catégorie"}</h2></div><button type="button" onClick={close} className="grid size-10 place-items-center rounded-xl bg-slate-100"><X /></button></header><div className="grid gap-5 p-6"><label className="text-sm font-black">Nom<input required minLength={2} maxLength={60} value={value.name} onChange={event => setValue({ ...value, name: event.target.value })} className="mt-2 min-h-12 w-full rounded-xl border px-4"/></label><label className="text-sm font-black">Description<textarea maxLength={500} value={value.description} onChange={event => setValue({ ...value, description: event.target.value })} className="mt-2 min-h-28 w-full rounded-xl border p-4"/></label><label className="text-sm font-black">Couleur<input type="color" value={value.color} onChange={event => setValue({ ...value, color: event.target.value.toUpperCase() })} className="mt-2 h-12 w-full cursor-pointer rounded-xl border bg-white p-1"/></label><CategoryBadgePicker value={value.badge} onChange={badge => setValue({ ...value, badge })}/><div className="flex items-center gap-3 rounded-2xl border p-4"><span className="grid size-12 place-items-center rounded-xl text-xl" style={{ backgroundColor: `${value.color}20`, color: value.color }}>{value.badge}</span><strong>{value.name || "Aperçu de la catégorie"}</strong></div><button className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-slate-950 font-black text-white"><Save size={18}/> Enregistrer</button></div></form></div>; }
