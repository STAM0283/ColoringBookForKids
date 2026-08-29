"use client";

import Image from "next/image";
import { CheckCircle2, Clock3, Film, ImageIcon, LoaderCircle, Plus, Sparkles, Tags, UploadCloud, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { AdminSelect } from "./admin-select";
import { AdminFormField } from "./admin-form-field";

export function VideoCreateManager({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return <>
    <header className="mx-auto flex max-w-6xl flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div><p className="text-xs font-black uppercase tracking-[.2em] text-emerald-700 dark:text-emerald-300">Contenu vidéo</p><h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 dark:text-white md:text-4xl">Vidéos</h1><p className="mt-2 max-w-2xl text-slate-500 dark:text-slate-300">Gérez les vidéos, leurs miniatures et leur publication depuis une seule liste.</p></div>
      <button type="button" onClick={() => setOpen(true)} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 font-black text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-emerald-800 hover:shadow-xl dark:bg-emerald-500 dark:text-slate-950 dark:hover:bg-emerald-400"><Plus size={19}/>Créer une vidéo</button>
    </header>
    {children}
    {open && <CreateVideoDialog close={() => setOpen(false)}/>}
  </>;
}

function CreateVideoDialog({ close }: { close: () => void }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null), [videoUrl, setVideoUrl] = useState("");
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null), [thumbnailUrl, setThumbnailUrl] = useState("");
  const [duration, setDuration] = useState(0), [published, setPublished] = useState(true), [featured, setFeatured] = useState(false);
  const [categories,setCategories]=useState<Array<{id:string;name:string}>>([]),[categoryId,setCategoryId]=useState("");
  const [loading, setLoading] = useState(false), [error, setError] = useState("");

  useEffect(() => () => { if (videoUrl) URL.revokeObjectURL(videoUrl); }, [videoUrl]);
  useEffect(() => () => { if (thumbnailUrl) URL.revokeObjectURL(thumbnailUrl); }, [thumbnailUrl]);
  useEffect(()=>{fetch("/api/admin/activity-categories").then(response=>response.ok?response.json():{items:[]}).then((data:{items:Array<{id:string;name:string}>})=>setCategories(data.items)).catch(()=>setCategories([]))},[]);
  function selectVideo(file?: File) { if (videoUrl) URL.revokeObjectURL(videoUrl); setVideoFile(file ?? null); setVideoUrl(file ? URL.createObjectURL(file) : ""); setDuration(0); }
  function selectThumbnail(file?: File) { if (thumbnailUrl) URL.revokeObjectURL(thumbnailUrl); setThumbnailFile(file ?? null); setThumbnailUrl(file ? URL.createObjectURL(file) : ""); }
  function dismiss() { if (!loading) close(); }
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!videoFile) return setError("Sélectionnez une vidéo MP4.");
    setLoading(true); setError("");
    const form = new FormData(event.currentTarget); form.set("duration", String(duration)); form.set("categoryId",categoryId); form.set("published", published ? "on" : ""); form.set("featured", featured ? "on" : ""); form.set("video", videoFile); if (thumbnailFile) form.set("thumbnail", thumbnailFile);
    const response = await fetch("/api/admin/vlogs", { method: "POST", body: form });
    const data = await response.json().catch(() => null) as { message?: string } | null;
    setLoading(false);
    if (!response.ok) return setError(data?.message || "Création impossible.");
    window.dispatchEvent(new Event("admin-content-updated")); close();
  }

  return <div className="fixed inset-0 z-[120] grid place-items-center bg-slate-950/75 p-3 backdrop-blur-md sm:p-5" onMouseDown={dismiss}>
    <form ref={formRef} onSubmit={submit} onMouseDown={event => event.stopPropagation()} className="max-h-[94vh] w-full max-w-6xl overflow-auto rounded-[2rem] border border-transparent bg-white shadow-[0_35px_120px_-30px_rgba(0,0,0,.8)] dark:border-white/10 dark:bg-slate-900 dark:[color-scheme:dark]">
      <header className="flex items-start justify-between gap-5 border-b bg-gradient-to-br from-emerald-50 via-white to-white px-6 py-5 dark:border-white/10 dark:from-emerald-950/70 dark:via-slate-900 dark:to-slate-900 sm:px-8"><div className="flex gap-4"><span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300"><Film size={22}/></span><div><p className="text-[11px] font-black uppercase tracking-[.2em] text-emerald-700 dark:text-emerald-300">Nouvelle publication</p><h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950 dark:text-white">Créer une vidéo</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-300">Ajoutez le contenu et contrôlez son rendu avant publication.</p></div></div><button type="button" aria-label="Fermer" onClick={dismiss} className="grid size-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-500 transition hover:bg-slate-200 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/20 dark:hover:text-white"><X size={19}/></button></header>

      <div className="grid gap-6 px-6 py-6 sm:px-8 lg:grid-cols-[1fr_.95fr]">
        <div className="space-y-5">
          <Field label="Langue"><select name="language" defaultValue="FR" className={input}><option value="FR">🇫🇷 Français</option><option value="EN">🇬🇧 Anglais</option></select></Field>
          <Field label="Titre"><input name="title" required minLength={2} maxLength={150} autoFocus placeholder="Ex. Dessinons un petit renard" className={input}/></Field>
          <Field label="Description"><textarea name="description" required minLength={10} maxLength={2000} placeholder="Présentez le contenu de la vidéo…" className={`${input} min-h-32 resize-y py-3 leading-relaxed`}/></Field>
          <AdminSelect label="Catégorie" icon={<Tags size={18}/>} value={categoryId} options={[{value:"",label:"Sans catégorie"},...categories.map(category=>({value:category.id,label:category.name}))]} onChange={setCategoryId}/>
          <div className="grid gap-4 sm:grid-cols-2"><div className="rounded-2xl border bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[.045]"><p className="flex items-center gap-2 text-sm font-black text-slate-800 dark:text-slate-100"><Clock3 size={16} className="text-emerald-700 dark:text-emerald-300"/>Durée détectée</p><p className="mt-2 text-2xl font-black text-slate-950 dark:text-white">{duration ? formatDuration(duration) : "—"}</p><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Calculée automatiquement depuis le MP4.</p></div><label className={`flex cursor-pointer items-center justify-between gap-3 rounded-2xl border p-4 transition dark:border-white/10 ${published ? "border-emerald-200 bg-emerald-50 dark:border-emerald-400/40 dark:bg-emerald-400/10" : "bg-slate-50 dark:bg-white/[.045]"}`}><span><span className="block text-sm font-black text-slate-900 dark:text-slate-100">Publier sur le site</span><span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">{published ? "Visible immédiatement" : "Conserver en brouillon"}</span></span><Switch checked={published}/><input className="sr-only" type="checkbox" checked={published} onChange={event => setPublished(event.target.checked)}/></label></div>
          <label className="flex cursor-pointer items-center gap-3 rounded-2xl border bg-slate-50 p-4 transition hover:border-emerald-300 dark:border-white/10 dark:bg-white/[.045] dark:hover:border-emerald-400/40"><input type="checkbox" checked={featured} onChange={event => setFeatured(event.target.checked)} className="size-5 accent-emerald-700"/><span><span className="block text-sm font-black text-slate-900 dark:text-slate-100">Mettre cette vidéo en avant</span><span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">Elle apparaîtra prioritairement dans les listes.</span></span></label>
          {error && <p role="alert" className="rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700 dark:bg-red-400/10 dark:text-red-300">{error}</p>}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <FilePreview title="Vidéo MP4" hint="MP4 · 100 Mo maximum" selected={videoFile?.name} icon={<Film size={28}/>}> 
            {videoUrl ? <video src={videoUrl} muted controls preload="metadata" onLoadedMetadata={event => setDuration(Math.ceil(event.currentTarget.duration || 0))} className="size-full object-contain"/> : null}
            <input hidden type="file" accept="video/mp4" onChange={event => selectVideo(event.target.files?.[0])}/>
          </FilePreview>
          <FilePreview title="Miniature" hint="Image 16:9 recommandée · 15 Mo maximum" selected={thumbnailFile?.name} icon={<ImageIcon size={28}/>}>
            {thumbnailUrl ? <Image unoptimized fill src={thumbnailUrl} alt="Aperçu de la miniature" className="object-cover"/> : null}
            <input hidden type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={event => selectThumbnail(event.target.files?.[0])}/>
          </FilePreview>
        </div>
      </div>

      <footer className="flex flex-col-reverse gap-3 border-t bg-slate-50/80 px-6 py-4 dark:border-white/10 dark:bg-white/[.035] sm:flex-row sm:items-center sm:justify-between sm:px-8"><p className="hidden items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 sm:flex"><Sparkles size={15} className="text-emerald-700 dark:text-emerald-300"/>Les fichiers sont vérifiés avant leur stockage.</p><div className="flex flex-col-reverse gap-3 sm:flex-row"><button type="button" onClick={dismiss} disabled={loading} className="min-h-12 rounded-2xl border bg-white px-6 font-bold text-slate-600 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/[.06] dark:text-slate-200 dark:hover:bg-white/10">Annuler</button><button disabled={loading || !videoFile} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-6 font-black text-white shadow-lg transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-45 dark:bg-emerald-500 dark:text-slate-950 dark:hover:bg-emerald-400">{loading ? <LoaderCircle className="animate-spin" size={18}/> : <CheckCircle2 size={18}/>} {loading ? "Création…" : "Créer la vidéo"}</button></div></footer>
    </form>
  </div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <AdminFormField label={label}>{children}</AdminFormField>; }
