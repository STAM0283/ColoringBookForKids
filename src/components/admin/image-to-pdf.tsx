"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, CheckCircle2, FileImage, Languages, LoaderCircle, LockKeyhole, Trash2, UploadCloud, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { ActivityCategorySelector } from "./activity-category-selector";
import { MarkdownEditor } from "./markdown-editor";
import { AdminSelect } from "./admin-select";
type Selected = {
    id: string;
    file: File;
    preview: string;
};
export function ImageToPdf() {
    const router = useRouter();
    const [items, setItems] = useState<Selected[]>([]), [language, setLanguage] = useState<"FR" | "EN">("FR"), [title, setTitle] = useState(""), [description, setDescription] = useState(""), [cover, setCover] = useState<File | null>(null), [coverPreview, setCoverPreview] = useState(""), [categoryIds, setCategoryIds] = useState<string[]>([]), [activityTypeId,setActivityTypeId]=useState(""),[typeOptions,setTypeOptions]=useState<Array<{id:string;language:"FR"|"EN";name:string;badge:string}>>([]), [accessLevel, setAccessLevel] = useState<"PUBLIC" | "CLUB">("PUBLIC"), [loading, setLoading] = useState(false), [success, setSuccess] = useState(""), [error, setError] = useState("");
    useEffect(()=>{fetch("/api/admin/activity-types",{cache:"no-store"}).then(response=>response.ok?response.json():{items:[]}).then((data:{items:Array<{id:string;language:"FR"|"EN";name:string;badge:string}>})=>setTypeOptions(data.items)).catch(()=>setTypeOptions([]))},[]);
    useEffect(()=>{if(activityTypeId&&!typeOptions.some(option=>option.id===activityTypeId&&option.language===language))setActivityTypeId("")},[activityTypeId,language,typeOptions]);
    function add(files: FileList | null) { if (!files)
        return; setSuccess(""); setItems(current => [...current, ...Array.from(files).map(file => ({ id: crypto.randomUUID(), file, preview: URL.createObjectURL(file) }))].slice(0, 30)); }
    function remove(index: number) { setItems(current => { URL.revokeObjectURL(current[index].preview); return current.filter((_, position) => position !== index); }); }
    function move(index: number, direction: -1 | 1) { const target = index + direction; if (target < 0 || target >= items.length)
        return; setItems(current => { const next = [...current]; [next[index], next[target]] = [next[target], next[index]]; return next; }); }
    function chooseCover(file: File | null) { if (coverPreview)
        URL.revokeObjectURL(coverPreview); setCover(file); setCoverPreview(file ? URL.createObjectURL(file) : ""); }
    async function convert() { setLoading(true); setError(""); setSuccess(""); const form = new FormData(); form.set("language", language); form.set("title", title); form.set("description", description); form.set("accessLevel", accessLevel); form.set("activityTypeId",activityTypeId); form.set("categoryIds", JSON.stringify(categoryIds)); if (cover)
        form.set("cover", cover); items.forEach(item => form.append("images", item.file)); const response = await fetch("/api/admin/convert-to-pdf", { method: "POST", body: form }), data = await response.json().catch(() => null) as {
        message?: string;
    } | null; setLoading(false); if (response.ok) {
        setSuccess(data?.message || "Activité ajoutée avec succès.");
        items.forEach(item => URL.revokeObjectURL(item.preview));
        if (coverPreview)
            URL.revokeObjectURL(coverPreview);
        setItems([]);
        setCover(null);
        setCoverPreview("");
        window.dispatchEvent(new Event("admin-content-updated"));
        router.replace("/admin/activites");
        router.refresh();
    }
    else
        setError(data?.message || "Conversion impossible."); }
    return <section className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-card"><div className="border-b bg-gradient-to-r from-emerald-50 to-white p-6 dark:border-white/10 dark:from-emerald-500/10 dark:to-transparent md:p-8"><span className="grid size-12 place-items-center rounded-2xl bg-emerald-700 text-white"><FileImage /></span><h2 className="mt-4 text-2xl font-black text-slate-950 dark:text-white">Ajouter une activité</h2><p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-slate-500 dark:text-slate-300">Choisissez vos images. Elles seront converties en un PDF et ajoutées automatiquement aux activités.</p></div><div className="p-5 md:p-7"><div className="grid items-end gap-4 lg:grid-cols-[minmax(250px,.45fr)_minmax(0,1fr)]"><AdminSelect label="Langue" icon={<Languages size={18}/>} value={language} options={[{value:"FR",label:"🇫🇷 Français"},{value:"EN",label:"🇬🇧 Anglais"}]} onChange={value=>setLanguage(value as "FR"|"EN")}/><label className="block text-sm font-bold text-slate-700 dark:text-slate-200"><span className="mb-2 block">Nom de l’activité</span><input value={title} placeholder="Ex. Mon coloriage sur les dinosaures" onChange={event => setTitle(event.target.value)} className="min-h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 font-semibold text-slate-900 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-white/15 dark:bg-background dark:text-white"/></label></div>
<div className="mt-4"><MarkdownEditor label="Description" value={description} onChange={setDescription} maximumLength={2000} compact help="Structurez la présentation avec du gras, des listes ou des sous-titres."/></div><div className="mt-4"><AdminSelect label="Type d’activité" value={activityTypeId} options={[{value:"",label:"Sans type"},...typeOptions.filter(option=>option.language===language).map(option=>({value:option.id,label:`${option.badge} ${option.name}`}))]} onChange={setActivityTypeId}/></div>

 <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4"><div className="flex flex-col gap-4 sm:flex-row sm:items-center"><div className="relative grid h-32 w-full shrink-0 place-items-center overflow-hidden rounded-xl border bg-white text-slate-400 sm:w-40">{coverPreview ? <Image unoptimized fill src={coverPreview} alt="Aperçu de la couverture" className="object-contain p-2"/> : <FileImage size={34}/>}</div><div className="flex-1"><p className="text-sm font-black text-slate-800">Couverture de l’activité <span className="font-normal text-slate-400">(facultatif)</span></p><p className="mt-1 text-xs leading-5 text-slate-500">Sans couverture, la première page du PDF sera utilisée automatiquement.</p><label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-emerald-700 shadow-sm ring-1 ring-slate-200"><UploadCloud size={16}/>{cover ? "Changer la couverture" : "Choisir une couverture"}<input hidden type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={event => chooseCover(event.target.files?.[0] || null)}/></label>{cover && <button type="button" onClick={() => chooseCover(null)} className="ml-2 rounded-xl px-3 py-2.5 text-sm font-bold text-red-600">Retirer</button>}</div></div></div>
 <div className="mt-5"><ActivityCategorySelector onChange={setCategoryIds}/></div><fieldset className="mt-5"><legend className="text-sm font-black text-slate-700">Accès au PDF</legend><div className="mt-2 grid gap-3 sm:grid-cols-2"><Choice active={accessLevel === "PUBLIC"} click={() => setAccessLevel("PUBLIC")} icon={<Users />} title="Public" text="Téléchargeable par tout le monde"/><Choice active={accessLevel === "CLUB"} click={() => setAccessLevel("CLUB")} icon={<LockKeyhole />} title="Club Instagram" text="Code d’accès obligatoire"/></div></fieldset>
 <label className="mt-5 flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-emerald-200 bg-emerald-50/40 p-6 text-center transition hover:border-emerald-500"><UploadCloud className="text-emerald-700"/><strong className="mt-2 text-sm">Choisir les images</strong><small className="mt-1 text-slate-500">Chaque image deviendra une page du PDF</small><input hidden multiple type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={event => add(event.target.files)}/></label>
 {items.length > 0 && <div className="mt-6"><div className="mb-3 flex justify-between gap-4"><h3 className="font-black">Pages du PDF</h3><span className="text-sm text-slate-500">{items.length} page{items.length > 1 ? "s" : ""} sélectionnée{items.length > 1 ? "s" : ""} · maximum 30</span></div><div className="grid gap-3 sm:grid-cols-2">{items.map((item, index) => <article key={item.id} className="flex items-center gap-3 rounded-2xl border p-3"><span className="grid size-7 shrink-0 place-items-center rounded-lg bg-slate-900 text-xs font-black text-white">{index + 1}</span><div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-slate-100"><Image unoptimized fill src={item.preview} alt="" className="object-cover"/></div><p className="min-w-0 flex-1 truncate text-sm font-bold">{item.file.name}</p>{items.length > 1 && <div className="grid gap-1"><button disabled={index === 0} aria-label="Monter" onClick={() => move(index, -1)} className="grid size-7 place-items-center rounded-md bg-slate-100 disabled:opacity-25"><ArrowUp size={13}/></button><button disabled={index === items.length - 1} aria-label="Descendre" onClick={() => move(index, 1)} className="grid size-7 place-items-center rounded-md bg-slate-100 disabled:opacity-25"><ArrowDown size={13}/></button></div>}<button aria-label="Retirer" onClick={() => remove(index)} className="grid size-8 place-items-center rounded-lg text-red-600 hover:bg-red-50"><Trash2 size={15}/></button></article>)}</div></div>}
 {error && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-sm font-bold text-red-700">{error}</p>}{success && <p className="mt-5 flex items-center gap-3 rounded-xl bg-emerald-50 p-4 text-sm font-bold text-emerald-700"><CheckCircle2 /> {success}</p>}<button disabled={!items.length || title.trim().length < 2 || description.trim().length < 10 || loading} onClick={() => void convert()} className="mt-7 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 font-bold text-white shadow-lg disabled:cursor-not-allowed disabled:opacity-40">{loading ? <LoaderCircle className="animate-spin"/> : <FileImage />} {loading ? "Conversion et ajout…" : "Convertir en PDF et ajouter"}</button></div></section>;
}
function Choice({ active, click, icon, title, text }: {
    active: boolean;
    click: () => void;
    icon: React.ReactNode;
    title: string;
    text: string;
}) { return <button type="button" onClick={click} className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition ${active ? "border-emerald-600 bg-emerald-50 ring-2 ring-emerald-100" : "hover:border-slate-300"}`}><span className={`grid size-10 place-items-center rounded-xl ${active ? "bg-emerald-700 text-white" : "bg-slate-100 text-slate-500"}`}>{icon}</span><span><strong className="block">{title}</strong><small className="text-slate-500">{text}</small></span></button>; }
