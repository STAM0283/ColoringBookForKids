"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, BookOpen, CheckCircle2, ImagePlus, LoaderCircle, Save } from "lucide-react";
import { htmlToMarkdown } from "@/lib/rich-text";
import { BookGallery, BookVideoManager } from "./book-management-list";
import { MarkdownEditor } from "./markdown-editor";
import { AdminSelect } from "./admin-select";

type Book = {
  id: string; title: string; shortDescription: string; description: string; categoryId: string | null;
  ageMin: number; ageMax: number; pageCount: number; amazonUrl: string | null; pricingType: "FREE" | "PAID";
  priceCents: number | null; featured: boolean; published: boolean;
};
type Row = { book: Book; cover: { path: string; alt: string | null } | null };
type Category = { id: string; name: string };

const input = "mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100";

export function BookEditPage({ bookId }: { bookId: string }) {
  const [row, setRow] = useState<Row | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [description, setDescription] = useState("");
  const [pricing, setPricing] = useState<"FREE" | "PAID">("PAID");
  const [categoryId, setCategoryId] = useState("");
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
      if (found) { setDescription(htmlToMarkdown(found.book.description)); setPricing(found.book.pricingType); setCategoryId(found.book.categoryId ?? ""); }
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
    <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
      <Link href="/admin/livres" className="inline-flex min-h-11 items-center gap-2 rounded-xl border bg-white px-4 font-bold text-slate-600 shadow-sm transition hover:-translate-x-1 hover:text-emerald-700"><ArrowLeft size={18}/>Retour à la liste</Link>
      <p className="text-sm font-semibold text-slate-400">Les médias déjà liés sont conservés.</p>
    </div>
    <header className="mb-7 flex items-center gap-4"><span className="grid size-12 place-items-center rounded-2xl bg-emerald-100 text-emerald-700"><BookOpen/></span><div><p className="text-xs font-black uppercase tracking-[.18em] text-emerald-700">Catalogue</p><h1 className="text-3xl font-black tracking-tight text-slate-950">Modifier le livre</h1><p className="mt-1 text-slate-500">Mettez à jour sa fiche, sa couverture et ses contenus associés.</p></div></header>

    <form onSubmit={submit} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-8">
      <div className="grid gap-8 lg:grid-cols-[1fr_310px]">
        <div className="grid gap-5">
          <Field label="Titre"><input className={input} name="title" required minLength={2} defaultValue={book.title}/></Field>
          <Field label="Résumé court"><textarea className={`${input} min-h-24 py-3`} name="shortDescription" required minLength={10} maxLength={300} defaultValue={book.shortDescription}/></Field>
          <MarkdownEditor name="description" value={description} onChange={setDescription}/>
        </div>
        <aside className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4">
          <p className="flex items-center gap-2 font-black text-slate-900"><ImagePlus size={18} className="text-emerald-700"/>Couverture</p>
          <div className="relative mt-4 aspect-square overflow-hidden rounded-2xl border bg-white">{displayedCover ? <Image unoptimized fill src={displayedCover} alt={row.cover?.alt ?? book.title} className="object-contain"/> : <span className="grid h-full place-items-center text-sm text-slate-400">Aucune couverture</span>}</div>
          <label className="mt-4 block cursor-pointer rounded-xl bg-emerald-700 px-4 py-3 text-center text-sm font-black text-white">Remplacer la couverture<input hidden name="cover" type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={event => setCover(event.target.files?.[0] ?? null)}/></label>
          {cover && <p className="mt-2 truncate text-xs font-semibold text-slate-500">{cover.name}</p>}
        </aside>
      </div>

      <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Âge minimum"><input className={input} name="ageMin" type="number" min="0" max="18" defaultValue={book.ageMin} required/></Field>
        <Field label="Âge maximum"><input className={input} name="ageMax" type="number" min="0" max="18" defaultValue={book.ageMax} required/></Field>
        <Field label="Nombre de pages"><input className={input} name="pageCount" type="number" min="1" max="1000" defaultValue={book.pageCount} required/></Field>
        <div><input type="hidden" name="categoryId" value={categoryId}/><AdminSelect label="Catégorie" value={categoryId} options={[{value:"",label:"Sans catégorie"},...categories.map(category=>({value:category.id,label:category.name}))]} onChange={setCategoryId}/></div>
      </div>

      <section className="mt-7 rounded-2xl border border-emerald-100 bg-emerald-50/40 p-5"><h2 className="font-black text-slate-950">Tarification et destination</h2><div className="mt-4 flex flex-wrap gap-3">{(["FREE", "PAID"] as const).map(value => <label key={value} className={`cursor-pointer rounded-xl border px-5 py-3 font-bold ${pricing === value ? "border-emerald-600 bg-white text-emerald-700 shadow-sm" : "bg-white text-slate-500"}`}><input className="mr-2 accent-emerald-700" type="radio" checked={pricing === value} onChange={() => setPricing(value)}/>{value === "FREE" ? "Gratuit" : "Payant"}</label>)}</div>{pricing === "PAID" && <div className="mt-4 grid gap-4 md:grid-cols-2"><Field label="Prix indicatif Amazon (€)"><input className={input} name="price" type="number" min="0.01" step="0.01" defaultValue={book.priceCents ? (book.priceCents / 100).toFixed(2) : ""}/></Field><Field label="Lien Amazon"><input className={input} name="amazonUrl" type="url" defaultValue={book.amazonUrl ?? ""} placeholder="https://…"/></Field></div>}{pricing === "FREE" && <input type="hidden" name="amazonUrl" value=""/>}</section>

      <div className="mt-7 rounded-2xl bg-slate-50 p-5"><label className="flex items-center gap-3 font-bold text-slate-800"><input className="size-5 accent-emerald-700" type="checkbox" name="published" defaultChecked={book.published}/>Publié sur le site</label></div>
      {message && <p role="status" className={`mt-6 flex items-center gap-2 rounded-xl p-4 font-bold ${message.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"}`}>{message.ok && <CheckCircle2 size={19}/>} {message.text}</p>}
      <div className="mt-7 flex flex-wrap justify-end gap-3"><Link href="/admin/livres" className="inline-flex min-h-12 items-center justify-center rounded-xl border px-6 font-bold text-slate-600">Annuler</Link><button disabled={saving} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-slate-950 px-7 font-black text-white shadow-lg transition hover:bg-emerald-800 disabled:opacity-60">{saving ? <LoaderCircle className="animate-spin" size={19}/> : <Save size={19}/>} {saving ? "Enregistrement…" : "Enregistrer les modifications"}</button></div>
    </form>
    <section className="mt-7 grid gap-7"><BookGallery bookId={bookId}/><BookVideoManager bookId={bookId}/></section>
  </div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block text-sm font-bold text-slate-700">{label}{children}</label>; }