const input = "mt-2.5 min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-4 font-semibold text-slate-900 outline-none transition placeholder:font-normal placeholder:text-slate-400 hover:border-slate-300 focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-100 dark:border-white/10 dark:bg-white/[.045] dark:text-slate-100 dark:placeholder:text-slate-500 dark:hover:border-white/20 dark:focus:border-emerald-400 dark:focus:bg-white/[.07] dark:focus:ring-emerald-400/15";
function Switch({ checked }: { checked: boolean }) { return <span className={`relative h-7 w-12 shrink-0 rounded-full transition ${checked ? "bg-emerald-600" : "bg-slate-300"}`}><span className={`absolute top-1 size-5 rounded-full bg-white shadow-sm transition ${checked ? "left-6" : "left-1"}`}/></span>; }
function FilePreview({ title, hint, selected, icon, children }: { title: string; hint: string; selected?: string; icon: React.ReactNode; children: React.ReactNode }) { const hasPreview=Boolean(selected); return <label className="group block cursor-pointer"><span className="mb-2 flex items-center justify-between gap-3 text-sm font-black text-slate-800 dark:text-slate-100"><span>{title}</span>{selected&&<span className="max-w-56 truncate text-xs font-semibold text-emerald-700 dark:text-emerald-300">{selected}</span>}</span><span className="relative grid aspect-video w-full place-items-center overflow-hidden rounded-2xl border-2 border-dashed border-slate-300 bg-slate-950 transition group-hover:border-emerald-500 dark:border-white/15 dark:bg-slate-950/80 dark:group-hover:border-emerald-400">{children}{!hasPreview&&<span className="z-10 text-center text-white"><span className="mx-auto grid size-14 place-items-center rounded-2xl bg-white/10 text-slate-100 ring-1 ring-white/5">{icon}</span><span className="mt-3 block font-black">Choisir un fichier</span><span className="mt-1 block text-xs text-white/60">{hint}</span></span>}{hasPreview&&<span className="absolute bottom-3 right-3 z-10 inline-flex items-center gap-2 rounded-full bg-black/65 px-3 py-2 text-xs font-black text-white backdrop-blur"><UploadCloud size={14}/>Remplacer</span>}</span></label>; }
function formatDuration(seconds: number) { return `${Math.floor(seconds / 60)} min ${String(seconds % 60).padStart(2, "0")} s`; }
