"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { BookOpen, Heart, ImagePlus, LoaderCircle, Save, Sparkles, X } from "lucide-react";
import { MarkdownEditor } from "./markdown-editor";
import { AdminSelect } from "./admin-select";
import type { CharacterRow } from "./character-manager";

const blank = { language: "FR" as "FR" | "EN", name: "", shortDescription: "", biography: "", ageLabel: "", species: "", personality: "", hobbies: "", motto: "", color: "#0F8A68", published: true, sortOrder: 0 };
const colors = ["#0F8A68", "#0891B2", "#2563EB", "#7C3AED", "#DB2777", "#EA580C", "#D97706", "#475569"];
const input = "mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 dark:border-white/15 dark:bg-slate-950/40 dark:text-slate-100 dark:placeholder:text-slate-500";

export function CharacterDialog({ row, close, saved }: { row: CharacterRow | null; close: () => void; saved: (text: string) => void }) {
  const initial = row?.character ?? blank;
  const [value, setValue] = useState({ ...initial, biography: initial.biography || "", ageLabel: initial.ageLabel || "", species: initial.species || "", personality: initial.personality || "", hobbies: initial.hobbies || "", motto: initial.motto || "" });
  const [tab, setTab] = useState<"identity" | "story">("identity");
  const [portrait, setPortrait] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const pending = useRef(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!portrait) { setPreview(""); return; }
    const url = URL.createObjectURL(portrait); setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [portrait]);
  const picture = preview || (row?.portrait ? `/media/${row.portrait.path}` : "");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (pending.current) return;
    if (value.name.trim().length < 2 || value.shortDescription.trim().length < 10) { setTab("identity"); setError("Ajoutez un nom (2 caractères minimum) et une présentation (10 caractères minimum)."); return; }
    pending.current = true; setLoading(true); setError("");
    try {
      const form = new FormData();
      Object.entries(value).forEach(([key, val]) => form.set(key, String(val)));
      if (portrait) form.set("portrait", portrait);
      const response = await fetch(row ? `/api/admin/characters/${row.character.id}` : "/api/admin/characters", { method: row ? "PATCH" : "POST", body: form });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.message || "Enregistrement impossible.");
      saved(data?.message || "Personnage enregistré.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Connexion impossible. Veuillez réessayer."); }
    finally { pending.current = false; setLoading(false); }
  }

  return <CharacterModal close={close} busy={loading} titleId="character-title">
    <form onSubmit={submit} className="flex flex-col">
      <header className="flex shrink-0 items-center gap-3 border-b border-slate-100 bg-emerald-50/50 p-4 dark:border-white/10 dark:bg-emerald-400/5 sm:px-6">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-emerald-600 text-white"><Heart size={22}/></span>
        <div className="min-w-0 flex-1"><p className="text-[10px] font-black uppercase tracking-[.18em] text-emerald-700 dark:text-emerald-300">L’atelier des personnages</p><h2 id="character-title" className="text-xl font-black text-slate-950 dark:text-white">{row ? "Modifier le personnage" : "Créer un personnage"}</h2></div>
        <button type="button" disabled={loading} onClick={close} aria-label="Fermer" className="grid size-10 shrink-0 place-items-center rounded-full border border-slate-200 text-slate-500 transition hover:rotate-90 hover:bg-white dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/10"><X size={20}/></button>
      </header>
      <div role="tablist" aria-label="Sections du personnage" className="flex shrink-0 gap-2 border-b border-slate-100 px-4 py-3 dark:border-white/10 sm:px-6">
        {[{ id: "identity" as const, title: "L’essentiel", icon: Sparkles }, { id: "story" as const, title: "Histoire & personnalité", icon: BookOpen }].map(item => <button key={item.id} id={`character-tab-${item.id}`} aria-controls="character-panel" aria-selected={tab === item.id} role="tab" type="button" onClick={() => setTab(item.id)} onKeyDown={event => { if (event.key === "ArrowLeft" || event.key === "ArrowRight") { event.preventDefault(); const next = tab === "identity" ? "story" : "identity"; setTab(next); document.getElementById(`character-tab-${next}`)?.focus(); } }} className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-3 text-xs font-bold transition sm:text-sm ${tab === item.id ? "bg-emerald-600 text-white shadow-sm" : "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/5"}`}><item.icon size={16}/>{item.title}</button>)}
      </div>
      <div className="p-4 sm:p-6">
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_260px]">
          <div id="character-panel" role="tabpanel" aria-labelledby={`character-tab-${tab}`} className="min-w-0 space-y-4">
            {tab === "identity" ? <>
              <div className="grid items-end gap-3 sm:grid-cols-[1fr_190px]"><Field label="Nom" count={value.name.length} max={80} required><input autoComplete="off" required minLength={2} maxLength={80} value={value.name} placeholder="Ex. Piko le hérisson" onChange={event => setValue({ ...value, name: event.target.value })} className={input}/></Field><AdminSelect label="Langue" value={value.language} options={[{value:"FR",label:"🇫🇷 Français"},{value:"EN",label:"🇬🇧 Anglais"}]} onChange={language => setValue({ ...value, language: language as "FR" | "EN" })}/></div>
              <MarkdownEditor label="Présentation courte" value={value.shortDescription} onChange={shortDescription => setValue({ ...value, shortDescription })} maximumLength={240} minimumLength={10} compact help="Gras, italique, listes… Vérifiez le résultat dans l’aperçu."/>
              <div className="grid gap-3 sm:grid-cols-2"><Field label="Espèce ou type"><input maxLength={80} value={value.species} placeholder="Ex. Hérisson, fée…" onChange={event => setValue({ ...value, species: event.target.value })} className={input}/></Field><Field label="Âge du personnage"><input maxLength={50} value={value.ageLabel} placeholder="Ex. 6 ans, intemporel…" onChange={event => setValue({ ...value, ageLabel: event.target.value })} className={input}/></Field></div>
              <Field label="Devise"><input maxLength={180} value={value.motto} placeholder="Sa petite phrase préférée…" onChange={event => setValue({ ...value, motto: event.target.value })} className={input}/></Field>
              <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">Seuls le nom et la présentation sont nécessaires. Enrichissez ensuite son histoire dans le second onglet.</p>
            </> : <>
              <MarkdownEditor label="Biographie" value={value.biography} onChange={biography => setValue({ ...value, biography })} maximumLength={3000} minimumLength={0} required={false} compact help="Ses origines, son univers, ses aventures…"/>
              <div className="grid min-w-0 gap-4 sm:grid-cols-2">
                <MarkdownEditor label="Personnalité" value={value.personality} onChange={personality => setValue({ ...value, personality })} maximumLength={500} minimumLength={0} required={false} compact help="Ses qualités, ses traits de caractère…"/>
                <MarkdownEditor label="Passions & loisirs" value={value.hobbies} onChange={hobbies => setValue({ ...value, hobbies })} maximumLength={500} minimumLength={0} required={false} compact help="Ce qu’il aime faire et découvrir…"/>
              </div>
            </>}
          </div>
          <aside className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-3 dark:border-white/10 dark:bg-white/[.025]">
            <div className="relative mx-auto grid aspect-[4/3] max-h-44 w-full place-items-center overflow-hidden rounded-xl" style={{background: `linear-gradient(145deg,${value.color}25,${value.color}08)`}}>
              {picture ? <Image fill unoptimized sizes="260px" src={picture} alt={value.name || "Aperçu du portrait"} className="object-contain p-3"/> : <Heart size={48} style={{color:value.color}} strokeWidth={1.3}/>}
            </div>
            <p className="break-words text-center text-sm font-black text-slate-900 dark:text-white">{value.name || "Votre futur héros"}</p>
            <label className="relative flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-white px-3 text-xs font-bold text-emerald-700 transition hover:bg-emerald-50 focus-within:ring-2 focus-within:ring-emerald-500 dark:border-emerald-400/25 dark:bg-emerald-400/10 dark:text-emerald-300"><ImagePlus size={16}/>{picture ? "Remplacer le portrait" : "Ajouter un portrait"}<input type="file" accept="image/jpeg,image/png,image/webp,image/avif" aria-label="Choisir un portrait" className="absolute inset-0 cursor-pointer opacity-0" disabled={loading} onChange={event => setPortrait(event.target.files?.[0] || null)}/></label>
            {portrait && <button type="button" onClick={() => setPortrait(null)} className="w-full text-xs font-semibold text-slate-500 dark:text-slate-400">Annuler le nouveau portrait</button>}
            <div><p className="mb-2 text-xs font-bold text-slate-600 dark:text-slate-300">Sa couleur</p><div className="flex flex-wrap gap-2">{colors.map(color => <button key={color} type="button" aria-label={`Couleur ${color}`} aria-pressed={value.color === color} onClick={() => setValue({ ...value, color })} className={`size-7 rounded-full border-2 transition hover:scale-110 focus-visible:ring-2 focus-visible:ring-emerald-400 ${value.color === color ? "border-white ring-2 ring-slate-400 dark:ring-slate-200" : "border-transparent"}`} style={{background:color}}/>)}<input type="color" aria-label="Couleur personnalisée" value={value.color} onChange={event => setValue({ ...value, color:event.target.value.toUpperCase() })} className="h-7 w-9 cursor-pointer rounded border border-slate-200 bg-transparent p-0 dark:border-white/15"/></div></div>
            <div className="grid grid-cols-[1fr_80px] items-center gap-2 border-t border-slate-200 pt-3 dark:border-white/10"><label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200"><input type="checkbox" checked={value.published} onChange={event => setValue({ ...value, published:event.target.checked })} className="size-4 accent-emerald-600"/>Publié</label><label className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Ordre<input type="number" min={0} max={9999} value={value.sortOrder} onChange={event => setValue({ ...value, sortOrder:Number(event.target.value) })} className="mt-1 min-h-9 w-full rounded-lg border bg-white px-2 text-sm dark:border-white/15 dark:bg-slate-950/40 dark:text-white"/></label></div>
          </aside>
        </div>
        {error && <p role="alert" className="mt-4 rounded-xl bg-rose-50 p-3 text-sm font-bold text-rose-700 dark:bg-rose-400/10 dark:text-rose-300">{error}</p>}
      <footer className="mt-5 flex flex-wrap items-center justify-end gap-2 pb-2 pt-3"><button type="button" disabled={loading} onClick={close} className="min-h-11 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-600 hover:bg-white dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5">Annuler</button><button disabled={loading} className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-black text-white shadow-md transition hover:-translate-y-0.5 hover:bg-emerald-500 disabled:opacity-50">{loading ? <LoaderCircle size={17} className="animate-spin"/> : <Save size={17}/>} {loading ? "Enregistrement…" : row ? "Enregistrer" : "Créer le personnage"}</button></footer>
      </div>
    </form>
  </CharacterModal>;
}

function Field({ label, children, count, max, required }: { label: string; children: React.ReactNode; count?: number; max?: number; required?: boolean }) {
  return <label className="block min-w-0"><span className="flex items-center justify-between gap-2 text-xs font-bold text-slate-700 dark:text-slate-200"><span>{label}{required && <span aria-hidden="true" className="ml-1 text-rose-500">*</span>}</span>{max && <span className="text-[10px] font-medium tabular-nums text-slate-400">{count}/{max}</span>}</span>{children}</label>;
}

export function CharacterModal({ children, close, busy = false, titleId }: { children: React.ReactNode; close: () => void; busy?: boolean; titleId: string }) {
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null, overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden"; panel.current?.focus();
    return () => { document.body.style.overflow = overflow; previous?.focus(); };
  }, []);
  useEffect(() => {
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape" && !busy && !document.querySelector('[role="listbox"]')) close(); };
    window.addEventListener("keydown", escape);
    return () => window.removeEventListener("keydown", escape);
  }, [busy, close]);
  return createPortal(<div className="fixed inset-0 z-[130] flex flex-col items-center overflow-y-auto overscroll-contain bg-slate-950/75 p-2 backdrop-blur-md sm:p-5" onMouseDown={event => { if (event.target === event.currentTarget && !busy) close(); }}><div ref={panel} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby={titleId} className="my-auto flex w-full max-w-5xl shrink-0 flex-col overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-2xl outline-none dark:border-white/10 dark:bg-slate-900" onKeyDown={event => {
    if (event.key !== "Tab" || document.querySelector('[role="listbox"]')) return;
    const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), textarea:not(:disabled), select:not(:disabled), a[href]')).filter(control => control.getClientRects().length > 0);
    const first = controls[0], last = controls.at(-1);
    if (event.shiftKey && (document.activeElement === first || document.activeElement === panel.current)) { event.preventDefault(); last?.focus(); }
    if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  }}>{children}</div></div>, document.body);
}
