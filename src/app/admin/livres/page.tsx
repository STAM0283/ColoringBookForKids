import Link from "next/link";
import { Plus } from "lucide-react";
import { BookManagementList } from "@/components/admin/book-management-list";

export default function BooksAdminPage() {
  return <>
    <header className="mx-auto flex max-w-6xl flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-black uppercase tracking-[.2em] text-emerald-700">Catalogue</p><h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 md:text-4xl">Livres</h1><p className="mt-2 max-w-2xl text-slate-500">Consultez, organisez et mettez à jour tous les livres du site.</p></div><Link href="/admin/livres/nouveau" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 font-black text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-emerald-800 hover:shadow-xl"><Plus size={19}/>Créer un livre</Link></header>
    <BookManagementList/>
  </>;
}
