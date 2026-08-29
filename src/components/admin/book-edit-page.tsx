"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, BookOpen, CheckCircle2, ImagePlus, Languages, LoaderCircle, Save, ShieldCheck, Sparkles } from "lucide-react";
import { htmlToMarkdown } from "@/lib/rich-text";
import { BookGallery, BookVideoManager } from "./book-management-list";
import { MarkdownEditor } from "./markdown-editor";
import { AdminSelect } from "./admin-select";
import { AdminFormField } from "./admin-form-field";

type Book = {
  id: string; language: "FR" | "EN"; title: string; shortDescription: string; description: string; categoryId: string | null;
  ageMin: number; ageMax: number; pageCount: number; amazonUrl: string | null; pricingType: "FREE" | "PAID";
  priceCents: number | null; featured: boolean; published: boolean;
};
type Row = { book: Book; cover: { path: string; alt: string | null } | null };
type Category = { id: string; name: string };

const input = "mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100 dark:border-white/10 dark:bg-white/[.045] dark:text-slate-100 dark:placeholder:text-slate-500 dark:hover:border-white/20 dark:focus:border-emerald-400 dark:focus:bg-white/[.07] dark:focus:ring-emerald-400/15";

export function BookEditPage({ bookId }: { bookId: string }) {
  const [row, setRow] = useState<Row | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [description, setDescription] = useState("");
  const [pricing, setPricing] = useState<"FREE" | "PAID">("PAID");
  const [categoryId, setCategoryId] = useState("");
  const [language, setLanguage] = useState<"FR" | "EN">("FR");
  const [cover, setCover] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/books", { cache: "no-store" }).then(response => response.json()),
      fetch("/api/admin/activity-categories", { cache: "no-store" }).then(response => response.json()),
    ]).then(([bookData, categoryData]: [{ items?: Row[] }, { items?: Category[] }]) => {
      const found = bookData.items?.find(item => item.book.id === bookId) ?? null;
      setRow(found); setCategories(categoryData.items ?? []);
      if (found) { setDescription(htmlToMarkdown(found.book.description)); setPricing(found.book.pricingType); setCategoryId(found.book.categoryId ?? ""); setLanguage(found.book.language); }
    }).catch(() => setMessage({ ok: false, text: "Impossible de charger ce livre." })).finally(() => setLoading(false));
  }, [bookId]);

  useEffect(() => {
    if (!cover) { setCoverPreview(null); return; }
    const url = URL.createObjectURL(cover); setCoverPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [cover]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setMessage(null);
    const form = new FormData(event.currentTarget);
    form.set("description", description); form.set("pricingType", pricing);
    form.set("published", form.get("published") === "on" ? "true" : "false");
    if (!cover) form.delete("cover");
    const response = await fetch(`/api/admin/books/${bookId}`, { method: "PATCH", body: form });
    const data = await response.json().catch(() => null) as { message?: string } | null;
    setSaving(false); setMessage({ ok: response.ok, text: data?.message ?? (response.ok ? "Livre modifié avec succès." : "Modification impossible.") });
    if (response.ok && coverPreview) setRow(current => current ? { ...current, cover: { path: coverPreview, alt: `Couverture de ${form.get("title")}` } } : current);
  }

  if (loading) return <div className="grid min-h-[55vh] place-items-center"><LoaderCircle className="animate-spin text-emerald-700" size={38}/></div>;
  if (!row) return <div className="mx-auto max-w-3xl rounded-3xl border bg-white p-10 text-center shadow-sm"><h1 className="text-2xl font-black">Livre introuvable</h1><Link href="/admin/livres" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 font-bold text-white"><ArrowLeft size={18}/>Retour aux livres</Link></div>;
  const book = row.book;
  const displayedCover = coverPreview ?? (row.cover ? `/media/${row.cover.path}` : null);

  return <div className="mx-auto max-w-6xl pb-12">
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
      <Link href="/admin/livres" className="group inline-flex min-h-12 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 font-black text-slate-700 shadow-sm transition hover:-translate-x-1 hover:border-emerald-300 hover:text-emerald-700 hover:shadow-md dark:border-white/10 dark:bg-white/[.045] dark:text-slate-200 dark:hover:border-emerald-400/40 dark:hover:bg-emerald-400/10 dark:hover:text-emerald-300"><span className="grid size-8 place-items-center rounded-xl bg-slate-100 transition group-hover:bg-emerald-50 dark:bg-white/10 dark:group-hover:bg-emerald-400/15"><ArrowLeft size={17}/></span>Retour à la liste</Link>
      <p className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-4 py-2 text-xs font-black text-emerald-800 dark:border-emerald-400/35 dark:bg-emerald-400/10 dark:text-emerald-300"><ShieldCheck size={16}/>Les médias liés sont conservés</p>
    </div>
    <header className="relative mb-7 overflow-hidden rounded-[2rem] border border-emerald-100 bg-gradient-to-br from-[#103f35] via-[#17624f] to-[#2f8069] p-6 text-white shadow-xl sm:p-8"><span className="pointer-events-none absolute -right-12 -top-16 size-48 rounded-full bg-white/10 blur-2xl"/><span className="pointer-events-none absolute bottom-0 right-28 size-24 rounded-full bg-amber-300/15 blur-xl"/><div className="relative flex items-center gap-5"><span className="grid size-16 shrink-0 place-items-center rounded-[1.35rem] border border-white/20 bg-white/15 text-emerald-50 shadow-inner backdrop-blur"><BookOpen size={29}/></span><div><p className="flex items-center gap-2 text-xs font-black uppercase tracking-[.2em] text-emerald-100"><Sparkles size={14}/>Catalogue</p><h1 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">Modifier le livre</h1><p className="mt-2 max-w-2xl text-sm leading-relaxed text-emerald-50/75 sm:text-base">Mettez à jour sa fiche, sa couverture et ses contenus associés dans un espace unique.</p></div></div></header>

    <form onSubmit={submit} className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_24px_70px_-45px_rgba(15,23,42,.45)] dark:border-white/10 dark:bg-slate-900 dark:text-slate-100 md:p-8">
      <div className="mb-7 flex items-center justify-between gap-4 border-b border-slate-100 pb-5 dark:border-white/10"><div><p className="text-[10px] font-black uppercase tracking-[.18em] text-emerald-700 dark:text-emerald-300">Informations principales</p><h2 className="mt-1 text-xl font-black text-slate-950 dark:text-white">Identité du livre</h2></div><span className={`rounded-full px-3 py-1.5 text-xs font-black ${language==="EN"?"bg-blue-50 text-blue-700 dark:bg-blue-400/10 dark:text-blue-300":"bg-violet-50 text-violet-700 dark:bg-violet-400/10 dark:text-violet-300"}`}>{language==="EN"?"🇬🇧 Version anglaise":"🇫🇷 Version française"}</span></div>
      <div className="grid gap-8 lg:grid-cols-[1fr_310px]">
        <div className="grid gap-5">
          <div className="grid items-end gap-4 sm:grid-cols-[240px_1fr]"><div><input type="hidden" name="language" value={language}/><AdminSelect label="Langue du livre" icon={<Languages size={18}/>} value={language} options={[{value:"FR",label:"🇫🇷 Français"},{value:"EN",label:"🇬🇧 Anglais"}]} onChange={value=>setLanguage(value as "FR"|"EN")}/></div><Field label="Titre"><input className={input} name="title" required minLength={2} maxLength={150} defaultValue={book.title}/></Field></div>
          <Field label="Résumé court"><textarea className={`${input} min-h-24 py-3`} name="shortDescription" required minLength={10} maxLength={300} defaultValue={book.shortDescription}/></Field>
          <MarkdownEditor name="description" value={description} onChange={setDescription}/>
        </div>
        <aside className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4 dark:border-emerald-400/25 dark:bg-emerald-400/[.07]">
          <p className="flex items-center gap-2 font-black text-slate-900 dark:text-white"><ImagePlus size={18} className="text-emerald-700 dark:text-emerald-300"/>Couverture</p>
          <div className="relative mt-4 aspect-square overflow-hidden rounded-2xl border bg-white dark:border-white/10 dark:bg-slate-950/65">{displayedCover ? <Image unoptimized fill src={displayedCover} alt={row.cover?.alt ?? book.title} className="object-contain"/> : <span className="grid h-full place-items-center text-sm text-slate-400">Aucune couverture</span>}</div>
          <label className="mt-4 block cursor-pointer rounded-xl bg-emerald-700 px-4 py-3 text-center text-sm font-black text-white">Remplacer la couverture<input hidden name="cover" type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={event => setCover(event.target.files?.[0] ?? null)}/></label>
          {cover && <p className="mt-2 truncate text-xs font-semibold text-slate-500">{cover.name}</p>}
        </aside>
      </div>

      <div className="mt-7 grid items-end gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Âge minimum"><input className={input} name="ageMin" type="number" min="0" max="18" defaultValue={book.ageMin} required/></Field>
        <Field label="Âge maximum"><input className={input} name="ageMax" type="number" min="0" max="18" defaultValue={book.ageMax} required/></Field>
        <Field label="Nombre de pages"><input className={input} name="pageCount" type="number" min="1" max="1000" defaultValue={book.pageCount} required/></Field>
        <div><input type="hidden" name="categoryId" value={categoryId}/><AdminSelect label="Catégorie" value={categoryId} options={[{value:"",label:"Sans catégorie"},...categories.map(category=>({value:category.id,label:category.name}))]} onChange={setCategoryId}/></div>
      </div>

      <section className="mt-7 rounded-2xl border border-emerald-100 bg-emerald-50/40 p-5 dark:border-emerald-400/25 dark:bg-emerald-400/[.07]"><h2 className="font-black text-slate-950 dark:text-white">Tarification et destination</h2><div className="mt-4 flex flex-wrap gap-3">{(["FREE", "PAID"] as const).map(value => <label key={value} className={`cursor-pointer rounded-xl border px-5 py-3 font-bold transition ${pricing === value ? "border-emerald-600 bg-white text-emerald-700 shadow-sm dark:border-emerald-400 dark:bg-emerald-400/15 dark:text-emerald-300" : "bg-white text-slate-500 dark:border-white/10 dark:bg-white/[.045] dark:text-slate-300"}`}><input className="mr-2 accent-emerald-700" type="radio" checked={pricing === value} onChange={() => setPricing(value)}/>{value === "FREE" ? "Gratuit" : "Payant"}</label>)}</div>{pricing === "PAID" && <div className="mt-4 grid items-end gap-4 md:grid-cols-2"><Field label="Prix indicatif Amazon (€)"><input className={input} name="price" type="number" min="0.01" step="0.01" defaultValue={book.priceCents ? (book.priceCents / 100).toFixed(2) : ""}/></Field><Field label="Lien Amazon"><input className={input} name="amazonUrl" type="url" defaultValue={book.amazonUrl ?? ""} placeholder="https://…"/></Field></div>}{pricing === "FREE" && <input type="hidden" name="amazonUrl" value=""/>}</section>

      <div className="mt-7 rounded-2xl bg-slate-50 p-5 dark:bg-white/[.045]"><label className="flex items-center gap-3 font-bold text-slate-800 dark:text-slate-100"><input className="size-5 accent-emerald-700" type="checkbox" name="published" defaultChecked={book.published}/>Publié sur le site</label></div>
      {message && <p role="status" className={`mt-6 flex items-center gap-2 rounded-xl p-4 font-bold ${message.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"}`}>{message.ok && <CheckCircle2 size={19}/>} {message.text}</p>}
      <div className="mt-7 flex flex-wrap justify-end gap-3"><Link href="/admin/livres" className="inline-flex min-h-12 items-center justify-center rounded-xl border px-6 font-bold text-slate-600 transition hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/[.06]">Annuler</Link><button disabled={saving} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-slate-950 px-7 font-black text-white shadow-lg transition hover:bg-emerald-800 disabled:opacity-60 dark:bg-emerald-700 dark:hover:bg-emerald-600">{saving ? <LoaderCircle className="animate-spin" size={19}/> : <Save size={19}/>} {saving ? "Enregistrement…" : "Enregistrer les modifications"}</button></div>
    </form>
    <section className="mt-7 grid gap-7"><BookGallery bookId={bookId}/><BookVideoManager bookId={bookId}/></section>
  </div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <AdminFormField label={label}>{children}</AdminFormField>; }
