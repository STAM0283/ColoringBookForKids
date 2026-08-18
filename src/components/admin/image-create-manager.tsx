"use client";

import Image from "next/image";
import { CheckCircle2, ImageIcon, LoaderCircle, Plus, Sparkles, Tags, UploadCloud, X } from "lucide-react";
import { useEffect, useState } from "react";
import { AdminSelect } from "./admin-select";

export function ImageCreateManager({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return <>
    <header className="mx-auto flex max-w-6xl flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div><p className="text-xs font-black uppercase tracking-[.2em] text-emerald-700">Galerie publique</p><h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 md:text-4xl">Images</h1><p className="mt-2 max-w-2xl text-slate-500">Gérez les illustrations publiées sur le site depuis une liste unique.</p></div>
      <button type="button" onClick={() => setOpen(true)} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 font-black text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-emerald-800 hover:shadow-xl"><Plus size={19}/>Ajouter une image</button>
    </header>
    {children}
    {open && <CreateImageDialog close={() => setOpen(false)}/>}
  </>;
}

function CreateImageDialog({ close }: { close: () => void }) {
  const [file, setFile] = useState<File | null>(null), [preview, setPreview] = useState("");
  const [alt, setAlt] = useState(""), [loading, setLoading] = useState(false), [error, setError] = useState("");
  const [categories,setCategories]=useState<Array<{id:string;name:string}>>([]),[categoryId,setCategoryId]=useState("");
  useEffect(()=>{fetch("/api/admin/activity-categories").then(response=>response.ok?response.json():{items:[]}).then((data:{items:Array<{id:string;name:string}>})=>setCategories(data.items)).catch(()=>setCategories([]))},[]);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  function select(file?: File) { if (preview) URL.revokeObjectURL(preview); setFile(file ?? null); setPreview(file ? URL.createObjectURL(file) : ""); setError(""); }
  function dismiss() { if (!loading) close(); }
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!file) return setError("Sélectionnez une image.");
    setLoading(true); setError("");
    const form = new FormData(); form.set("type", "IMAGE"); form.set("file", file); form.set("alt", alt); form.set("categoryId",categoryId);
    const response = await fetch("/api/admin/media", { method: "POST", body: form });
    const data = await response.json().catch(() => null) as { message?: string } | null;
    setLoading(false); if (!response.ok) return setError(data?.message || "Ajout impossible.");
    window.dispatchEvent(new Event("admin-content-updated")); close();
  }
  return <div className="fixed inset-0 z-[120] grid place-items-center bg-slate-950/75 p-3 backdrop-blur-md sm:p-5" onMouseDown={dismiss}>
    <form onSubmit={submit} onMouseDown={event => event.stopPropagation()} className="max-h-[94vh] w-full max-w-4xl overflow-auto rounded-[2rem] bg-white shadow-[0_35px_120px_-30px_rgba(0,0,0,.8)]">
      <header className="flex items-start justify-between gap-5 border-b bg-gradient-to-br from-emerald-50 via-white to-white px-6 py-5 sm:px-8"><div className="flex gap-4"><span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-emerald-100 text-emerald-700"><ImageIcon size={23}/></span><div><p className="text-[11px] font-black uppercase tracking-[.2em] text-emerald-700">Nouvelle illustration</p><h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">Ajouter une image</h2><p className="mt-1 text-sm text-slate-500">Vérifiez le rendu avant de l’ajouter à la galerie.</p></div></div><button type="button" aria-label="Fermer" onClick={dismiss} className="grid size-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-500 transition hover:bg-slate-200"><X size={19}/></button></header>
      <div className="grid gap-6 px-6 py-6 sm:px-8 md:grid-cols-[1fr_1.05fr]">
        <div className="space-y-5"><label className="block text-sm font-black text-slate-800">Texte alternatif<input value={alt} onChange={event => setAlt(event.target.value)} required minLength={3} maxLength={300} autoFocus placeholder="Ex. Ours coloriant dans son atelier" className="mt-2.5 min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-4 font-semibold text-slate-900 outline-none transition focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-100"/></label><AdminSelect label="Catégorie" icon={<Tags size={18}/>} value={categoryId} options={[{value:"",label:"Sans catégorie"},...categories.map(category=>({value:category.id,label:category.name}))]} onChange={setCategoryId}/><div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4"><p className="font-black text-emerald-900">Pourquoi ce texte ?</p><p className="mt-2 text-sm leading-6 text-slate-600">Il décrit l’image pour l’accessibilité et aide les moteurs de recherche à comprendre son contenu.</p></div>{error && <p role="alert" className="rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700">{error}</p>}</div>
        <label className="group block cursor-pointer"><span className="mb-2 flex items-center justify-between gap-3 text-sm font-black text-slate-800"><span>Fichier image</span>{file && <span className="max-w-56 truncate text-xs font-semibold text-emerald-700">{file.name}</span>}</span><span className="relative grid aspect-square max-h-[430px] w-full place-items-center overflow-hidden rounded-2xl border-2 border-dashed border-slate-300 bg-slate-950 transition group-hover:border-emerald-500">{preview ? <Image unoptimized fill src={preview} alt="Aperçu avant ajout" className="object-contain"/> : <span className="text-center text-white"><span className="mx-auto grid size-16 place-items-center rounded-2xl bg-white/10"><ImageIcon size={30}/></span><span className="mt-3 block font-black">Choisir une image</span><span className="mt-1 block text-xs text-white/55">JPG, PNG, WebP ou AVIF · 15 Mo max.</span></span>}{preview && <span className="absolute bottom-3 right-3 inline-flex items-center gap-2 rounded-full bg-black/65 px-3 py-2 text-xs font-black text-white backdrop-blur"><UploadCloud size={14}/>Remplacer</span>}</span><input hidden type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={event => select(event.target.files?.[0])}/></label>
      </div>
      <footer className="flex flex-col-reverse gap-3 border-t bg-slate-50/80 px-6 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8"><p className="hidden items-center gap-2 text-xs font-semibold text-slate-500 sm:flex"><Sparkles size={15} className="text-emerald-700"/>Le format et la taille sont contrôlés avant le stockage.</p><div className="flex flex-col-reverse gap-3 sm:flex-row"><button type="button" onClick={dismiss} disabled={loading} className="min-h-12 rounded-2xl border bg-white px-6 font-bold text-slate-600">Annuler</button><button disabled={loading || !file || alt.trim().length < 3} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-6 font-black text-white shadow-lg transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-45">{loading ? <LoaderCircle className="animate-spin" size={18}/> : <CheckCircle2 size={18}/>} {loading ? "Ajout…" : "Ajouter à la galerie"}</button></div></footer>
    </form>
  </div>;
}
