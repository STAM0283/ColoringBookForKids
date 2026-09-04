"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminSelect } from "./admin-select";
import { BookOpen, ArrowUpRight, LoaderCircle, Gift, Globe2, Instagram, ShieldCheck } from "lucide-react";

export type AccessLevel = "PUBLIC" | "CLUB" | "BUYER";

export function AccessBookSelect({ value, onChange, required = true }: { value: string; onChange: (value: string) => void; required?: boolean }) {
  const [books, setBooks] = useState<Array<{ id: string; slug: string; title: string; language: string }>>([]);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setError(false); setLoading(true);
    fetch("/api/admin/books", { cache: "no-store", signal: controller.signal })
      .then(async response => { if (!response.ok) throw new Error(); return response.json(); })
      .then((data: { items: Array<{ book: { id: string; slug: string; title: string; language: string } }> }) => setBooks(data.items.map(row => row.book)))
      .catch(() => { if (!controller.signal.aborted) setError(true); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [attempt]);
  const selected = books.find(book => book.id === value);
  return <div className="min-w-0 space-y-2">
    <input type="hidden" name="accessBookId" value={value}/>
    {loading ? <p role="status" className="flex min-h-14 items-center gap-2 rounded-2xl border px-4 text-sm text-slate-500 dark:border-white/10 dark:text-slate-400"><LoaderCircle size={17} className="animate-spin"/>Chargement des livres…</p> : <AdminSelect label={required ? "Livre associé" : "Portée du code"} icon={<BookOpen size={18}/>} value={value} onChange={onChange} options={[
      { value: "", label: required ? "Choisir le livre acheté" : "Club Instagram — tous les PDF du Club" },
      ...(value && !selected ? [{ value, label: "Livre associé indisponible" }] : []),
      ...books.map(book => ({ value: book.id, label: `${book.title} · ${book.language}` })),
    ]}/>}
    {selected && <div className="flex items-start gap-3 rounded-xl border border-emerald-200/60 bg-emerald-50/50 p-3 dark:border-emerald-400/20 dark:bg-emerald-400/5"><BookOpen size={18} className="mt-1 shrink-0 text-emerald-700 dark:text-emerald-300"/><div className="min-w-0"><p className="text-[10px] font-black uppercase tracking-wide text-emerald-700 dark:text-emerald-300">Lié à ce livre uniquement</p><p className="mt-1 break-words text-sm font-bold text-slate-900 dark:text-white">{selected.title}</p><div className="mt-2 flex flex-wrap gap-x-4 gap-y-2"><Link target="_blank" rel="noopener noreferrer" href={`/admin/livres/${selected.id}/modifier`} className="inline-flex min-h-8 items-center gap-1 text-xs font-bold text-emerald-700 underline-offset-4 hover:underline dark:text-emerald-300">Ouvrir la fiche <ArrowUpRight size={14}/></Link><Link target="_blank" rel="noopener noreferrer" href={`${selected.language === "EN" ? "/en/books" : "/livres"}/${selected.slug}`} className="inline-flex min-h-8 items-center gap-1 text-xs font-semibold text-slate-500 underline-offset-4 hover:underline dark:text-slate-400">Voir côté visiteur <ArrowUpRight size={14}/></Link></div></div></div>}
    {error && <p role="alert" className="text-xs text-rose-600 dark:text-rose-300">Livres indisponibles. <button type="button" onClick={() => setAttempt(current => current + 1)} className="font-bold underline">Réessayer</button></p>}
  </div>;
}

export function PdfAccessSettings({ value, onChange, kind = "book", buyerBookId = "", onBuyerBookChange }: {
  value: AccessLevel; onChange: (value: AccessLevel) => void; kind?: "book" | "activity";
  buyerBookId?: string; onBuyerBookChange?: (value: string) => void;
}) {
  const choices = [
    { value: "PUBLIC" as const, title: "Tout le monde", description: "PDF accessible sans compte ni code.", icon: Globe2 },
    { value: "CLUB" as const, title: "Club Instagram", description: "Le parent utilise son code Club.", icon: Instagram },
    { value: "BUYER" as const, title: "Bonus acheteur", description: "Un code limité au livre acheté.", icon: Gift },
  ];
  return <fieldset className="pdf-access-settings min-w-0 rounded-2xl border border-emerald-200/70 bg-emerald-50/40 p-4 dark:border-emerald-400/20 dark:bg-emerald-400/[.04]">
    <legend className="px-2 text-sm font-black text-slate-900 dark:text-slate-100">Qui peut consulter et télécharger le PDF ?</legend>
    <div className="pdf-access-options grid gap-2">
      {choices.map(choice => <label key={choice.value} className={`relative flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors focus-within:ring-2 focus-within:ring-emerald-400 motion-reduce:transition-none ${value === choice.value ? "border-emerald-600 bg-emerald-50 dark:border-emerald-400/60 dark:bg-emerald-400/10" : "border-slate-200 bg-white hover:border-emerald-300 dark:border-white/10 dark:bg-slate-950/30 dark:hover:border-emerald-400/40"}`}>
        <input type="radio" name="accessLevel" value={choice.value} checked={value === choice.value} onChange={() => onChange(choice.value)} className="mt-1 size-4 shrink-0 accent-emerald-600"/>
        <span className="min-w-0 flex-1"><span className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100"><choice.icon size={16} className="shrink-0 text-emerald-700 dark:text-emerald-300"/>{choice.title}</span><span className="mt-1 block text-xs leading-5 text-slate-500 dark:text-slate-400">{choice.description}</span></span>
      </label>)}
    </div>
    {value === "BUYER" && kind === "activity" && <div className="mt-3"><AccessBookSelect value={buyerBookId} onChange={onBuyerBookChange ?? (() => undefined)}/></div>}
    <p className="mt-3 flex items-start gap-2 text-xs leading-5 text-slate-500 dark:text-slate-400"><ShieldCheck size={15} className="mt-0.5 shrink-0"/>{value === "PUBLIC" ? "Accès immédiat, adapté aux enfants. La fiche et les aperçus restent publics." : value === "CLUB" ? "Vérifiez l’appartenance au Club auprès du parent, puis générez un code dans Outils → Codes d’accès." : "Après vérification de l’achat auprès du parent, générez un code lié au livre dans Outils → Codes d’accès. Il n’ouvre pas les autres bonus."}</p>
  </fieldset>;
}
