"use client";

import { MarkdownContent } from "@/components/markdown-content";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Heart, LoaderCircle, Pencil, Plus, RefreshCw, Search, Trash2 } from "lucide-react";
import { AdminSelect } from "./admin-select";
import { CharacterDialog, CharacterModal } from "./character-dialog";

export type Character = { id:string; language:"FR"|"EN"; name:string; shortDescription:string; biography:string|null; ageLabel:string|null; species:string|null; personality:string|null; hobbies:string|null; motto:string|null; color:string; published:boolean; sortOrder:number };
export type CharacterRow = { character:Character; portrait:{path:string}|null; imageCount:number };
const action = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold transition motion-safe:hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 disabled:opacity-50";

export function CharacterManager() {
  const [rows,setRows]=useState<CharacterRow[]>([]), [loading,setLoading]=useState(true);
  const [query,setQuery]=useState(""), [language,setLanguage]=useState(""), [status,setStatus]=useState("");
  const [editing,setEditing]=useState<CharacterRow|null>(null), [creating,setCreating]=useState(false);
  const [deleting,setDeleting]=useState<CharacterRow|null>(null), [busy,setBusy]=useState(false);
  const [message,setMessage]=useState(""), [error,setError]=useState("");
  const load=useCallback(async()=>{
    setLoading(true); setError("");
    try {
      const response=await fetch("/api/admin/characters",{cache:"no-store"});
      if(!response.ok) throw new Error("Impossible de charger les personnages.");
      const data=await response.json(); setRows(data.items);
    } catch(cause) { setError(cause instanceof Error?cause.message:"Connexion impossible."); }
    finally { setLoading(false); }
  },[]);
  useEffect(()=>{void load()},[load]);
  const visible=useMemo(()=>rows.filter(({character:c})=>
    (!language||c.language===language)&&(!status||String(c.published)===status)&&
    (!query.trim()||`${c.name} ${c.shortDescription} ${c.species||""}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()))
  ),[rows,query,language,status]);
  async function remove() {
    if(!deleting||busy)return;
    setBusy(true);setError("");
    try {
      const response=await fetch(`/api/admin/characters/${deleting.character.id}`,{method:"DELETE"});
      if(!response.ok)throw new Error("Suppression impossible. Veuillez réessayer.");
      setDeleting(null);setMessage("Personnage supprimé.");await load();
    } catch(cause){setError(cause instanceof Error?cause.message:"Connexion impossible.");}
    finally{setBusy(false);}
  }
  return <div className="mx-auto max-w-7xl space-y-5">
    <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div><p className="text-[11px] font-black uppercase tracking-[.18em] text-emerald-700 dark:text-emerald-300">L’univers du Petit Crayon</p><h1 className="mt-1 text-3xl font-black text-slate-950 dark:text-white">Personnages</h1><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Donnez vie à vos héros et retrouvez leurs illustrations.</p></div>
      <button onClick={()=>setCreating(true)} className={`${action} bg-emerald-600 text-white shadow-lg shadow-emerald-900/10 hover:bg-emerald-500`}><Plus size={19}/>Nouveau personnage</button>
    </header>
    <section aria-label="Filtrer les personnages" className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-slate-900/60">
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_190px_190px_48px]">
        <label className="relative flex items-center"><Search size={18} className="absolute left-3 text-slate-400"/><input aria-label="Rechercher un personnage" value={query} onChange={event=>setQuery(event.target.value)} placeholder="Nom, espèce, présentation…" className="min-h-12 w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500 dark:border-white/10 dark:bg-slate-950/40 dark:text-white"/></label>
        <AdminSelect label="Langue" value={language} options={[{value:"",label:"Toutes les langues"},{value:"FR",label:"Français"},{value:"EN",label:"Anglais"}]} onChange={setLanguage}/>
        <AdminSelect label="Publication" value={status} options={[{value:"",label:"Tous les statuts"},{value:"true",label:"Publiés"},{value:"false",label:"Brouillons"}]} onChange={setStatus}/>
        <button disabled={loading} onClick={()=>void load()} aria-label="Actualiser les personnages" title="Actualiser" className="grid min-h-12 place-items-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-emerald-400/10"><RefreshCw size={18} className={loading?"animate-spin":""}/></button>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 px-1 text-xs text-slate-500 dark:text-slate-400"><span>{visible.length} / {rows.length} personnages · {rows.filter(row=>row.character.published).length} publiés</span>{(query||language||status)&&<button onClick={()=>{setQuery("");setLanguage("");setStatus("")}} className="min-h-8 font-bold text-emerald-700 hover:underline dark:text-emerald-300">Réinitialiser les filtres</button>}</div>
    </section>
    {message&&<p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800 dark:bg-emerald-400/10 dark:text-emerald-300">{message}</p>}
    {error&&!deleting&&<p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-400/10 dark:text-rose-300">{error}</p>}
    {loading?<div role="status" className="flex min-h-48 items-center justify-center gap-3 text-sm text-slate-500"><LoaderCircle className="animate-spin" size={22}/>Chargement des personnages…</div>:visible.length?<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {visible.map(row=><article key={row.character.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md dark:border-white/10 dark:bg-slate-900/60">
        <div className="relative h-44" style={{background:`linear-gradient(135deg,${row.character.color}25,${row.character.color}08)`}}>
          {row.portrait?<Image fill unoptimized sizes="400px" src={`/media/${row.portrait.path}`} alt={row.character.name} className="object-contain p-4"/>:<div className="grid h-full place-items-center"><Heart size={52} strokeWidth={1.3} style={{color:row.character.color}}/></div>}
          <span className="absolute left-3 top-3 rounded-lg bg-white/90 px-2 py-1 text-[10px] font-black text-slate-700 dark:bg-slate-950/80 dark:text-slate-200">{row.character.language}</span>
          <span className={`absolute right-3 top-3 rounded-lg px-2 py-1 text-[10px] font-bold ${row.character.published?"bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300":"bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200"}`}>{row.character.published?"Publié":"Brouillon"}</span>
        </div>
        <div className="p-4"><h2 className="break-words text-xl font-black text-slate-900 dark:text-white">{row.character.name}</h2><MarkdownContent value={row.character.shortDescription} className="mt-1 line-clamp-2 min-h-10 break-words text-sm leading-5 text-slate-500 dark:text-slate-400 [&_p]:my-0 [&_h2]:text-sm [&_h3]:text-sm"/>
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600 dark:text-slate-300">{[row.character.species,row.character.ageLabel,`${row.imageCount} illustration${row.imageCount===1?"":"s"}`].filter(Boolean).map((text,index)=><span key={index} className="max-w-full break-words rounded-lg bg-slate-100 px-2 py-1 dark:bg-white/5">{text}</span>)}</div>
          <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3 dark:border-white/10"><button aria-label={`Modifier ${row.character.name}`} onClick={()=>setEditing(row)} className={`${action} flex-1 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-400/10 dark:text-emerald-300 dark:hover:bg-emerald-400/20`}><Pencil size={16}/>Modifier</button><button aria-label={`Supprimer ${row.character.name}`} title="Supprimer" onClick={()=>{setError("");setDeleting(row)}} className={`${action} text-rose-600 hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-400/10`}><Trash2 size={18}/></button></div>
        </div>
      </article>)}
    </div>:<div className="rounded-2xl border border-dashed border-slate-200 py-12 text-center dark:border-white/15"><Heart className="mx-auto text-emerald-500" size={32}/><h2 className="mt-3 text-lg font-bold dark:text-white">{rows.length?"Aucun personnage ne correspond":"Votre univers commence ici"}</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{rows.length?"Essayez un autre nom ou ajustez les filtres.":"Créez votre premier héros, son portrait et son histoire."}</p>{!rows.length&&!error&&<button onClick={()=>setCreating(true)} className={`${action} mt-4 bg-emerald-600 text-white hover:bg-emerald-500`}><Plus size={17}/>Créer un personnage</button>}</div>}
    {(creating||editing)&&<CharacterDialog row={editing} close={()=>{setCreating(false);setEditing(null)}} saved={text=>{setMessage(text);setCreating(false);setEditing(null);void load()}}/>}
    {deleting&&<CharacterModal close={()=>setDeleting(null)} busy={busy} titleId="delete-character-title"><div className="p-6"><h2 id="delete-character-title" className="text-xl font-black dark:text-white">Supprimer ce personnage ?</h2><p className="mt-3 text-sm text-slate-500 dark:text-slate-300">La fiche de <strong>{deleting.character.name}</strong> sera supprimée. Ses images resteront dans la médiathèque.</p>{error&&<p role="alert" className="mt-3 text-sm text-rose-600 dark:text-rose-300">{error}</p>}<div className="mt-5 flex justify-end gap-2"><button disabled={busy} onClick={()=>setDeleting(null)} className={`${action} border border-slate-200 dark:border-white/15 dark:text-white`}>Annuler</button><button disabled={busy} onClick={()=>void remove()} className={`${action} bg-rose-600 text-white hover:bg-rose-500`}>{busy?<LoaderCircle size={17} className="animate-spin"/>:<Trash2 size={17}/>}Supprimer</button></div></div></CharacterModal>}
  </div>;
}
